/** Platform fee model: client pays hourlyRate, guard receives guardPay, platform keeps the difference. */

export type PlatformFeeModel = 'flat' | 'tiered' | 'percent';

export interface PlatformFeeTier {
  /** Inclusive minimum client hourly rate for this tier. */
  minHourlyRate: number;
  feePerHour: number;
}

export interface PlatformFeeConfig {
  model: PlatformFeeModel;
  /** Used when model is `flat`. */
  flatFeePerHour: number;
  /** Used when model is `percent` (0–1, e.g. 0.15 = 15%). */
  percentRate: number;
  /** Floor per hour when model is `percent`. */
  minFeePerHour: number;
  /** Ceiling per hour when model is `percent`. */
  maxFeePerHour: number;
  /** Sorted descending by minHourlyRate when model is `tiered`. */
  tiers: PlatformFeeTier[];
}

/** Backward-compatible default — flat $5/hr everywhere. */
export const DEFAULT_PLATFORM_FEE_CONFIG: PlatformFeeConfig = {
  model: 'flat',
  flatFeePerHour: 5,
  percentRate: 0.15,
  minFeePerHour: 4,
  maxFeePerHour: 12,
  tiers: [
    { minHourlyRate: 75, feePerHour: 10 },
    { minHourlyRate: 50, feePerHour: 8 },
    { minHourlyRate: 30, feePerHour: 6 },
    { minHourlyRate: 0, feePerHour: 5 },
  ],
};

/** Suggested upgrade preset for owners moving off flat $5/hr. */
export const TIERED_PLATFORM_FEE_PRESET: PlatformFeeConfig = {
  ...DEFAULT_PLATFORM_FEE_CONFIG,
  model: 'tiered',
};

export const LEGACY_PLATFORM_FEE_PER_HOUR = DEFAULT_PLATFORM_FEE_CONFIG.flatFeePerHour;

function clampFee(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function normalizePlatformFeeConfig(
  input?: Partial<PlatformFeeConfig> | null
): PlatformFeeConfig {
  const base = DEFAULT_PLATFORM_FEE_CONFIG;
  const model = input?.model ?? base.model;
  const flatFeePerHour = Math.max(0, input?.flatFeePerHour ?? base.flatFeePerHour);
  const percentRate = clampFee(input?.percentRate ?? base.percentRate, 0, 0.5);
  const minFeePerHour = Math.max(0, input?.minFeePerHour ?? base.minFeePerHour);
  const maxFeePerHour = Math.max(minFeePerHour, input?.maxFeePerHour ?? base.maxFeePerHour);

  const tiers =
    input?.tiers && input.tiers.length > 0
      ? [...input.tiers]
          .map((tier) => ({
            minHourlyRate: Math.max(0, tier.minHourlyRate),
            feePerHour: Math.max(0, tier.feePerHour),
          }))
          .sort((a, b) => b.minHourlyRate - a.minHourlyRate)
      : [...base.tiers];

  return {
    model,
    flatFeePerHour,
    percentRate,
    minFeePerHour,
    maxFeePerHour,
    tiers,
  };
}

export function resolvePlatformFeePerHour(
  hourlyRate: number,
  config: PlatformFeeConfig = DEFAULT_PLATFORM_FEE_CONFIG
): number {
  const rate = Math.max(0, hourlyRate);
  const normalized = normalizePlatformFeeConfig(config);

  switch (normalized.model) {
    case 'flat':
      return normalized.flatFeePerHour;
    case 'percent': {
      const raw = rate * normalized.percentRate;
      return roundMoney(clampFee(raw, normalized.minFeePerHour, normalized.maxFeePerHour));
    }
    case 'tiered': {
      const tier = normalized.tiers.find((t) => rate >= t.minHourlyRate);
      return tier?.feePerHour ?? normalized.tiers[normalized.tiers.length - 1]?.feePerHour ?? LEGACY_PLATFORM_FEE_PER_HOUR;
    }
    default:
      return LEGACY_PLATFORM_FEE_PER_HOUR;
  }
}

export function computeGuardPay(
  hourlyRate: number,
  feePerHour?: number,
  config?: PlatformFeeConfig
): number {
  const fee = feePerHour ?? resolvePlatformFeePerHour(hourlyRate, config);
  return Math.max(0, hourlyRate - fee);
}

export function computePlatformFee(
  durationHours: number,
  feePerHour: number = LEGACY_PLATFORM_FEE_PER_HOUR
): number {
  return roundMoney(durationHours * feePerHour);
}

export function computeGuardEarnings(
  durationHours: number,
  hourlyRate: number,
  feePerHour?: number,
  config?: PlatformFeeConfig
): number {
  const guardPay = computeGuardPay(hourlyRate, feePerHour, config);
  return roundMoney(durationHours * guardPay);
}

export function computeGuardPayoutCents(
  hourlyRate: number,
  durationHours: number,
  feePerHour?: number,
  config?: PlatformFeeConfig
): number {
  const guardPay = computeGuardPay(hourlyRate, feePerHour, config);
  return Math.round(durationHours * guardPay * 100);
}

export function platformFeeModelLabel(model: PlatformFeeModel): string {
  switch (model) {
    case 'flat':
      return 'Flat rate';
    case 'tiered':
      return 'Tiered by client rate';
    case 'percent':
      return 'Percentage with min/max';
    default:
      return model;
  }
}

export function describePlatformFeeAtRate(
  hourlyRate: number,
  config: PlatformFeeConfig = DEFAULT_PLATFORM_FEE_CONFIG
): string {
  const fee = resolvePlatformFeePerHour(hourlyRate, config);
  const guardPay = computeGuardPay(hourlyRate, fee, config);
  return `$${fee}/hr platform · guard receives $${guardPay}/hr`;
}

export function feePreviewRates(): number[] {
  return [25, 35, 50, 75];
}
