import { apiUrl } from '../api/guardrClient';

const TOKEN_KEY = 'guardr_api_jwt';

export type StripePublicConfig = {
  stripePublishableKey: string | null;
  paymentsConfigured: boolean;
  canRunTestPayments: boolean;
  stripeTestPublishableKey: string | null;
};

let cachedConfig: StripePublicConfig | undefined;

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = {};
  if (typeof localStorage === 'undefined') return headers;
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function fetchStripePublicConfig(): Promise<StripePublicConfig> {
  if (cachedConfig) return cachedConfig;
  const fallback: StripePublicConfig = {
    stripePublishableKey: null,
    paymentsConfigured: false,
    canRunTestPayments: false,
    stripeTestPublishableKey: null,
  };
  try {
    const res = await fetch(apiUrl('/api/config'), { headers: authHeaders() });
    const data = (await res.json()) as Partial<StripePublicConfig> & { error?: string };
    if (!res.ok) {
      cachedConfig = fallback;
      return fallback;
    }
    cachedConfig = {
      stripePublishableKey: data.stripePublishableKey ?? null,
      paymentsConfigured: data.paymentsConfigured === true,
      canRunTestPayments: data.canRunTestPayments === true,
      stripeTestPublishableKey: data.stripeTestPublishableKey ?? null,
    };
    return cachedConfig;
  } catch {
    cachedConfig = fallback;
    return fallback;
  }
}

export async function fetchStripePublishableKey(options?: { testMode?: boolean }): Promise<string | null> {
  const config = await fetchStripePublicConfig();
  if (options?.testMode) return config.stripeTestPublishableKey;
  return config.stripePublishableKey;
}

export function resetStripePublicConfigCache(): void {
  cachedConfig = undefined;
}
