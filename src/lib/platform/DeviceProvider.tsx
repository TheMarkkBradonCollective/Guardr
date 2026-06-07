import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { FormFactor, getViewportWidth, isNativeShell, isStandaloneDisplay, resolveFormFactor } from './device';

interface DeviceContextValue {
  formFactor: FormFactor;
  isStandalone: boolean;
  isNativeShell: boolean;
  isOnline: boolean;
  viewportWidth: number;
}

const DeviceContext = createContext<DeviceContextValue>({
  formFactor: 'desktop',
  isStandalone: false,
  isNativeShell: false,
  isOnline: true,
  viewportWidth: 1024,
});

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [viewportWidth, setViewportWidth] = useState(getViewportWidth);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isStandalone, setIsStandalone] = useState(isStandaloneDisplay);

  useEffect(() => {
    const onResize = () => setViewportWidth(getViewportWidth());
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    const standaloneMq = window.matchMedia('(display-mode: standalone)');

    window.addEventListener('resize', onResize);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    standaloneMq.addEventListener('change', () => setIsStandalone(isStandaloneDisplay()));

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      standaloneMq.removeEventListener('change', () => setIsStandalone(isStandaloneDisplay()));
    };
  }, []);

  const value = useMemo<DeviceContextValue>(
    () => ({
      formFactor: resolveFormFactor(viewportWidth),
      isStandalone,
      isNativeShell: isNativeShell(),
      isOnline,
      viewportWidth,
    }),
    [viewportWidth, isStandalone, isOnline]
  );

  useEffect(() => {
    document.body.dataset.formFactor = value.formFactor;
    document.body.dataset.standalone = value.isStandalone ? 'true' : 'false';
    document.body.dataset.online = value.isOnline ? 'true' : 'false';
    document.body.classList.toggle('pwa-standalone', value.isStandalone || value.isNativeShell);
  }, [value.formFactor, value.isStandalone, value.isNativeShell, value.isOnline]);

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}

export function useDevice(): DeviceContextValue {
  return useContext(DeviceContext);
}
