import type { JobType, SecurityRequest } from '../types';
import type { PerformanceFactor, PerformanceFactorStatus } from './guardPerformance';

export type PerformanceFactorId =
  | 'acceptance'
  | 'completion'
  | 'on-time'
  | 'quality'
  | 'client-rating';

export const PERFORMANCE_FACTOR_IDS: PerformanceFactorId[] = [
  'acceptance',
  'completion',
  'on-time',
  'quality',
  'client-rating',
];

export function isPerformanceFactorId(value: string): value is PerformanceFactorId {
  return PERFORMANCE_FACTOR_IDS.includes(value as PerformanceFactorId);
}

export interface FactorPointBand {
  status: PerformanceFactorStatus;
  statusLabel: string;
  rangeLabel: string;
  pointsMin: number;
  pointsMax: number;
}

export interface FactorDetailCopy {
  aboutTitle: string;
  aboutBody: string;
  thresholdWarning?: string;
  activityHeading: string;
  positiveLabel: string;
  negativeLabel: string;
  excludedLabel: string;
  viewAllLabel: string;
  tips: string[];
  windowLabel: string;
}

export interface FactorActivityRow {
  id: string;
  label: string;
  count: number;
  total: number;
  tone: 'positive' | 'negative' | 'neutral';
}

export interface FactorActivityBreakdown {
  rows: FactorActivityRow[];
  excludedCount: number;
  windowSize: number;
}

export type FactorWindowCell = 'positive' | 'negative' | 'neutral' | 'empty';

export interface FactorRollingWindow {
  cells: FactorWindowCell[];
  droppedCells: FactorWindowCell[];
  positiveCount: number;
  negativeCount: number;
}

const ROLLING_WINDOW_SIZE = 100;
const ON_TIME_GRACE_MS = 15 * 60 * 1000;

export const FACTOR_POINT_SCALES: Record<PerformanceFactorId, FactorPointBand[]> = {
  acceptance: [
    { status: 'very-high', statusLabel: 'Very high', rangeLabel: '80% – 100%', pointsMin: 25, pointsMax: 30 },
    { status: 'high', statusLabel: 'High', rangeLabel: '65% – 79%', pointsMin: 20, pointsMax: 24 },
    { status: 'moderate', statusLabel: 'Moderate', rangeLabel: '50% – 64%', pointsMin: 15, pointsMax: 19 },
    { status: 'low', statusLabel: 'Low', rangeLabel: '21% – 49%', pointsMin: 1, pointsMax: 14 },
    { status: 'very-low', statusLabel: 'Very low', rangeLabel: '0% – 20%', pointsMin: 0, pointsMax: 0 },
  ],
  completion: [
    { status: 'very-high', statusLabel: 'Very high', rangeLabel: '99% – 100%', pointsMin: 13, pointsMax: 15 },
    { status: 'high', statusLabel: 'High', rangeLabel: '97% – 98%', pointsMin: 11, pointsMax: 12 },
    { status: 'moderate', statusLabel: 'Moderate', rangeLabel: '94% – 96%', pointsMin: 5, pointsMax: 9 },
    { status: 'low', statusLabel: 'Low', rangeLabel: '91% – 93%', pointsMin: 1, pointsMax: 3 },
    { status: 'very-low', statusLabel: 'Very low', rangeLabel: '0% – 90%', pointsMin: 0, pointsMax: 0 },
  ],
  'on-time': [
    { status: 'very-high', statusLabel: 'Very high', rangeLabel: '95% – 100%', pointsMin: 36, pointsMax: 40 },
    { status: 'high', statusLabel: 'High', rangeLabel: '85% – 94%', pointsMin: 28, pointsMax: 35 },
    { status: 'moderate', statusLabel: 'Moderate', rangeLabel: '70% – 84%', pointsMin: 18, pointsMax: 27 },
    { status: 'low', statusLabel: 'Low', rangeLabel: '50% – 69%', pointsMin: 6, pointsMax: 17 },
    { status: 'very-low', statusLabel: 'Very low', rangeLabel: '0% – 49%', pointsMin: 0, pointsMax: 5 },
  ],
  quality: [
    { status: 'very-high', statusLabel: 'Very high', rangeLabel: '95% – 100%', pointsMin: 9, pointsMax: 10 },
    { status: 'high', statusLabel: 'High', rangeLabel: '85% – 94%', pointsMin: 7, pointsMax: 8 },
    { status: 'moderate', statusLabel: 'Moderate', rangeLabel: '70% – 84%', pointsMin: 4, pointsMax: 6 },
    { status: 'low', statusLabel: 'Low', rangeLabel: '50% – 69%', pointsMin: 1, pointsMax: 3 },
    { status: 'very-low', statusLabel: 'Very low', rangeLabel: '0% – 49%', pointsMin: 0, pointsMax: 0 },
  ],
  'client-rating': [
    { status: 'very-high', statusLabel: 'Very high', rangeLabel: '4.8 – 5.0 ★', pointsMin: 5, pointsMax: 5 },
    { status: 'high', statusLabel: 'High', rangeLabel: '4.5 – 4.7 ★', pointsMin: 4, pointsMax: 4 },
    { status: 'moderate', statusLabel: 'Moderate', rangeLabel: '4.0 – 4.4 ★', pointsMin: 2, pointsMax: 3 },
    { status: 'low', statusLabel: 'Low', rangeLabel: '3.0 – 3.9 ★', pointsMin: 1, pointsMax: 1 },
    { status: 'very-low', statusLabel: 'Very low', rangeLabel: 'Below 3.0 ★', pointsMin: 0, pointsMax: 0 },
  ],
};

