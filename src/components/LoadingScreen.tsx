/**
 * LoadingScreen — Base Web pattern.
 *
 * Uses Base Web Spinner as the loading indicator.
 * Clean black/white — matches Base Web app launch screen aesthetic.
 */

import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { formatAppVersion } from '../lib/appVersion';
import { Logo } from './Logo';

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
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Guardr"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--uber-bg, #ffffff)',
        gap: '24px',
        zIndex: 9999,
        padding: '24px',
      }}
    >
      <Logo size={64} className="guardr-loading-logo" />

      <div
        aria-hidden
        style={{
          width: '28px',
          height: '28px',
          border: '3px solid var(--uber-border, #eeeeee)',
          borderTopColor: 'var(--uber-text, #000)',
          borderRadius: '50%',
          animation: 'uber-spin 0.7s linear infinite',
        }}
      />

      {slow ? (
        <div style={{ textAlign: 'center', maxWidth: 280 }}>
          <p
            style={{
              margin: '0 0 12px',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--uber-text, #000)',
            }}
          >
            This is taking longer than usual.
          </p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              style={{
                appearance: 'none',
                border: 0,
                background: 'var(--uber-text, #000)',
                color: 'var(--uber-bg, #fff)',
                fontWeight: 700,
                fontSize: '14px',
                minHeight: 44,
                padding: '0 18px',
                borderRadius: 12,
              }}
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : null}

      <p
        style={{
          position: 'absolute',
          bottom: 'max(24px, calc(24px + env(safe-area-inset-bottom, 0px)))',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--uber-text-muted, #767676)',
          letterSpacing: '0.04em',
          margin: 0,
        }}
      >
        {formatAppVersion()}
      </p>

      <style>{`
        @keyframes uber-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
