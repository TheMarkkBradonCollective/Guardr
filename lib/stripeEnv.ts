export type StripeEnv = Record<string, string | undefined>;
export type StripeKeyMode = 'test' | 'live';

const SECRET_PLACEHOLDER = 'sk_test_placeholder';
const PUBLISHABLE_PLACEHOLDER = 'pk_test_placeholder';

function firstEnv(env: StripeEnv | undefined, name: string): string | undefined {
  const value = (env?.[name] ?? process.env[name])?.trim();
  return value || undefined;
}

function isTestSecret(key: string): boolean {
  return key.startsWith('sk_test_') || key.startsWith('rk_test_');
}

function isLiveSecret(key: string): boolean {
  return key.startsWith('sk_live_') || key.startsWith('rk_live_');
}

function isTestPublishable(key: string): boolean {
  return key.startsWith('pk_test_');
}

function isLivePublishable(key: string): boolean {
  return key.startsWith('pk_live_');
}

/** Legacy reader: configured STRIPE_SECRET_KEY, whether test or live. */
export function readStripeSecretKey(env?: StripeEnv): string | undefined {
  const key = firstEnv(env, 'STRIPE_SECRET_KEY');
  if (!key || key === SECRET_PLACEHOLDER) return undefined;
  return key;
}

export function readStripeLiveSecretKey(env?: StripeEnv): string | undefined {
  const key = readStripeSecretKey(env);
  if (key && isLiveSecret(key)) return key;
  return undefined;
}

/**
 * Permanent test-mode secret. Prefers STRIPE_TEST_SECRET_KEY; falls back to
 * STRIPE_SECRET_KEY when that value is still a test key (current production).
 * Live keys are never returned here.
 */
export function readStripeTestSecretKey(env?: StripeEnv): string | undefined {
  const named = firstEnv(env, 'STRIPE_TEST_SECRET_KEY');
  if (named && isTestSecret(named) && named !== SECRET_PLACEHOLDER) return named;
  const legacy = readStripeSecretKey(env);
  if (legacy && isTestSecret(legacy)) return legacy;
  return undefined;
}

export function readStripeSecretKeyForMode(mode: StripeKeyMode, env?: StripeEnv): string | undefined {
  return mode === 'test' ? readStripeTestSecretKey(env) : readStripeLiveSecretKey(env);
}

/** Default charge path: live when configured, otherwise the test secret (today's setup). */
export function readStripeDefaultSecretKey(env?: StripeEnv): string | undefined {
  return readStripeLiveSecretKey(env) ?? readStripeTestSecretKey(env);
}

export function readStripeWebhookSecret(env?: StripeEnv): string | undefined {
  return firstEnv(env, 'STRIPE_WEBHOOK_SECRET');
}

export function readStripeTestWebhookSecret(env?: StripeEnv): string | undefined {
  const named = firstEnv(env, 'STRIPE_TEST_WEBHOOK_SECRET');
  if (named) return named;
  // Until a live webhook secret is introduced, the existing secret is the test one.
  if (!readStripeLiveSecretKey(env)) return readStripeWebhookSecret(env);
  return undefined;
}

/** Unique signing secrets so the webhook can accept both test and live events. */
export function readStripeWebhookSecrets(env?: StripeEnv): string[] {
  const secrets: string[] = [];
  for (const secret of [readStripeWebhookSecret(env), firstEnv(env, 'STRIPE_TEST_WEBHOOK_SECRET')]) {
    if (secret && !secrets.includes(secret)) secrets.push(secret);
  }
  return secrets;
}

export function readStripePublishableKey(env?: StripeEnv): string | undefined {
  const key = firstEnv(env, 'STRIPE_PUBLISHABLE_KEY');
  if (!key || key === PUBLISHABLE_PLACEHOLDER) return undefined;
  return key;
}

export function readStripeLivePublishableKey(env?: StripeEnv): string | undefined {
  const key = readStripePublishableKey(env);
  if (key && isLivePublishable(key)) return key;
  return undefined;
}

export function readStripeTestPublishableKey(env?: StripeEnv): string | undefined {
  const named = firstEnv(env, 'STRIPE_TEST_PUBLISHABLE_KEY');
  if (named && isTestPublishable(named) && named !== PUBLISHABLE_PLACEHOLDER) return named;
  const legacy = readStripePublishableKey(env);
  if (legacy && isTestPublishable(legacy)) return legacy;
  return undefined;
}

export function isStripePaymentsConfigured(env?: StripeEnv): boolean {
  return !!readStripeDefaultSecretKey(env);
}

export function isStripeTestPaymentsConfigured(env?: StripeEnv): boolean {
  return !!readStripeTestSecretKey(env);
}

export const PAYMENTS_NOT_CONFIGURED_BODY = { error: 'payments not configured' } as const;
