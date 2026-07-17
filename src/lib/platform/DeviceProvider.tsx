import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { FormFactor, getViewportWidth, isNativeShell, isStandaloneDisplay, resolveFormFactor, BREAKPOINTS } from './device';
import { getShellKind, ShellKind } from './shellKind';
import { resolveViewSurface, ViewSurface } from './viewSurface';
import {
  experienceTierDataset,
  resolveExperienceTier,
  type ExperienceTier,
  type PwaExperience,
  type ApkExperience,
} from './experienceTier';

interface DeviceContextValue {
  formFactor: FormFactor;
  shellKind: ShellKind;
  viewSurface: ViewSurface;
  experienceTier: ExperienceTier;
  /** PWA full | lite — undefined on non-PWA shells */
  pwaMode?: PwaExperience;
  /** APK full | premium — undefined on non-native shells */
  apkMode?: ApkExperience;
  isStandalone: boolean;
  isNativeShell: boolean;
  viewportWidth: number;
}

const DeviceContext = createContext<DeviceContextValue>({
  formFactor: 'mobile',
  shellKind: 'browser',
  viewSurface: 'browser-mobile',
  experienceTier: { shell: 'browser', mode: 'standard' },
  isStandalone: false,
  isNativeShell: false,
  viewportWidth: BREAKPOINTS.md - 1,
});

function applyBodyDataset(value: DeviceContextValue): void {
  if (typeof document === 'undefined') return;

  document.body.dataset.formFactor = value.formFactor;
  document.body.dataset.shell = value.shellKind;
  document.body.dataset.viewSurface = value.viewSurface;
  document.body.dataset.standalone = value.isStandalone ? 'true' : 'false';

  const tierData = experienceTierDataset(value.experienceTier);
  document.body.dataset.experienceTier = tierData.experienceTier;

  if (tierData.pwaMode) {
    document.body.dataset.pwaMode = tierData.pwaMode;
  } else {
    delete document.body.dataset.pwaMode;
  }

  if (tierData.apkMode) {
    document.body.dataset.apkMode = tierData.apkMode;
  } else {
    delete document.body.dataset.apkMode;
  }

  document.body.classList.toggle('pwa-standalone', value.isStandalone || value.isNativeShell);
  document.body.classList.toggle('shell-browser', value.shellKind === 'browser');
  document.body.classList.toggle('shell-pwa', value.shellKind === 'pwa');
  document.body.classList.toggle('shell-native', value.shellKind === 'native');
  document.body.classList.toggle('experience-lite', value.pwaMode === 'lite');
  document.body.classList.toggle('experience-premium', value.apkMode === 'premium');
  document.body.classList.add('mobility-platform');
}

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [viewportWidth, setViewportWidth] = useState(getViewportWidth);
  const [isStandalone, setIsStandalone] = useState(isStandaloneDisplay);
  const [shellKind, setShellKind] = useState<ShellKind>(getShellKind);
  const [tierEpoch, setTierEpoch] = useState(0);

  useEffect(() => {
    const onResize = () => setViewportWidth(getViewportWidth());
    const standaloneMq = window.matchMedia('(display-mode: standalone)');

    const syncShell = () => {
      setIsStandalone(isStandaloneDisplay());
      setShellKind(getShellKind());
      setTierEpoch((n) => n + 1);
    };

    const connection = (navigator as Navigator & { connection?: EventTarget }).connection;
    const onConnectionChange = () => setTierEpoch((n) => n + 1);

    window.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    standaloneMq.addEventListener('change', syncShell);
    connection?.addEventListener?.('change', onConnectionChange);

    return () => {
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
      standaloneMq.removeEventListener('change', syncShell);
      connection?.removeEventListener?.('change', onConnectionChange);
    };
  }, []);

  const value = useMemo<DeviceContextValue>(() => {
    const formFactor = resolveFormFactor(viewportWidth);
    const kind = shellKind;
    const experienceTier = resolveExperienceTier(kind, formFactor);
    return {
      formFactor,
      shellKind: kind,
      viewSurface: resolveViewSurface(kind, formFactor),
      experienceTier,
      pwaMode: experienceTier.shell === 'pwa' ? experienceTier.mode : undefined,
      apkMode: experienceTier.shell === 'native' ? experienceTier.mode : undefined,
      isStandalone,
      isNativeShell: isNativeShell(),
      viewportWidth,
    };
  }, [viewportWidth, isStandalone, shellKind, tierEpoch]);

  // Apply layout attributes synchronously so the first paint uses the correct shell.
  applyBodyDataset(value);

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}

export function useDevice(): DeviceContextValue {
  return useContext(DeviceContext);
}
