import { computeGuardPay } from './payments';
import { isMultiGuardJob } from './guardTeams';
import { computeGuardPerformanceRating, type PerformanceTier } from './guardPerformance';
import type { SecurityGuard, SecurityRequest, ShiftReport } from '../types';

/** Performance tier ids used for job priority and matching boosts. */
export type PerformanceTierId = 'starting' | 'rising' | 'professional' | 'elite';

/** Guard hourly pay at or above this threshold counts as a premium job. */
export const PREMIUM_GUARD_PAY_PER_HOUR = 35;

/** Base matching score boost by performance tier (added to total match score). */
export const TIER_MATCHING_BOOST: Record<PerformanceTierId, number> = {
  starting: 0,
  rising: 3,
  professional: 5,
  elite: 8,
};

/** Extra matching boost on premium jobs, stacked on top of the base tier boost. */
export const PREMIUM_TIER_MATCHING_BOOST: Record<PerformanceTierId, number> = {
  starting: 0,
  rising: 2,
  professional: 5,
  elite: 10,
};

/** Staggered open-job notification delays for standard jobs. */
export const TIER_NOTIFICATION_WAVE_DELAYS_MS: Record<PerformanceTierId, number> = {
  elite: 0,
  professional: 5 * 60 * 1000,
  rising: 10 * 60 * 1000,
  starting: 15 * 60 * 1000,
};

/** Shorter stagger on premium jobs — higher tiers see the job sooner. */
export const PREMIUM_TIER_NOTIFICATION_WAVE_DELAYS_MS: Record<PerformanceTierId, number> = {
  elite: 0,
  professional: 0,
  rising: 5 * 60 * 1000,
  starting: 15 * 60 * 1000,
};

const TIER_WAVE_ORDER: PerformanceTierId[] = ['elite', 'professional', 'rising', 'starting'];

export type PremiumJob = Pick<
  SecurityRequest,
  'hourlyRate' | 'guardPay' | 'guardsNeeded' | 'teamLeadId' | 'guardSlots'
>;

export function performanceTierId(tier: PerformanceTier): PerformanceTierId {
  const id = tier.id;
  if (id === 'rising' || id === 'professional' || id === 'elite') return id;
  return 'starting';
}

export function effectiveGuardPayForPriority(job: PremiumJob): number {
  return job.guardPay ?? computeGuardPay(job.hourlyRate);
}

/** High pay, multi-guard, or coordinated crew jobs count as premium for priority routing. */
export function isPremiumJob(job: PremiumJob): boolean {
  const pay = effectiveGuardPayForPriority(job);
  if (pay >= PREMIUM_GUARD_PAY_PER_HOUR) return true;
  if (isMultiGuardJob(job)) return true;
  if (job.teamLeadId) return true;
  if ((job.guardSlots ?? []).some((slot) => slot.guardId)) return true;
  return false;
}

export function tierMatchingBoostPoints(tierId: PerformanceTierId, premiumJob: boolean): number {
  const base = TIER_MATCHING_BOOST[tierId];
  if (!premiumJob) return base;
  return base + PREMIUM_TIER_MATCHING_BOOST[tierId];
}

export function notificationWaveDelayMs(tierId: PerformanceTierId, premiumJob: boolean): number {
  const table = premiumJob ? PREMIUM_TIER_NOTIFICATION_WAVE_DELAYS_MS : TIER_NOTIFICATION_WAVE_DELAYS_MS;
  return table[tierId];
}

export interface TierJobNotificationCopy {
  title?: string;
  body: string;
  priority?: 'normal' | 'high';
}

export function tierJobNotificationCopy(
  tierId: PerformanceTierId,
  premiumJob: boolean,
  jobTitle: string
): TierJobNotificationCopy {
  const quoted = `"${jobTitle}"`;
  if (premiumJob && (tierId === 'elite' || tierId === 'professional')) {
    return {
      title: 'Priority job — high paying shift',
      body: `${quoted} is a premium shift — you have early access. Browse and apply.`,
      priority: 'high',
    };
  }
  if (premiumJob && tierId === 'rising') {
    return {
      title: 'High paying job available',
      body: `${quoted} is open on the map with priority pay.`,
      priority: 'normal',
    };
  }
  if (tierId === 'elite' || tierId === 'professional') {
    return {
      title: 'Early access — new job',
      body: `${quoted} is paid and open on the map — browse and apply.`,
      priority: tierId === 'elite' ? 'high' : 'normal',
    };
  }
  return {
    body: `${quoted} is paid and open on the map — browse and apply.`,
    priority: 'normal',
  };
}

export interface NotificationWave<T> {
  tierId: PerformanceTierId;
  items: T[];
  delayMs: number;
}

export function groupGuardsIntoNotificationWaves<T extends { id: string }>(
  guards: T[],
  resolveTierId: (guard: T) => PerformanceTierId,
  premiumJob: boolean
): NotificationWave<T>[] {
  const byTier = new Map<PerformanceTierId, T[]>();
  for (const guard of guards) {
    const tierId = resolveTierId(guard);
    const list = byTier.get(tierId) ?? [];
    list.push(guard);
    byTier.set(tierId, list);
  }

  return TIER_WAVE_ORDER.filter((tierId) => (byTier.get(tierId)?.length ?? 0) > 0).map((tierId) => ({
    tierId,
    items: byTier.get(tierId)!,
    delayMs: notificationWaveDelayMs(tierId, premiumJob),
  }));
}

export function resolveGuardTierId(
  guard: SecurityGuard,
  requests: SecurityRequest[],
  reports: ShiftReport[] = []
): PerformanceTierId {
  return performanceTierId(computeGuardPerformanceRating(guard, requests, reports).tier);
}
