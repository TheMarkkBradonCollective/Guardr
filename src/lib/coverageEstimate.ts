/**
 * Rough client-facing coverage cost estimates for the public homepage.
 *
 * These are indicative "compare your options" figures (like Uber's ride-option
 * price comparison) — NOT a binding quote. Real pricing is set when a client
 * posts a job and guards apply / negotiate.
 */

export type CoverageTierId = 'standard' | 'armed' | 'executive';

export interface CoverageTier {
  id: CoverageTierId;
  name: string;
  tagline: string;
  /** Indicative client hourly rate range, per guard (USD). */
  rateLow: number;
  rateHigh: number;
  /** Short bullet points shown on the option card. */
  features: string[];
  /** Typical use cases. */
  bestFor: string;
}

export const COVERAGE_TIERS: CoverageTier[] = [
  {
    id: 'standard',
    name: 'Standard',
    tagline: 'Unarmed licensed guard',
    rateLow: 28,
    rateHigh: 34,
    features: ['State-licensed', 'Uniformed presence', 'Live check-ins'],
    bestFor: 'Retail, construction, front desk, and recurring site posts.',
  },
  {
    id: 'armed',
    name: 'Armed',
    tagline: 'Armed licensed guard',
    rateLow: 42,
    rateHigh: 52,
    features: ['Armed permit verified', 'Elevated deterrence', 'Incident reporting'],
    bestFor: 'Cash handling, high-value assets, and elevated-risk sites.',
  },
  {
    id: 'executive',
    name: 'Executive & Events',
    tagline: 'Premium / event-trained',
    rateLow: 55,
    rateHigh: 75,
    features: ['Event & crowd trained', 'Coordinated crews', 'Priority dispatch'],
    bestFor: 'Events, executive protection, and large coordinated coverage.',
  },
];

export interface CoverageEstimateInput {
  tierId: CoverageTierId;
  /** Coverage hours per guard. */
  hours: number;
  /** Number of guards. */
  guards: number;
}

export interface CoverageEstimate {
  tierId: CoverageTierId;
  hours: number;
  guards: number;
  rateLow: number;
  rateHigh: number;
  /** Total low/high across all guards and hours (USD). */
  totalLow: number;
  totalHigh: number;
  /** Midpoint total (USD). */
  totalMid: number;
}

export const ESTIMATE_LIMITS = {
  minHours: 1,
  maxHours: 24,
  minGuards: 1,
  maxGuards: 20,
} as const;

export function clampHours(hours: number): number {
  if (!Number.isFinite(hours)) return ESTIMATE_LIMITS.minHours;
  return Math.min(ESTIMATE_LIMITS.maxHours, Math.max(ESTIMATE_LIMITS.minHours, Math.round(hours)));
}

export function clampGuards(guards: number): number {
  if (!Number.isFinite(guards)) return ESTIMATE_LIMITS.minGuards;
  return Math.min(ESTIMATE_LIMITS.maxGuards, Math.max(ESTIMATE_LIMITS.minGuards, Math.round(guards)));
}

export function getCoverageTier(tierId: CoverageTierId): CoverageTier {
  return COVERAGE_TIERS.find((tier) => tier.id === tierId) ?? COVERAGE_TIERS[0];
}

export function estimateCoverage({ tierId, hours, guards }: CoverageEstimateInput): CoverageEstimate {
  const tier = getCoverageTier(tierId);
  const safeHours = clampHours(hours);
  const safeGuards = clampGuards(guards);
  const units = safeHours * safeGuards;
  const totalLow = Math.round(tier.rateLow * units);
  const totalHigh = Math.round(tier.rateHigh * units);
  return {
    tierId: tier.id,
    hours: safeHours,
    guards: safeGuards,
    rateLow: tier.rateLow,
    rateHigh: tier.rateHigh,
    totalLow,
    totalHigh,
    totalMid: Math.round((totalLow + totalHigh) / 2),
  };
}

export function formatEstimateUsd(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

/** Compact "$28–$34/hr" style range label. */
export function formatRateRange(tier: CoverageTier): string {
  return `$${tier.rateLow}–$${tier.rateHigh}/hr`;
}
