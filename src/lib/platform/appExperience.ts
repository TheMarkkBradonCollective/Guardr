import { Capacitor } from '@capacitor/core';
import { isStandaloneDisplay } from './displayMode';

function bakedNativeProductApp(): string {
  if (typeof window === 'undefined') return '';
  const baked = window.__GUARDR_NATIVE_PRODUCT_APP__;
  return typeof baked === 'string' ? baked.trim() : '';
}

/** Messenger APK — sign in, then run the messaging companion. */
export function isMessengerExperience(): boolean {
  return bakedNativeProductApp() === 'messenger';
}

/**
 * True in a Guard / Customer / Staff / Messenger Android shell (Capacitor APK
 * or AAB), a Playwright baked-app hook, or an installed PWA.
 *
 * Role APKs also bake `window.__GUARDR_NATIVE_PRODUCT_APP__`. That is the
 * Playwright hook for installed-app tests — not display-mode standalone.
 * Messenger is a companion messaging shell (not a full role-app picker).
 *
 * Installed PWAs are operational shells — the same data and routes as the APK,
 * delivered as a lightweight home-screen app.
 */
export function isAppExperience(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (Capacitor.isNativePlatform()) return true;
  } catch {
    /* ignore */
  }
  const baked = bakedNativeProductApp();
  if (baked === 'client' || baked === 'guard' || baked === 'staff' || baked === 'messenger') {
    return true;
  }
  return isStandaloneDisplay();
}
