import { countGuardViolationReports } from './clientViolations';
import { ALL_JOB_TYPES } from './guardJobPreferences';
import { JOB_TYPE_LABELS } from './guardJobs';
import type { SecurityGuard, SecurityRequest, ShiftReport, JobType } from '../types';

export interface GuardPerformanceMetrics {
  /** Composite 1–5 security rating derived from shift behavior. */
  overallScore: number;
  onTimeRate: number;
  checkInCompletionRate: number;
  uniformComplianceRate: number;
  attendanceRate: number;
  incidentPenalty: number;
  jobsSampled: number;
}

export interface GuardSkillRating {
  skill: string;
  jobType: JobType;
  rating: number;
  reviewCount: number;
}

const ON_TIME_GRACE_MS = 15 * 60 * 1000;

function guardCompletedJobs(guardId: string, requests: SecurityRequest[]): SecurityRequest[] {
  return requests.filter(
    (r) =>
      r.assignedGuardId === guardId &&
      (r.status === 'completed' || r.status === 'closed')
  );
}

export function computeGuardPerformance(
  guardId: string,
  requests: SecurityRequest[],
  reports: ShiftReport[] = []
): GuardPerformanceMetrics {
  const jobs = guardCompletedJobs(guardId, requests);
  if (!jobs.length) {
    return {
      overallScore: 0,
      onTimeRate: 0,
      checkInCompletionRate: 0,
      uniformComplianceRate: 0,
      attendanceRate: 0,
      incidentPenalty: 0,
      jobsSampled: 0,
    };
  }

  let onTime = 0;
  let checkedIn = 0;
  let uniformOk = 0;
  let attended = 0;

  for (const job of jobs) {
    const noShow = (job as SecurityRequest & { noShow?: boolean }).noShow === true;
    if (!noShow) attended += 1;

    if (job.checkInAudit?.checkedAt) {
      checkedIn += 1;
      const startMs = new Date(job.startDate).getTime();
      const checkMs = new Date(job.checkInAudit.checkedAt).getTime();
      if (checkMs <= startMs + ON_TIME_GRACE_MS) onTime += 1;

      const uniform = job.checkInAudit.uniform;
      if (
        uniform?.uniformPresent &&
        uniform?.blackShoes &&
        uniform?.professionalAppearance
      ) {
        uniformOk += 1;
      }
    }
  }

  const incidentCount = reports.filter(
    (r) => r.guardId === guardId && r.type === 'incident'
  ).length;
  const incidentPenalty = Math.min(1, incidentCount / Math.max(jobs.length, 1));

  const onTimeRate = onTime / jobs.length;
  const checkInCompletionRate = checkedIn / jobs.length;
  const uniformComplianceRate = checkedIn ? uniformOk / checkedIn : 0;
  const attendanceRate = attended / jobs.length;

  const starRatings = jobs
    .map((j) => j.ratingGiven)
    .filter((r): r is number => typeof r === 'number' && r > 0);
  const reviewAvg = starRatings.length
    ? starRatings.reduce((a, b) => a + b, 0) / starRatings.length
    : 3.5;

  const behaviorScore =
    onTimeRate * 0.25 +
    checkInCompletionRate * 0.2 +
    uniformComplianceRate * 0.15 +
    attendanceRate * 0.25 +
    (1 - incidentPenalty) * 0.15;

  const overallScore = Number(
    Math.min(5, Math.max(1, reviewAvg * 0.55 + behaviorScore * 5 * 0.45)).toFixed(1)
  );

  return {
    overallScore,
    onTimeRate,
    checkInCompletionRate,
    uniformComplianceRate,
    attendanceRate,
    incidentPenalty,
    jobsSampled: jobs.length,
  };
}

function guardCompletedJobsForType(
  guardId: string,
  requests: SecurityRequest[],
  jobType: JobType
): SecurityRequest[] {
  return guardCompletedJobs(guardId, requests).filter((job) => (job.type ?? 'other') === jobType);
}

