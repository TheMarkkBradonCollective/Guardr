import { Capacitor } from '@capacitor/core';
import { isStandaloneDisplay } from './device';

/** How the user opened Guardr — website tab, combined PWA, or a role APK. */
export type ShellKind = 'browser' | 'pwa' | 'native';

export function getShellKind(): ShellKind {
  if (typeof window === 'undefined') return 'browser';
  if (Capacitor.isNativePlatform()) return 'native';
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
