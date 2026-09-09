/** Breakpoints aligned with Tailwind defaults — CSS utilities only. */
export const BREAKPOINTS = {
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

/**
 * Form-factor floors for `body[data-form-factor]`.
 *
 * These match `SURFACE_BOUNDS` so a laptop between Tailwind `lg` (1024) and the
 * desktop operations centre (1180) is a tablet — not a scaled-down desktop.
 * Tailwind `lg:` utilities stay at 1024px; they must not choose which app loads.
 */
export const FORM_FACTOR_BOUNDS = {
  tabletMin: 744,
  desktopMin: 1180,
} as const;

export type FormFactor = 'mobile' | 'tablet' | 'desktop';

export function getViewportWidth(): number {
  if (typeof window === 'undefined') return FORM_FACTOR_BOUNDS.desktopMin;
  const layoutWidth = window.innerWidth;
  const visualWidth = window.visualViewport?.width;
  if (visualWidth && visualWidth > 0) {
    // Native WebViews can report an inflated layout width; prefer the visual viewport.
    return Math.min(layoutWidth, visualWidth);
  }
  return layoutWidth;
}

export function resolveFormFactor(width = getViewportWidth()): FormFactor {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    if (window.matchMedia(`(min-width: ${FORM_FACTOR_BOUNDS.desktopMin}px)`).matches) return 'desktop';
    if (window.matchMedia(`(min-width: ${FORM_FACTOR_BOUNDS.tabletMin}px)`).matches) return 'tablet';
    return 'mobile';
  }
  if (width < FORM_FACTOR_BOUNDS.tabletMin) return 'mobile';
  if (width < FORM_FACTOR_BOUNDS.desktopMin) return 'tablet';
  return 'desktop';
}

/** Tablet + desktop — denser content, split panels, persistent sidebar. */
export function isWideFormFactor(formFactor: FormFactor): boolean {
  return formFactor === 'tablet' || formFactor === 'desktop';
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
}

export function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android/.test(navigator.userAgent.toLowerCase());
}

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

import { isAppExperience } from './appExperience';

/** True when running as the combined PWA or a Capacitor role APK. */
export function isNativeShell(): boolean {
  return isAppExperience();
}

/** Installed app shell — home-screen PWA or native APK. */
export function isInstalledApp(): boolean {
  return isAppExperience();
}
