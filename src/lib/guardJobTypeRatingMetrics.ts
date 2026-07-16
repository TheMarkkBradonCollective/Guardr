import type { JobType, SecurityRequest } from '../types';
import { JOB_TYPE_PREFERENCE_CATEGORIES } from './guardJobPreferences';
import {
  computeClientReviewStatsForJobType,
  computeClientReviewStatsForModality,
  computeGuardPerformanceForJobType,
  computeGuardPerformanceForModality,
  type GuardPerformanceMetrics,
  type PerformanceFactorStatus,
} from './guardPerformance';
import {
  jobTypesForModality,
  representativeJobTypeForModality,
  workModalityLabel,
  type WorkModality,
} from './guardWorkModality';

export type JobTypeRatingCategory = 'nightlife' | 'events' | 'sites' | 'specialized';

export type JobTypeMetricId =
  | 'on-time'
  | 'check-ins'
  | 'uniform'
  | 'attendance'
  | 'incident-free'
  | 'client-rating'
  | 'lifetime-shifts';

export const JOB_TYPE_METRIC_IDS: JobTypeMetricId[] = [
  'on-time',
  'check-ins',
  'uniform',
  'attendance',
  'incident-free',
  'client-rating',
  'lifetime-shifts',
];

export function isJobTypeMetricId(value: string): value is JobTypeMetricId {
  return JOB_TYPE_METRIC_IDS.includes(value as JobTypeMetricId);
}

export const JOB_TYPE_RATING_DISPLAY_NAMES: Record<JobType, string> = {
  'nightclub-bar': 'Nightlife',
  'event-wedding': 'Weddings',
  'event-concert': 'Concerts',
  'event-festival': 'Festivals',
  'event-corporate': 'Corporate events',
  'event-private': 'Private events',
  event: 'Events',
  'foot-patrol': 'Foot patrol',
  'vehicle-patrol': 'Vehicle patrol',
  patrol: 'Patrol',
  construction: 'Construction',
  'fire-watch': 'Fire watch',
  'standing-guard': 'Standing guard',
  bodyguard: 'Executive protection',
  'armed-escort': 'Armed escort',
  'asset-protection': 'Property security',
  other: 'Custom requests',
};

interface JobTypeMetricTemplate {
  id: JobTypeMetricId;
  label: Record<JobTypeRatingCategory, string>;
  targetLabel: string;
  targetRate: number;
  kind: 'rate' | 'count' | 'stars';
  targetCount?: number;
}

