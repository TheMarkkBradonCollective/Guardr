import type Stripe from 'stripe';

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

export const GUARD_PAY_PLATFORM_FEE = 5;

export function computeGuardPayoutCents(hourlyRate: number, durationHours: number): number {
  const guardPay = Math.max(0, hourlyRate - GUARD_PAY_PLATFORM_FEE);
  return Math.round(durationHours * guardPay * 100);
}
