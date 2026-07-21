import { APP_VERSION } from './appVersion';
import { apiUrl } from './siteConfig';

export interface DownloadVersionManifest {
  webVersion: string;
  apkVersion: string;
  apkVersionCode: number;
  apkUrl: string;
  apkDirectUrl?: string;
  updatedAt?: string;
}

export function parseVersionParts(version: string): number[] {
  return String(version || '0')
    .split('.')
    .map((part) => {
      const value = Number.parseInt(part, 10);
      return Number.isFinite(value) ? value : 0;
    });
}

/** Negative if a < b, positive if a > b, zero if equal. */
export function compareVersions(a: string, b: string): number {
  const left = parseVersionParts(a);
  const right = parseVersionParts(b);
  for (let index = 0; index < 3; index += 1) {
    const diff = (left[index] ?? 0) - (right[index] ?? 0);
    if (diff !== 0) {
      return diff < 0 ? -1 : 1;
    }
  }
  return 0;
}

export function isVersionOlder(installed: string, latest: string): boolean {
  return compareVersions(installed, latest) < 0;
}

export async function fetchDownloadVersionManifest(): Promise<DownloadVersionManifest> {
  const response = await fetch(apiUrl('/download/version.json'), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Could not load the latest app version.');
  }
  return (await response.json()) as DownloadVersionManifest;
}

export function resolveInstalledWebVersion(manifest?: DownloadVersionManifest | null): string {
  return manifest?.webVersion ?? APP_VERSION;
}