export const FACTOR_DETAIL_COPY: Record<PerformanceFactorId, FactorDetailCopy> = {
  acceptance: {
    aboutTitle: 'About acceptance rate',
    aboutBody:
      'Your acceptance rate is based on how often you accept shift offers you apply for. It is calculated from your most recent offers.',
    activityHeading: 'Last 100 offers',
    positiveLabel: 'Accepted',
    negativeLabel: 'Declined',
    excludedLabel: 'offers excluded',
    viewAllLabel: 'View all offers',
    windowLabel: 'offers',
    tips: [
      'Raise your app/ringer volume to avoid missing incoming offers',
      'Pause your dash if you need to take a break',
      'Respond to offers when they arrive — timeouts also count toward your rating',
    ],
  },
  completion: {
    aboutTitle: 'About completion rate',
    aboutBody:
      'Your completion rate is based on shifts you finish without unassigning. It is calculated from your most recent assigned shifts.',
    thresholdWarning: 'Keep your completion rate at 90% or above to avoid risking deactivation.',
    activityHeading: 'Last 100 orders',
    positiveLabel: 'Completed',
    negativeLabel: 'Unassigned',
    excludedLabel: 'orders excluded',
    viewAllLabel: 'View all orders',
    windowLabel: 'orders',
    tips: [
      'Complete any shifts you accept, and only unassign in case of emergency',
      'Consider the route and timing when choosing which shifts to accept',
      'Pause availability if you cannot reliably cover upcoming shifts',
    ],
  },
  'on-time': {
    aboutTitle: 'About on-time rate',
    aboutBody:
      'Your on-time rate measures check-ins within 15 minutes of shift start across your most recent completed shifts.',
    activityHeading: 'Last 100 check-ins',
    positiveLabel: 'On time',
    negativeLabel: 'Late',
    excludedLabel: 'check-ins excluded',
    viewAllLabel: 'View all check-ins',
    windowLabel: 'check-ins',
    tips: [
      'Leave early enough to account for traffic and parking',
      'Confirm the site address before you head out',
      'Use the in-app navigation to estimate travel time',
    ],
  },
  quality: {
    aboutTitle: 'About quality rate',
    aboutBody:
      'Your quality rate combines uniform compliance and check-in completion across your most recent completed shifts.',
    activityHeading: 'Last 100 audits',
    positiveLabel: 'Passed',
    negativeLabel: 'Missed',
    excludedLabel: 'audits excluded',
    viewAllLabel: 'View all audits',
    windowLabel: 'audits',
    tips: [
      'Complete your check-in audit before starting duty',
      'Wear the required uniform and duty belt every shift',
      'Keep your badge and professional appearance camera-ready',
    ],
  },
  'client-rating': {
    aboutTitle: 'About customer rating',
    aboutBody:
      'Your customer rating is the average star score clients leave after completed shifts in your rolling window.',
    activityHeading: 'Last 100 reviews',
    positiveLabel: '4+ stars',
    negativeLabel: 'Below 4 stars',
    excludedLabel: 'reviews excluded',
    viewAllLabel: 'View all reviews',
    windowLabel: 'reviews',
    tips: [
      'Greet clients professionally at arrival and departure',
      'Follow post orders and site-specific instructions',
      'Submit incident reports promptly when issues arise',
    ],
  },
};

