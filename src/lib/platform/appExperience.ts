import { Capacitor } from '@capacitor/core';

function bakedNativeProductApp(): string {
  if (typeof window === 'undefined') return '';
  const baked = window.__GUARDR_NATIVE_PRODUCT_APP__;
  return typeof baked === 'string' ? baked.trim() : '';
}

/** Messenger APK — launcher only, not a Guard / Customer / Staff shell. */
export function isMessengerExperience(): boolean {
  return bakedNativeProductApp() === 'messenger';
}

/**
 * True in a Guard / Customer / Staff Android shell (Capacitor APK or AAB),
 * not the public website in a browser tab.
 *
 * Role APKs also bake `window.__GUARDR_NATIVE_PRODUCT_APP__`. That is the
 * Playwright hook for installed-app tests — not display-mode standalone.
 * Messenger is a companion launcher, not an operational app.
 */
export function isAppExperience(): boolean {
  if (typeof window === 'undefined') return false;
  if (isMessengerExperience()) return false;
  if (Capacitor.isNativePlatform()) return true;
  const baked = bakedNativeProductApp();
  return baked === 'client' || baked === 'guard' || baked === 'staff';
}
