import type Stripe from 'stripe';

import {
  computeGuardPayoutCents,
  LEGACY_PLATFORM_FEE_PER_HOUR,
} from './platformFees';
import {
  readStripeDefaultSecretKey,
  readStripeSecretKeyForMode,
  type StripeKeyMode,
} from './stripeEnv.ts';

let stripe: Stripe | null | undefined;
let stripePromise: Promise<Stripe | null> | undefined;

export async function createStripeSdk(secretKey: string): Promise<Stripe> {
  const { default: StripeSdk } = await import('stripe');
  return new StripeSdk(secretKey, {
    httpClient: StripeSdk.createFetchHttpClient(),
  });
}

export async function getStripe(env?: Record<string, string | undefined>): Promise<Stripe | null> {
  if (stripe !== undefined && !env) return stripe;
  const key = readStripeDefaultSecretKey(env);
  if (!key) {
    if (!env) stripe = null;
    return null;
  }
  if (!env) {
    if (!stripePromise) {
      stripePromise = createStripeSdk(key).then((client) => {
        stripe = client;
        return client;
      });
    }
    return stripePromise;
  }
  return createStripeSdk(key);
}


const stripeByMode: Partial<Record<StripeKeyMode, Stripe | null | Promise<Stripe | null>>> = {};

export async function getStripeForMode(
  mode: StripeKeyMode,
  env?: Record<string, string | undefined>
): Promise<Stripe | null> {
  const key = readStripeSecretKeyForMode(mode, env);
  if (!key) return null;
  if (env) return createStripeSdk(key);
  const cached = stripeByMode[mode];
  if (cached) return cached;
  const created = createStripeSdk(key).then((client) => {
    stripeByMode[mode] = client;
    return client;
  });
  stripeByMode[mode] = created;
  return created;
}

export function resetStripeClientCache(): void {
  stripe = undefined;
  stripePromise = undefined;
  stripeByMode.test = undefined;
  stripeByMode.live = undefined;
}

/** @deprecated Use per-job platform_fee_per_hour when available. */
export const GUARD_PAY_PLATFORM_FEE = LEGACY_PLATFORM_FEE_PER_HOUR;

export { computeGuardPayoutCents };
