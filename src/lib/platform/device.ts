/** Breakpoints aligned with Tailwind defaults */
export const BREAKPOINTS = {
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type FormFactor = 'mobile' | 'tablet' | 'desktop';

export function getViewportWidth(): number {
  if (typeof window === 'undefined') return BREAKPOINTS.lg;
  const layoutWidth = window.innerWidth;
  const visualWidth = window.visualViewport?.width;
  if (visualWidth && visualWidth > 0) {
    // Native WebViews can report an inflated layout width; prefer the visual viewport.
    return Math.min(layoutWidth, visualWidth);
  }
  return layoutWidth;
}

export function resolveFormFactor(width = getViewportWidth()): FormFactor {
  if (width < BREAKPOINTS.md) return 'mobile';
  if (width < BREAKPOINTS.lg) return 'tablet';
  return 'desktop';
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

/** True when running as installed PWA or future Capacitor shell */
export function isNativeShell(): boolean {
  if (typeof window === 'undefined') return false;
  return isStandaloneDisplay() || !!(window as Window & { Capacitor?: unknown }).Capacitor;
}