export function computeGuardPerformanceForJobType(
  guardId: string,
  requests: SecurityRequest[],
  jobType: JobType,
  reports: ShiftReport[] = []
): GuardPerformanceMetrics {
  const jobs = guardCompletedJobsForType(guardId, requests, jobType);
  if (!jobs.length) {
    return {
      overallScore: 0,
      onTimeRate: 0,
      checkInCompletionRate: 0,
      uniformComplianceRate: 0,
      attendanceRate: 0,
      incidentPenalty: 0,
      jobsSampled: 0,
    };
  }

  let onTime = 0;
  let checkedIn = 0;
  let uniformOk = 0;
  let attended = 0;

  for (const job of jobs) {
    const noShow = (job as SecurityRequest & { noShow?: boolean }).noShow === true;
    if (!noShow) attended += 1;

    if (job.checkInAudit?.checkedAt) {
      checkedIn += 1;
      const startMs = new Date(job.startDate).getTime();
      const checkMs = new Date(job.checkInAudit.checkedAt).getTime();
      if (checkMs <= startMs + ON_TIME_GRACE_MS) onTime += 1;

      const uniform = job.checkInAudit.uniform;
      if (
        uniform?.uniformPresent &&
        uniform?.blackShoes &&
        uniform?.professionalAppearance
      ) {
        uniformOk += 1;
      }
    }
  }

  const incidentCount = reports.filter(
    (r) => r.guardId === guardId && r.type === 'incident'
  ).length;
  const incidentPenalty = Math.min(1, incidentCount / Math.max(jobs.length, 1));

  const onTimeRate = onTime / jobs.length;
  const checkInCompletionRate = checkedIn / jobs.length;
  const uniformComplianceRate = checkedIn ? uniformOk / checkedIn : 0;
  const attendanceRate = attended / jobs.length;

  const starRatings = jobs
    .map((j) => j.ratingGiven)
    .filter((r): r is number => typeof r === 'number' && r > 0);
  const reviewAvg = starRatings.length
    ? starRatings.reduce((a, b) => a + b, 0) / starRatings.length
    : 3.5;

  const behaviorScore =
    onTimeRate * 0.25 +
    checkInCompletionRate * 0.2 +
    uniformComplianceRate * 0.15 +
    attendanceRate * 0.25 +
    (1 - incidentPenalty) * 0.15;

  const overallScore = Number(
    Math.min(5, Math.max(1, reviewAvg * 0.55 + behaviorScore * 5 * 0.45)).toFixed(1)
  );

  return {
    overallScore,
    onTimeRate,
    checkInCompletionRate,
    uniformComplianceRate,
    attendanceRate,
    incidentPenalty,
    jobsSampled: jobs.length,
  };
}

export function computeClientReviewStatsForJobType(
  guardId: string,
  requests: SecurityRequest[],
  jobType: JobType
): ClientReviewStats {
  const ratings = guardCompletedJobsForType(guardId, requests, jobType)
    .map((j) => j.ratingGiven)
    .filter((r): r is number => typeof r === 'number' && r > 0);

  if (!ratings.length) {
    return { average: 0, count: 0 };
  }

  const average = Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1));
  return { average, count: ratings.length };
}

export interface JobTypeRatingMetric {
  id: string;
  label: string;
  valueDisplay: string;
  targetLabel: string;
  status: PerformanceFactorStatus;
  statusLabel: string;
}

