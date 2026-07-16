import type {
  GuardStandingCrewMember,
  SecurityGuard,
  SecurityRequest,
  SessionUser,
} from '../types';
import { reportPushEvent } from './pushApi';
import { findPriorityCrewLeadsForJob } from './priorityCrewNotify';
import { guardShouldNotifyForOpenJob } from './guardOpenJobNotify';
import {
  guardHasPremiumJobPriority,
  isPremiumOpenJob,
  PREMIUM_GUARD_PAY_THRESHOLD,
} from './guardPremiumJobPriority';
import { jobTypeRatingDisplayName } from './guardJobTypeRatingMetrics';

/** Notify trusted crew leads first, then premium-priority guards, then everyone else who matches. */
export function notifyOpenJobToGuards(
  actor: SessionUser,
  job: Pick<
    SecurityRequest,
    'id' | 'title' | 'location' | 'guardsNeeded' | 'type' | 'startDate' | 'endDate' | 'state' | 'guardPay' | 'teamLeadId' | 'guardSlots'
  >,
  guards: SecurityGuard[],
  standingCrewMembers: GuardStandingCrewMember[],
  requests: SecurityRequest[] = []
): void {
  const needed = Math.max(1, job.guardsNeeded ?? 1);
  const notified = new Set<string>();
  const premiumJob = isPremiumOpenJob(job);
  const jobType = job.type ?? 'other';

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

  if (premiumJob) {
    const premiumGuards = guards
      .filter(
        (guard) =>
          !notified.has(guard.id) &&
          guardShouldNotifyForOpenJob(guard, job) &&
          guardHasPremiumJobPriority(guard.id, jobType, requests)
      )
      .sort((a, b) => b.rating - a.rating);

    for (const guard of premiumGuards) {
      notified.add(guard.id);
      void reportPushEvent(actor, {
        type: 'job_open_to_guards',
        guardId: guard.id,
        requestId: job.id,
        location: job.location,
        priority: 'high',
        title: 'Premium job — you are in the priority line',
        body: `"${job.title}" pays $${PREMIUM_GUARD_PAY_THRESHOLD}+/hr or needs a coordinated crew. Your ${jobTypeRatingDisplayName(jobType).toLowerCase()} ratings put you first in line.`,
      });
    }
  }

  for (const guard of guards) {
    if (notified.has(guard.id)) continue;
    if (!guardShouldNotifyForOpenJob(guard, job)) continue;
    notified.add(guard.id);
    void reportPushEvent(actor, {
      type: 'job_open_to_guards',
      guardId: guard.id,
      requestId: job.id,
      location: job.location,
      body: premiumJob
        ? `"${job.title}" is a premium shift on the map — browse and apply.`
        : `"${job.title}" is paid and open on the map — browse and apply.`,
    });
  }
}
