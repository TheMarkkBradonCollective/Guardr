/**
 * LoadingScreen — Uber Base Web pattern.
 *
 * Uses Base Web Spinner as the loading indicator.
 * Clean black/white — matches Uber's app launch screen aesthetic.
 */

import React, { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { APP_VERSION } from '../lib/appVersion';
import { Logo } from './Logo';

export function LoadingScreen() {
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
        gap: '32px',
        zIndex: 9999,
      }}
    >
      {/* Logo */}
      <Logo size={64} className="guardr-loading-logo" />

      {/* Base Web-style spinner ring */}
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

      {/* Version */}
      <p
        aria-hidden
        style={{
          position: 'absolute',
          bottom: '24px',
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
        v{APP_VERSION}
      </p>

      <style>{`
        @keyframes uber-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
