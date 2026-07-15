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
  event: 'Event Security',
  patrol: 'Patrol',
  'armed-escort': 'Armed Escort',
  bodyguard: 'Executive Protection',
  'asset-protection': 'Asset Protection',
  'long-term': 'Site Security',
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
