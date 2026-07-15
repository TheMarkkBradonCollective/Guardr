import type {
  GuardStandingCrewMember,
  SecurityGuard,
  SecurityRequest,
  SessionUser,
} from '../types';
import { reportPushEvent } from './pushApi';
import { findPriorityCrewLeadsForJob } from './priorityCrewNotify';

/** Notify trusted crew leads first, then broadcast to all guards. */
export function notifyOpenJobToGuards(
  actor: SessionUser,
  job: Pick<SecurityRequest, 'id' | 'title' | 'location' | 'guardsNeeded'>,
  guards: SecurityGuard[],
  standingCrewMembers: GuardStandingCrewMember[]
): void {
  const needed = Math.max(1, job.guardsNeeded ?? 1);
  const leads = findPriorityCrewLeadsForJob(job, guards, standingCrewMembers);

  for (const { guard, crewSize } of leads) {
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

  void reportPushEvent(actor, {
    type: 'job_open_to_guards',
    requestId: job.id,
    location: job.location,
    body: `"${job.title}" is paid and open on the map — browse and apply.`,
  });
}
