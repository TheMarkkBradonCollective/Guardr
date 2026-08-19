import {
  DEFAULT_CLIENT_FEE_SCHEDULES,
  feeConfigJsonWithSchedules,
  normalizeClientPlatformFeeSchedules,
  normalizePlatformFeeConfig,
  parseFeeSchedulesFromFeeConfigJson,
  resolveClientJobFeeConfig,
  type ClientPlatformFeeSchedules,
  type PlatformFeeConfig,
} from '../../lib/platformFees';
import type { StaffRolePermissionOverrides } from './permissions';
import {
  DEFAULT_STAFF_COMPENSATION_CONFIG,
  normalizeStaffCompensationConfig,
  type StaffCompensationConfig,
} from './staffCompensation';
import {
  DEFAULT_STAFF_MARKETPLACE_CAP_CONFIG,
  normalizeStaffMarketplaceCapConfig,
  type StaffMarketplaceCapConfig,
} from './staffMarketplaceCap';
import {
  parseClientCredentialRuleOverrides,
  type ClientCredentialRuleOverride,
} from './clientCredentialCatalog';

export type {
  AgreementPlatformFeeConfig,
  ClientPlatformFeeSchedule,
  ClientPlatformFeeSchedules,
  PlatformFeeConfig,
  PlatformFeeGuardType,
  PlatformFeeModel,
  PlatformFeeTier,
} from '../../lib/platformFees';
export {
  DEFAULT_CLIENT_FEE_SCHEDULES,
  DEFAULT_PLATFORM_FEE_CONFIG,
  PLATFORM_FEE_GUARD_TYPES,
  PLATFORM_FEE_GUARD_TYPE_LABELS,
  TIERED_PLATFORM_FEE_PRESET,
  feeGuardTypeFromJobType,
  resolveClientJobFeeConfig,
} from '../../lib/platformFees';

export type JobReviewMode = 'staff-all' | 'trusted-auto' | 'none';

