import type { GuardStandingCrewMember, SecurityGuard, SecurityRequest } from '../types';
import { getActiveStandingCrewMembers } from './guardStandingCrew';
import { isGuardTrusted } from './guardTrust';

export interface PriorityCrewLead {
  guard: SecurityGuard;
  crewSize: number;
}

/** Trusted leads with standing crew size >= guards needed on the job. */
export function findPriorityCrewLeadsForJob(
  job: Pick<SecurityRequest, 'guardsNeeded'>,
  guards: SecurityGuard[],
  standingCrewMembers: GuardStandingCrewMember[]
): PriorityCrewLead[] {
  const needed = Math.max(1, job.guardsNeeded ?? 1);
  const leads: PriorityCrewLead[] = [];

  for (const guard of guards) {
    if (!isGuardTrusted(guard) || guard.isStaff) continue;
    const activeMembers = getActiveStandingCrewMembers(standingCrewMembers, guard.id);
    const crewSize = 1 + activeMembers.length;
    if (crewSize >= needed) {
      leads.push({ guard, crewSize });
    }
  }

  return leads.sort((a, b) => b.crewSize - a.crewSize || b.guard.rating - a.guard.rating);
}
