import { listGuardViolationReportsForGuard } from './clientViolations';
import { buildGuardContractViolations } from './guardContractViolations';
import {
  computeGuardPerformance,
  computeGuardPerformanceRating,
  PERFORMANCE_TIERS,
  type PerformanceTier,
} from './guardPerformance';
import { buildStaffShiftViolations, type OpsShiftViolation } from './staffOps';
import type { SecurityGuard, SecurityRequest } from '../types';

export type StaffGuardStatSortKey =
  | 'rating-desc'
  | 'rating-asc'
  | 'violations-desc'
  | 'violations-asc'
  | 'on-time-desc'
  | 'on-time-asc'
  | 'jobs-desc'
  | 'jobs-asc'
  | 'name-asc'
  | 'name-desc'
  | 'tier-desc'
  | 'tier-asc';

export interface StaffGuardFactorPoints {
  acceptance: number;
  completion: number;
  onTime: number;
  quality: number;
  clientRating: number;
}

export interface StaffGuardStatRow {
  guardId: string;
  guardName: string;
  badgeNumber: string;
  userStatus: string;
  tier: PerformanceTier;
  overallRating: number;
  overallScore: number;
  jobsCompleted: number;
  shiftsSampled: number;
  onTimeRate: number;
  acceptancePoints: number;
  completionPoints: number;
  onTimePoints: number;
  qualityPoints: number;
  clientRatingPoints: number;
  openViolations: number;
  totalViolations: number;
  shiftAuditViolations: number;
  clientReports: number;
  noShows: number;
  failedAudits: number;
  disputesOpen: number;
  isActive: boolean;
}

export interface StaffStatsTierBucket {
  tierId: string;
  tierName: string;
  count: number;
}

export interface PerformanceTierPercentBar {
  tierId: string;
  tierName: string;
  level: number;
  count: number;
  pct: number;
}

const ORDERED_PERFORMANCE_TIERS = [
  { id: 'starting', name: 'Starting', level: 0 },
  ...PERFORMANCE_TIERS.map((tier) => ({ id: tier.id, name: tier.name, level: tier.level })),
];

