import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { FormFactor, getViewportWidth, isNativeShell, isStandaloneDisplay, resolveFormFactor } from './device';

interface DeviceContextValue {
  formFactor: FormFactor;
  isStandalone: boolean;
  isNativeShell: boolean;
  viewportWidth: number;
}

const DeviceContext = createContext<DeviceContextValue>({
  formFactor: 'desktop',
  isStandalone: false,
  isNativeShell: false,
  viewportWidth: 1024,
});

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [viewportWidth, setViewportWidth] = useState(getViewportWidth);
  const [isStandalone, setIsStandalone] = useState(isStandaloneDisplay);

  useEffect(() => {
    const onResize = () => setViewportWidth(getViewportWidth());
    const standaloneMq = window.matchMedia('(display-mode: standalone)');

    window.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    standaloneMq.addEventListener('change', () => setIsStandalone(isStandaloneDisplay()));

    return () => {
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
      standaloneMq.removeEventListener('change', () => setIsStandalone(isStandaloneDisplay()));
    };
  }, []);

  const value = useMemo<DeviceContextValue>(
    () => ({
      formFactor: resolveFormFactor(viewportWidth),
      isStandalone,
      isNativeShell: isNativeShell(),
      viewportWidth,
    }),
    [viewportWidth, isStandalone]
  );

  // Apply layout attributes synchronously so the first paint uses the correct shell.
  if (typeof document !== 'undefined') {
    document.body.dataset.formFactor = value.formFactor;
    document.body.dataset.standalone = value.isStandalone ? 'true' : 'false';
    document.body.classList.toggle('pwa-standalone', value.isStandalone || value.isNativeShell);
  }

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}

export function useDevice(): DeviceContextValue {
  return useContext(DeviceContext);
}
