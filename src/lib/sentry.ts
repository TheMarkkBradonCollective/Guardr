/**
 * Sentry error monitoring scaffold — activates when VITE_SENTRY_DSN is set.
 */

type SentryScope = { setTag: (k: string, v: string) => void; setExtra: (k: string, v: unknown) => void };

interface SentryLike {
  init: (opts: { dsn: string; environment?: string }) => void;
  captureException: (err: unknown) => void;
  captureMessage: (msg: string, level?: string) => void;
  withScope: (fn: (scope: SentryScope) => void) => void;
}

let initialized = false;
let sentry: SentryLike | null = null;

export async function initSentry(): Promise<void> {
  if (initialized) return;
  const dsn = (import.meta as { env?: { VITE_SENTRY_DSN?: string } }).env?.VITE_SENTRY_DSN;
  if (!dsn) return;

  try {
    const mod = await import('@sentry/react');
    mod.init({
      dsn,
      environment: (import.meta as { env?: { MODE?: string } }).env?.MODE ?? 'production',
      tracesSampleRate: 0.1,
    });
    sentry = mod as unknown as SentryLike;
    initialized = true;
  } catch {
    /* @sentry/react not installed — scaffold only */
  }
}

export function captureError(err: unknown, context?: Record<string, unknown>): void {
  if (!sentry) {
    console.error('[Guardr]', err, context);
    return;
  }
  sentry.withScope((scope) => {
    if (context) Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
    sentry!.captureException(err);
  });
}

export function captureMessage(msg: string, level = 'info'): void {
  if (!sentry) return;
  sentry.captureMessage(msg, level);
}