export function buildJobTypeRatingMetrics(
  metrics: GuardPerformanceMetrics,
  clientReviews: ClientReviewStats
): JobTypeRatingMetric[] {
  const rows: JobTypeRatingMetric[] = [];

  if (clientReviews.count > 0) {
    const rate = clientReviews.average / 5;
    const status = factorStatus(rate);
    rows.push({
      id: 'client-reviews',
      label: 'Client rating',
      valueDisplay: starDisplay(clientReviews.average),
      targetLabel: 'Stay above 4.5 ★',
      status: status.status,
      statusLabel: status.statusLabel,
    });
  }

  if (metrics.jobsSampled <= 0) return rows;

  const metricDefs: Array<{
    id: string;
    label: string;
    rate: number;
    display: string;
    targetLabel: string;
  }> = [
    {
      id: 'on-time',
      label: 'On-time arrival',
      rate: metrics.onTimeRate,
      display: percentDisplay(metrics.onTimeRate),
      targetLabel: 'Stay above 90%',
    },
    {
      id: 'check-ins',
      label: 'Check-in reliability',
      rate: metrics.checkInCompletionRate,
      display: percentDisplay(metrics.checkInCompletionRate),
      targetLabel: 'Stay above 95%',
    },
    {
      id: 'uniform',
      label: 'Uniform compliance',
      rate: metrics.uniformComplianceRate,
      display: percentDisplay(metrics.uniformComplianceRate),
      targetLabel: 'Stay above 95%',
    },
    {
      id: 'attendance',
      label: 'Attendance',
      rate: metrics.attendanceRate,
      display: percentDisplay(metrics.attendanceRate),
      targetLabel: 'Stay above 95%',
    },
    {
      id: 'incident-free',
      label: 'Incident-free record',
      rate: 1 - metrics.incidentPenalty,
      display: percentDisplay(1 - metrics.incidentPenalty),
      targetLabel: 'Stay above 95%',
    },
  ];

  for (const metric of metricDefs) {
    const status = factorStatus(metric.rate);
    rows.push({
      id: metric.id,
      label: metric.label,
      valueDisplay: metric.display,
      targetLabel: metric.targetLabel,
      status: status.status,
      statusLabel: status.statusLabel,
    });
  }

  rows.push({
    id: 'lifetime-shifts',
    label: 'Lifetime shifts',
    valueDisplay: String(metrics.jobsSampled),
    targetLabel: 'Requires 5 for rating',
    status: metrics.jobsSampled >= 5 ? 'very-high' : 'moderate',
    statusLabel: metrics.jobsSampled >= 5 ? 'Established' : 'Building',
  });

  return rows;
}

export function computeGuardSkillRatings(
  guard: SecurityGuard,
  requests: SecurityRequest[],
  options?: { includeAllJobTypes?: boolean }
): GuardSkillRating[] {
  const jobs = guardCompletedJobs(guard.id, requests);
  const buckets = new Map<JobType, { total: number; count: number }>();

  for (const job of jobs) {
    const jobType = job.type ?? 'other';
    const rating = job.ratingGiven ?? guard.rating;
    const entry = buckets.get(jobType) ?? { total: 0, count: 0 };
    entry.total += rating;
    entry.count += 1;
    buckets.set(jobType, entry);
  }

  const types = options?.includeAllJobTypes ? ALL_JOB_TYPES : [...buckets.keys()];

  return types
    .map((jobType) => {
      const entry = buckets.get(jobType);
      const count = entry?.count ?? 0;
      return {
        skill: JOB_TYPE_LABELS[jobType],
        jobType,
        rating: count > 0 ? Number((entry!.total / count).toFixed(1)) : 0,
        reviewCount: count,
      };
    })
    .sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating || a.skill.localeCompare(b.skill));
}

export function formatPerformanceScore(score: number): string {
  if (score <= 0) return '—';
  return score.toFixed(1);
}

export interface ClientReviewStats {
  average: number;
  count: number;
}

export interface PerformanceBreakdownRow {
  id: string;
  label: string;
  /** Display score on a 1–5 scale. */
  score: number;
  /** Bar fill width 0–100. */
  percent: number;
}

function rateToPercent(rate: number): number {
  return Math.round(Math.min(100, Math.max(0, rate * 100)));
}

function rateToScore(rate: number): number {
  return Number((Math.min(1, Math.max(0, rate)) * 5).toFixed(1));
}

