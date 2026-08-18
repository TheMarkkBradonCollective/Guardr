/**
 * Surface kind — which of the three independent Guardr interfaces to load.
 *
 * Guardr ships three separately designed applications that share branding,
 * domain logic, and data but no layouts, navigation, or page structure:
 *
 *   mobile   — one-handed app UI (PWA + Android APK are the primary experience)
 *   tablet   — split-view touch UI built for larger touchscreens
 *   desktop  — pointer/keyboard operations center
 *
 * `resolveSurfaceKind` is the only place that decides which one renders. Nothing
 * downstream is allowed to scale one surface into another: each surface owns its
 * own shell, kit, page composition, and CSS layer.
 */

import { FORM_FACTOR_BOUNDS, type FormFactor } from '../lib/platform/device';
import type { ShellKind } from '../lib/platform/shellKind';

export type SurfaceKind = 'mobile' | 'tablet' | 'desktop';

export const SURFACE_KINDS: readonly SurfaceKind[] = ['mobile', 'tablet', 'desktop'];

/**
 * Surface boundaries — same floors as `FORM_FACTOR_BOUNDS`.
 *
 * Tailwind `md`/`lg` in `device.ts` stay at 768/1024 for utility CSS. These
 * numbers choose which of the three applications loads: 744px so large phones
 * in landscape keep the one-handed UI, 1180px so a 13" laptop is not a
 * squeezed desktop operations centre.
 */
export const SURFACE_BOUNDS = FORM_FACTOR_BOUNDS;

const OVERRIDE_KEY = 'guardr_surface_override';
const OVERRIDE_PARAM = 'ui';

export interface SurfaceResolutionInput {
  /** Viewport width in CSS pixels. */
  viewportWidth: number;
  /** browser | pwa | native — installed shells never get the desktop UI. */
  shellKind: ShellKind;
  /** Form factor from `DeviceProvider`, used as the fallback signal. */
  formFactor?: FormFactor;
  /** True when the primary input is touch (no fine pointer). */
  touch?: boolean;
  /** Explicit override from query string, storage, or settings. */
  override?: SurfaceKind | null;
}

export function isSurfaceKind(value: unknown): value is SurfaceKind {
  return value === 'mobile' || value === 'tablet' || value === 'desktop';
}

/**
 * Picks the application to load.
 *
 * Rules, in order:
 *  1. An explicit override always wins (used by `?ui=`, settings, and E2E).
 *  2. Installed shells (PWA / APK) never load the desktop operations center —
 *     a 13" Android tablet is still a touch device, so it gets the tablet app.
 *  3. Otherwise width decides, with a coarse-pointer guard so touchscreen
 *     laptops below the desktop floor stay on the tablet app.
 */
export function resolveSurfaceKind(input: SurfaceResolutionInput): SurfaceKind {
  if (input.override && isSurfaceKind(input.override)) return input.override;

  const width = Number.isFinite(input.viewportWidth) ? input.viewportWidth : 0;
  const installed = input.shellKind === 'pwa' || input.shellKind === 'native';

  if (width < SURFACE_BOUNDS.tabletMin) return 'mobile';
  if (width < SURFACE_BOUNDS.desktopMin) return 'tablet';

  // Installed app shells are touch-first by definition. Loading the pointer-only
  // operations center inside an APK would ship hover states nobody can reach.
  if (installed) return 'tablet';

  // A wide browser window on a touch-only device (kiosk, Surface in tablet mode)
  // still needs touch targets and sheets rather than hover menus.
  if (input.touch === true) return 'tablet';

  return 'desktop';
}

/** Reads a one-off override from the URL, e.g. `?ui=desktop`. */
export function readSurfaceOverrideFromQuery(search: string): SurfaceKind | null {
  if (!search) return null;
  try {
    const value = new URLSearchParams(search).get(OVERRIDE_PARAM);
    return isSurfaceKind(value) ? value : null;
  } catch {
    return null;
  }
}

/** Reads the persisted override written by `setSurfaceOverride`. */
export function readStoredSurfaceOverride(): SurfaceKind | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(OVERRIDE_KEY);
    return isSurfaceKind(value) ? value : null;
  } catch {
    return null;
  }
}

/** Persists an override, or clears it when passed `null`. */
export function setSurfaceOverride(surface: SurfaceKind | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (surface == null) window.localStorage.removeItem(OVERRIDE_KEY);
    else window.localStorage.setItem(OVERRIDE_KEY, surface);
  } catch {
    /* private mode / quota — fall back to automatic detection */
  }
}

/** Current override from either source, query string taking precedence. */
export function currentSurfaceOverride(): SurfaceKind | null {
  if (typeof window === 'undefined') return null;
  return readSurfaceOverrideFromQuery(window.location.search) ?? readStoredSurfaceOverride();
}

/** True when the pointer is coarse (touch) rather than a mouse or trackpad. */
export function detectCoarsePointer(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(pointer: fine)').matches;
  } catch {
    return false;
  }
}

/** Body/root attributes so each CSS layer can scope itself to its own surface. */
export function surfaceDataset(surface: SurfaceKind, overridden: boolean): Record<string, string> {
  return {
    surface,
    surfaceMode: overridden ? 'forced' : 'auto',
  };
}

/** Human label for settings and debug affordances. */
export function surfaceLabel(surface: SurfaceKind): string {
  if (surface === 'mobile') return 'Mobile app';
  if (surface === 'tablet') return 'Tablet app';
  return 'Desktop operations';
}