export function buildPerformanceTierPercentBars(rows: StaffGuardStatRow[]): PerformanceTierPercentBar[] {
  const total = rows.length;
  const tierMap = new Map<string, number>();
  for (const row of rows) {
    tierMap.set(row.tier.id, (tierMap.get(row.tier.id) ?? 0) + 1);
  }

  return ORDERED_PERFORMANCE_TIERS.map((tier) => {
    const count = tierMap.get(tier.id) ?? 0;
    return {
      tierId: tier.id,
      tierName: tier.name,
      level: tier.level,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  });
}

export interface StaffStatsViolationBucket {
  key: string;
  label: string;
  count: number;
}

export interface StaffStatsPlatformSummary {
  guardCount: number;
  activeGuardCount: number;
  avgOverallRating: number;
  avgOnTimeRate: number;
  totalOpenViolations: number;
  totalViolations: number;
  guardsWithViolations: number;
  tierDistribution: StaffStatsTierBucket[];
  violationsByCheckpoint: StaffStatsViolationBucket[];
  violationsBySource: StaffStatsViolationBucket[];
  violationsByCategory: StaffStatsViolationBucket[];
}

function fieldGuards(guards: SecurityGuard[]): SecurityGuard[] {
  return guards.filter((g) => !g.isStaff);
}

function tierLevel(tier: PerformanceTier): number {
  return tier.level;
}

function noShowCount(guardId: string, requests: SecurityRequest[]): number {
  return requests.filter(
    (r) => r.assignedGuardId === guardId && r.noShow === true
  ).length;
}

function openDisputeCount(guardId: string, requests: SecurityRequest[]): number {
  return requests.reduce((sum, req) => {
    const open = (req.shiftAuditViolations ?? []).filter(
      (v) =>
        v.guardId === guardId &&
        v.status === 'dispute-open' &&
        v.dispute?.guardSubmittedAt
    ).length;
    return sum + open;
  }, 0);
}

export function buildStaffGuardStatRow(
  guard: SecurityGuard,
  requests: SecurityRequest[]
): StaffGuardStatRow {
  const performance = computeGuardPerformance(guard.id, requests);
  const rating = computeGuardPerformanceRating(guard, requests);
  const contractViolations = buildGuardContractViolations(guard, requests);
  const shiftRows = buildStaffShiftViolations(requests, [guard]).filter(
    (v) => v.guardId === guard.id
  );

  const factorById = new Map(rating.factors.map((f) => [f.id, f]));

  return {
    guardId: guard.id,
    guardName: guard.name,
    badgeNumber: guard.badgeNumber,
    userStatus: guard.userStatus ?? 'pending',
    tier: rating.tier,
    overallRating: rating.overallRating,
    overallScore: performance.overallScore,
    jobsCompleted: guard.jobsCompleted ?? 0,
    shiftsSampled: performance.jobsSampled,
    onTimeRate: performance.onTimeRate,
    acceptancePoints: factorById.get('acceptance')?.pointsEarned ?? 0,
    completionPoints: factorById.get('completion')?.pointsEarned ?? 0,
    onTimePoints: factorById.get('on-time')?.pointsEarned ?? 0,
    qualityPoints: factorById.get('quality')?.pointsEarned ?? 0,
    clientRatingPoints: factorById.get('client-rating')?.pointsEarned ?? 0,
    openViolations: 0,
    totalViolations: contractViolations.length,
    shiftAuditViolations: shiftRows.length,
    clientReports: listGuardViolationReportsForGuard(guard.id, requests).length,
    noShows: noShowCount(guard.id, requests),
    failedAudits: guard.failedAudits ?? 0,
    disputesOpen: openDisputeCount(guard.id, requests),
    isActive: guard.userStatus === 'active',
  };
}

function countOpenContractViolations(guard: SecurityGuard, requests: SecurityRequest[]): number {
  const shiftViolations = buildStaffShiftViolations(requests, [guard]).filter((v) => v.guardId === guard.id);
  const openShift = shiftViolations.filter((v) => v.needsReview).length;
  const contractViolations = buildGuardContractViolations(guard, requests);
  const other = contractViolations.filter((v) => v.kind !== 'shift-audit').length;
  return openShift + other;
}

export function buildStaffGuardStatRows(
  guards: SecurityGuard[],
  requests: SecurityRequest[]
): StaffGuardStatRow[] {
  return fieldGuards(guards).map((guard) => {
    const row = buildStaffGuardStatRow(guard, requests);
    return {
      ...row,
      openViolations: countOpenContractViolations(guard, requests),
    };
  });
}

export function sortStaffGuardStatRows(
  rows: StaffGuardStatRow[],
  sortKey: StaffGuardStatSortKey
): StaffGuardStatRow[] {
  const sorted = [...rows];
  const byName = (a: StaffGuardStatRow, b: StaffGuardStatRow) =>
    a.guardName.localeCompare(b.guardName);
  const byRating = (a: StaffGuardStatRow, b: StaffGuardStatRow) =>
    b.overallRating - a.overallRating || b.overallScore - a.overallScore;
  const byViolations = (a: StaffGuardStatRow, b: StaffGuardStatRow) =>
    b.openViolations - a.openViolations || b.totalViolations - a.totalViolations;
  const byOnTime = (a: StaffGuardStatRow, b: StaffGuardStatRow) =>
    b.onTimeRate - a.onTimeRate;
  const byJobs = (a: StaffGuardStatRow, b: StaffGuardStatRow) =>
    b.jobsCompleted - a.jobsCompleted;
  const byTier = (a: StaffGuardStatRow, b: StaffGuardStatRow) =>
    tierLevel(b.tier) - tierLevel(a.tier) || b.overallRating - a.overallRating;

  switch (sortKey) {
    case 'rating-asc':
      return sorted.sort((a, b) => -byRating(a, b));
    case 'violations-desc':
      return sorted.sort(byViolations);
    case 'violations-asc':
      return sorted.sort((a, b) => -byViolations(a, b));
    case 'on-time-desc':
      return sorted.sort(byOnTime);
    case 'on-time-asc':
      return sorted.sort((a, b) => -byOnTime(a, b));
    case 'jobs-desc':
      return sorted.sort(byJobs);
    case 'jobs-asc':
      return sorted.sort((a, b) => -byJobs(a, b));
    case 'name-asc':
      return sorted.sort(byName);
    case 'name-desc':
      return sorted.sort((a, b) => -byName(a, b));
    case 'tier-asc':
      return sorted.sort((a, b) => -byTier(a, b));
    case 'tier-desc':
    case 'rating-desc':
    default:
      return sorted.sort(byTier);
  }
}

export function buildStaffStatsPlatformSummary(
  rows: StaffGuardStatRow[],
  shiftViolations: OpsShiftViolation[]
): StaffStatsPlatformSummary {
  const activeRows = rows.filter((r) => r.isActive);
  const avg = (values: number[]) =>
    values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;

  const tierMap = new Map<string, StaffStatsTierBucket>();
  for (const row of rows) {
    const existing = tierMap.get(row.tier.id);
    if (existing) existing.count += 1;
    else tierMap.set(row.tier.id, { tierId: row.tier.id, tierName: row.tier.name, count: 1 });
  }

  const checkpointMap = new Map<string, number>();
  const sourceMap = new Map<string, number>();
  const categoryMap = new Map<string, number>();
  for (const v of shiftViolations) {
    checkpointMap.set(v.checkpoint, (checkpointMap.get(v.checkpoint) ?? 0) + 1);
    sourceMap.set(v.source, (sourceMap.get(v.source) ?? 0) + 1);
    categoryMap.set(v.category, (categoryMap.get(v.category) ?? 0) + 1);
  }

  const toBuckets = (map: Map<string, number>, labelFn?: (k: string) => string) =>
    [...map.entries()]
      .map(([key, count]) => ({
        key,
        label: labelFn ? labelFn(key) : key,
        count,
      }))
      .sort((a, b) => b.count - a.count);

  return {
    guardCount: rows.length,
    activeGuardCount: activeRows.length,
    avgOverallRating: Math.round(avg(rows.map((r) => r.overallRating))),
    avgOnTimeRate: Math.round(avg(rows.map((r) => r.onTimeRate * 100))),
    totalOpenViolations: rows.reduce((sum, r) => sum + r.openViolations, 0),
    totalViolations: rows.reduce((sum, r) => sum + r.totalViolations, 0),
    guardsWithViolations: rows.filter((r) => r.totalViolations > 0).length,
    tierDistribution: [...tierMap.values()].sort((a, b) => b.count - a.count),
    violationsByCheckpoint: toBuckets(checkpointMap),
    violationsBySource: toBuckets(sourceMap, (k) => (k === 'client' ? 'Client flags' : 'System flags')),
    violationsByCategory: toBuckets(categoryMap),
  };
}

export function compareStaffGuardStatRows(
  rows: StaffGuardStatRow[],
  guardIds: string[]
): StaffGuardStatRow[] {
  const idSet = new Set(guardIds);
  return guardIds
    .map((id) => rows.find((r) => r.guardId === id))
    .filter((r): r is StaffGuardStatRow => !!r && idSet.has(r.guardId));
}

export function staffGuardStatSortTabLabel(sortKey: StaffGuardStatSortKey): string {
  const labels: Record<StaffGuardStatSortKey, string> = {
    'rating-desc': 'Rating',
    'rating-asc': 'Rating (low)',
    'violations-desc': 'Violations',
    'violations-asc': 'Violations (few)',
    'on-time-desc': 'On-time',
    'on-time-asc': 'On-time (low)',
    'jobs-desc': 'Jobs',
    'jobs-asc': 'Jobs (few)',
    'name-asc': 'Name A–Z',
    'name-desc': 'Name Z–A',
    'tier-desc': 'Tier',
    'tier-asc': 'Tier (low)',
  };
  return labels[sortKey];
}

export function staffGuardStatSortLabel(sortKey: StaffGuardStatSortKey): string {
  const labels: Record<StaffGuardStatSortKey, string> = {
    'rating-desc': 'Rating (high → low)',
    'rating-asc': 'Rating (low → high)',
    'violations-desc': 'Open violations (most)',
    'violations-asc': 'Open violations (fewest)',
    'on-time-desc': 'On-time rate (high → low)',
    'on-time-asc': 'On-time rate (low → high)',
    'jobs-desc': 'Jobs completed (most)',
    'jobs-asc': 'Jobs completed (fewest)',
    'name-asc': 'Name (A → Z)',
    'name-desc': 'Name (Z → A)',
    'tier-desc': 'Tier (highest)',
    'tier-asc': 'Tier (lowest)',
  };
  return labels[sortKey];
}

export const STAFF_GUARD_STAT_SORT_OPTIONS: StaffGuardStatSortKey[] = [
  'rating-desc',
  'tier-desc',
  'violations-desc',
  'on-time-desc',
  'jobs-desc',
  'name-asc',
  'rating-asc',
  'violations-asc',
  'on-time-asc',
];

export function formatStaffStatPercent(rate: number): string {
  return `${Math.round(Math.min(100, Math.max(0, rate * 100)))}%`;
}