/** Client star ratings left on completed shifts. */
export function computeClientReviewStats(
  guardId: string,
  requests: SecurityRequest[]
): ClientReviewStats {
  const ratings = guardCompletedJobs(guardId, requests)
    .map((j) => j.ratingGiven)
    .filter((r): r is number => typeof r === 'number' && r > 0);

  if (!ratings.length) {
    return { average: 0, count: 0 };
  }

  const average = Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1));
  return { average, count: ratings.length };
}

/** DoorDash-style behavior breakdown rows for rating bars. */
export function buildPerformanceBreakdown(
  metrics: GuardPerformanceMetrics,
  clientReviews: ClientReviewStats
): PerformanceBreakdownRow[] {
  const rows: PerformanceBreakdownRow[] = [];

  if (clientReviews.count > 0) {
    rows.push({
      id: 'client-reviews',
      label: 'Client reviews',
      score: clientReviews.average,
      percent: rateToPercent(clientReviews.average / 5),
    });
  }

  if (metrics.jobsSampled <= 0) return rows;

  rows.push(
    {
      id: 'on-time',
      label: 'On-time arrival',
      score: rateToScore(metrics.onTimeRate),
      percent: rateToPercent(metrics.onTimeRate),
    },
    {
      id: 'check-ins',
      label: 'Check-in reliability',
      score: rateToScore(metrics.checkInCompletionRate),
      percent: rateToPercent(metrics.checkInCompletionRate),
    },
    {
      id: 'uniform',
      label: 'Uniform compliance',
      score: rateToScore(metrics.uniformComplianceRate),
      percent: rateToPercent(metrics.uniformComplianceRate),
    },
    {
      id: 'attendance',
      label: 'Attendance',
      score: rateToScore(metrics.attendanceRate),
      percent: rateToPercent(metrics.attendanceRate),
    },
    {
      id: 'incident-free',
      label: 'Incident-free record',
      score: rateToScore(1 - metrics.incidentPenalty),
      percent: rateToPercent(1 - metrics.incidentPenalty),
    }
  );

  return rows;
}

export function formatReviewCount(count: number): string {
  if (count <= 0) return 'No client reviews yet';
  if (count === 1) return 'Based on 1 client review';
  return `Based on ${count} client reviews`;
}

export function formatShiftSampleCount(count: number): string {
  if (count <= 0) return 'No completed shifts yet';
  if (count === 1) return '1 completed shift analyzed';
  return `${count} completed shifts analyzed`;
}

// ─── DoorDash-style tier & point-based rating ───────────────────────────────

export type PerformanceFactorStatus = 'very-high' | 'high' | 'moderate' | 'low' | 'very-low';

export interface PerformanceTier {
  id: string;
  name: string;
  level: number;
  /** Minimum overall rating (0–100) to reach this tier. */
  threshold: number;
}

export interface PerformanceFactor {
  id: string;
  label: string;
  /** 0–1 raw rate used for scoring. */
  rate: number;
  /** Display value, e.g. "93%". */
  rateDisplay: string;
  pointsEarned: number;
  pointsMax: number;
  status: PerformanceFactorStatus;
  statusLabel: string;
}

export interface PerformanceViolation {
  id: string;
  label: string;
  count: number;
}

export interface GuardPerformanceRating {
  /** Sum of factor points (0–100). */
  overallRating: number;
  tier: PerformanceTier;
  nextTier: PerformanceTier | null;
  pointsToNextTier: number;
  factors: PerformanceFactor[];
  violations: PerformanceViolation[];
}

/** Tier thresholds — mirrors DoorDash Rising / Professional / Elite progression. */
export const PERFORMANCE_TIERS: PerformanceTier[] = [
  { id: 'rising', name: 'Rising', level: 1, threshold: 60 },
  { id: 'professional', name: 'Professional', level: 2, threshold: 75 },
  { id: 'elite', name: 'Elite', level: 3, threshold: 85 },
];

