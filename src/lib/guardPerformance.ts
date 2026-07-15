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

const SKILL_BY_JOB_TYPE: Partial<Record<JobType, string>> = {
  'nightclub-bar': 'Nightlife Security',
  'event-wedding': 'Wedding Security',
  'event-concert': 'Concert Security',
  'event-festival': 'Festival Security',
  'event-corporate': 'Corporate Event Security',
  'event-private': 'Private Event Security',
  event: 'Event Security',
  patrol: 'Patrol',
  construction: 'Construction Security',
  'fire-watch': 'Fire Watch',
  'standing-guard': 'Standing Guard',
  'armed-escort': 'Armed Escort',
  bodyguard: 'Executive Protection',
  'asset-protection': 'Asset Protection',
  other: 'General Security',
};

export function computeGuardSkillRatings(
  guard: SecurityGuard,
  requests: SecurityRequest[]
): GuardSkillRating[] {
  const jobs = guardCompletedJobs(guard.id, requests);
  const buckets = new Map<string, { total: number; count: number }>();

  for (const job of jobs) {
    const skill =
      guard.specialties?.find((s) => job.title.toLowerCase().includes(s.toLowerCase())) ??
      SKILL_BY_JOB_TYPE[job.type] ??
      'General Security';
    const rating = job.ratingGiven ?? guard.rating;
    const entry = buckets.get(skill) ?? { total: 0, count: 0 };
    entry.total += rating;
    entry.count += 1;
    buckets.set(skill, entry);
  }

  for (const specialty of guard.specialties ?? []) {
    if (!buckets.has(specialty)) {
      buckets.set(specialty, { total: guard.rating, count: 1 });
    }
  }

  return [...buckets.entries()]
    .map(([skill, { total, count }]) => ({
      skill,
      rating: Number((total / count).toFixed(1)),
      reviewCount: count,
    }))
    .sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating);
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
