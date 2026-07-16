import type {
  GuardStandingCrewMember,
  SecurityGuard,
  SecurityRequest,
  SessionUser,
  ShiftReport,
} from '../types';
import { reportPushEvent } from './pushApi';
import { findPriorityCrewLeadsForJob } from './priorityCrewNotify';
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
  | 'teamLeadId'
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

/** Notify trusted crew leads first, then tier-staggered waves for matching guards. */
export function notifyOpenJobToGuards(
  actor: SessionUser,
  job: OpenJobNotifyJob,
  guards: SecurityGuard[],
  standingCrewMembers: GuardStandingCrewMember[],
  options: OpenJobNotificationOptions = {}
): void {
  const premiumJob = isPremiumJob(job as PremiumJob);
  const needed = Math.max(1, job.guardsNeeded ?? 1);
  const notified = new Set<string>();
  const requests = options.allRequests ?? [];
  const reports = options.reports ?? [];

  const leads = findPriorityCrewLeadsForJob(job, guards, standingCrewMembers).filter(({ guard }) =>
    guardShouldNotifyForOpenJob(guard, job)
  );

  for (const { guard, crewSize } of leads) {
    notified.add(guard.id);
    void reportPushEvent(actor, {
      type: 'job_open_to_guards',
      guardId: guard.id,
      requestId: job.id,
      location: job.location,
      priority: 'high',
      title: 'Priority job — your crew qualifies',
      body: `"${job.title}" needs ${needed} guard${needed > 1 ? 's' : ''} — your crew of ${crewSize} qualifies. Apply early.`,
    });
  }

  const eligible = guards.filter(
    (guard) => !notified.has(guard.id) && guardShouldNotifyForOpenJob(guard, job)
  );
  const waves = groupGuardsIntoNotificationWaves(
    eligible,
    (guard) => resolveGuardTierId(guard, requests, reports),
    premiumJob
  );

  for (const wave of waves) {
    scheduleNotificationWave(() => {
      for (const guard of wave.items) {
        if (notified.has(guard.id)) continue;
        notified.add(guard.id);
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