function guardAssignedJobs(guardId: string, requests: SecurityRequest[]): SecurityRequest[] {
  return requests.filter(
    (r) =>
      r.assignedGuardId === guardId &&
      ['accepted', 'in-progress', 'completed', 'closed', 'cancelled'].includes(r.status)
  );
}

function guardCompletedJobs(guardId: string, requests: SecurityRequest[]): SecurityRequest[] {
  return requests.filter(
    (r) =>
      r.assignedGuardId === guardId &&
      (r.status === 'completed' || r.status === 'closed')
  );
}

function sortByRecent(jobs: SecurityRequest[]): SecurityRequest[] {
  return [...jobs].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
}

function isOnTimeCheckIn(job: SecurityRequest): boolean | null {
  if (!job.checkInAudit?.checkedAt) return null;
  const startMs = new Date(job.startDate).getTime();
  const checkMs = new Date(job.checkInAudit.checkedAt).getTime();
  return checkMs <= startMs + ON_TIME_GRACE_MS;
}

function passedQualityAudit(job: SecurityRequest): boolean | null {
  if (!job.checkInAudit?.checkedAt) return null;
  const uniform = job.checkInAudit.uniform;
  return !!(
    uniform?.uniformPresent &&
    uniform?.blackShoes &&
    uniform?.professionalAppearance
  );
}

function acceptanceEvents(guardId: string, requests: SecurityRequest[]) {
  const applications = sortByRecent(
    requests.filter((r) => r.applicants?.includes(guardId))
  );
  return applications.map((job) => ({
    job,
    positive: job.assignedGuardId === guardId,
    excluded: job.status === 'cancelled' && job.assignedGuardId !== guardId,
  }));
}

function completionEvents(guardId: string, requests: SecurityRequest[]) {
  const assigned = sortByRecent(guardAssignedJobs(guardId, requests));
  return assigned.map((job) => ({
    job,
    positive: job.status === 'completed' || job.status === 'closed',
    excluded: false,
  }));
}

function onTimeEvents(guardId: string, requests: SecurityRequest[]) {
  const jobs = sortByRecent(guardCompletedJobs(guardId, requests));
  return jobs.map((job) => {
    const onTime = isOnTimeCheckIn(job);
    return {
      job,
      positive: onTime === true,
      excluded: onTime === null,
    };
  });
}

function qualityEvents(guardId: string, requests: SecurityRequest[]) {
  const jobs = sortByRecent(guardCompletedJobs(guardId, requests));
  return jobs.map((job) => {
    const passed = passedQualityAudit(job);
    return {
      job,
      positive: passed === true,
      excluded: passed === null,
    };
  });
}

function clientRatingEvents(guardId: string, requests: SecurityRequest[]) {
  const jobs = sortByRecent(
    guardCompletedJobs(guardId, requests).filter(
      (j) => typeof j.ratingGiven === 'number' && j.ratingGiven > 0
    )
  );
  return jobs.map((job) => ({
    job,
    positive: (job.ratingGiven ?? 0) >= 4,
    excluded: false,
  }));
}

function eventsForFactor(
  guardId: string,
  factorId: PerformanceFactorId,
  requests: SecurityRequest[]
) {
  switch (factorId) {
    case 'acceptance':
      return acceptanceEvents(guardId, requests);
    case 'completion':
      return completionEvents(guardId, requests);
    case 'on-time':
      return onTimeEvents(guardId, requests);
    case 'quality':
      return qualityEvents(guardId, requests);
    case 'client-rating':
      return clientRatingEvents(guardId, requests);
  }
}

