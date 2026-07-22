import { useEffect } from 'react';
import { isNativeShell } from './platform/device';
import {
  readAppRouteFromWindow,
  readAuthChoiceFromWindow,
  syncAppRoute,
  syncAuthChoiceRoute,
} from './appNavigation';
import { attachCapacitorBackButtonListener } from './systemBackButton';

/**
 * Bootstrap system-back support for PWA, APK, and website shells.
 * - Seeds history state on native shells so refresh + back share route snapshots.
 * - Attaches Capacitor hardware back on Android APK.
 */
export function useSystemBackButtonBootstrap(enabled: boolean): void {
  useEffect(() => {
    if (!isNativeShell()) return;

    const authChoice = readAuthChoiceFromWindow();
    if (authChoice) {
      syncAuthChoiceRoute(authChoice, true);
      return;
    }

    const route = readAppRouteFromWindow();
    if (!route) return;

    syncAppRoute(route, true);
  }, [enabled]);

  useEffect(() => {
    return attachCapacitorBackButtonListener();
  }, []);
}
