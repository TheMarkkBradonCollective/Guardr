import { Capacitor } from '@capacitor/core';
import { isMessengerExperience } from './platform/appExperience';
import { isStandaloneDisplay } from './platform/displayMode';
import { bakedNativeProductApp, productAppFromPath, readStoredProductApp } from './productApps';

/**
 * One-role device binding is scoped per install surface so a Guard PWA and a
 * Customer website tab on the same machine do not share one localStorage slot
 * (same origin would otherwise treat them as "same device, two roles").
 * Email and phone identity checks are unchanged.
 */
export type OneRoleDeviceSurface =
  | 'website-tab'
  | 'pwa-client'
  | 'pwa-guard'
  | 'pwa-staff'
  | 'native-client'
  | 'native-guard'
  | 'native-staff'
  | 'messenger';

function pwaSurfaceFromPath(pathname: string): OneRoleDeviceSurface | null {
  const app = productAppFromPath(pathname);
  if (app === 'client') return 'pwa-client';
  if (app === 'guard') return 'pwa-guard';
  if (app === 'staff') return 'pwa-staff';
  return null;
}

export function resolveOneRoleDeviceSurface(
  pathname = typeof window !== 'undefined' ? window.location.pathname : '/',
): OneRoleDeviceSurface {
  if (isMessengerExperience()) return 'messenger';

  const baked = bakedNativeProductApp();
  if (baked === 'client') return 'native-client';
  if (baked === 'guard') return 'native-guard';
  if (baked === 'staff') return 'native-staff';

  try {
    if (Capacitor.isNativePlatform()) {
      const stored = readStoredProductApp();
      if (stored === 'client') return 'native-client';
      if (stored === 'guard') return 'native-guard';
      if (stored === 'staff') return 'native-staff';
      return pwaSurfaceFromPath(pathname) ?? 'native-guard';
    }
  } catch {
    /* ignore */
  }

  if (isStandaloneDisplay()) {
    const stored = readStoredProductApp();
    if (stored === 'client') return 'pwa-client';
    if (stored === 'guard') return 'pwa-guard';
    if (stored === 'staff') return 'pwa-staff';
    return pwaSurfaceFromPath(pathname) ?? 'pwa-guard';
  }

  return 'website-tab';
}
