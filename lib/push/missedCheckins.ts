import type { SupabaseClient } from '@supabase/supabase-js';
import { claimNotificationDedup, missedCheckinDedupKey, pruneStaleNotificationDedup } from './dedup';
import { buildEventDispatchPayloads } from './eventDispatch';
import { dispatchPushNotification } from './delivery';
import { isPushConfigured } from './config';

type AuditRecord = { checkedAt?: string };
type MidShiftAudit = { checkedAt?: string };

interface InProgressJob {
  id: string;
  location: string | null;
  site_name: string | null;
  assigned_guard_id: string | null;
  check_in_audit: AuditRecord | null;
  mid_shift_audits: MidShiftAudit[] | null;
}

function lastActivityIso(job: InProgressJob): string | null {
  const checkIn = job.check_in_audit?.checkedAt;
  if (!checkIn) return null;

  const mids = job.mid_shift_audits ?? [];
  const lastMid = mids.length ? mids[mids.length - 1]?.checkedAt : null;
  return lastMid ?? checkIn;
}

export interface MissedCheckinScanResult {
  scanned: number;
  notified: number;
  skipped: number;
  sent: number;
  failed: number;
}

export async function scanAndNotifyMissedCheckins(
  db: SupabaseClient
): Promise<MissedCheckinScanResult> {
  if (!isPushConfigured()) {
    return { scanned: 0, notified: 0, skipped: 0, sent: 0, failed: 0 };
  }

  await pruneStaleNotificationDedup(db);

  const { data: jobs, error } = await db
    .from('security_requests')
    .select('id, location, site_name, assigned_guard_id, check_in_audit, mid_shift_audits')
    .eq('status', 'in-progress')
    .not('assigned_guard_id', 'is', null);

  if (error) throw new Error(error.message);

  const now = Date.now();
  const hourBucket = Math.floor(now / (60 * 60 * 1000));
  let notified = 0;
  let skipped = 0;
  let sent = 0;
  let failed = 0;

  const guardIds = [
    ...new Set(
      (jobs ?? [])
        .map((job) => job.assigned_guard_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const guardNames = new Map<string, string>();
  if (guardIds.length) {
    const { data: guards } = await db.from('guards').select('id, name').in('id', guardIds);
    for (const guard of guards ?? []) {
      guardNames.set(guard.id, guard.name);
    }
  }

  for (const job of (jobs ?? []) as InProgressJob[]) {
    const lastActivity = lastActivityIso(job);
    if (!lastActivity || !job.assigned_guard_id) {
      skipped += 1;
      continue;
    }

    const hoursSince = (now - new Date(lastActivity).getTime()) / (60 * 60 * 1000);
    if (hoursSince < 1) {
      skipped += 1;
      continue;
    }

    const dedupKey = missedCheckinDedupKey(job.id, hourBucket);
    const alreadySent = await claimNotificationDedup(db, dedupKey, 'missed_checkin');
    if (alreadySent) {
      skipped += 1;
      continue;
    }

    const guardName = guardNames.get(job.assigned_guard_id);
    const payloads = await buildEventDispatchPayloads(db, {
      type: 'missed_checkin',
      guardId: job.assigned_guard_id,
      guardName,
      requestId: job.id,
      siteId: job.site_name || undefined,
      location: job.location || undefined,
    });

    for (const payload of payloads) {
      const result = await dispatchPushNotification(db, payload);
      sent += result.sent;
      failed += result.failed;
    }

    notified += 1;
  }

  return {
    scanned: jobs?.length ?? 0,
    notified,
    skipped,
    sent,
    failed,
  };
}
