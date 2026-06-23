import { useEffect } from 'react';
import { isNativeShell } from './platform/device';
import { readAppRouteFromWindow, syncAppRoute } from './appNavigation';

/**
 * In installed PWA / native shells, ensure the current history entry carries
 * appRoute state so refresh and system-back use the same route snapshot.
 */
export function useNativeBackButtonBootstrap(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !isNativeShell()) return;

    const route = readAppRouteFromWindow();
    if (!route) return;

    syncAppRoute(route, true);
  }, [enabled]);
}