const STARTING_TIER: PerformanceTier = {
  id: 'starting',
  name: 'Starting',
  level: 0,
  threshold: 0,
};

const FACTOR_WEIGHTS = {
  acceptance: 30,
  completion: 15,
  onTime: 40,
  quality: 10,
  clientRating: 5,
} as const;

function factorStatus(rate: number): { status: PerformanceFactorStatus; statusLabel: string } {
  if (rate >= 0.95) return { status: 'very-high', statusLabel: 'Very high' };
  if (rate >= 0.85) return { status: 'high', statusLabel: 'High' };
  if (rate >= 0.7) return { status: 'moderate', statusLabel: 'Moderate' };
  if (rate >= 0.5) return { status: 'low', statusLabel: 'Low' };
  return { status: 'very-low', statusLabel: 'Very low' };
}

function percentDisplay(rate: number): string {
  return `${Math.round(Math.min(100, Math.max(0, rate * 100)))}%`;
}

function starDisplay(avg: number): string {
  if (avg <= 0) return '—';
  return `${avg.toFixed(1)} ★`;
}

function pointsFromRate(rate: number, max: number): number {
  return Math.round(Math.min(max, Math.max(0, rate * max)));
}

function guardAssignedJobs(guardId: string, requests: SecurityRequest[]): SecurityRequest[] {
  return requests.filter(
    (r) =>
      r.assignedGuardId === guardId &&
      ['accepted', 'in-progress', 'completed', 'closed', 'cancelled'].includes(r.status)
  );
}

function computeAcceptanceRate(guardId: string, requests: SecurityRequest[]): number {
  const applications = requests.filter((r) => r.applicants?.includes(guardId));
  if (!applications.length) {
    const assigned = guardAssignedJobs(guardId, requests);
    return assigned.length > 0 ? 1 : 0;
  }
  const accepted = applications.filter((r) => r.assignedGuardId === guardId);
  return accepted.length / applications.length;
}

function computeCompletionRate(guardId: string, requests: SecurityRequest[]): number {
  const assigned = guardAssignedJobs(guardId, requests);
  if (!assigned.length) return 0;
  const completed = assigned.filter((r) => r.status === 'completed' || r.status === 'closed');
  return completed.length / assigned.length;
}

function computeQualityRate(metrics: GuardPerformanceMetrics): number {
  if (metrics.jobsSampled <= 0) return 0;
  return (metrics.uniformComplianceRate + metrics.checkInCompletionRate) / 2;
}

export function getPerformanceTier(overallRating: number): PerformanceTier {
  if (overallRating >= 85) return PERFORMANCE_TIERS[2];
  if (overallRating >= 75) return PERFORMANCE_TIERS[1];
  if (overallRating >= 60) return PERFORMANCE_TIERS[0];
  return STARTING_TIER;
}

export function getNextPerformanceTier(overallRating: number): PerformanceTier | null {
  const next = PERFORMANCE_TIERS.find((t) => overallRating < t.threshold);
  return next ?? null;
}

export function computePerformanceViolations(
  guardId: string,
  guard: SecurityGuard,
  requests: SecurityRequest[]
): PerformanceViolation[] {
  const violations: PerformanceViolation[] = [];

  const noShows = guardAssignedJobs(guardId, requests).filter(
    (r) => (r as SecurityRequest & { noShow?: boolean }).noShow === true
  ).length;
  if (noShows > 0) {
    violations.push({ id: 'no-show', label: 'No-show', count: noShows });
  }

  const failedAudits = guard.failedAudits ?? 0;
  if (failedAudits > 0) {
    violations.push({ id: 'failed-audit', label: 'Failed uniform audit', count: failedAudits });
  }

  const clientReported = countGuardViolationReports(guardId, requests);
  if (clientReported > 0) {
    violations.push({
      id: 'client-reported',
      label: 'Client-reported violation',
      count: clientReported,
    });
  }

  return violations;
}

