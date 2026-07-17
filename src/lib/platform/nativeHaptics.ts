/**
 * Native haptic feedback for APK Premium experiences.
 * Safe no-ops on web / PWA / Full APK / unsupported devices.
 */

import { Capacitor } from '@capacitor/core';
import {
  experienceAllowsHaptics,
  resolveExperienceTier,
  type ExperienceTier,
} from './experienceTier';
import { getShellKind } from './shellKind';
import { resolveFormFactor, getViewportWidth } from './device';

export type HapticKind = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

function activeTier(override?: ExperienceTier): ExperienceTier {
  if (override) return override;
  const shell = getShellKind();
  const formFactor = resolveFormFactor(getViewportWidth());
  return resolveExperienceTier(shell, formFactor);
}

/**
 * Fire a short haptic pulse when the experience allows it (Premium APK).
 * Uses Vibration API when available — Capacitor Haptics plugin optional later.
 */
export async function triggerHaptic(
  kind: HapticKind = 'light',
  tier?: ExperienceTier,
): Promise<boolean> {
  const experience = activeTier(tier);
  if (!experienceAllowsHaptics(experience)) return false;
  if (!Capacitor.isNativePlatform()) return false;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false;

  const pattern: number | number[] =
    kind === 'light'
      ? 12
      : kind === 'medium'
        ? 24
        : kind === 'heavy'
          ? 40
          : kind === 'success'
            ? [16, 40, 16]
            : kind === 'warning'
              ? [24, 50, 24]
              : [40, 60, 40];

  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}

/** Convenience for clock-in / clock-out / payment confirmations. */
export function hapticConfirm(tier?: ExperienceTier): Promise<boolean> {
  return triggerHaptic('success', tier);
}

/** Convenience for primary field actions (accept job, start shift). */
export function hapticPress(tier?: ExperienceTier): Promise<boolean> {
  return triggerHaptic('medium', tier);
}
