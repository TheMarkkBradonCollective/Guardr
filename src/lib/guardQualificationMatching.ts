import type { SecurityGuard, SecurityRequest } from '../types';
import { getJobDistance } from './guardJobs';
import { guardCanApplyToJob } from './guardJobs';
import { toGuardJobView } from './guardJobView';
import { armedStatusRank, computeGuardArmedStatus, guardMeetsArmedRequirement } from './guardArmedStatus';
import { computeGuardPerformance, computeGuardPerformanceRating } from './guardPerformance';
import {
  isPremiumJob,
  performanceTierId,
  tierMatchingBoostPoints,
  type PerformanceTierId,
} from './guardTierJobPriority';
import { guardHasApplied } from './jobApplications';
import { filterGuardsAvailableForJob } from './guardAvailability';

export interface GuardMatchFactors {
  certificationMatch: number;
  armedStatusMatch: number;
  distanceScore: number;
  ratingScore: number;
  experienceScore: number;
  performanceScore: number;
  trainingComplete: number;
  tierBoost: number;
}

export interface GuardMatchScore {
  guard: SecurityGuard;
  totalScore: number;
  meetsRequirements: boolean;
  factors: GuardMatchFactors;
  distanceMiles: number | null;
}

const WEIGHTS: GuardMatchFactors = {
  certificationMatch: 30,
  armedStatusMatch: 15,
  distanceScore: 15,
  ratingScore: 15,
  experienceScore: 10,
  performanceScore: 10,
  trainingComplete: 5,
  tierBoost: 0,
};

function scoreDistance(miles: number | null): number {
  if (miles == null) return 0.5;
  if (miles <= 5) return 1;
  if (miles <= 15) return 0.75;
  if (miles <= 30) return 0.5;
  if (miles <= 50) return 0.25;
  return 0.1;
}

function scoreRating(rating: number): number {
  return Math.min(1, Math.max(0, rating / 5));
}

function scoreExperience(years: number | undefined, jobsCompleted: number): number {
  const yearScore = Math.min(1, (years ?? 0) / 10);
  const jobScore = Math.min(1, jobsCompleted / 100);
  return yearScore * 0.6 + jobScore * 0.4;
}

function scoreArmedMatch(guard: SecurityGuard, job: SecurityRequest): number {
  if (!job.armedRequired) return 1;
  if (!guardMeetsArmedRequirement(guard, true)) return 0;
  const status = computeGuardArmedStatus(guard);
  return armedStatusRank(status) / 3;
}

function scoreTraining(guard: SecurityGuard, job: SecurityRequest): number {
  const meets = guardCanApplyToJob(guard, toGuardJobView(job, guard.id));
  return meets ? 1 : 0.3;
}

export function scoreGuardForJob(
  guard: SecurityGuard,
  job: SecurityRequest,
  allRequests?: SecurityRequest[]
): GuardMatchScore {
  const jobView = toGuardJobView(job, guard.id);
  const meetsRequirements = guardCanApplyToJob(guard, jobView, allRequests);
  const distanceMiles = getJobDistance(jobView);
  const performance = computeGuardPerformance(guard.id, allRequests ?? []);
  const premiumJob = isPremiumJob(job);
  const tierId: PerformanceTierId = allRequests?.length
    ? performanceTierId(computeGuardPerformanceRating(guard, allRequests).tier)
    : 'starting';
  const tierBoost = tierMatchingBoostPoints(tierId, premiumJob);

  const factors: GuardMatchFactors = {
    certificationMatch: meetsRequirements ? 1 : 0,
    armedStatusMatch: scoreArmedMatch(guard, job),
    distanceScore: scoreDistance(distanceMiles),
    ratingScore: scoreRating(guard.rating),
    experienceScore: scoreExperience(guard.yearsExperience, guard.jobsCompleted),
    performanceScore: performance.overallScore > 0 ? performance.overallScore / 5 : scoreRating(guard.rating),
    trainingComplete: scoreTraining(guard, job),
    tierBoost,
  };

  let totalScore = 0;
  for (const key of Object.keys(WEIGHTS) as (keyof GuardMatchFactors)[]) {
    if (key === 'tierBoost') continue;
    totalScore += factors[key] * WEIGHTS[key];
  }
  totalScore += tierBoost;
  if (!meetsRequirements) totalScore *= 0.35;

  return {
    guard,
    totalScore: Math.round(totalScore),
    meetsRequirements,
    factors,
    distanceMiles,
  };
}

/** Rank guards for a job — applicants only, or full marketplace pool. */
export function rankGuardsForJob(
  job: SecurityRequest,
  guards: SecurityGuard[],
  options?: {
    applicantsOnly?: boolean;
    allRequests?: SecurityRequest[];
    limit?: number;
  }
): GuardMatchScore[] {
  const pool = options?.applicantsOnly
    ? guards.filter((g) => guardHasApplied(job, g.id))
    : guards.filter((g) => !g.isStaff && g.userStatus === 'active');

  const availablePool = filterGuardsAvailableForJob(pool, job);

  const ranked = availablePool
    .map((guard) => scoreGuardForJob(guard, job, options?.allRequests))
    .sort((a, b) => {
      if (b.meetsRequirements !== a.meetsRequirements) {
        return b.meetsRequirements ? 1 : -1;
      }
      return b.totalScore - a.totalScore;
    });

  return options?.limit ? ranked.slice(0, options.limit) : ranked;
}
