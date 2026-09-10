import { Capacitor } from '@capacitor/core';
import { isStandaloneDisplay } from './displayMode';

function bakedNativeProductApp(): string {
  if (typeof window === 'undefined') return '';
  const baked = window.__GUARDR_NATIVE_PRODUCT_APP__;
  return typeof baked === 'string' ? baked.trim() : '';
}

function isBakedNativeShell(): boolean {
  const baked = bakedNativeProductApp();
  return baked === 'client' || baked === 'guard' || baked === 'staff' || baked === 'messenger';
}

/**
 * How the user opened Guardr — website tab, installed PWA, or native Android app.
 */
export type ShellKind = 'browser' | 'pwa' | 'native';

export function getShellKind(): ShellKind {
  if (typeof window === 'undefined') return 'browser';
  try {
    if (Capacitor.isNativePlatform()) return 'native';
  } catch {
    /* Capacitor unavailable in some test runners */
  }
  if (isBakedNativeShell()) return 'native';
  if (isStandaloneDisplay()) return 'pwa';
  return 'browser';
}

export function isBrowserShell(): boolean {
  return getShellKind() === 'browser';
}

export function isPwaShell(): boolean {
  return getShellKind() === 'pwa';
}

export function isNativeShellKind(): boolean {
  return getShellKind() === 'native';
}
