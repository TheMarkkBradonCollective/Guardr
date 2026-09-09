import { Capacitor } from '@capacitor/core';

function bakedNativeProductApp(): string {
  if (typeof window === 'undefined') return '';
  const baked = window.__GUARDR_NATIVE_PRODUCT_APP__;
  return typeof baked === 'string' ? baked.trim() : '';
}

/**
 * True in a Hire / Work / Staff Android shell (Capacitor APK or AAB),
 * not the public website in a browser tab.
 *
 * Role APKs also bake `window.__GUARDR_NATIVE_PRODUCT_APP__`. That is the
 * Playwright hook for installed-app tests — not display-mode standalone.
 */
export function isAppExperience(): boolean {
  if (typeof window === 'undefined') return false;
  if (Capacitor.isNativePlatform()) return true;
  const baked = bakedNativeProductApp();
  return baked === 'client' || baked === 'guard' || baked === 'staff';
}
