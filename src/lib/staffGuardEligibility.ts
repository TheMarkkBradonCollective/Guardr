import { isGuardTrusted } from './guardTrust';
import type { StaffGuardStatRow } from './staffStats';
import type { SecurityGuard } from '../types';

export type StaffGuardEligibilityKind = 'trusted';

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

export function buildStaffGuardEligibilityRecommendations(
  guards: SecurityGuard[],
  statRows: StaffGuardStatRow[]
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
  }

  return recommendations.sort(
    (a, b) => b.overallRating - a.overallRating || a.guardName.localeCompare(b.guardName)
  );
}

export function staffGuardEligibilityKindLabel(kind: StaffGuardEligibilityKind): string {
  return kind === 'trusted' ? 'Trusted' : kind;
}