const METRIC_TEMPLATES: Record<JobTypeRatingCategory, JobTypeMetricTemplate[]> = {
  nightlife: [
    {
      id: 'on-time',
      label: {
        nightlife: 'Door readiness',
        events: 'On-time arrival',
        sites: 'On-time arrival',
        specialized: 'On-time arrival',
      },
      targetLabel: 'Stay above 90%',
      targetRate: 0.9,
      kind: 'rate',
    },
    {
      id: 'check-ins',
      label: {
        nightlife: 'Venue check-ins',
        events: 'Post check-ins',
        sites: 'Site check-ins',
        specialized: 'Assignment check-ins',
      },
      targetLabel: 'Stay above 95%',
      targetRate: 0.95,
      kind: 'rate',
    },
    {
      id: 'uniform',
      label: {
        nightlife: 'Appearance standard',
        events: 'Dress code compliance',
        sites: 'Uniform compliance',
        specialized: 'Professional appearance',
      },
      targetLabel: 'Stay above 95%',
      targetRate: 0.95,
      kind: 'rate',
    },
    {
      id: 'client-rating',
      label: {
        nightlife: 'Client rating',
        events: 'Client rating',
        sites: 'Client rating',
        specialized: 'Client rating',
      },
      targetLabel: 'Stay above 4.5 ★',
      targetRate: 0.9,
      kind: 'stars',
    },
    {
      id: 'attendance',
      label: {
        nightlife: 'Shift attendance',
        events: 'Shift attendance',
        sites: 'Attendance',
        specialized: 'Shift attendance',
      },
      targetLabel: 'Stay above 95%',
      targetRate: 0.95,
      kind: 'rate',
    },
    {
      id: 'lifetime-shifts',
      label: {
        nightlife: 'Lifetime venue shifts',
        events: 'Lifetime event shifts',
        sites: 'Lifetime site shifts',
        specialized: 'Lifetime assignments',
      },
      targetLabel: 'Requires 5',
      targetRate: 1,
      kind: 'count',
      targetCount: 5,
    },
  ],
  events: [
    {
      id: 'on-time',
      label: {
        nightlife: 'Door readiness',
        events: 'On-time arrival',
        sites: 'On-time arrival',
        specialized: 'On-time arrival',
      },
      targetLabel: 'Stay above 90%',
      targetRate: 0.9,
      kind: 'rate',
    },
    {
      id: 'check-ins',
      label: {
        nightlife: 'Venue check-ins',
        events: 'Post check-ins',
        sites: 'Site check-ins',
        specialized: 'Assignment check-ins',
      },
      targetLabel: 'Stay above 95%',
      targetRate: 0.95,
      kind: 'rate',
    },
    {
      id: 'uniform',
      label: {
        nightlife: 'Appearance standard',
        events: 'Dress code compliance',
        sites: 'Uniform compliance',
        specialized: 'Professional appearance',
      },
      targetLabel: 'Stay above 95%',
      targetRate: 0.95,
      kind: 'rate',
    },
    {
      id: 'incident-free',
      label: {
        nightlife: 'Incident-free shifts',
        events: 'Incident-free events',
        sites: 'Incident-free record',
        specialized: 'Incident-free record',
      },
      targetLabel: 'Stay above 95%',
      targetRate: 0.95,
      kind: 'rate',
    },
    {
      id: 'client-rating',
      label: {
        nightlife: 'Client rating',
        events: 'Client rating',
        sites: 'Client rating',
        specialized: 'Client rating',
      },
      targetLabel: 'Stay above 4.5 ★',
      targetRate: 0.9,
      kind: 'stars',
    },
    {
      id: 'lifetime-shifts',
      label: {
        nightlife: 'Lifetime venue shifts',
        events: 'Lifetime event shifts',
        sites: 'Lifetime site shifts',
        specialized: 'Lifetime assignments',
      },
      targetLabel: 'Requires 5',
      targetRate: 1,
      kind: 'count',
      targetCount: 5,
    },
  ],
  sites: [
    {
      id: 'on-time',
      label: {
        nightlife: 'Door readiness',
        events: 'On-time arrival',
        sites: 'On-time arrival',
        specialized: 'On-time arrival',
      },
      targetLabel: 'Stay above 90%',
      targetRate: 0.9,
      kind: 'rate',
    },
    {
      id: 'check-ins',
      label: {
        nightlife: 'Venue check-ins',
        events: 'Post check-ins',
        sites: 'Site check-ins',
        specialized: 'Assignment check-ins',
      },
      targetLabel: 'Stay above 95%',
      targetRate: 0.95,
      kind: 'rate',
    },
    {
      id: 'uniform',
      label: {
        nightlife: 'Appearance standard',
        events: 'Dress code compliance',
        sites: 'Uniform compliance',
        specialized: 'Professional appearance',
      },
      targetLabel: 'Stay above 95%',
      targetRate: 0.95,
      kind: 'rate',
    },
    {
      id: 'attendance',
      label: {
        nightlife: 'Shift attendance',
        events: 'Shift attendance',
        sites: 'Attendance',
        specialized: 'Shift attendance',
      },
      targetLabel: 'Stay above 95%',
      targetRate: 0.95,
      kind: 'rate',
    },
    {
      id: 'incident-free',
      label: {
        nightlife: 'Incident-free shifts',
        events: 'Incident-free events',
        sites: 'Incident-free record',
        specialized: 'Incident-free record',
      },
      targetLabel: 'Stay above 95%',
      targetRate: 0.95,
      kind: 'rate',
    },
    {
      id: 'lifetime-shifts',
      label: {
        nightlife: 'Lifetime venue shifts',
        events: 'Lifetime event shifts',
        sites: 'Lifetime site shifts',
        specialized: 'Lifetime assignments',
      },
      targetLabel: 'Requires 5',
      targetRate: 1,
      kind: 'count',
      targetCount: 5,
    },
  ],
  specialized: [
    {
      id: 'on-time',
      label: {
        nightlife: 'Door readiness',
        events: 'On-time arrival',
        sites: 'On-time arrival',
        specialized: 'On-time arrival',
      },
      targetLabel: 'Stay above 90%',
      targetRate: 0.9,
      kind: 'rate',
    },
    {
      id: 'check-ins',
      label: {
        nightlife: 'Venue check-ins',
        events: 'Post check-ins',
        sites: 'Site check-ins',
        specialized: 'Assignment check-ins',
      },
      targetLabel: 'Stay above 95%',
      targetRate: 0.95,
      kind: 'rate',
    },
    {
      id: 'uniform',
      label: {
        nightlife: 'Appearance standard',
        events: 'Dress code compliance',
        sites: 'Uniform compliance',
        specialized: 'Professional appearance',
      },
      targetLabel: 'Stay above 95%',
      targetRate: 0.95,
      kind: 'rate',
    },
    {
      id: 'client-rating',
      label: {
        nightlife: 'Client rating',
        events: 'Client rating',
        sites: 'Client rating',
        specialized: 'Client rating',
      },
      targetLabel: 'Stay above 4.5 ★',
      targetRate: 0.9,
      kind: 'stars',
    },
    {
      id: 'incident-free',
      label: {
        nightlife: 'Incident-free shifts',
        events: 'Incident-free events',
        sites: 'Incident-free record',
        specialized: 'Incident-free record',
      },
      targetLabel: 'Stay above 95%',
      targetRate: 0.95,
      kind: 'rate',
    },
    {
      id: 'lifetime-shifts',
      label: {
        nightlife: 'Lifetime venue shifts',
        events: 'Lifetime event shifts',
        sites: 'Lifetime site shifts',
        specialized: 'Lifetime assignments',
      },
      targetLabel: 'Requires 5',
      targetRate: 1,
      kind: 'count',
      targetCount: 5,
    },
  ],
};

