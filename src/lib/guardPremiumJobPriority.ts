import type { JobType, SecurityRequest } from '../types';
import {
  buildJobTypeRatingCards,
  jobTypeRatingDisplayName,
  type JobTypeMetricId,
  type JobTypeRatingCard,
} from './guardJobTypeRatingMetrics';

/** Guard pay per hour at or above this threshold counts as a premium job. */
export const PREMIUM_GUARD_PAY_THRESHOLD = 35;

export interface PremiumPriorityTarget {
  id: JobTypeMetricId;
  label: string;
  met: boolean;
}

export interface JobTypePremiumPriorityProgress {
  displayName: string;
  metCount: number;
  totalCount: number;
  isQualified: boolean;
  targets: PremiumPriorityTarget[];
  progressLabel: string;
  qualifiedLabel: string;
}

export type PremiumOpenJob = Pick<
  SecurityRequest,
  'guardPay' | 'guardsNeeded' | 'teamLeadId' | 'guardSlots' | 'type'
>;

/** Premium jobs get compressed notification waves and extra matching weight. */
export function isPremiumOpenJob(job: PremiumOpenJob): boolean {
  const guardPay = job.guardPay ?? 0;
  if (guardPay >= PREMIUM_GUARD_PAY_THRESHOLD) return true;
  if ((job.guardsNeeded ?? 1) > 1) return true;
  if (job.teamLeadId) return true;
  if ((job.guardSlots?.length ?? 0) > 0) return true;
  return false;
}

export function buildJobTypePremiumPriorityProgress(
  jobType: JobType,
  cards: JobTypeRatingCard[]
): JobTypePremiumPriorityProgress {
  const displayName = jobTypeRatingDisplayName(jobType);
  const targets: PremiumPriorityTarget[] = cards.map((card) => ({
    id: card.id,
    label: card.label,
    met: card.meetsTarget,
  }));
  const metCount = targets.filter((target) => target.met).length;
  const totalCount = targets.length;
  const isQualified = totalCount > 0 && metCount === totalCount;

  return {
    displayName,
    metCount,
    totalCount,
    isQualified,
    targets,
    progressLabel: `${metCount} of ${totalCount} to premium priority`,
    qualifiedLabel: `Premium priority unlocked for ${displayName.toLowerCase()}`,
  };
}

export function guardHasPremiumJobPriority(
  guardId: string,
  jobType: JobType,
  requests: SecurityRequest[]
): boolean {
  const cards = buildJobTypeRatingCards(guardId, jobType, requests);
  return buildJobTypePremiumPriorityProgress(jobType, cards).isQualified;
}

/** Extra sort weight for premium job matching — used when ordering open-job alerts. */
export function premiumJobMatchingWeight(
  guardId: string,
  job: PremiumOpenJob,
  requests: SecurityRequest[]
): number {
  if (!isPremiumOpenJob(job)) return 0;
  const jobType = job.type ?? 'other';
  return guardHasPremiumJobPriority(guardId, jobType, requests) ? 100 : 0;
}

export function premiumPriorityInfoCopy(displayName: string, totalCount: number): {
  title: string;
  body: string;
  ctaLabel: string;
} {
  return {
    title: `Premium priority helps you get high-paying ${displayName.toLowerCase()} offers`,
    body: `Hit and maintain all ${totalCount} rating targets for ${displayName.toLowerCase()} and you'll move to the front of the line for premium jobs — including shifts paying $${PREMIUM_GUARD_PAY_THRESHOLD}+/hr, multi-guard needs, and coordinated crew work.`,
    ctaLabel: 'Done',
  };
}
