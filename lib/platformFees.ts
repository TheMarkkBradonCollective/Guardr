/** Platform fee model: client pays hourlyRate, guard receives guardPay, platform keeps the difference. */

export type PlatformFeeModel = 'flat' | 'percent';

/** Per-agreement fee override — flat $/hr or percent of client charge for one job/deal. */
export interface AgreementPlatformFeeConfig {
  model: PlatformFeeModel;
  flatFeePerHour?: number;
  /** 0–1, e.g. 0.15 = 15% of client hourly rate */
  percentRate?: number;
}

export interface PlatformFeeConfig {
  model: PlatformFeeModel;
  /** Used when model is `flat`. */
  flatFeePerHour: number;
  /** Used when model is `percent` (0–1, e.g. 0.15 = 15%). */
  percentRate: number;
  /** @deprecated Legacy tiered config — migrated to flat on read. */
  minFeePerHour?: number;
  /** @deprecated Legacy tiered config — migrated to flat on read. */
  maxFeePerHour?: number;
  /** @deprecated Legacy tiered bands — migrated to flat on read. */
  tiers?: Array<{ minHourlyRate: number; feePerHour: number }>;
}

/** Backward-compatible default — flat $5/hr everywhere. */
export const DEFAULT_PLATFORM_FEE_CONFIG: PlatformFeeConfig = {
  model: 'flat',
  flatFeePerHour: 5,
  percentRate: 0.15,
};

export const LEGACY_PLATFORM_FEE_PER_HOUR = DEFAULT_PLATFORM_FEE_CONFIG.flatFeePerHour;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function migrateLegacyModel(input?: Partial<PlatformFeeConfig> | null): PlatformFeeModel {
  const model = input?.model;
  if (model === 'flat' || model === 'percent') return model;
  if (model === 'tiered') {
    const tiers = input?.tiers;
    if (tiers && tiers.length > 0) {
      const sorted = [...tiers].sort((a, b) => a.minHourlyRate - b.minHourlyRate);
      return sorted[0]?.feePerHour != null ? 'flat' : 'flat';
    }
    return 'flat';
  }
  return DEFAULT_PLATFORM_FEE_CONFIG.model;
}

function legacyFlatFromTiered(input?: Partial<PlatformFeeConfig> | null): number {
  if (input?.flatFeePerHour != null && input.flatFeePerHour > 0) {
    return input.flatFeePerHour;
  }
  const tiers = input?.tiers;
  if (tiers && tiers.length > 0) {
    const sorted = [...tiers].sort((a, b) => a.minHourlyRate - b.minHourlyRate);
    return sorted[0]?.feePerHour ?? DEFAULT_PLATFORM_FEE_CONFIG.flatFeePerHour;
  }
  return DEFAULT_PLATFORM_FEE_CONFIG.flatFeePerHour;
}

export function normalizePlatformFeeConfig(
  input?: Partial<PlatformFeeConfig> | null
): PlatformFeeConfig {
  const base = DEFAULT_PLATFORM_FEE_CONFIG;
  const model = migrateLegacyModel(input);
  const flatFeePerHour = Math.max(
    0,
    model === 'flat' && input?.model === 'tiered'
      ? legacyFlatFromTiered(input)
      : (input?.flatFeePerHour ?? base.flatFeePerHour)
  );
  const percentRate = Math.min(0.5, Math.max(0, input?.percentRate ?? base.percentRate));

  return {
    model,
    flatFeePerHour,
    percentRate,
  };
}

export function normalizeAgreementFeeConfig(
  input?: Partial<AgreementPlatformFeeConfig> | null
): AgreementPlatformFeeConfig | undefined {
  if (!input?.model) return undefined;
  if (input.model === 'flat') {
    const flatFeePerHour = Math.max(0, input.flatFeePerHour ?? 0);
    return { model: 'flat', flatFeePerHour };
  }
  const percentRate = Math.min(0.5, Math.max(0, input.percentRate ?? 0));
  return { model: 'percent', percentRate };
}

