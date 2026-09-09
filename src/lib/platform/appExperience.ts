import { Capacitor } from '@capacitor/core';

function bakedNativeProductApp(): string {
  if (typeof window === 'undefined') return '';
  const baked = window.__GUARDR_NATIVE_PRODUCT_APP__;
  return typeof baked === 'string' ? baked.trim() : '';
}

function isStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Guard / Customer / Staff Android APK or AAB (baked role). */
export function isNativeRoleApp(): boolean {
  if (typeof window === 'undefined') return false;
  if (Capacitor.isNativePlatform()) return true;
  const baked = bakedNativeProductApp();
  return baked === 'client' || baked === 'guard' || baked === 'staff';
}

/**
 * Combined home-screen app: Guard, Customer, and Staff in one install.
 * Same login picker as the website. Not a role APK.
 */
export function isCombinedPwaExperience(): boolean {
  if (typeof window === 'undefined') return false;
  if (isNativeRoleApp()) return false;
  return isStandaloneDisplayMode();
}

/**
 * True in an installed app shell — role APK or the combined PWA —
 * not the public website in a browser tab.
 */
export function isAppExperience(): boolean {
  return isNativeRoleApp() || isCombinedPwaExperience();
}
