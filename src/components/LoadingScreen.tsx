/**
 * Boot loading screen. Native splash dismissal stays here; the visible
 * treatment is the shared loading state.
 */

import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { formatAppVersion } from '../lib/appVersion';
import { LoadingState } from './states/StateViews';
import './states/states.css';

export function LoadingScreen({ onRetry }: { onRetry?: () => void }) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 8000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    void (async () => {
      try {
        const { SplashScreen } = await import('@capacitor/splash-screen');
        await SplashScreen.hide({ fadeOutDuration: 0 });
      } catch (error) {
        console.warn('[native] splash hide failed:', error);
      }
    })();
  }, []);

  return (
    <div className="gr-loading-screen" role="status" aria-live="polite" aria-label="Loading Guardr">
      <LoadingState
        title={slow ? 'This is taking longer than usual.' : 'Loading Guardr'}
        message={
          slow
            ? 'The connection is still working. You can retry without leaving this screen.'
            : 'Guardr is opening.'
        }
        action={slow && onRetry ? { label: 'Try again', onClick: onRetry } : undefined}
      />
      <p className="gr-loading-version">{formatAppVersion()}</p>
    </div>
  );
}
