export type StripeEnv = Record<string, string | undefined>;

const PLACEHOLDER = 'sk_test_placeholder';

export function readStripeSecretKey(env?: StripeEnv): string | undefined {
  const key = (env?.STRIPE_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY)?.trim();
  if (!key || key === PLACEHOLDER) return undefined;
  return key;
}

export function readStripeWebhookSecret(env?: StripeEnv): string | undefined {
  const secret = (env?.STRIPE_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET)?.trim();
  return secret || undefined;
}

export function readStripePublishableKey(env?: StripeEnv): string | undefined {
  const key = (env?.STRIPE_PUBLISHABLE_KEY ?? process.env.STRIPE_PUBLISHABLE_KEY)?.trim();
  if (!key || key === 'pk_test_placeholder') return undefined;
  return key;
}

export function isStripePaymentsConfigured(env?: StripeEnv): boolean {
  return !!readStripeSecretKey(env);
}

export const PAYMENTS_NOT_CONFIGURED_BODY = { error: 'payments not configured' } as const;