function parseStaffRolePermissions(raw: unknown): StaffRolePermissionOverrides | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const entries = Object.entries(raw as Record<string, unknown>);
  if (entries.length === 0) return undefined;
  const result: StaffRolePermissionOverrides = {};
  for (const [role, perms] of entries) {
    if (!Array.isArray(perms)) continue;
    result[role as keyof StaffRolePermissionOverrides] = perms.filter(
      (p): p is NonNullable<StaffRolePermissionOverrides[keyof StaffRolePermissionOverrides]>[number] =>
        typeof p === 'string',
    );
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

export interface PlatformSettings {
  paymentStripeEnabled: boolean;
  paymentSquareEnabled: boolean;
  feeConfig: PlatformFeeConfig;
  /** Personal vs business fee tables, each with per-guard-type rates. */
  clientFeeSchedules: ClientPlatformFeeSchedules;
  /** Job posting review policy */
  jobReviewMode?: JobReviewMode;
  /** When true, trusted clients auto-publish jobs with valid coordinates */
  trustedClientAutoPublish?: boolean;
  smsNotificationsEnabled?: boolean;
  backgroundCheckProvider?: string;
  insuranceVerificationMode?: string;
  /** Automatically release Stripe payouts after shift completion delay */
  autoStripePayoutEnabled?: boolean;
  /** Hours after completion before auto Stripe payout (default 48) */
  autoStripePayoutDelayHours?: number;
  /** Verified insured guards skip staff applicant review on card jobs */
  verifiedGuardSelfServe?: boolean;
  /** Homepage message from the Founder account — editable by Founder only. */
  ownerMessage?: string;
  ownerMessageUpdatedAt?: string;
  /** Homepage message from the Director account — editable by Director and Founder. */
  directorMessage?: string;
  directorMessageUpdatedAt?: string;
  /** Custom staff-role permission lists — when set, overrides built-in defaults for that role. */
  staffRolePermissions?: StaffRolePermissionOverrides;
  /** When true, the public homepage shows the company license & insurance placard. */
  companyPlacardPublicEnabled?: boolean;
  /** Extra pay per hour for guards rostered on a coordinated crew for that specific job. */
  crewTeamPayBumpPerHour?: number;
  /** @deprecated Use crewTeamPayBumpPerHour — kept for DB/localStorage compatibility. */
  teamLeadBonusPerGuardPerHour?: number;
  /** @deprecated No longer used — full crew bump is billed to the client. */
  teamLeadBonusClientSharePercent?: number;
  /** @deprecated No longer used. */
  teamLeadBonusPlatformSharePercent?: number;
  /** Staff revenue-share compensation — % of collected platform fees per role. */
  staffCompensation?: StaffCompensationConfig;
  /** City staffing cap — staff slots scale with active guards and clients in each market. */
  staffMarketplaceCap?: StaffMarketplaceCapConfig;
  /** Admin overrides for the client credential library (applicable to / required for). */
  clientCredentialRules?: ClientCredentialRuleOverride[];
  updatedAt?: string;
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  paymentStripeEnabled: true,
  paymentSquareEnabled: false,
  feeConfig: {
    model: DEFAULT_CLIENT_FEE_SCHEDULES.business.model,
    flatFeePerHour: DEFAULT_CLIENT_FEE_SCHEDULES.business.flatFeePerHour,
    percentRate: DEFAULT_CLIENT_FEE_SCHEDULES.business.percentRate,
  },
  clientFeeSchedules: {
    personal: { ...DEFAULT_CLIENT_FEE_SCHEDULES.personal, byGuardType: { ...DEFAULT_CLIENT_FEE_SCHEDULES.personal.byGuardType } },
    business: { ...DEFAULT_CLIENT_FEE_SCHEDULES.business, byGuardType: { ...DEFAULT_CLIENT_FEE_SCHEDULES.business.byGuardType } },
  },
  autoStripePayoutEnabled: true,
  autoStripePayoutDelayHours: 48,
  verifiedGuardSelfServe: true,
  jobReviewMode: 'trusted-auto',
  trustedClientAutoPublish: true,
  smsNotificationsEnabled: false,
  backgroundCheckProvider: 'manual',
  insuranceVerificationMode: 'manual',
  companyPlacardPublicEnabled: true,
  crewTeamPayBumpPerHour: 1,
  teamLeadBonusPerGuardPerHour: 1,
  teamLeadBonusClientSharePercent: 100,
  teamLeadBonusPlatformSharePercent: 0,
  staffCompensation: { ...DEFAULT_STAFF_COMPENSATION_CONFIG },
  staffMarketplaceCap: { ...DEFAULT_STAFF_MARKETPLACE_CAP_CONFIG },
  clientCredentialRules: [],
};

const STORAGE_KEY = 'guardr_platform_settings';

export function platformAllowsStripe(settings: PlatformSettings): boolean {
  return settings.paymentStripeEnabled;
}

export function platformAllowsSquare(settings: PlatformSettings): boolean {
  return settings.paymentSquareEnabled === true;
}

/** @deprecated Cash payments removed from the platform. */
export function platformAllowsCash(_settings: PlatformSettings): boolean {
  return false;
}

export function platformPaymentModeLabel(settings: PlatformSettings): string {
  const stripe = settings.paymentStripeEnabled;
  const square = settings.paymentSquareEnabled;
  if (stripe && square) return 'Stripe + Square';
  if (stripe) return 'Stripe only';
  if (square) return 'Square only';
  return 'Not configured';
}

export function platformPaymentModeDescription(settings: PlatformSettings): string {
  const stripe = settings.paymentStripeEnabled;
  const square = settings.paymentSquareEnabled;
  if (stripe && square) {
    return 'Clients can pay by card through Stripe or Square. Each processor must be connected in env before it can be enabled.';
  }
  if (stripe) {
    return 'Clients pay online by card through Stripe checkout.';
  }
  if (square) {
    return 'Clients pay online by card through Square checkout.';
  }
  return 'Enable at least one connected card processor below.';
}

export function platformSmsModeLabel(settings: PlatformSettings): string {
  return settings.smsNotificationsEnabled === true ? 'Twilio only' : 'Off';
}

export function platformSmsModeDescription(settings: PlatformSettings): string {
  if (settings.smsNotificationsEnabled === true) {
    return 'SMS alerts are sent through Twilio for job updates, approvals, and staff notifications.';
  }
  return 'SMS notifications are off. Staff can still use in-app and push alerts.';
}

export function platformBackgroundCheckModeLabel(settings: PlatformSettings): string {
  return settings.backgroundCheckProvider === 'checkr' ? 'Checkr only' : 'Manual staff review';
}

export function platformBackgroundCheckModeDescription(settings: PlatformSettings): string {
  if (settings.backgroundCheckProvider === 'checkr') {
    return 'Guard background checks run through Checkr when connected. Results sync automatically.';
  }
  return 'Staff manually review guard background checks in the Credentials panel.';
}

export function platformInsuranceModeLabel(settings: PlatformSettings): string {
  return settings.insuranceVerificationMode === 'api' ? 'Automated API' : 'Manual COI review';
}

export function platformInsuranceModeDescription(settings: PlatformSettings): string {
  if (settings.insuranceVerificationMode === 'api') {
    return 'Certificates of insurance are verified automatically through the connected API.';
  }
  return 'Staff manually review COI documents in the Credentials panel.';
}

export function platformCheckrEnabled(settings: PlatformSettings): boolean {
  return settings.backgroundCheckProvider === 'checkr';
}

export function platformInsuranceApiEnabled(settings: PlatformSettings): boolean {
  return settings.insuranceVerificationMode === 'api';
}

/** At least one card processor must stay enabled. */
export function normalizePlatformSettings(
  input: Partial<PlatformSettings> & { paymentCashEnabled?: boolean }
): PlatformSettings | null {
  const stripe = input.paymentStripeEnabled ?? DEFAULT_PLATFORM_SETTINGS.paymentStripeEnabled;
  const square = input.paymentSquareEnabled ?? DEFAULT_PLATFORM_SETTINGS.paymentSquareEnabled;
  if (!stripe && !square) return null;
  const bumpRate = Math.max(
    0,
    input.crewTeamPayBumpPerHour ?? input.teamLeadBonusPerGuardPerHour ?? 1
  );
  return {
    paymentStripeEnabled: stripe,
    paymentSquareEnabled: square,
    feeConfig: normalizePlatformFeeConfig(input.feeConfig),
    clientFeeSchedules: input.clientFeeSchedules
      ? normalizeClientPlatformFeeSchedules(input.clientFeeSchedules, input.feeConfig)
      : normalizeClientPlatformFeeSchedules(undefined, input.feeConfig),
    autoStripePayoutEnabled: input.autoStripePayoutEnabled ?? true,
    autoStripePayoutDelayHours: input.autoStripePayoutDelayHours ?? 48,
    verifiedGuardSelfServe: input.verifiedGuardSelfServe ?? true,
    jobReviewMode: input.jobReviewMode ?? 'trusted-auto',
    trustedClientAutoPublish: input.trustedClientAutoPublish ?? true,
    smsNotificationsEnabled: input.smsNotificationsEnabled ?? false,
    backgroundCheckProvider: input.backgroundCheckProvider ?? 'manual',
    insuranceVerificationMode: input.insuranceVerificationMode ?? 'manual',
    companyPlacardPublicEnabled: input.companyPlacardPublicEnabled ?? true,
    staffRolePermissions: input.staffRolePermissions,
    crewTeamPayBumpPerHour: bumpRate,
    teamLeadBonusPerGuardPerHour: bumpRate,
    teamLeadBonusClientSharePercent: 100,
    teamLeadBonusPlatformSharePercent: 0,
    staffCompensation: normalizeStaffCompensationConfig(
      input.staffCompensation ?? DEFAULT_STAFF_COMPENSATION_CONFIG,
    ),
    staffMarketplaceCap: normalizeStaffMarketplaceCapConfig(
      input.staffMarketplaceCap ?? DEFAULT_STAFF_MARKETPLACE_CAP_CONFIG,
    ),
    clientCredentialRules: parseClientCredentialRuleOverrides(input.clientCredentialRules),
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  };
}

export function loadPlatformSettingsFromStorage(): PlatformSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        ...DEFAULT_PLATFORM_SETTINGS,
        feeConfig: { ...DEFAULT_PLATFORM_SETTINGS.feeConfig },
        clientFeeSchedules: normalizeClientPlatformFeeSchedules(
          DEFAULT_CLIENT_FEE_SCHEDULES,
          DEFAULT_PLATFORM_SETTINGS.feeConfig
        ),
      };
    }
    const parsed = JSON.parse(raw) as Partial<PlatformSettings> & { paymentCashEnabled?: boolean };
    if (parsed.paymentCashEnabled != null && parsed.paymentSquareEnabled == null) {
      parsed.paymentSquareEnabled = false;
    }
    delete parsed.paymentCashEnabled;
    return (
      normalizePlatformSettings(parsed) ?? {
        ...DEFAULT_PLATFORM_SETTINGS,
      }
    );
  } catch {
    return { ...DEFAULT_PLATFORM_SETTINGS };
  }
}

