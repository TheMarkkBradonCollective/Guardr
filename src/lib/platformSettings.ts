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
  /** Bonus paid to team lead per confirmed crew guard per hour (default $1). */
  teamLeadBonusPerGuardPerHour?: number;
  /** Client share of team lead bonus (default 50%). */
  teamLeadBonusClientSharePercent?: number;
  /** Platform share of team lead bonus (default 50%). */
  teamLeadBonusPlatformSharePercent?: number;
  updatedAt?: string;
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  paymentCashEnabled: true,
  paymentStripeEnabled: true,
  feeConfig: { ...DEFAULT_PLATFORM_FEE_CONFIG },
  teamLeadBonusPerGuardPerHour: 1,
  teamLeadBonusClientSharePercent: 50,
  teamLeadBonusPlatformSharePercent: 50,
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
  let clientShare = input.teamLeadBonusClientSharePercent ?? 50;
  let platformShare = input.teamLeadBonusPlatformSharePercent ?? 50;
  if (clientShare + platformShare !== 100) {
    clientShare = 50;
    platformShare = 50;
  }
  const bonusRate = Math.max(0, input.teamLeadBonusPerGuardPerHour ?? 1);
  return {
    paymentCashEnabled: cash,
    paymentStripeEnabled: stripe,
    feeConfig: normalizePlatformFeeConfig(input.feeConfig),
    teamLeadBonusPerGuardPerHour: bonusRate,
    teamLeadBonusClientSharePercent: clientShare,
    teamLeadBonusPlatformSharePercent: platformShare,
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
      teamLeadBonusPerGuardPerHour:
        row.team_lead_bonus_per_guard_per_hour != null
          ? Number(row.team_lead_bonus_per_guard_per_hour)
          : 1,
      teamLeadBonusClientSharePercent:
        row.team_lead_bonus_client_share_percent ?? 50,
      teamLeadBonusPlatformSharePercent:
        row.team_lead_bonus_platform_share_percent ?? 50,
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
    team_lead_bonus_per_guard_per_hour: settings.teamLeadBonusPerGuardPerHour ?? 1,
    team_lead_bonus_client_share_percent: settings.teamLeadBonusClientSharePercent ?? 50,
    team_lead_bonus_platform_share_percent: settings.teamLeadBonusPlatformSharePercent ?? 50,
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
