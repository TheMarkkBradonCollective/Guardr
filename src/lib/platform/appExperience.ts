import { Capacitor } from '@capacitor/core';

/**
 * True when the user is in the installed app shell (native APK or PWA),
 * not the public marketing website in a browser tab.
 */
export function isAppExperience(): boolean {
  if (typeof window === 'undefined') return false;
  if (Capacitor.isNativePlatform()) return true;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
