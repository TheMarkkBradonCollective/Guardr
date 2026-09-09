import { Capacitor } from '@capacitor/core';
import { isAppExperience } from './appExperience';

/**
 * How the user opened Guardr — website tab or native Android app.
 * `pwa` remains on the type for older unit tests; live detection never returns it.
 */
export type ShellKind = 'browser' | 'pwa' | 'native';

export function getShellKind(): ShellKind {
  if (typeof window === 'undefined') return 'browser';
  if (Capacitor.isNativePlatform() || isAppExperience()) return 'native';
  return 'browser';
}

export function isBrowserShell(): boolean {
  return getShellKind() === 'browser';
}

export function isPwaShell(): boolean {
  return false;
}

export function isNativeShellKind(): boolean {
  return getShellKind() === 'native';
}
