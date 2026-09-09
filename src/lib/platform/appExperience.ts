import { Capacitor } from '@capacitor/core';

function hasBakedProductApp(): boolean {
  const env = typeof import.meta !== 'undefined' ? import.meta.env : undefined;
  const baked = env?.VITE_PRODUCT_APP;
  if (baked === 'client' || baked === 'guard' || baked === 'staff') return true;
  if (typeof window === 'undefined') return false;
  const fromWindow = window.__GUARDR_NATIVE_PRODUCT_APP__;
  return fromWindow === 'client' || fromWindow === 'guard' || fromWindow === 'staff';
}

/**
 * True when the user is in the installed app shell (native APK or PWA),
 * not the public marketing website in a browser tab.
 *
 * Role APKs bake `VITE_PRODUCT_APP`, so that bundle is always an app
 * experience even before Capacitor reports a native platform.
 */
export function isAppExperience(): boolean {
  if (typeof window === 'undefined') return false;
  if (hasBakedProductApp()) return true;
  if (Capacitor.isNativePlatform()) return true;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
