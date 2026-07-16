import {
  DEFAULT_PLATFORM_FEE_CONFIG,
  normalizePlatformFeeConfig,
  type PlatformFeeConfig,
} from '../../lib/platformFees';

export type {
  AgreementPlatformFeeConfig,
  PlatformFeeConfig,
  PlatformFeeModel,
  PlatformFeeTier,
} from '../../lib/platformFees';
export { DEFAULT_PLATFORM_FEE_CONFIG, TIERED_PLATFORM_FEE_PRESET } from '../../lib/platformFees';

export type JobReviewMode = 'staff-all' | 'trusted-auto' | 'none';

export interface PlatformSettings {
  paymentStripeEnabled: boolean;
  paymentSquareEnabled: boolean;
  feeConfig: PlatformFeeConfig;
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
  updatedAt?: string;
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  paymentStripeEnabled: true,
  paymentSquareEnabled: false,
  feeConfig: { ...DEFAULT_PLATFORM_FEE_CONFIG },
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
    autoStripePayoutEnabled: input.autoStripePayoutEnabled ?? true,
    autoStripePayoutDelayHours: input.autoStripePayoutDelayHours ?? 48,
    verifiedGuardSelfServe: input.verifiedGuardSelfServe ?? true,
    jobReviewMode: input.jobReviewMode ?? 'trusted-auto',
    trustedClientAutoPublish: input.trustedClientAutoPublish ?? true,
    smsNotificationsEnabled: input.smsNotificationsEnabled ?? false,
    backgroundCheckProvider: input.backgroundCheckProvider ?? 'manual',
    insuranceVerificationMode: input.insuranceVerificationMode ?? 'manual',
    companyPlacardPublicEnabled: input.companyPlacardPublicEnabled ?? true,
    crewTeamPayBumpPerHour: bumpRate,
    teamLeadBonusPerGuardPerHour: bumpRate,
    teamLeadBonusClientSharePercent: 100,
    teamLeadBonusPlatformSharePercent: 0,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  };
}

export function loadPlatformSettingsFromStorage(): PlatformSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PLATFORM_SETTINGS, feeConfig: { ...DEFAULT_PLATFORM_FEE_CONFIG } };
    const parsed = JSON.parse(raw) as Partial<PlatformSettings> & { paymentCashEnabled?: boolean };
    if (parsed.paymentCashEnabled != null && parsed.paymentSquareEnabled == null) {
      parsed.paymentSquareEnabled = false;
    }
    delete parsed.paymentCashEnabled;
    return (
      normalizePlatformSettings(parsed) ?? {
        ...DEFAULT_PLATFORM_SETTINGS,
        feeConfig: { ...DEFAULT_PLATFORM_FEE_CONFIG },
      }
    );
  } catch {
    return { ...DEFAULT_PLATFORM_SETTINGS, feeConfig: { ...DEFAULT_PLATFORM_FEE_CONFIG } };
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
  updated_at?: string | null;
}): PlatformSettings {
  return (
    normalizePlatformSettings({
      paymentStripeEnabled: row.payment_stripe_enabled ?? true,
      paymentSquareEnabled: row.payment_square_enabled ?? false,
      feeConfig: normalizePlatformFeeConfig(
        row.fee_config as Partial<PlatformFeeConfig> | null | undefined
      ),
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
      crewTeamPayBumpPerHour:
        row.team_lead_bonus_per_guard_per_hour != null
          ? Number(row.team_lead_bonus_per_guard_per_hour)
          : 1,
      teamLeadBonusPerGuardPerHour:
        row.team_lead_bonus_per_guard_per_hour != null
          ? Number(row.team_lead_bonus_per_guard_per_hour)
          : 1,
      updatedAt: row.updated_at ?? undefined,
    }) ?? {
      ...DEFAULT_PLATFORM_SETTINGS,
      feeConfig: { ...DEFAULT_PLATFORM_FEE_CONFIG },
    }
  );
}

export function platformSettingsToDbRow(settings: PlatformSettings) {
  return {
    id: 'default',
    payment_cash_enabled: false,
    payment_stripe_enabled: settings.paymentStripeEnabled,
    payment_square_enabled: settings.paymentSquareEnabled,
    fee_config: settings.feeConfig,
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
