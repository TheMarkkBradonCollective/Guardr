/**
 * Platform experience tiers — purpose-built UX per shell, not scaled layouts.
 *
 * Website: standard (form-factor layouts only)
 * PWA:     full | lite  (lite = battery/bandwidth-friendly)
 * APK:     full | premium (premium = richest native polish)
 *
 * Spec: docs/guardedesign.md §8–9 · docs/CROSS_PLATFORM.md · .cursor/commands/uberitplatforms.md
 */

import type { FormFactor } from './device';
import type { ShellKind } from './shellKind';

export type WebsiteExperience = 'standard';
export type PwaExperience = 'full' | 'lite';
export type ApkExperience = 'full' | 'premium';

export type ExperienceTier =
  | { shell: 'browser'; mode: WebsiteExperience }
  | { shell: 'pwa'; mode: PwaExperience }
  | { shell: 'native'; mode: ApkExperience };

export type ExperienceMode = WebsiteExperience | PwaExperience | ApkExperience;

const PWA_MODE_KEY = 'guardr_pwa_mode';
const APK_MODE_KEY = 'guardr_apk_mode';

type ConnectionLike = {
  saveData?: boolean;
  effectiveType?: string;
};

function readStoredMode(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readQueryOverride(param: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return new URLSearchParams(window.location.search).get(param);
  } catch {
    return null;
  }
}

function getConnection(): ConnectionLike | null {
  if (typeof navigator === 'undefined') return null;
  const nav = navigator as Navigator & { connection?: ConnectionLike; mozConnection?: ConnectionLike };
  return nav.connection ?? nav.mozConnection ?? null;
}

/** True when the device/network suggests a lightweight PWA experience. */
export function shouldPreferPwaLite(): boolean {
  if (typeof navigator === 'undefined') return false;

  const connection = getConnection();
  if (connection?.saveData) return true;
  if (connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') return true;

  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof memory === 'number' && memory > 0 && memory <= 2) return true;

  return false;
}

function readEnvOverride(key: 'VITE_PWA_EXPERIENCE' | 'VITE_APK_EXPERIENCE'): string | undefined {
  try {
    const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
    return env?.[key]?.toLowerCase();
  } catch {
    return undefined;
  }
}

export function resolvePwaExperience(): PwaExperience {
  const query = readQueryOverride('pwa');
  if (query === 'lite' || query === 'full') return query;

  const stored = readStoredMode(PWA_MODE_KEY);
  if (stored === 'lite' || stored === 'full') return stored;

  const env = readEnvOverride('VITE_PWA_EXPERIENCE');
  if (env === 'lite' || env === 'full') return env;

  return shouldPreferPwaLite() ? 'lite' : 'full';
}

export function resolveApkExperience(formFactor: FormFactor = 'mobile'): ApkExperience {
  const query = readQueryOverride('apk');
  if (query === 'premium' || query === 'full') return query;

  const stored = readStoredMode(APK_MODE_KEY);
  if (stored === 'premium' || stored === 'full') return stored;

  const env = readEnvOverride('VITE_APK_EXPERIENCE');
  if (env === 'premium' || env === 'full') return env;

  // Tablets get the premium shell by default; phones stay field-ready full.
  return formFactor === 'tablet' || formFactor === 'desktop' ? 'premium' : 'full';
}

export function resolveExperienceTier(
  shellKind: ShellKind,
  formFactor: FormFactor = 'mobile',
): ExperienceTier {
  if (shellKind === 'pwa') {
    return { shell: 'pwa', mode: resolvePwaExperience() };
  }
  if (shellKind === 'native') {
    return { shell: 'native', mode: resolveApkExperience(formFactor) };
  }
  return { shell: 'browser', mode: 'standard' };
}

/** Body dataset values for CSS targeting. */
export function experienceTierDataset(tier: ExperienceTier): {
  experienceTier: string;
  pwaMode?: string;
  apkMode?: string;
} {
  if (tier.shell === 'pwa') {
    return {
      experienceTier: `pwa-${tier.mode}`,
      pwaMode: tier.mode,
    };
  }
  if (tier.shell === 'native') {
    return {
      experienceTier: `apk-${tier.mode}`,
      apkMode: tier.mode,
    };
  }
  return { experienceTier: 'website' };
}

export function isLiteExperience(tier: ExperienceTier): boolean {
  return tier.shell === 'pwa' && tier.mode === 'lite';
}

export function isPremiumExperience(tier: ExperienceTier): boolean {
  return tier.shell === 'native' && tier.mode === 'premium';
}

/** Persist an explicit PWA mode override (settings / debug). */
export function setPwaExperiencePreference(mode: PwaExperience | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (mode == null) window.localStorage.removeItem(PWA_MODE_KEY);
    else window.localStorage.setItem(PWA_MODE_KEY, mode);
  } catch {
    /* ignore quota / private mode */
  }
}

/** Persist an explicit APK mode override (settings / debug). */
export function setApkExperiencePreference(mode: ApkExperience | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (mode == null) window.localStorage.removeItem(APK_MODE_KEY);
    else window.localStorage.setItem(APK_MODE_KEY, mode);
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Motion multiplier for the active experience.
 * Lite shortens; premium allows slightly richer springs.
 */
export function experienceMotionScale(tier: ExperienceTier): number {
  if (isLiteExperience(tier)) return 0.55;
  if (isPremiumExperience(tier)) return 1.12;
  return 1;
}

/** Whether decorative hero art / heavy visuals should render. */
export function experienceAllowsDecorativeArt(tier: ExperienceTier): boolean {
  return !isLiteExperience(tier);
}

/** Whether glass blur chrome is allowed (PWA Full yes, Lite no). */
export function experienceAllowsGlassChrome(tier: ExperienceTier): boolean {
  if (tier.shell === 'pwa') return tier.mode === 'full';
  return false;
}

/** Whether native haptics should fire (all APK shells — phones are the primary field device). */
export function experienceAllowsHaptics(tier: ExperienceTier): boolean {
  return tier.shell === 'native';
}