export interface JobTypeRatingCard {
  id: JobTypeMetricId;
  label: string;
  valueDisplay: string;
  targetLabel: string;
  rate: number;
  meetsTarget: boolean;
  status: PerformanceFactorStatus;
  statusLabel: string;
}

export interface JobTypeMetricDetailCopy {
  windowLabel: string;
  aboutBody: string;
  targetLevelLabel: string;
  excludedLabel: string;
  tips: string[];
}

const ON_TIME_GRACE_MS = 15 * 60 * 1000;

function factorStatus(rate: number): { status: PerformanceFactorStatus; statusLabel: string } {
  if (rate >= 0.95) return { status: 'very-high', statusLabel: 'Excellent' };
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

export function jobTypeRatingCategory(jobType: JobType): JobTypeRatingCategory {
  if (jobType === 'patrol') return 'sites';
  const match = JOB_TYPE_PREFERENCE_CATEGORIES.find((category) => category.types.includes(jobType));
  return (match?.id as JobTypeRatingCategory | undefined) ?? 'specialized';
}

export function jobTypeRatingDisplayName(jobType: JobType): string {
  return JOB_TYPE_RATING_DISPLAY_NAMES[jobType] ?? jobType;
}

function metricRateForTemplate(
  template: JobTypeMetricTemplate,
  metrics: GuardPerformanceMetrics,
  clientReviews: { average: number; count: number }
): number {
  switch (template.id) {
    case 'on-time':
      return metrics.jobsSampled > 0 ? metrics.onTimeRate : 0;
    case 'check-ins':
      return metrics.jobsSampled > 0 ? metrics.checkInCompletionRate : 0;
    case 'uniform':
      return metrics.jobsSampled > 0 ? metrics.uniformComplianceRate : 0;
    case 'attendance':
      return metrics.jobsSampled > 0 ? metrics.attendanceRate : 0;
    case 'incident-free':
      return metrics.jobsSampled > 0 ? 1 - metrics.incidentPenalty : 0;
    case 'client-rating':
      return clientReviews.count > 0 ? clientReviews.average / 5 : 0;
    case 'lifetime-shifts': {
      const target = template.targetCount ?? 5;
      return Math.min(1, metrics.jobsSampled / target);
    }
    default:
      return 0;
  }
}

function metricValueDisplay(
  template: JobTypeMetricTemplate,
  metrics: GuardPerformanceMetrics,
  clientReviews: { average: number; count: number }
): string {
  if (template.kind === 'count') {
    return String(metrics.jobsSampled);
  }
  if (template.kind === 'stars') {
    return clientReviews.count > 0 ? starDisplay(clientReviews.average) : '—';
  }
  const rate = metricRateForTemplate(template, metrics, clientReviews);
  return percentDisplay(rate);
}

function metricMeetsTarget(
  template: JobTypeMetricTemplate,
  metrics: GuardPerformanceMetrics,
  clientReviews: { average: number; count: number }
): boolean {
  if (template.kind === 'count') {
    return metrics.jobsSampled >= (template.targetCount ?? 5);
  }
  if (template.kind === 'stars') {
    return clientReviews.count > 0 && clientReviews.average >= 4.5;
  }
  return metricRateForTemplate(template, metrics, clientReviews) >= template.targetRate;
}

export function buildJobTypeRatingCards(
  guardId: string,
  jobType: JobType,
  requests: SecurityRequest[]
): JobTypeRatingCard[] {
  const category = jobTypeRatingCategory(jobType);
  const templates = METRIC_TEMPLATES[category];
  const metrics = computeGuardPerformanceForJobType(guardId, requests, jobType);
  const clientReviews = computeClientReviewStatsForJobType(guardId, requests, jobType);

  return templates.map((template) => {
    const rate = metricRateForTemplate(template, metrics, clientReviews);
    const status = factorStatus(rate);
    return {
      id: template.id,
      label: template.label[category],
      valueDisplay: metricValueDisplay(template, metrics, clientReviews),
      targetLabel: template.targetLabel,
      rate,
      meetsTarget: metricMeetsTarget(template, metrics, clientReviews),
      status: status.status,
      statusLabel: status.statusLabel,
    };
  });
}

const MODALITY_METRIC_LABELS: Record<
  WorkModality,
  Record<JobTypeMetricId, string>
> = {
  standing: {
    'on-time': 'Post readiness',
    'check-ins': 'Site check-ins',
    uniform: 'Uniform compliance',
    attendance: 'Attendance',
    'incident-free': 'Incident-free record',
    'client-rating': 'Client rating',
    'lifetime-shifts': 'Lifetime standing shifts',
  },
  driving: {
    'on-time': 'Route readiness',
    'check-ins': 'Patrol check-ins',
    uniform: 'Uniform compliance',
    attendance: 'Attendance',
    'incident-free': 'Incident-free record',
    'client-rating': 'Client rating',
    'lifetime-shifts': 'Lifetime patrol shifts',
  },
};

export function buildModalityRatingCards(
  guardId: string,
  modality: WorkModality,
  requests: SecurityRequest[]
): JobTypeRatingCard[] {
  const representativeType = representativeJobTypeForModality(modality);
  const category = jobTypeRatingCategory(representativeType);
  const templates = METRIC_TEMPLATES[category];
  const metrics = computeGuardPerformanceForModality(guardId, requests, modality);
  const clientReviews = computeClientReviewStatsForModality(guardId, requests, modality);
  const labels = MODALITY_METRIC_LABELS[modality];

  return templates.map((template) => {
    const rate = metricRateForTemplate(template, metrics, clientReviews);
    const status = factorStatus(rate);
    return {
      id: template.id,
      label: labels[template.id],
      valueDisplay: metricValueDisplay(template, metrics, clientReviews),
      targetLabel: template.targetLabel,
      rate,
      meetsTarget: metricMeetsTarget(template, metrics, clientReviews),
      status: status.status,
      statusLabel: status.statusLabel,
    };
  });
}

function completedJobsForModality(
  guardId: string,
  requests: SecurityRequest[],
  modality: WorkModality
): SecurityRequest[] {
  const modalityTypes = new Set(jobTypesForModality(modality));

  return requests
    .filter(
      (request) =>
        request.assignedGuardId === guardId &&
        (request.status === 'completed' || request.status === 'closed') &&
        modalityTypes.has((request.type ?? 'other') as JobType)
    )
    .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
}

function completedJobsForType(
  guardId: string,
  requests: SecurityRequest[],
  jobType: JobType
): SecurityRequest[] {
  return requests
    .filter(
      (request) =>
        request.assignedGuardId === guardId &&
        (request.status === 'completed' || request.status === 'closed') &&
        (request.type ?? 'other') === jobType
    )
    .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
}

function shiftPassesMetric(
  job: SecurityRequest,
  metricId: JobTypeMetricId
): boolean | null {
  const noShow = (job as SecurityRequest & { noShow?: boolean }).noShow === true;

  switch (metricId) {
    case 'on-time': {
      if (!job.checkInAudit?.checkedAt) return false;
      const startMs = new Date(job.startDate).getTime();
      const checkMs = new Date(job.checkInAudit.checkedAt).getTime();
      return checkMs <= startMs + ON_TIME_GRACE_MS;
    }
    case 'check-ins':
      return !!job.checkInAudit?.checkedAt;
    case 'uniform': {
      const uniform = job.checkInAudit?.uniform;
      return !!(
        uniform?.uniformPresent &&
        uniform?.blackShoes &&
        uniform?.professionalAppearance
      );
    }
    case 'attendance':
      return !noShow;
    case 'incident-free':
      return true;
    case 'client-rating':
      return typeof job.ratingGiven === 'number' && job.ratingGiven >= 4.5;
    case 'lifetime-shifts':
      return true;
    default:
      return null;
  }
}

export function computeJobTypeMetricBreakdown(
  guardId: string,
  jobType: JobType,
  metricId: JobTypeMetricId,
  requests: SecurityRequest[]
): { positiveCount: number; negativeCount: number; excludedCount: number; windowSize: number } {
  const jobs = completedJobsForType(guardId, requests, jobType).slice(0, 40);
  let positiveCount = 0;
  let negativeCount = 0;
  let excludedCount = 0;

  for (const job of jobs) {
    const result = shiftPassesMetric(job, metricId);
    if (result == null) {
      excludedCount += 1;
      continue;
    }
    if (result) positiveCount += 1;
    else negativeCount += 1;
  }

  return {
    positiveCount,
    negativeCount,
    excludedCount,
    windowSize: jobs.length,
  };
}

export function computeModalityMetricBreakdown(
  guardId: string,
  modality: WorkModality,
  metricId: JobTypeMetricId,
  requests: SecurityRequest[]
): { positiveCount: number; negativeCount: number; excludedCount: number; windowSize: number } {
  const jobs = completedJobsForModality(guardId, requests, modality).slice(0, 40);
  let positiveCount = 0;
  let negativeCount = 0;
  let excludedCount = 0;

  for (const job of jobs) {
    const result = shiftPassesMetric(job, metricId);
    if (result == null) {
      excludedCount += 1;
      continue;
    }
    if (result) positiveCount += 1;
    else negativeCount += 1;
  }

  return {
    positiveCount,
    negativeCount,
    excludedCount,
    windowSize: jobs.length,
  };
}

export function buildJobTypeMetricDetailCopy(
  guardId: string,
  jobType: JobType,
  metricId: JobTypeMetricId,
  card: JobTypeRatingCard,
  requests: SecurityRequest[]
): JobTypeMetricDetailCopy {
  const displayName = jobTypeRatingDisplayName(jobType).toLowerCase();
  const breakdown = computeJobTypeMetricBreakdown(guardId, jobType, metricId, requests);
  const windowLabel =
    breakdown.windowSize > 0 ? `LAST ${breakdown.windowSize} SHIFTS` : 'NO SHIFTS YET';
  const targetLevelLabel =
    metricId === 'client-rating'
      ? 'Pro level: 4.5 ★'
      : metricId === 'lifetime-shifts'
        ? 'Pro level: 5 shifts'
        : `Pro level: ${card.targetLabel.replace('Stay above ', '').replace('Requires ', '')}`;

  const aboutBody =
    breakdown.windowSize > 0
      ? `You scored ${card.valueDisplay} on ${card.label.toLowerCase()} across your recent ${displayName} shifts. ${breakdown.positiveCount} of ${breakdown.windowSize} counted shifts met the target, with ${breakdown.negativeCount} needing improvement.`
      : `Complete ${displayName} shifts to start tracking ${card.label.toLowerCase()}. Your cards will show 0% until you have shift history in this category.`;

  const tipsByMetric: Record<JobTypeMetricId, string[]> = {
    'on-time': [
      'Plan arrival 15 minutes before shift start so check-in stays inside the grace window.',
      'Use the job briefing to confirm the venue entrance and parking before you leave.',
    ],
    'check-ins': [
      'Check in as soon as you arrive on site so the client sees you are in position.',
      'Complete the self-audit photos when prompted — missed check-ins hurt this score.',
    ],
    uniform: [
      'Lay out uniform items the night before so nothing is missing at shift start.',
      'Use the pre-shift self-audit to catch appearance issues before you clock in.',
    ],
    attendance: [
      'Accept only shifts you can fully cover and update availability when plans change.',
      'Message the client early if an emergency could affect your arrival.',
    ],
    'incident-free': [
      'Follow post orders and de-escalation steps documented in the shift briefing.',
      'Report incidents promptly so they are documented accurately on the shift record.',
    ],
    'client-rating': [
      'Greet the client contact professionally at arrival and before departure.',
      'Ask for feedback after complex shifts so you can improve before the review is submitted.',
    ],
    'lifetime-shifts': [
      'Enable alerts for this job type in Preferences to see more matching shifts.',
      'Complete at least five shifts to establish a reliable specialty rating.',
    ],
  };

  return {
    windowLabel,
    aboutBody,
    targetLevelLabel,
    excludedLabel:
      breakdown.excludedCount === 1
        ? 'shift excluded from this calculation'
        : 'shifts excluded from this calculation',
    tips: tipsByMetric[metricId],
  };
}

export function getJobTypeRatingCard(
  guardId: string,
  jobType: JobType,
  metricId: JobTypeMetricId,
  requests: SecurityRequest[]
): JobTypeRatingCard | null {
  return buildJobTypeRatingCards(guardId, jobType, requests).find((card) => card.id === metricId) ?? null;
}

export function buildModalityMetricDetailCopy(
  guardId: string,
  modality: WorkModality,
  metricId: JobTypeMetricId,
  card: JobTypeRatingCard,
  requests: SecurityRequest[]
): JobTypeMetricDetailCopy {
  const displayName = workModalityLabel(modality).toLowerCase();
  const breakdown = computeModalityMetricBreakdown(guardId, modality, metricId, requests);
  const windowLabel =
    breakdown.windowSize > 0 ? `LAST ${breakdown.windowSize} SHIFTS` : 'NO SHIFTS YET';
  const targetLevelLabel =
    metricId === 'client-rating'
      ? 'Pro level: 4.5 ★'
      : metricId === 'lifetime-shifts'
        ? 'Pro level: 5 shifts'
        : `Pro level: ${card.targetLabel.replace('Stay above ', '').replace('Requires ', '')}`;

  const aboutBody =
    breakdown.windowSize > 0
      ? `You scored ${card.valueDisplay} on ${card.label.toLowerCase()} across your recent ${displayName} shifts. ${breakdown.positiveCount} of ${breakdown.windowSize} counted shifts met the target, with ${breakdown.negativeCount} needing improvement.`
      : `Complete ${displayName} shifts to start tracking ${card.label.toLowerCase()}. Your cards will show 0% until you have shift history in this category.`;

  const standingTips: Record<JobTypeMetricId, string[]> = {
    'on-time': [
      'Arrive at your post early so you are ready before the client expects coverage.',
      'Review post orders before clocking in so you know the exact check-in location.',
    ],
    'check-ins': [
      'Check in from your assigned post as soon as you are in position.',
      'Complete self-audit photos when prompted — missed check-ins hurt this score.',
    ],
    uniform: [
      'Lay out uniform items the night before so nothing is missing at shift start.',
      'Use the pre-shift self-audit to catch appearance issues before you clock in.',
    ],
    attendance: [
      'Accept only standing shifts you can fully cover.',
      'Message the client early if an emergency could affect your arrival.',
    ],
    'incident-free': [
      'Follow post orders and de-escalation steps documented in the shift briefing.',
      'Report incidents promptly so they are documented accurately on the shift record.',
    ],
    'client-rating': [
      'Greet the client contact professionally at arrival and before departure.',
      'Stay visible and attentive at your post throughout the shift.',
    ],
    'lifetime-shifts': [
      'Enable standing job alerts in Preferences to see more matching shifts.',
      'Complete at least five standing shifts to unlock priority offers.',
    ],
  };

  const drivingTips: Record<JobTypeMetricId, string[]> = {
    'on-time': [
      'Plan your route before leaving so you reach the first checkpoint on time.',
      'Factor in traffic and parking when accepting patrol shifts.',
    ],
    'check-ins': [
      'Complete patrol checkpoints as you move through the route.',
      'Log each stop promptly so dispatch sees your progress.',
    ],
    uniform: [
      'Lay out uniform items the night before so nothing is missing at shift start.',
      'Use the pre-shift self-audit to catch appearance issues before you clock in.',
    ],
    attendance: [
      'Accept only driving shifts you can fully cover.',
      'Message the client early if vehicle or traffic issues could affect your route.',
    ],
    'incident-free': [
      'Follow patrol orders and report hazards promptly while on route.',
      'Document incidents accurately before continuing your patrol.',
    ],
    'client-rating': [
      'Check in with the client contact at the start and end of your route.',
      'Keep patrol logs complete so clients see thorough coverage.',
    ],
    'lifetime-shifts': [
      'Enable patrol job alerts in Preferences to see more driving shifts.',
      'Complete at least five patrol shifts to unlock priority offers.',
    ],
  };

  const tipsByMetric = modality === 'standing' ? standingTips : drivingTips;

  return {
    windowLabel,
    aboutBody,
    targetLevelLabel,
    excludedLabel:
      breakdown.excludedCount === 1
        ? 'shift excluded from this calculation'
        : 'shifts excluded from this calculation',
    tips: tipsByMetric[metricId],
  };
}

export function getModalityRatingCard(
  guardId: string,
  modality: WorkModality,
  metricId: JobTypeMetricId,
  requests: SecurityRequest[]
): JobTypeRatingCard | null {
  return buildModalityRatingCards(guardId, modality, requests).find((card) => card.id === metricId) ?? null;
}
