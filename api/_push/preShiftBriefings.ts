import type { SupabaseClient } from '@supabase/supabase-js';
import {
  claimNotificationDedup,
  preShiftBriefingReminderDedupKey,
  pruneStaleNotificationDedup,
} from './dedup';
import { buildEventDispatchPayloads } from './eventDispatch';
import { dispatchPushNotification } from './delivery';
import { isPushConfigured } from './config';
import type { PushNotificationType } from './types';

const NOTIFICATION_TYPE: PushNotificationType = 'pre_shift_briefing';
const HOUR_MS = 60 * 60 * 1000;
const BRIEFING_UNLOCK_MS = 24 * HOUR_MS;

type ReminderTier = '12h' | '6h' | '3h' | '1h' | '30m';

const REMINDER_TIERS: { tier: ReminderTier; msBeforeStart: number }[] = [
  { tier: '12h', msBeforeStart: 12 * HOUR_MS },
  { tier: '6h', msBeforeStart: 6 * HOUR_MS },
  { tier: '3h', msBeforeStart: 3 * HOUR_MS },
  { tier: '1h', msBeforeStart: HOUR_MS },
  { tier: '30m', msBeforeStart: 30 * 60 * 1000 },
];

interface AcceptedJob {
  id: string;
  title: string;
  start_date: string;
  assigned_guard_id: string | null;
  en_route_at: string | null;
  check_in_audit: { checkedAt?: string } | null;
}

function activeReminderTier(msUntilStart: number): ReminderTier | null {
  if (msUntilStart <= 0 || msUntilStart > BRIEFING_UNLOCK_MS) return null;
  for (let i = 0; i < REMINDER_TIERS.length; i += 1) {
    const { tier, msBeforeStart } = REMINDER_TIERS[i]!;
    const lowerBound = i < REMINDER_TIERS.length - 1 ? REMINDER_TIERS[i + 1]!.msBeforeStart : 0;
    if (msUntilStart <= msBeforeStart && msUntilStart > lowerBound) return tier;
  }
  return null;
}

function reminderCopy(tier: ReminderTier, jobTitle: string) {
  switch (tier) {
    case '12h':
      return {
        title: 'Shift briefing ready',
        body: `Your briefing for "${jobTitle}" is available — review site details before you head out.`,
        priority: 'normal' as const,
      };
    case '6h':
      return {
        title: '6 hours until shift',
        body: `"${jobTitle}" starts in 6 hours. Open your shift briefing on the map.`,
        priority: 'normal' as const,
      };
    case '3h':
      return {
        title: '3 hours until shift',
        body: `"${jobTitle}" starts in 3 hours. Review post orders and site briefing.`,
        priority: 'normal' as const,
      };
    case '1h':
      return {
        title: '1 hour until shift',
        body: `"${jobTitle}" starts in 1 hour. Review your briefing, then start heading to site.`,
        priority: 'high' as const,
      };
    case '30m':
      return {
        title: '30 minutes until shift',
        body: `"${jobTitle}" starts in 30 minutes. Head to site when you're ready.`,
        priority: 'high' as const,
      };
    default:
      return {
        title: 'Shift briefing',
        body: `Review your briefing for "${jobTitle}".`,
        priority: 'normal' as const,
      };
  }
}

export interface PreShiftBriefingScanResult {
  scanned: number;
  notified: number;
  skipped: number;
  sent: number;
  failed: number;
}

export async function scanAndNotifyPreShiftBriefings(
  db: SupabaseClient
): Promise<PreShiftBriefingScanResult> {
  if (!isPushConfigured()) {
    return { scanned: 0, notified: 0, skipped: 0, sent: 0, failed: 0 };
  }

  await pruneStaleNotificationDedup(db);

  const now = Date.now();
  const { data: jobs, error } = await db
    .from('security_requests')
    .select('id, title, start_date, assigned_guard_id, en_route_at, check_in_audit')
    .eq('status', 'accepted')
    .not('assigned_guard_id', 'is', null)
    .gte('start_date', new Date(now - 15 * 60 * 1000).toISOString())
    .lte('start_date', new Date(now + BRIEFING_UNLOCK_MS).toISOString());

  if (error) throw new Error(error.message);

  let notified = 0;
  let skipped = 0;
  let sent = 0;
  let failed = 0;

  for (const job of (jobs ?? []) as AcceptedJob[]) {
    if (!job.assigned_guard_id || job.en_route_at || job.check_in_audit?.checkedAt) {
      skipped += 1;
      continue;
    }

    const startMs = new Date(job.start_date).getTime();
    if (Number.isNaN(startMs)) {
      skipped += 1;
      continue;
    }

    const tier = activeReminderTier(startMs - now);
    if (!tier) {
      skipped += 1;
      continue;
    }

    const dedupKey = preShiftBriefingReminderDedupKey(job.id, job.assigned_guard_id, tier);
    const alreadySent = await claimNotificationDedup(db, dedupKey, NOTIFICATION_TYPE);
    if (alreadySent) {
      skipped += 1;
      continue;
    }

    const copy = reminderCopy(tier, job.title);
    const payloads = await buildEventDispatchPayloads(db, {
      type: NOTIFICATION_TYPE,
      recipientUserId: job.assigned_guard_id,
      guardId: job.assigned_guard_id,
      requestId: job.id,
      title: copy.title,
      body: copy.body,
      priority: copy.priority,
      url: `/guard/map?jc=${encodeURIComponent(job.id)}`,
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
