/** Platform fee model: client pays hourlyRate, guard receives guardPay, platform keeps the difference. */

export type PlatformFeeModel = 'flat' | 'percent';

/** @deprecated Legacy tiered model — migrated to flat on read. */
export type LegacyPlatformFeeModel = PlatformFeeModel | 'tiered';

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

export type PlatformFeeConfigInput = Partial<Omit<PlatformFeeConfig, 'model'>> & {
  model?: LegacyPlatformFeeModel;
};

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

function migrateLegacyModel(input?: PlatformFeeConfigInput | null): PlatformFeeModel {
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

function legacyFlatFromTiered(input?: PlatformFeeConfigInput | null): number {
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
  input?: PlatformFeeConfigInput | null
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

/** Guard / service types staff can price separately on personal vs business accounts. */
export const PLATFORM_FEE_GUARD_TYPES = [
  'standing-guard',
  'foot-patrol',
  'vehicle-patrol',
  'construction',
  'fire-watch',
  'asset-protection',
  'nightclub-bar',
  'event',
  'armed-escort',
  'bodyguard',
  'other',
] as const;

export type PlatformFeeGuardType = (typeof PLATFORM_FEE_GUARD_TYPES)[number];

export const PLATFORM_FEE_GUARD_TYPE_LABELS: Record<PlatformFeeGuardType, string> = {
  'standing-guard': 'Standing guard',
  'foot-patrol': 'Foot patrol',
  'vehicle-patrol': 'Vehicle patrol',
  construction: 'Construction',
  'fire-watch': 'Fire watch',
  'asset-protection': 'Property security',
  'nightclub-bar': 'Nightclub & bar',
  event: 'Events',
  'armed-escort': 'Armed escort',
  bodyguard: 'Executive protection',
  other: 'Custom / other',
};

export type ClientFeeAccountKind = 'personal' | 'business';

export interface ClientPlatformFeeSchedule extends PlatformFeeConfig {
  byGuardType: Partial<Record<PlatformFeeGuardType, PlatformFeeConfig>>;
}

export interface ClientPlatformFeeSchedules {
  personal: ClientPlatformFeeSchedule;
  business: ClientPlatformFeeSchedule;
}

const FEE_GUARD_TYPE_SET = new Set<string>(PLATFORM_FEE_GUARD_TYPES);

export function feeGuardTypeFromJobType(jobType?: string | null): PlatformFeeGuardType {
  const type = (jobType ?? '').trim();
  if (!type) return 'other';
  if (type === 'patrol') return 'vehicle-patrol';
  if (type.startsWith('event')) return 'event';
  if (FEE_GUARD_TYPE_SET.has(type)) return type as PlatformFeeGuardType;
  return 'other';
}

function scheduleFromFeeConfig(
  config: PlatformFeeConfig,
  byGuardType: ClientPlatformFeeSchedule['byGuardType'] = {}
): ClientPlatformFeeSchedule {
  return {
    ...normalizePlatformFeeConfig(config),
    byGuardType,
  };
}

function flatSchedule(
  flatFeePerHour: number,
  byGuardType: Partial<Record<PlatformFeeGuardType, number>>
): ClientPlatformFeeSchedule {
  const overrides: ClientPlatformFeeSchedule['byGuardType'] = {};
  for (const [key, value] of Object.entries(byGuardType) as [PlatformFeeGuardType, number][]) {
    if (value === flatFeePerHour) continue;
    overrides[key] = { model: 'flat', flatFeePerHour: value, percentRate: 0.15 };
  }
  return scheduleFromFeeConfig(
    { model: 'flat', flatFeePerHour, percentRate: 0.15 },
    overrides
  );
}

/** Fresh-install defaults — personal and business are priced separately by guard type. */
export const DEFAULT_CLIENT_FEE_SCHEDULES: ClientPlatformFeeSchedules = {
  personal: flatSchedule(5, {
    event: 6,
    'nightclub-bar': 6,
    construction: 6,
    'fire-watch': 6,
    bodyguard: 8,
    'armed-escort': 8,
  }),
  business: flatSchedule(6, {
    'standing-guard': 6,
    event: 8,
    'nightclub-bar': 8,
    construction: 8,
    'fire-watch': 8,
    'asset-protection': 7,
    bodyguard: 12,
    'armed-escort': 12,
  }),
};

export function normalizeClientPlatformFeeSchedule(
  input?: Partial<ClientPlatformFeeSchedule> | PlatformFeeConfigInput | null,
  fallback: PlatformFeeConfig = DEFAULT_PLATFORM_FEE_CONFIG
): ClientPlatformFeeSchedule {
  const base = normalizePlatformFeeConfig({ ...fallback, ...(input ?? {}) });
  const rawTypes =
    input && typeof input === 'object' && 'byGuardType' in input
      ? (input as Partial<ClientPlatformFeeSchedule>).byGuardType
      : undefined;
  const byGuardType: ClientPlatformFeeSchedule['byGuardType'] = {};
  if (rawTypes && typeof rawTypes === 'object') {
    for (const key of PLATFORM_FEE_GUARD_TYPES) {
      const override = rawTypes[key];
      if (!override) continue;
      byGuardType[key] = normalizePlatformFeeConfig({ ...base, ...override });
    }
  }
  return { ...base, byGuardType };
}

export function normalizeClientPlatformFeeSchedules(
  input?: Partial<ClientPlatformFeeSchedules> | null,
  fallback?: PlatformFeeConfig | null
): ClientPlatformFeeSchedules {
  const fb = normalizePlatformFeeConfig(fallback ?? DEFAULT_PLATFORM_FEE_CONFIG);
  if (!input) {
    return {
      personal: scheduleFromFeeConfig(fb),
      business: scheduleFromFeeConfig(fb),
    };
  }
  return {
    personal: normalizeClientPlatformFeeSchedule(input.personal, fb),
    business: normalizeClientPlatformFeeSchedule(input.business, fb),
  };
}

export function resolveClientJobFeeConfig(
  schedules: ClientPlatformFeeSchedules | null | undefined,
  clientType?: ClientFeeAccountKind | string | null,
  jobType?: string | null,
  fallback: PlatformFeeConfig = DEFAULT_PLATFORM_FEE_CONFIG
): PlatformFeeConfig {
  const normalized = normalizeClientPlatformFeeSchedules(schedules, fallback);
  const kind: ClientFeeAccountKind = clientType === 'personal' ? 'personal' : 'business';
  const schedule = normalized[kind];
  const guardType = feeGuardTypeFromJobType(jobType);
  const override = schedule.byGuardType[guardType];
  return normalizePlatformFeeConfig(override ?? schedule);
}

export function parseFeeSchedulesFromFeeConfigJson(
  raw: unknown,
  fallback: PlatformFeeConfig
): ClientPlatformFeeSchedules | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const schedules = (raw as { schedules?: Partial<ClientPlatformFeeSchedules> }).schedules;
  if (!schedules) return undefined;
  return normalizeClientPlatformFeeSchedules(schedules, fallback);
}

export function feeConfigJsonWithSchedules(
  feeConfig: PlatformFeeConfig,
  schedules: ClientPlatformFeeSchedules
): Record<string, unknown> {
  return {
    ...normalizePlatformFeeConfig(feeConfig),
    schedules: normalizeClientPlatformFeeSchedules(schedules, feeConfig),
  };
}

/** @deprecated Tiered fees removed — use flat or percent only. */
export const TIERED_PLATFORM_FEE_PRESET: PlatformFeeConfig = {
  ...DEFAULT_PLATFORM_FEE_CONFIG,
};

/** @deprecated Use PlatformFeeTier removal — kept for import compatibility. */
export type PlatformFeeTier = { minHourlyRate: number; feePerHour: number };
