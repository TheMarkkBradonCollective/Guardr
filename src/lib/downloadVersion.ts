import { Capacitor } from '@capacitor/core';
import { APP_VERSION } from './appVersion';
import { bundledDownloadVersionManifest } from './bundledDownloadManifest';
import { apiUrl } from './siteConfig';

export type { DownloadVersionManifest } from './downloadVersionTypes';
export { parseVersionParts, compareVersions, isVersionOlder } from './versionCompare';

import type { DownloadVersionManifest } from './downloadVersionTypes';

export async function fetchDownloadVersionManifest(): Promise<DownloadVersionManifest> {
  const bundled = bundledDownloadVersionManifest();

  if (Capacitor.isNativePlatform()) {
    try {
      const response = await fetch(apiUrl('/download/version.json'), { cache: 'no-store' });
      if (response.ok) {
        const remote = (await response.json()) as DownloadVersionManifest;
        return { ...bundled, ...remote };
      }
    } catch {
      /* Site optional for native — use GitHub + package version. */
    }
    return bundled;
  }

  const response = await fetch(apiUrl('/download/version.json'), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Could not load the latest app version.');
  }
  return (await response.json()) as DownloadVersionManifest;
}

export function resolveInstalledWebVersion(manifest?: DownloadVersionManifest | null): string {
  return manifest?.webVersion ?? APP_VERSION;
}
