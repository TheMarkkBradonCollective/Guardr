import { getPendingCrewLeadRequest } from './guardCrewJoinRequest';
import {
  guardIsMemberOfStandingCrew,
  guardLeadsOwnStandingCrew,
} from './guardStandingCrew';
import { isGuardTrusted } from './guardTrust';
import type { StaffGuardStatRow } from './staffStats';
import type { GuardCrewJoinRequest, GuardStandingCrewMember, SecurityGuard } from '../types';

export type StaffGuardEligibilityKind = 'trusted' | 'crew-lead';

export interface StaffGuardEligibilityRecommendation {
  guardId: string;
  guardName: string;
  badgeNumber: string;
  kind: StaffGuardEligibilityKind;
  title: string;
  summary: string;
  overallRating: number;
  tierName: string;
}

const PROFESSIONAL_RATING = 75;
const ELITE_RATING = 85;

function guardById(guards: SecurityGuard[], guardId: string): SecurityGuard | undefined {
  return guards.find((g) => g.id === guardId);
}

function hasCleanAccountabilityRecord(row: StaffGuardStatRow): boolean {
  return row.openViolations === 0 && row.noShows === 0 && row.disputesOpen === 0;
}

/** Guards who meet performance and accountability bars for staff to consider marking trusted. */
export function isTrustedEligible(
  guard: SecurityGuard,
  row: StaffGuardStatRow
): boolean {
  if (guard.isStaff) return false;
  if (guard.userStatus !== 'active') return false;
  if (!guard.verified) return false;
  if (isGuardTrusted(guard)) return false;
  if (row.overallRating < PROFESSIONAL_RATING) return false;
  return hasCleanAccountabilityRecord(row);
}

/** Trusted guards staff can pick when creating a new standing crew lead. */
export function isStaffCrewLeadCandidate(
  guard: SecurityGuard,
  standingCrewMembers: GuardStandingCrewMember[],
): boolean {
  if (guard.isStaff) return false;
  if (guard.userStatus !== 'active') return false;
  if (!guard.verified) return false;
  if (!isGuardTrusted(guard)) return false;
  if (guardLeadsOwnStandingCrew(guard, standingCrewMembers)) return false;
  if (guardIsMemberOfStandingCrew(standingCrewMembers, guard.id)) return false;
  return true;
}

export function listGuardsEligibleForStaffCrewCreation(
  guards: SecurityGuard[],
  standingCrewMembers: GuardStandingCrewMember[],
  query = '',
): SecurityGuard[] {
  const q = query.trim().toLowerCase();
  return guards
    .filter((guard) => isStaffCrewLeadCandidate(guard, standingCrewMembers))
    .filter(
      (guard) =>
        !q ||
        guard.name.toLowerCase().includes(q) ||
        guard.email.toLowerCase().includes(q) ||
        guard.badgeNumber.toLowerCase().includes(q),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Trusted guards who meet Elite-tier performance for staff to consider as crew leads. */
export function isCrewLeadEligible(
  guard: SecurityGuard,
  row: StaffGuardStatRow,
  standingCrewMembers: GuardStandingCrewMember[],
  crewJoinRequests: GuardCrewJoinRequest[]
): boolean {
  if (guard.isStaff) return false;
  if (guard.userStatus !== 'active') return false;
  if (!isGuardTrusted(guard)) return false;
  if (guardLeadsOwnStandingCrew(guard, standingCrewMembers)) return false;
  if (guardIsMemberOfStandingCrew(standingCrewMembers, guard.id)) return false;
  if (getPendingCrewLeadRequest(crewJoinRequests, guard.id)) return false;
  if (row.overallRating < ELITE_RATING) return false;
  return hasCleanAccountabilityRecord(row);
}

export function buildStaffGuardEligibilityRecommendations(
  guards: SecurityGuard[],
  statRows: StaffGuardStatRow[],
  standingCrewMembers: GuardStandingCrewMember[] = [],
  crewJoinRequests: GuardCrewJoinRequest[] = []
): StaffGuardEligibilityRecommendation[] {
  const recommendations: StaffGuardEligibilityRecommendation[] = [];

  for (const row of statRows) {
    const guard = guardById(guards, row.guardId);
    if (!guard) continue;

    if (isTrustedEligible(guard, row)) {
      recommendations.push({
        guardId: row.guardId,
        guardName: row.guardName,
        badgeNumber: row.badgeNumber,
        kind: 'trusted',
        title: 'Mark as trusted',
        summary: `Professional tier (${row.overallRating} rating) with no open violations, disputes, or no-shows.`,
        overallRating: row.overallRating,
        tierName: row.tier.name,
      });
    }

    if (isCrewLeadEligible(guard, row, standingCrewMembers, crewJoinRequests)) {
      recommendations.push({
        guardId: row.guardId,
        guardName: row.guardName,
        badgeNumber: row.badgeNumber,
        kind: 'crew-lead',
        title: 'Set up as crew lead',
        summary: `Elite-tier trusted guard (${row.overallRating} rating) with a clean accountability record.`,
        overallRating: row.overallRating,
        tierName: row.tier.name,
      });
    }
  }

  return recommendations.sort((a, b) => {
    const kindOrder = a.kind === 'trusted' && b.kind === 'crew-lead' ? -1 : a.kind === 'crew-lead' && b.kind === 'trusted' ? 1 : 0;
    if (kindOrder !== 0) return kindOrder;
    return b.overallRating - a.overallRating || a.guardName.localeCompare(b.guardName);
  });
}

export function staffGuardEligibilityKindLabel(kind: StaffGuardEligibilityKind): string {
  return kind === 'trusted' ? 'Trusted' : 'Crew lead';
}
