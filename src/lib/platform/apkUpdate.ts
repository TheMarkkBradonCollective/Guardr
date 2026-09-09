import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import {
  compareVersions,
  fetchDownloadVersionManifest,
  resolveApkDownloadUrl,
  type DownloadVersionManifest,
} from '../downloadVersion';
import { resolveDownloadLiveContext } from '../resolveDownloadLiveContext';
import { GuardrApkInstaller } from './guardrApkInstaller';

export interface InstalledAppVersion {
  version: string;
  versionCode?: number;
}

export interface AppUpdateStatus {
  manifest: DownloadVersionManifest;
  installed: InstalledAppVersion | null;
  updateAvailable: boolean;
  shell: 'native' | 'pwa' | 'browser';
}

export async function getInstalledAppVersion(): Promise<InstalledAppVersion | null> {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  try {
    const info = await App.getInfo();
    const versionCode = Number.parseInt(info.build, 10);
    return {
      version: info.version,
      versionCode: Number.isFinite(versionCode) ? versionCode : undefined,
    };
  } catch {
    return null;
  }
}

export async function fetchAppUpdateStatus(): Promise<AppUpdateStatus> {
  const manifest = await fetchDownloadVersionManifest();
  const installed = await getInstalledAppVersion();
  const live = resolveDownloadLiveContext();
  const shell = live === 'apk' ? 'native' : live;

  return {
    manifest,
    installed,
    updateAvailable: installed ? compareVersions(installed.version, manifest.apkVersion) < 0 : false,
    shell,
  };
}

export async function installLatestApk(manifest?: DownloadVersionManifest): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('APK install is only available in the Guardr Android app.');
  }

  const latest = manifest ?? (await fetchDownloadVersionManifest());
  const url = resolveApkDownloadUrl(latest);
  if (!url) {
    throw new Error('No APK download URL is configured.');
  }

  const absoluteUrl = url.startsWith('http')
    ? url
    : `${window.location.origin}${url.startsWith('/') ? url : `/${url}`}`;

  await GuardrApkInstaller.downloadAndInstall({ url: absoluteUrl });
}
