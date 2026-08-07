import type { SupabaseClient } from '@supabase/supabase-js';
import { isPushConfigured } from './config';
import { dispatchPushNotification } from './delivery';
import { findGuardsToNotifyForOpenJob } from './guardOpenJobRecipients';
import {
  groupGuardsIntoNotificationWaves,
  isPremiumJob,
  tierJobNotificationCopy,
  type PerformanceTierId,
  type PremiumJob,
} from '../../src/lib/guardTierJobPriority.ts';
import { resolveGuardTierMap, sleep } from './guardTierResolve';

export async function notifyOpenJobToGuards(
  db: SupabaseClient,
  options: {
    requestId: string;
    title: string;
    body: string;
    location?: string;
    guardsNeeded?: number;
    hourlyRate?: number;
    guardPay?: number | null;
    guardSlots?: PremiumJob['guardSlots'];
    type: string;
    state?: string | null;
    startDate: string;
    endDate: string;
  }
): Promise<void> {
  if (!isPushConfigured()) return;

  const recipients = await findGuardsToNotifyForOpenJob(db, {
    type: options.type,
    state: options.state,
    startDate: options.startDate,
    endDate: options.endDate,
  });
  if (!recipients.length) return;

  const premiumJob = isPremiumJob({
    hourlyRate: options.hourlyRate ?? 0,
    guardPay: options.guardPay ?? undefined,
    guardsNeeded: options.guardsNeeded,
    guardSlots: options.guardSlots,
  });

  const { data: guardRows, error: guardError } = await db
    .from('guards')
    .select('id, failed_audits')
    .in('id', recipients);

  if (guardError) throw new Error(guardError.message);

  const tierMap = await resolveGuardTierMap(
    db,
    (guardRows ?? []).map((row) => ({
      id: String(row.id),
      failedAudits: Number(row.failed_audits ?? 0),
    }))
  );

  const waves = groupGuardsIntoNotificationWaves(
    recipients.map((guardId) => ({ id: guardId })),
    (guard) => tierMap.get(guard.id) ?? ('starting' as PerformanceTierId),
    premiumJob
  );

  const notified = new Set<string>();

  for (const wave of waves) {
    if (wave.delayMs > 0) await sleep(wave.delayMs);

    for (const guard of wave.items) {
      if (notified.has(guard.id)) continue;
      notified.add(guard.id);
      const copy = tierJobNotificationCopy(wave.tierId, premiumJob, options.title);
      await dispatchPushNotification(db, {
        userId: guard.id,
        title: copy.title ?? options.title ?? 'New job on the map',
        body: copy.body || options.body,
        type: 'job_open_to_guards',
        requestId: options.requestId,
        siteId: options.location,
        priority: copy.priority,
      });
    }
  }
}