export function computeFactorActivityBreakdown(
  guardId: string,
  factorId: PerformanceFactorId,
  requests: SecurityRequest[]
): FactorActivityBreakdown {
  const events = eventsForFactor(guardId, factorId, requests);
  const included = events.filter((e) => !e.excluded).slice(0, ROLLING_WINDOW_SIZE);
  const excludedCount = events.filter((e) => e.excluded).length;
  const positiveCount = included.filter((e) => e.positive).length;
  const negativeCount = included.length - positiveCount;

  return {
    windowSize: ROLLING_WINDOW_SIZE,
    excludedCount,
    rows: [
      {
        id: 'positive',
        label: FACTOR_DETAIL_COPY[factorId].positiveLabel,
        count: positiveCount,
        total: included.length,
        tone: 'positive',
      },
      {
        id: 'negative',
        label: FACTOR_DETAIL_COPY[factorId].negativeLabel,
        count: negativeCount,
        total: included.length,
        tone: 'negative',
      },
    ],
  };
}

export function computeFactorRollingWindow(
  guardId: string,
  factorId: PerformanceFactorId,
  requests: SecurityRequest[]
): FactorRollingWindow {
  const events = eventsForFactor(guardId, factorId, requests);
  const included = events.filter((e) => !e.excluded);
  const recent = included.slice(0, ROLLING_WINDOW_SIZE);
  const dropped = included.slice(ROLLING_WINDOW_SIZE, ROLLING_WINDOW_SIZE + 5);

  const toCell = (positive: boolean): FactorWindowCell => (positive ? 'positive' : 'negative');

  const cells: FactorWindowCell[] = recent.map((e) => toCell(e.positive));
  const targetGrid = Math.min(100, Math.max(recent.length, 40));
  while (cells.length < targetGrid) {
    cells.push('empty');
  }

  return {
    cells,
    droppedCells: dropped.map((e) => toCell(e.positive)),
    positiveCount: recent.filter((e) => e.positive).length,
    negativeCount: recent.filter((e) => !e.positive).length,
  };
}

export function factorPointsMarkerPercent(factor: PerformanceFactor): number {
  if (factor.pointsMax <= 0) return 0;
  return Math.min(100, Math.max(0, (factor.pointsEarned / factor.pointsMax) * 100));
}

export function formatFactorStreak(count: number, factorId: PerformanceFactorId): string {
  if (count <= 0) return '0 in a row';
  if (factorId === 'client-rating') return `${count} strong in a row`;
  if (count >= 100) return '100+ in a row';
  return `${count} in a row`;
}

export function computeFactorStreak(
  guardId: string,
  factorId: PerformanceFactorId,
  requests: SecurityRequest[]
): number {
  const events = eventsForFactor(guardId, factorId, requests).filter((e) => !e.excluded);
  let streak = 0;
  for (const event of events) {
    if (!event.positive) break;
    streak += 1;
  }
  return streak;
}

export function computeFactorWeekDelta(
  guardId: string,
  factorId: PerformanceFactorId,
  requests: SecurityRequest[]
): number {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const events = eventsForFactor(guardId, factorId, requests).filter((e) => !e.excluded);

  const rateForWindow = (startMs: number, endMs: number) => {
    const windowEvents = events.filter((e) => {
      const t = new Date(e.job.startDate).getTime();
      return t >= startMs && t < endMs;
    });
    if (!windowEvents.length) return null;
    return windowEvents.filter((e) => e.positive).length / windowEvents.length;
  };

  const current = rateForWindow(now - weekMs, now);
  const previous = rateForWindow(now - weekMs * 2, now - weekMs);
  if (current == null || previous == null) return 0;
  return Math.round((current - previous) * 100);
}

export interface FactorHistoryItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  outcome: 'positive' | 'negative' | 'neutral';
  outcomeLabel: string;
  jobType?: JobType;
}

export function buildFactorHistory(
  guardId: string,
  factorId: PerformanceFactorId,
  requests: SecurityRequest[]
): FactorHistoryItem[] {
  return eventsForFactor(guardId, factorId, requests)
    .filter((e) => !e.excluded)
    .map(({ job, positive }) => ({
      id: job.id,
      title: job.title,
      subtitle: `${job.clientName} · ${job.status.replace('-', ' ')}`,
      date: job.startDate,
      outcome: positive ? 'positive' : 'negative',
      outcomeLabel: positive
        ? FACTOR_DETAIL_COPY[factorId].positiveLabel
        : FACTOR_DETAIL_COPY[factorId].negativeLabel,
      jobType: job.type,
    }));
}
