import { useEffect } from 'react';
import { isNativeShell } from './platform/device';
import { readAppRouteFromWindow } from './appNavigation';

/**
 * In installed PWA / native shells, seed a history entry so the first system-back
 * triggers popstate instead of closing the app when the user has not navigated yet.
 */
export function useNativeBackButtonBootstrap(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !isNativeShell()) return;
    if (window.history.state?.appRoute) return;

    const route = readAppRouteFromWindow();
    if (!route) return;

    window.history.replaceState({ appRoute: route }, '', window.location.pathname + window.location.search);
    window.history.pushState({ appRoute: route }, '', window.location.pathname + window.location.search);
  }, [enabled]);
}
