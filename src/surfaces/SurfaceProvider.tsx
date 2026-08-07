import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useDevice } from '../lib/platform';
import {
  currentSurfaceOverride,
  detectCoarsePointer,
  isSurfaceKind,
  resolveSurfaceKind,
  setSurfaceOverride as persistSurfaceOverride,
  surfaceDataset,
  type SurfaceKind,
} from './surfaceKind';
import { surfaceCssVars, surfaceDesign, type SurfaceDesignScale } from './surfaceDesign';

interface SurfaceContextValue {
  /** Which of the three independent applications is mounted. */
  surface: SurfaceKind;
  /** The surface's own design scale — never read another surface's scale. */
  design: SurfaceDesignScale;
  /** True when a `?ui=` or stored override is forcing the surface. */
  forced: boolean;
  /** Forces a surface, or clears the override with `null`. */
  setSurface: (surface: SurfaceKind | null) => void;
}

const FALLBACK: SurfaceContextValue = {
  surface: 'mobile',
  design: surfaceDesign('mobile'),
  forced: false,
  setSurface: () => {},
};

const SurfaceContext = createContext<SurfaceContextValue>(FALLBACK);

function applySurfaceToDocument(surface: SurfaceKind, forced: boolean): void {
  if (typeof document === 'undefined') return;

  const dataset = surfaceDataset(surface, forced);
  for (const [key, value] of Object.entries(dataset)) {
    document.documentElement.dataset[key] = value;
    document.body.dataset[key] = value;
  }

  // The three CSS layers are scoped to these classes, so exactly one can ever match.
  document.body.classList.toggle('sf-mobile', surface === 'mobile');
  document.body.classList.toggle('sf-tablet', surface === 'tablet');
  document.body.classList.toggle('sf-desktop', surface === 'desktop');

  // Classic mobile drawer CSS keys off data-view-surface. Keep that attribute in
  // lockstep with the surface router (including ?ui= overrides on a wider viewport)
  // so the restored phone chrome still gets its styles.
  const existing = document.body.dataset.viewSurface;
  if (existing) {
    const shell = existing.split('-')[0] || 'browser';
    const synced = `${shell}-${surface}`;
    document.body.dataset.viewSurface = synced;
    document.documentElement.dataset.viewSurface = synced;
  }

  const style = document.documentElement.style;
  for (const [prop, value] of Object.entries(surfaceCssVars(surface))) {
    style.setProperty(prop, value);
  }
}

/**
 * Resolves which of the three applications to load and publishes it to the tree.
 *
 * Mount this inside `DeviceProvider` — it reads viewport and shell signals from
 * there and turns them into a single surface decision. Everything below reads
 * `useSurface()` rather than re-deriving layout from viewport width.
 */
export function SurfaceProvider({
  children,
  /** Test/preview hook: pins the surface without touching storage. */
  forceSurface,
}: {
  children: React.ReactNode;
  forceSurface?: SurfaceKind;
}) {
  const { viewportWidth, shellKind } = useDevice();
  const [override, setOverrideState] = useState<SurfaceKind | null>(() =>
    forceSurface ?? currentSurfaceOverride(),
  );
  const [touch, setTouch] = useState(detectCoarsePointer);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(pointer: coarse)');
    const sync = () => setTouch(detectCoarsePointer());
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (forceSurface) setOverrideState(forceSurface);
  }, [forceSurface]);

  const surface = useMemo(
    () => resolveSurfaceKind({ viewportWidth, shellKind, touch, override }),
    [viewportWidth, shellKind, touch, override],
  );

  const setSurface = useCallback((next: SurfaceKind | null) => {
    if (next != null && !isSurfaceKind(next)) return;
    persistSurfaceOverride(next);
    setOverrideState(next);
  }, []);

  const forced = override != null;

  // Applied during render so the first paint already has the right layer and
  // variables — a layout effect would flash the previous surface's chrome.
  applySurfaceToDocument(surface, forced);

  const value = useMemo<SurfaceContextValue>(
    () => ({ surface, design: surfaceDesign(surface), forced, setSurface }),
    [surface, forced, setSurface],
  );

  return <SurfaceContext.Provider value={value}>{children}</SurfaceContext.Provider>;
}

export function useSurface(): SurfaceContextValue {
  return useContext(SurfaceContext);
}

/** Convenience read for components that only branch on the surface id. */
export function useSurfaceKind(): SurfaceKind {
  return useContext(SurfaceContext).surface;
}

/** The active surface's design scale. */
export function useSurfaceDesign(): SurfaceDesignScale {
  return useContext(SurfaceContext).design;
}

export function OnMobile({ children }: { children: React.ReactNode }) {
  return useSurfaceKind() === 'mobile' ? <>{children}</> : null;
}

export function OnTablet({ children }: { children: React.ReactNode }) {
  return useSurfaceKind() === 'tablet' ? <>{children}</> : null;
}

export function OnDesktop({ children }: { children: React.ReactNode }) {
  return useSurfaceKind() === 'desktop' ? <>{children}</> : null;
}

/**
 * Renders exactly one branch per surface.
 *
 * Prefer this over inline ternaries: it makes the three implementations sit side
 * by side in the source, so nobody accidentally reuses one surface's structure.
 */
export function SurfaceSwitch({
  mobile,
  tablet,
  desktop,
}: {
  mobile: React.ReactNode;
  tablet: React.ReactNode;
  desktop: React.ReactNode;
}) {
  const surface = useSurfaceKind();
  if (surface === 'mobile') return <>{mobile}</>;
  if (surface === 'tablet') return <>{tablet}</>;
  return <>{desktop}</>;
}
