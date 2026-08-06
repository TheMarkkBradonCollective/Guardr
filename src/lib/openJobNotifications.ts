import type { SecurityGuard, SecurityRequest, SessionUser, ShiftReport } from '../types';
import { reportPushEvent } from './pushApi';
import { guardShouldNotifyForOpenJob } from './guardOpenJobNotify';
import {
  groupGuardsIntoNotificationWaves,
  isPremiumJob,
  resolveGuardTierId,
  tierJobNotificationCopy,
  type PremiumJob,
} from './guardTierJobPriority';

export type OpenJobNotifyJob = Pick<
  SecurityRequest,
  | 'id'
  | 'title'
  | 'location'
  | 'guardsNeeded'
  | 'type'
  | 'startDate'
  | 'endDate'
  | 'state'
  | 'hourlyRate'
  | 'guardPay'
  | 'guardSlots'
>;

export interface OpenJobNotificationOptions {
  allRequests?: SecurityRequest[];
  reports?: ShiftReport[];
}

function scheduleNotificationWave(run: () => void, delayMs: number): void {
  if (delayMs > 0) {
    setTimeout(run, delayMs);
    return;
  }
  run();
}

/** Notify matching guards in tier-staggered waves when a job opens. */
export function notifyOpenJobToGuards(
  actor: SessionUser,
  job: OpenJobNotifyJob,
  guards: SecurityGuard[],
  _options: OpenJobNotificationOptions = {}
): void {
  const premiumJob = isPremiumJob(job as PremiumJob);
  const eligible = guards.filter((guard) => guardShouldNotifyForOpenJob(guard, job));
  const waves = groupGuardsIntoNotificationWaves(
    eligible,
    (guard) =>
      resolveGuardTierId(guard, _options.allRequests ?? [], _options.reports ?? []),
    premiumJob
  );

  for (const wave of waves) {
    scheduleNotificationWave(() => {
      for (const guard of wave.items) {
        const copy = tierJobNotificationCopy(wave.tierId, premiumJob, job.title);
        void reportPushEvent(actor, {
          type: 'job_open_to_guards',
          guardId: guard.id,
          requestId: job.id,
          location: job.location,
          priority: copy.priority,
          title: copy.title,
          body: copy.body,
        });
      }
    }, wave.delayMs);
  }
}
