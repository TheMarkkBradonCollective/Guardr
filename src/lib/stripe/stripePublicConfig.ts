import { apiUrl } from '../api/guardrClient';

let cachedPublishableKey: string | null | undefined;

export async function fetchStripePublishableKey(): Promise<string | null> {
  if (cachedPublishableKey !== undefined) return cachedPublishableKey;
  try {
    const res = await fetch(apiUrl('/api/config'));
    const data = (await res.json()) as { stripePublishableKey?: string | null; error?: string };
    if (!res.ok) {
      cachedPublishableKey = null;
      return null;
    }
    cachedPublishableKey = data.stripePublishableKey ?? null;
    return cachedPublishableKey;
  } catch {
    cachedPublishableKey = null;
    return null;
  }
}

export function resetStripePublicConfigCache(): void {
  cachedPublishableKey = undefined;
}