export function savePlatformSettingsToStorage(settings: PlatformSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

export function platformSettingsFromDbRow(row: {
  payment_cash_enabled?: boolean | null;
  payment_stripe_enabled?: boolean | null;
  payment_square_enabled?: boolean | null;
  fee_config?: unknown;
  team_lead_bonus_per_guard_per_hour?: number | null;
  team_lead_bonus_client_share_percent?: number | null;
  team_lead_bonus_platform_share_percent?: number | null;
  owner_message?: string | null;
  owner_message_updated_at?: string | null;
  director_message?: string | null;
  director_message_updated_at?: string | null;
  auto_stripe_payout_enabled?: boolean | null;
  auto_stripe_payout_delay_hours?: number | null;
  verified_guard_self_serve?: boolean | null;
  job_review_mode?: string | null;
  trusted_client_auto_publish?: boolean | null;
  sms_notifications_enabled?: boolean | null;
  background_check_provider?: string | null;
  insurance_verification_mode?: string | null;
  company_placard_public_enabled?: boolean | null;
  staff_role_permissions?: unknown;
  staff_compensation_config?: unknown;
  client_credential_rules?: unknown;
  updated_at?: string | null;
}): PlatformSettings {
  const feeConfig = normalizePlatformFeeConfig(
    row.fee_config as Partial<PlatformFeeConfig> | null | undefined
  );
  const nestedSchedules = parseFeeSchedulesFromFeeConfigJson(row.fee_config, feeConfig);
  return (
    normalizePlatformSettings({
      paymentStripeEnabled: row.payment_stripe_enabled ?? true,
      paymentSquareEnabled: row.payment_square_enabled ?? false,
      feeConfig,
      clientFeeSchedules: nestedSchedules,
      ownerMessage: row.owner_message ?? undefined,
      ownerMessageUpdatedAt: row.owner_message_updated_at ?? undefined,
      directorMessage: row.director_message ?? undefined,
      directorMessageUpdatedAt: row.director_message_updated_at ?? undefined,
      autoStripePayoutEnabled: row.auto_stripe_payout_enabled ?? true,
      autoStripePayoutDelayHours:
        row.auto_stripe_payout_delay_hours != null
          ? Number(row.auto_stripe_payout_delay_hours)
          : 48,
      verifiedGuardSelfServe: row.verified_guard_self_serve ?? true,
      jobReviewMode: (row.job_review_mode as JobReviewMode) ?? 'trusted-auto',
      trustedClientAutoPublish: row.trusted_client_auto_publish ?? true,
      smsNotificationsEnabled: row.sms_notifications_enabled ?? false,
      backgroundCheckProvider: row.background_check_provider ?? 'manual',
      insuranceVerificationMode: row.insurance_verification_mode ?? 'manual',
      companyPlacardPublicEnabled: row.company_placard_public_enabled ?? true,
      staffRolePermissions: parseStaffRolePermissions(row.staff_role_permissions),
      crewTeamPayBumpPerHour:
        row.team_lead_bonus_per_guard_per_hour != null
          ? Number(row.team_lead_bonus_per_guard_per_hour)
          : 1,
      teamLeadBonusPerGuardPerHour:
        row.team_lead_bonus_per_guard_per_hour != null
          ? Number(row.team_lead_bonus_per_guard_per_hour)
          : 1,
      staffCompensation: normalizeStaffCompensationConfig(
        (row.staff_compensation_config as StaffCompensationConfig | null | undefined) ??
          DEFAULT_STAFF_COMPENSATION_CONFIG,
      ),
      clientCredentialRules: parseClientCredentialRuleOverrides(row.client_credential_rules),
      updatedAt: row.updated_at ?? undefined,
    }) ?? {
      ...DEFAULT_PLATFORM_SETTINGS,
    }
  );
}

export function platformSettingsToDbRow(settings: PlatformSettings) {
  return {
    id: 'default',
    payment_cash_enabled: false,
    payment_stripe_enabled: settings.paymentStripeEnabled,
    payment_square_enabled: settings.paymentSquareEnabled,
    fee_config: feeConfigJsonWithSchedules(settings.feeConfig, settings.clientFeeSchedules),
    owner_message: settings.ownerMessage ?? null,
    owner_message_updated_at: settings.ownerMessageUpdatedAt ?? null,
    director_message: settings.directorMessage ?? null,
    director_message_updated_at: settings.directorMessageUpdatedAt ?? null,
    auto_stripe_payout_enabled: settings.autoStripePayoutEnabled ?? true,
    auto_stripe_payout_delay_hours: settings.autoStripePayoutDelayHours ?? 48,
    verified_guard_self_serve: settings.verifiedGuardSelfServe ?? true,
    job_review_mode: settings.jobReviewMode ?? 'trusted-auto',
    trusted_client_auto_publish: settings.trustedClientAutoPublish ?? true,
    sms_notifications_enabled: settings.smsNotificationsEnabled ?? false,
    background_check_provider: settings.backgroundCheckProvider ?? 'manual',
    insurance_verification_mode: settings.insuranceVerificationMode ?? 'manual',
    company_placard_public_enabled: settings.companyPlacardPublicEnabled ?? true,
    staff_role_permissions: settings.staffRolePermissions ?? null,
    staff_compensation_config: settings.staffCompensation ?? DEFAULT_STAFF_COMPENSATION_CONFIG,
    client_credential_rules: settings.clientCredentialRules ?? [],
    team_lead_bonus_per_guard_per_hour:
      settings.crewTeamPayBumpPerHour ?? settings.teamLeadBonusPerGuardPerHour ?? 1,
    team_lead_bonus_client_share_percent: 100,
    team_lead_bonus_platform_share_percent: 0,
    updated_at: settings.updatedAt ?? new Date().toISOString(),
  };
}

export interface ClientPaymentGates {
  allowStripe: boolean;
  allowSquare: boolean;
}

export function clientPaymentGates(settings: PlatformSettings): ClientPaymentGates {
  return {
    allowStripe: platformAllowsStripe(settings),
    allowSquare: platformAllowsSquare(settings),
  };
}

export function feeConfigForClientJob(
  settings: PlatformSettings,
  clientType?: 'personal' | 'business' | string | null,
  jobType?: string | null
): PlatformFeeConfig {
  return resolveClientJobFeeConfig(
    settings.clientFeeSchedules,
    clientType,
    jobType,
    settings.feeConfig
  );
}
