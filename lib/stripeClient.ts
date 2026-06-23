import type Stripe from 'stripe';

import {
  computeGuardPayoutCents,
  LEGACY_PLATFORM_FEE_PER_HOUR,
} from './platformFees';

let stripe: Stripe | null | undefined;
let stripePromise: Promise<Stripe | null> | undefined;

export async function getStripe(): Promise<Stripe | null> {
  if (stripe !== undefined) return stripe;
  if (!stripePromise) {
    stripePromise = (async () => {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key || key === 'sk_test_placeholder') return null;
      const { default: StripeSdk } = await import('stripe');
      return new StripeSdk(key);
    })();
  }
  stripe = await stripePromise;
  return stripe;
}

/** @deprecated Use per-job platform_fee_per_hour when available. */
export const GUARD_PAY_PLATFORM_FEE = LEGACY_PLATFORM_FEE_PER_HOUR;

export { computeGuardPayoutCents };