export function resolvePlatformFeePerHour(
  hourlyRate: number,
  config: PlatformFeeConfig = DEFAULT_PLATFORM_FEE_CONFIG,
  agreementFeeConfig?: AgreementPlatformFeeConfig | null
): number {
  const rate = Math.max(0, hourlyRate);
  const agreement = normalizeAgreementFeeConfig(agreementFeeConfig);
  if (agreement) {
    return resolveAgreementPlatformFeePerHour(rate, agreement);
  }

  const normalized = normalizePlatformFeeConfig(config);
  if (normalized.model === 'flat') {
    return normalized.flatFeePerHour;
  }
  return roundMoney(rate * normalized.percentRate);
}

export function resolveAgreementPlatformFeePerHour(
  hourlyRate: number,
  agreement: AgreementPlatformFeeConfig
): number {
  const rate = Math.max(0, hourlyRate);
  const normalized = normalizeAgreementFeeConfig(agreement);
  if (!normalized) return 0;
  if (normalized.model === 'flat') {
    return normalized.flatFeePerHour ?? 0;
  }
  return roundMoney(rate * (normalized.percentRate ?? 0));
}

export function computeGuardPay(
  hourlyRate: number,
  feePerHour?: number,
  config?: PlatformFeeConfig,
  agreementFeeConfig?: AgreementPlatformFeeConfig | null
): number {
  const fee =
    feePerHour ??
    resolvePlatformFeePerHour(hourlyRate, config, agreementFeeConfig);
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
  config?: PlatformFeeConfig,
  agreementFeeConfig?: AgreementPlatformFeeConfig | null
): number {
  const guardPay = computeGuardPay(hourlyRate, feePerHour, config, agreementFeeConfig);
  return roundMoney(durationHours * guardPay);
}

export function computeGuardPayoutCents(
  hourlyRate: number,
  durationHours: number,
  feePerHour?: number,
  config?: PlatformFeeConfig,
  agreementFeeConfig?: AgreementPlatformFeeConfig | null
): number {
  const guardPay = computeGuardPay(hourlyRate, feePerHour, config, agreementFeeConfig);
  return Math.round(durationHours * guardPay * 100);
}

export function computeJobBilling(
  hourlyRate: number,
  durationHours: number,
  guardsNeeded: number,
  globalConfig: PlatformFeeConfig = DEFAULT_PLATFORM_FEE_CONFIG,
  agreementFeeConfig?: AgreementPlatformFeeConfig | null
): {
  hourlyRate: number;
  platformFeePerHour: number;
  guardPay: number;
  estimatedPayout: number;
  agreementFeeConfig?: AgreementPlatformFeeConfig;
} {
  const platformFeePerHour = resolvePlatformFeePerHour(
    hourlyRate,
    globalConfig,
    agreementFeeConfig
  );
  const guardPay = computeGuardPay(hourlyRate, platformFeePerHour);
  const estimatedPayout =
    Math.round(durationHours * hourlyRate * Math.max(1, guardsNeeded) * 100) / 100;
  return {
    hourlyRate,
    platformFeePerHour,
    guardPay,
    estimatedPayout,
    agreementFeeConfig: normalizeAgreementFeeConfig(agreementFeeConfig),
  };
}

export function platformFeeModelLabel(model: PlatformFeeModel): string {
  switch (model) {
    case 'flat':
      return 'Flat rate per hour';
    case 'percent':
      return 'Percentage of client charge';
    default:
      return model;
  }
}

export function describePlatformFeeAtRate(
  hourlyRate: number,
  config: PlatformFeeConfig = DEFAULT_PLATFORM_FEE_CONFIG,
  agreementFeeConfig?: AgreementPlatformFeeConfig | null
): string {
  const fee = resolvePlatformFeePerHour(hourlyRate, config, agreementFeeConfig);
  const guardPay = computeGuardPay(hourlyRate, fee, config, agreementFeeConfig);
  return `$${fee}/hr platform · guard receives $${guardPay}/hr`;
}

export function feePreviewRates(): number[] {
  return [25, 35, 50, 75];
}

/** @deprecated Tiered fees removed — use flat or percent only. */
export const TIERED_PLATFORM_FEE_PRESET: PlatformFeeConfig = {
  ...DEFAULT_PLATFORM_FEE_CONFIG,
};

/** @deprecated Use PlatformFeeTier removal — kept for import compatibility. */
export type PlatformFeeTier = { minHourlyRate: number; feePerHour: number };
