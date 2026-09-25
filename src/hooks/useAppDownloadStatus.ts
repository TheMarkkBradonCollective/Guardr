import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { isPlayStoreBuild } from '../lib/platform/playStoreBuild';
import { APP_VERSION } from '../lib/appVersion';
import {
  compareVersions,
  fetchDownloadVersionManifest,
  type DownloadVersionManifest,
} from '../lib/downloadVersion';
import { getInstalledAppVersion } from '../lib/platform/apkUpdate';
import { readInstallState, type InstallState, writeInstallState } from '../lib/platform/installRegistry';
import { resolveDownloadLiveContext } from '../lib/resolveDownloadLiveContext';
import type { DownloadLiveContext } from '../lib/installSurfaceCopy';
import { userFacingError } from '../lib/userFacingError';

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
  refresh: () => Promise<void>;
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
      const live = resolveDownloadLiveContext();
      const [latest, nativeInfo] = await Promise.all([
        fetchDownloadVersionManifest(),
        getInstalledAppVersion(),
      ]);

      let state = readInstallState();

      if (nativeInfo?.version && live === 'apk') {
        state = {
          apk: {
            version: nativeInfo.version,
            versionCode: nativeInfo.versionCode,
            registeredAt: Date.now(),
          },
        };
        writeInstallState(state);
      }

      setManifest(latest);
      setInstallState(state);
      setInstalledApkVersion(
        live === 'apk' ? nativeInfo?.version ?? state.apk?.version ?? null : null
      );
      setInstalledApkVersionCode(
        live === 'apk' ? nativeInfo?.versionCode ?? state.apk?.versionCode : undefined
      );
    } catch (refreshError) {
      setError(userFacingError(refreshError, 'Could not check app version.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const liveContext = resolveDownloadLiveContext();
  const apkRecord = liveContext === 'apk' ? installState.apk : undefined;
  const effectiveApkVersion =
    liveContext === 'apk' ? installedApkVersion ?? apkRecord?.version ?? null : null;
  const apkNeedsUpdate =
    Boolean(manifest && effectiveApkVersion) &&
    compareVersions(effectiveApkVersion!, manifest!.apkVersion) < 0;

  return {
    loading,
    error,
    manifest,
    installState,
    installedApkVersion: effectiveApkVersion,
    installedApkVersionCode,
    liveContext,
    apkNeedsUpdate,
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
  return Capacitor.isNativePlatform() && !isPlayStoreBuild();
}
