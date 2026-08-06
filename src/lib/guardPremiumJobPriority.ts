import type { JobType, SecurityGuard, SecurityRequest } from '../types';
import {
  buildModalityRatingCards,
  type JobTypeMetricId,
  type JobTypeRatingCard,
} from './guardJobTypeRatingMetrics';
import {
  workModalityForJobType,
  workModalityLabel,
  type WorkModality,
} from './guardWorkModality';
import { guardHasApprovedVehicle } from './guardVehicle';

/** Guard pay per hour at or above this threshold counts as a premium job. */
export const PREMIUM_GUARD_PAY_THRESHOLD = 35;

export interface ModalityPriorityTarget {
  id: JobTypeMetricId;
  label: string;
  met: boolean;
}

export interface ModalityPriorityProgress {
  modality: WorkModality;
  displayName: string;
  metCount: number;
  totalCount: number;
  isQualified: boolean;
  targets: ModalityPriorityTarget[];
  progressLabel: string;
  qualifiedLabel: string;
}

/** @deprecated Use ModalityPriorityTarget */
export interface ProGuardTarget {
  id: string;
  label: string;
  met: boolean;
}

/** @deprecated Use ModalityPriorityProgress */
export interface ProGuardProgress {
  metCount: number;
  totalCount: number;
  isQualified: boolean;
  targets: ProGuardTarget[];
  progressLabel: string;
  qualifiedLabel: string;
}

/** @deprecated Use ModalityPriorityTarget */
export interface PremiumPriorityTarget {
  id: JobTypeMetricId;
  label: string;
  met: boolean;
}

/** @deprecated Use ModalityPriorityProgress */
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
  'guardPay' | 'guardsNeeded' | 'guardSlots' | 'type'
>;

/** Premium jobs get compressed notification waves and extra matching weight. */
export function isPremiumOpenJob(job: PremiumOpenJob): boolean {
  const guardPay = job.guardPay ?? 0;
  if (guardPay >= PREMIUM_GUARD_PAY_THRESHOLD) return true;
  if ((job.guardsNeeded ?? 1) > 1) return true;
  if ((job.guardSlots?.length ?? 0) > 0) return true;
  return false;
}

export function buildModalityPriorityProgress(
  modality: WorkModality,
  guard: SecurityGuard,
  requests: SecurityRequest[]
): ModalityPriorityProgress {
  const cards = buildModalityRatingCards(guard.id, modality, requests);
  const displayName = workModalityLabel(modality);
  const targets: ModalityPriorityTarget[] = cards.map((card) => ({
    id: card.id,
    label: card.label,
    met: card.meetsTarget,
  }));
  const metCount = targets.filter((target) => target.met).length;
  const totalCount = targets.length;
  const isQualified = totalCount > 0 && metCount === totalCount;

  return {
    modality,
    displayName,
    metCount,
    totalCount,
    isQualified,
    targets,
    progressLabel: `${metCount} of ${totalCount} to ${displayName} priority`,
    qualifiedLabel: `${displayName} priority unlocked`,
  };
}

export function guardHasModalityPriority(
  modality: WorkModality,
  guard: SecurityGuard,
  requests: SecurityRequest[]
): boolean {
  if (modality === 'driving' && !guardHasApprovedVehicle(guard)) return false;
  return buildModalityPriorityProgress(modality, guard, requests).isQualified;
}

export function buildJobTypePremiumPriorityProgress(
  jobType: JobType,
  cards: JobTypeRatingCard[]
): JobTypePremiumPriorityProgress {
  const modality = workModalityForJobType(jobType);
  const displayName = modality ? workModalityLabel(modality) : jobType;
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

/** @deprecated Use buildModalityPriorityProgress('standing', ...) */
export function buildProGuardProgress(
  guard: SecurityGuard,
  requests: SecurityRequest[]
): ProGuardProgress {
  const progress = buildModalityPriorityProgress('standing', guard, requests);
  return {
    metCount: progress.metCount,
    totalCount: progress.totalCount,
    isQualified: progress.isQualified,
    targets: progress.targets,
    progressLabel: progress.progressLabel,
    qualifiedLabel: progress.qualifiedLabel,
  };
}

/** @deprecated Use guardHasModalityPriority */
export function guardHasProGuardPriority(
  guard: SecurityGuard,
  requests: SecurityRequest[]
): boolean {
  return guardHasModalityPriority('standing', guard, requests);
}

/** Modality-specific priority for premium open jobs. */
export function guardHasPremiumJobPriority(
  guard: SecurityGuard,
  requests: SecurityRequest[],
  job?: Pick<PremiumOpenJob, 'type'>
): boolean {
  const jobType = job?.type ?? 'other';
  const modality = workModalityForJobType(jobType);
  if (!modality) return false;
  return guardHasModalityPriority(modality, guard, requests);
}

/** Extra sort weight for premium job matching — used when ordering open-job alerts. */
export function premiumJobMatchingWeight(
  guard: SecurityGuard,
  job: PremiumOpenJob,
  requests: SecurityRequest[]
): number {
  if (!isPremiumOpenJob(job)) return 0;
  return guardHasPremiumJobPriority(guard, requests, job) ? 100 : 0;
}

export function modalityRewardsInfoCopy(
  modality: WorkModality,
  totalCount: number
): {
  title: string;
  body: string;
  ctaLabel: string;
} {
  const label = workModalityLabel(modality);
  const shiftKind = modality === 'standing' ? 'standing shifts' : 'driving jobs';

  return {
    title: `Strong ${label.toLowerCase()} ratings help you get priority ${shiftKind}`,
    body: `Hit and maintain all ${totalCount} ${label.toLowerCase()} targets and you'll move to the front of the line for premium ${shiftKind} — including shifts paying $${PREMIUM_GUARD_PAY_THRESHOLD}+/hr and multi-guard needs.`,
    ctaLabel: 'Done',
  };
}

/** @deprecated Use modalityRewardsInfoCopy */
export function proGuardRewardsInfoCopy(totalCount: number): {
  title: string;
  body: string;
  ctaLabel: string;
} {
  return modalityRewardsInfoCopy('standing', totalCount);
}

/** @deprecated Use modalityRewardsInfoCopy */
export function premiumPriorityInfoCopy(displayName: string, totalCount: number): {
  title: string;
  body: string;
  ctaLabel: string;
} {
  const modality: WorkModality =
    displayName.toLowerCase() === 'driving' ? 'driving' : 'standing';
  return modalityRewardsInfoCopy(modality, totalCount);
}
