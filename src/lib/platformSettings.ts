import {
  DEFAULT_PLATFORM_FEE_CONFIG,
  normalizePlatformFeeConfig,
  type PlatformFeeConfig,
} from '../../lib/platformFees';

export type { PlatformFeeConfig, PlatformFeeModel, PlatformFeeTier } from '../../lib/platformFees';
export {
  DEFAULT_PLATFORM_FEE_CONFIG,
  TIERED_PLATFORM_FEE_PRESET,
} from '../../lib/platformFees';

export interface PlatformSettings {
  paymentCashEnabled: boolean;
  paymentStripeEnabled: boolean;
  feeConfig: PlatformFeeConfig;
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
  paymentCashEnabled: true,
  paymentStripeEnabled: true,
  feeConfig: { ...DEFAULT_PLATFORM_FEE_CONFIG },
  crewTeamPayBumpPerHour: 1,
  teamLeadBonusPerGuardPerHour: 1,
  teamLeadBonusClientSharePercent: 100,
  teamLeadBonusPlatformSharePercent: 0,
};

const STORAGE_KEY = 'guardr_platform_settings';

export function platformAllowsCash(settings: PlatformSettings): boolean {
  return settings.paymentCashEnabled;
}

export function platformAllowsStripe(settings: PlatformSettings): boolean {
  return settings.paymentStripeEnabled;
}

export function platformPaymentModeLabel(settings: PlatformSettings): string {
  if (settings.paymentCashEnabled && settings.paymentStripeEnabled) return 'Card and cash';
  if (settings.paymentCashEnabled) return 'Cash only';
  if (settings.paymentStripeEnabled) return 'Card only';
  return 'Not configured';
}

export function platformPaymentModeDescription(settings: PlatformSettings): string {
  if (settings.paymentCashEnabled && settings.paymentStripeEnabled) {
    return 'Clients can pay by card (automatic) or request cash (staff approves).';
  }
  if (settings.paymentCashEnabled) {
    return 'Clients request cash payment; staff must approve each payment.';
  }
  if (settings.paymentStripeEnabled) {
    return 'Clients pay online by card through Stripe checkout.';
  }
  return 'Enable at least one payment method in Settings.';
}

/** At least one payment method must stay enabled. */
export function normalizePlatformSettings(
  input: Partial<PlatformSettings>
): PlatformSettings | null {
  const cash = input.paymentCashEnabled ?? DEFAULT_PLATFORM_SETTINGS.paymentCashEnabled;
  const stripe = input.paymentStripeEnabled ?? DEFAULT_PLATFORM_SETTINGS.paymentStripeEnabled;
  if (!cash && !stripe) return null;
  const bumpRate = Math.max(
    0,
    input.crewTeamPayBumpPerHour ?? input.teamLeadBonusPerGuardPerHour ?? 1
  );
  return {
    paymentCashEnabled: cash,
    paymentStripeEnabled: stripe,
    feeConfig: normalizePlatformFeeConfig(input.feeConfig),
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
  updated_at?: string | null;
}): PlatformSettings {
  return (
    normalizePlatformSettings({
      paymentCashEnabled: row.payment_cash_enabled ?? true,
      paymentStripeEnabled: row.payment_stripe_enabled ?? true,
      feeConfig: normalizePlatformFeeConfig(
        row.fee_config as Partial<PlatformFeeConfig> | null | undefined
      ),
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
