import { APP_VERSION } from './appVersion';
import type { DownloadVersionManifest } from './downloadVersionTypes';
import { GITHUB_ALL_APKS_ZIP, GITHUB_GUARD_APK } from './githubApkRelease';

/** Version metadata baked into the APK — no guardr.co fetch required for day-to-day use. */
export function bundledDownloadVersionManifest(): DownloadVersionManifest {
  const versionCode = Number.parseInt(
    (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_APP_VERSION_CODE ?? '',
    10
  );

  return {
    webVersion: APP_VERSION,
    apkVersion: APP_VERSION,
    apkVersionCode: Number.isFinite(versionCode) ? versionCode : 0,
    apkUrl: GITHUB_GUARD_APK,
    apkDirectUrl: GITHUB_GUARD_APK,
    appsZipUrl: GITHUB_ALL_APKS_ZIP,
    appsZipDirectUrl: GITHUB_ALL_APKS_ZIP,
  };
}
