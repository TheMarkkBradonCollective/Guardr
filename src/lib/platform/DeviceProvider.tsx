import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { FormFactor, getViewportWidth, isNativeShell, isStandaloneDisplay, resolveFormFactor, BREAKPOINTS } from './device';
import { getShellKind, ShellKind } from './shellKind';
import { resolveViewSurface, ViewSurface } from './viewSurface';

interface DeviceContextValue {
  formFactor: FormFactor;
  shellKind: ShellKind;
  viewSurface: ViewSurface;
  isStandalone: boolean;
  isNativeShell: boolean;
  viewportWidth: number;
}

const DeviceContext = createContext<DeviceContextValue>({
  formFactor: 'mobile',
  shellKind: 'browser',
  viewSurface: 'browser-mobile',
  isStandalone: false,
  isNativeShell: false,
  viewportWidth: BREAKPOINTS.md - 1,
});

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [viewportWidth, setViewportWidth] = useState(getViewportWidth);
  const [isStandalone, setIsStandalone] = useState(isStandaloneDisplay);
  const [shellKind, setShellKind] = useState<ShellKind>(getShellKind);

  useEffect(() => {
    const onResize = () => setViewportWidth(getViewportWidth());
    const standaloneMq = window.matchMedia('(display-mode: standalone)');

    const syncShell = () => {
      setIsStandalone(isStandaloneDisplay());
      setShellKind(getShellKind());
    };

    window.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    standaloneMq.addEventListener('change', syncShell);

    return () => {
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
      standaloneMq.removeEventListener('change', syncShell);
    };
  }, []);

  const value = useMemo<DeviceContextValue>(() => {
    const formFactor = resolveFormFactor(viewportWidth);
    const kind = shellKind;
    return {
      formFactor,
      shellKind: kind,
      viewSurface: resolveViewSurface(kind, formFactor),
      isStandalone,
      isNativeShell: isNativeShell(),
      viewportWidth,
    };
  }, [viewportWidth, isStandalone, shellKind]);

  // Apply layout attributes synchronously so the first paint uses the correct shell.
  if (typeof document !== 'undefined') {
    document.body.dataset.formFactor = value.formFactor;
    document.body.dataset.shell = value.shellKind;
    document.body.dataset.viewSurface = value.viewSurface;
    document.body.dataset.standalone = value.isStandalone ? 'true' : 'false';
    document.body.classList.toggle('pwa-standalone', value.isStandalone || value.isNativeShell);
    document.body.classList.toggle('shell-browser', value.shellKind === 'browser');
    document.body.classList.toggle('shell-pwa', value.shellKind === 'pwa');
    document.body.classList.toggle('shell-native', value.shellKind === 'native');
    document.body.classList.add('mobility-platform');
  }

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}

export function useDevice(): DeviceContextValue {
  return useContext(DeviceContext);
}