export function buildPerformanceFactors(
  guardId: string,
  metrics: GuardPerformanceMetrics,
  clientReviews: ClientReviewStats,
  requests: SecurityRequest[]
): PerformanceFactor[] {
  const acceptanceRate = computeAcceptanceRate(guardId, requests);
  const completionRate = computeCompletionRate(guardId, requests);
  const onTimeRate = metrics.jobsSampled > 0 ? metrics.onTimeRate : 0;
  const qualityRate = computeQualityRate(metrics);
  const clientRate = clientReviews.count > 0 ? clientReviews.average / 5 : 0;

  const factors: PerformanceFactor[] = [
    {
      id: 'acceptance',
      label: 'Acceptance rate',
      rate: acceptanceRate,
      rateDisplay: percentDisplay(acceptanceRate),
      pointsEarned: pointsFromRate(acceptanceRate, FACTOR_WEIGHTS.acceptance),
      pointsMax: FACTOR_WEIGHTS.acceptance,
      ...factorStatus(acceptanceRate),
    },
    {
      id: 'completion',
      label: 'Completion rate',
      rate: completionRate,
      rateDisplay: percentDisplay(completionRate),
      pointsEarned: pointsFromRate(completionRate, FACTOR_WEIGHTS.completion),
      pointsMax: FACTOR_WEIGHTS.completion,
      ...factorStatus(completionRate),
    },
    {
      id: 'on-time',
      label: 'On-time rate',
      rate: onTimeRate,
      rateDisplay: percentDisplay(onTimeRate),
      pointsEarned: pointsFromRate(onTimeRate, FACTOR_WEIGHTS.onTime),
      pointsMax: FACTOR_WEIGHTS.onTime,
      ...factorStatus(onTimeRate),
    },
    {
      id: 'quality',
      label: 'Quality rate',
      rate: qualityRate,
      rateDisplay: percentDisplay(qualityRate),
      pointsEarned: pointsFromRate(qualityRate, FACTOR_WEIGHTS.quality),
      pointsMax: FACTOR_WEIGHTS.quality,
      ...factorStatus(qualityRate),
    },
  ];

  if (clientReviews.count > 0) {
    factors.push({
      id: 'client-rating',
      label: 'Customer rating',
      rate: clientRate,
      rateDisplay: starDisplay(clientReviews.average),
      pointsEarned: pointsFromRate(clientRate, FACTOR_WEIGHTS.clientRating),
      pointsMax: FACTOR_WEIGHTS.clientRating,
      ...factorStatus(clientRate),
    });
  }

  return factors;
}

export function computeGuardPerformanceRating(
  guard: SecurityGuard,
  requests: SecurityRequest[],
  reports: ShiftReport[] = []
): GuardPerformanceRating {
  const metrics = computeGuardPerformance(guard.id, requests, reports);
  const clientReviews = computeClientReviewStats(guard.id, requests);
  const factors = buildPerformanceFactors(guard.id, metrics, clientReviews, requests);
  const violations = computePerformanceViolations(guard.id, guard, requests);

  const overallRating = factors.reduce((sum, f) => sum + f.pointsEarned, 0);
  const tier = getPerformanceTier(overallRating);
  const nextTier = getNextPerformanceTier(overallRating);
  const pointsToNextTier = nextTier ? Math.max(0, nextTier.threshold - overallRating) : 0;

  return {
    overallRating,
    tier,
    nextTier,
    pointsToNextTier,
    factors,
    violations,
  };
}

export function formatOverallRating(score: number): string {
  if (score <= 0) return '—';
  return String(score);
}

export function formatViolationSummary(violations: PerformanceViolation[]): string {
  const total = violations.reduce((sum, v) => sum + v.count, 0);
  if (total <= 0) return '';
  if (total === 1) return '1 contract violation';
  return `${total} contract violations`;
}
