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

export interface PlatformSettings {
  paymentCashEnabled: boolean;
  paymentStripeEnabled: boolean;
  feeConfig: PlatformFeeConfig;
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
  paymentCashEnabled: false,
  paymentStripeEnabled: true,
  feeConfig: { ...DEFAULT_PLATFORM_FEE_CONFIG },
  autoStripePayoutEnabled: true,
  autoStripePayoutDelayHours: 48,
  verifiedGuardSelfServe: true,
  crewTeamPayBumpPerHour: 1,
  teamLeadBonusPerGuardPerHour: 1,
  teamLeadBonusClientSharePercent: 100,
  teamLeadBonusPlatformSharePercent: 0,
};

const STORAGE_KEY = 'guardr_platform_settings';

/** Cash payments are disabled — marketplace is card/Stripe only. */
export function platformAllowsCash(_settings: PlatformSettings): boolean {
  return false;
}

export function platformAllowsStripe(settings: PlatformSettings): boolean {
  return settings.paymentStripeEnabled;
}

export function platformPaymentModeLabel(settings: PlatformSettings): string {
  if (settings.paymentStripeEnabled) return 'Card only';
  return 'Not configured';
}

export function platformPaymentModeDescription(settings: PlatformSettings): string {
  if (settings.paymentStripeEnabled) {
    return 'Clients pay online by card through Stripe checkout.';
  }
  return 'Enable card payments in Settings.';
}

/** At least one payment method must stay enabled. */
export function normalizePlatformSettings(
  input: Partial<PlatformSettings>
): PlatformSettings | null {
  const stripe = input.paymentStripeEnabled ?? DEFAULT_PLATFORM_SETTINGS.paymentStripeEnabled;
  if (!stripe) return null;
  const bumpRate = Math.max(
    0,
    input.crewTeamPayBumpPerHour ?? input.teamLeadBonusPerGuardPerHour ?? 1
  );
  return {
    paymentCashEnabled: false,
    paymentStripeEnabled: stripe,
    feeConfig: normalizePlatformFeeConfig(input.feeConfig),
    autoStripePayoutEnabled: input.autoStripePayoutEnabled ?? true,
    autoStripePayoutDelayHours: input.autoStripePayoutDelayHours ?? 48,
    verifiedGuardSelfServe: input.verifiedGuardSelfServe ?? true,
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
    const parsed = JSON.parse(raw) as Partial<PlatformSettings>;
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
  updated_at?: string | null;
}): PlatformSettings {
  return (
    normalizePlatformSettings({
      paymentCashEnabled: false,
      paymentStripeEnabled: row.payment_stripe_enabled ?? true,
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
    payment_cash_enabled: settings.paymentCashEnabled,
    payment_stripe_enabled: settings.paymentStripeEnabled,
    fee_config: settings.feeConfig,
    owner_message: settings.ownerMessage ?? null,
    owner_message_updated_at: settings.ownerMessageUpdatedAt ?? null,
    director_message: settings.directorMessage ?? null,
    director_message_updated_at: settings.directorMessageUpdatedAt ?? null,
    auto_stripe_payout_enabled: settings.autoStripePayoutEnabled ?? true,
    auto_stripe_payout_delay_hours: settings.autoStripePayoutDelayHours ?? 48,
    verified_guard_self_serve: settings.verifiedGuardSelfServe ?? true,
    team_lead_bonus_per_guard_per_hour:
      settings.crewTeamPayBumpPerHour ?? settings.teamLeadBonusPerGuardPerHour ?? 1,
    team_lead_bonus_client_share_percent: 100,
    team_lead_bonus_platform_share_percent: 0,
    updated_at: settings.updatedAt ?? new Date().toISOString(),
  };
}

export interface ClientPaymentGates {
  allowStripe: boolean;
  allowCash: boolean;
}

export function clientPaymentGates(settings: PlatformSettings): ClientPaymentGates {
  return {
    allowStripe: platformAllowsStripe(settings),
    allowCash: platformAllowsCash(settings),
  };
}
