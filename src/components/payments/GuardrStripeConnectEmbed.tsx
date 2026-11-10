import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { fetchStripePublishableKey } from '../../lib/stripe/stripePublicConfig';
import { createConnectAccountSession } from '../../lib/stripeApi';
import { guardrStripeAppearance } from '../../lib/stripe/stripeAppearance';
import { readThemeFromDocument } from '../../lib/platform/theme';
import { userFacingError } from '../../lib/userFacingError';

type ConnectComponent = 'account_onboarding' | 'account_management';

export function GuardrStripeConnectEmbed({
  accountId,
  component = 'account_onboarding',
  onComplete,
  onLoadError,
}: {
  accountId: string;
  component?: ConnectComponent;
  onComplete?: () => void;
  onLoadError?: (message: string) => void;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let mountedElement: HTMLElement | null = null;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const publishableKey = await fetchStripePublishableKey();
        if (!publishableKey) throw new Error('Stripe Connect is not available.');
        const { loadConnectAndInitialize } = await import('@stripe/connect-js');
        const dark = readThemeFromDocument() === 'dark';
        const appearance = guardrStripeAppearance(readThemeFromDocument());
        const connect = loadConnectAndInitialize({
          publishableKey,
          fetchClientSecret: async () => {
            const { clientSecret } = await createConnectAccountSession(accountId, component);
            return clientSecret;
          },
          appearance: {
            overlays: 'dialog',
            variables: {
              colorPrimary: appearance.variables?.colorPrimary ?? (dark ? '#e8c547' : '#1a1a1a'),
              colorBackground: appearance.variables?.colorBackground,
              fontFamily: appearance.variables?.fontFamily,
            },
          },
        });
        if (cancelled || !mountRef.current) return;
        const tag = component === 'account_management' ? 'account-management' : 'account-onboarding';
        const el = connect.create(tag) as HTMLElement & { setOnExit?: (listener: () => void) => void };
        el.setOnExit?.(() => onComplete?.());
        mountedElement = el;
        mountRef.current.innerHTML = '';
        mountRef.current.appendChild(el);
      } catch (err: unknown) {
        const message = userFacingError(err, 'Could not load Stripe Connect');
        if (!cancelled) {
          setError(message);
          onLoadError?.(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (mountRef.current) mountRef.current.innerHTML = '';
      mountedElement = null;
    };
  }, [accountId, component, onComplete, onLoadError]);

  if (error) {
    return <p className="text-sm text-red-500 leading-relaxed">{error}</p>;
  }

  return (
    <div className="relative min-h-[420px] w-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-brand-bg/60 z-10">
          <Loader2 className="w-8 h-8 animate-spin text-brand-text-muted" />
        </div>
      )}
      <div ref={mountRef} className="w-full" />
    </div>
  );
}
