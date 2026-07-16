import type {
  GuardStandingCrewMember,
  SecurityGuard,
  SecurityRequest,
  SessionUser,
} from '../types';
import { reportPushEvent } from './pushApi';
import { findPriorityCrewLeadsForJob } from './priorityCrewNotify';
import { guardShouldNotifyForOpenJob } from './guardOpenJobNotify';

/** Notify trusted crew leads first, then guards who match preferences, service area, and availability. */
export function notifyOpenJobToGuards(
  actor: SessionUser,
  job: Pick<
    SecurityRequest,
    'id' | 'title' | 'location' | 'guardsNeeded' | 'type' | 'startDate' | 'endDate' | 'state'
  >,
  guards: SecurityGuard[],
  standingCrewMembers: GuardStandingCrewMember[]
): void {
  const needed = Math.max(1, job.guardsNeeded ?? 1);
  const notified = new Set<string>();

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

  for (const guard of guards) {
    if (notified.has(guard.id)) continue;
    if (!guardShouldNotifyForOpenJob(guard, job)) continue;
    notified.add(guard.id);
    void reportPushEvent(actor, {
      type: 'job_open_to_guards',
      guardId: guard.id,
      requestId: job.id,
      location: job.location,
      body: `"${job.title}" is paid and open on the map — browse and apply.`,
    });
  }
}
