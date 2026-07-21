import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { APP_VERSION } from '../lib/appVersion';
import {
  compareVersions,
  fetchDownloadVersionManifest,
  type DownloadVersionManifest,
} from '../lib/downloadVersion';
import { getInstalledAppVersion } from '../lib/platform/apkUpdate';
import { isAndroidWebView, readInstallState, type InstallState } from '../lib/platform/installRegistry';
import { isNativeShell, isStandaloneDisplay } from '../lib/platform/device';
import type { DownloadLiveContext } from '../lib/installSurfaceCopy';

export type { DownloadLiveContext };

export interface AppDownloadStatus {
  loading: boolean;
  error: string | null;
  manifest: DownloadVersionManifest | null;
  installState: InstallState;
  installedApkVersion: string | null;
  installedApkVersionCode: number | undefined;
  liveContext: DownloadLiveContext;
  apkNeedsUpdate: boolean;
  pwaActive: boolean;
  refresh: () => Promise<void>;
}

function resolveLiveContext(): DownloadLiveContext {
  if (isNativeShell() || isAndroidWebView()) {
    return 'apk';
  }
  if (isStandaloneDisplay()) {
    return 'pwa';
  }
  return 'browser';
}

export function useAppDownloadStatus(): AppDownloadStatus {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manifest, setManifest] = useState<DownloadVersionManifest | null>(null);
  const [installState, setInstallState] = useState<InstallState>(() => readInstallState());
  const [installedApkVersion, setInstalledApkVersion] = useState<string | null>(null);
  const [installedApkVersionCode, setInstalledApkVersionCode] = useState<number | undefined>();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [latest, nativeInfo] = await Promise.all([
        fetchDownloadVersionManifest(),
        getInstalledAppVersion(),
      ]);

      const state = readInstallState();
      if (nativeInfo?.version) {
        state.apk = {
          version: nativeInfo.version,
          versionCode: nativeInfo.versionCode,
          registeredAt: Date.now(),
        };
        delete state.pwa;
      }

      setManifest(latest);
      setInstallState(state);
      setInstalledApkVersion(nativeInfo?.version ?? state.apk?.version ?? null);
      setInstalledApkVersionCode(nativeInfo?.versionCode ?? state.apk?.versionCode);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Could not check app version.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const liveContext = resolveLiveContext();
  const apkRecord = installState.apk;
  const apkInstalled = Boolean(apkRecord?.version || installedApkVersion);
  const effectiveApkVersion = installedApkVersion ?? apkRecord?.version ?? null;
  const apkNeedsUpdate =
    Boolean(manifest && effectiveApkVersion) &&
    compareVersions(effectiveApkVersion!, manifest!.apkVersion) < 0;
  const pwaActive =
    !apkInstalled &&
    (liveContext === 'pwa' || Boolean(installState.pwa?.version || isStandaloneDisplay()));

  return {
    loading,
    error,
    manifest,
    installState,
    installedApkVersion: effectiveApkVersion,
    installedApkVersionCode,
    liveContext,
    apkNeedsUpdate,
    pwaActive,
    refresh,
  };
}

export function currentWebVersionLabel(manifest: DownloadVersionManifest | null): string {
  if (manifest?.webVersion) {
    return manifest.webVersion;
  }
  return APP_VERSION;
}

export function canInstallApkInApp(): boolean {
  return Capacitor.isNativePlatform();
}
