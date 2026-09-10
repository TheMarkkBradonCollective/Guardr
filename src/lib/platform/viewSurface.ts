import type { FormFactor } from './device';
import type { ShellKind } from './shellKind';

/** Combined shell × form-factor surface used for layout and CSS targeting. */
export type ViewSurface =
  | 'browser-desktop'
  | 'browser-tablet'
  | 'browser-mobile'
  | 'pwa-desktop'
  | 'pwa-tablet'
  | 'pwa-mobile'
  | 'native-desktop'
  | 'native-tablet'
  | 'native-mobile';

export function resolveViewSurface(shellKind: ShellKind, formFactor: FormFactor): ViewSurface {
  return `${shellKind}-${formFactor}` as ViewSurface;
}

/** True when the user is in an installed PWA or native Android shell. */
export function isInstalledAppSurface(surface: ViewSurface): boolean {
  return surface.startsWith('native-') || surface.startsWith('pwa-');
}

/** True when the surface should use tablet merge layouts (rail + touch). */
export function isTabletMergeSurface(surface: ViewSurface): boolean {
  return surface.endsWith('-tablet');
}

/** True when the surface should use advanced desktop chrome. Browser desktop only in practice. */
export function isAdvancedDesktopSurface(surface: ViewSurface): boolean {
  return surface === 'browser-desktop';
}

/**
 * Slide-up cards, bottom sheets, and swipe-to-confirm.
 * Keep on mobile/tablet browser and all APK — not the website desktop workbench.
 */
export function prefersMobileGestureUi(surface: ViewSurface): boolean {
  return !isAdvancedDesktopSurface(surface);
}

