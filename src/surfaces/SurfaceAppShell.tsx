import React, { Suspense, lazy, useEffect } from 'react';
import { useSurface } from './SurfaceProvider';
import type { SurfaceKind } from './surfaceKind';
import type { SurfaceShellProps } from './surfaceShellTypes';
import { MobileSkeletonScreen } from './mobile/kit/MobileSkeleton';
import { TabletSkeletonScreen } from './tablet/kit/TabletSkeleton';
import { DesktopSkeletonScreen } from './desktop/kit/DesktopSkeleton';

/**
 * Loads one of three independent applications.
 *
 * Each surface is a separate lazy chunk, so a phone never downloads the desktop
 * data table, command palette, or drag-and-drop board, and the desktop never
 * downloads the sheet gesture code. `preloadSurface` is called from `main.tsx`
 * before the first render so the correct chunk is already in flight and the
 * skeleton below is rarely seen.
 */

const MobileShell = lazy(() =>
  import('./mobile/MobileAppShell').then((module) => ({ default: module.MobileAppShell })),
);
const TabletShell = lazy(() =>
  import('./tablet/TabletAppShell').then((module) => ({ default: module.TabletAppShell })),
);
const DesktopShell = lazy(() =>
  import('./desktop/DesktopAppShell').then((module) => ({ default: module.DesktopAppShell })),
);

const LOADERS: Record<SurfaceKind, () => Promise<unknown>> = {
  mobile: () => import('./mobile/MobileAppShell'),
  tablet: () => import('./tablet/TabletAppShell'),
  desktop: () => import('./desktop/DesktopAppShell'),
};

/** Starts fetching a surface's chunk. Safe to call repeatedly. */
export function preloadSurface(surface: SurfaceKind): void {
  void LOADERS[surface]().catch(() => {
    /* the Suspense boundary will retry on render */
  });
}

function SurfaceFallback({ surface }: { surface: SurfaceKind }) {
  if (surface === 'mobile') return <MobileSkeletonScreen />;
  if (surface === 'tablet') return <TabletSkeletonScreen />;
  return <DesktopSkeletonScreen />;
}

export function SurfaceAppShell(props: SurfaceShellProps) {
  const { surface } = useSurface();

  // Warm the neighbouring surface once idle: crossing a breakpoint by resizing or
  // rotating then swaps instantly instead of showing a skeleton.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const neighbours: SurfaceKind[] =
      surface === 'mobile' ? ['tablet'] : surface === 'tablet' ? ['mobile', 'desktop'] : ['tablet'];
    const idle = window.setTimeout(() => neighbours.forEach(preloadSurface), 2500);
    return () => window.clearTimeout(idle);
  }, [surface]);

  return (
    <Suspense fallback={<SurfaceFallback surface={surface} />}>
      {surface === 'mobile' ? (
        <MobileShell {...props} />
      ) : surface === 'tablet' ? (
        <TabletShell {...props} />
      ) : (
        <DesktopShell {...props} />
      )}
    </Suspense>
  );
}
