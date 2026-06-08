import { createRequire } from 'module';
import type Stripe from 'stripe';

const require = createRequire(import.meta.url);

let stripe: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  if (stripe !== undefined) return stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key === 'sk_test_placeholder') {
    stripe = null;
    return null;
  }

  const StripeSdk = require('stripe') as typeof import('stripe').default;
  stripe = new StripeSdk(key);
  return stripe;
}

export const GUARD_PAY_PLATFORM_FEE = 5;

export function computeGuardPayoutCents(hourlyRate: number, durationHours: number): number {
  const guardPay = Math.max(0, hourlyRate - GUARD_PAY_PLATFORM_FEE);
  return Math.round(durationHours * guardPay * 100);
}
