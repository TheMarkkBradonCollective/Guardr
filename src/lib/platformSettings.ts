export interface PlatformSettings {
  paymentCashEnabled: boolean;
  paymentStripeEnabled: boolean;
  updatedAt?: string;
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  paymentCashEnabled: true,
  paymentStripeEnabled: true,
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

/** At least one method must stay enabled. */
export function normalizePlatformSettings(
  input: Partial<PlatformSettings>
): PlatformSettings | null {
  const cash = input.paymentCashEnabled ?? DEFAULT_PLATFORM_SETTINGS.paymentCashEnabled;
  const stripe = input.paymentStripeEnabled ?? DEFAULT_PLATFORM_SETTINGS.paymentStripeEnabled;
  if (!cash && !stripe) return null;
  return {
    paymentCashEnabled: cash,
    paymentStripeEnabled: stripe,
    updatedAt: new Date().toISOString(),
  };
}

export function loadPlatformSettingsFromStorage(): PlatformSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PLATFORM_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<PlatformSettings>;
    return (
      normalizePlatformSettings(parsed) ?? { ...DEFAULT_PLATFORM_SETTINGS }
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
  updated_at?: string | null;
}): PlatformSettings {
  return (
    normalizePlatformSettings({
      paymentCashEnabled: row.payment_cash_enabled ?? true,
      paymentStripeEnabled: row.payment_stripe_enabled ?? true,
      updatedAt: row.updated_at ?? undefined,
    }) ?? { ...DEFAULT_PLATFORM_SETTINGS }
  );
}

export function platformSettingsToDbRow(settings: PlatformSettings) {
  return {
    id: 'default',
    payment_cash_enabled: settings.paymentCashEnabled,
    payment_stripe_enabled: settings.paymentStripeEnabled,
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
