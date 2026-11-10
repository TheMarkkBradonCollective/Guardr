import { APP_VERSION } from './appVersion';
import type { DownloadVersionManifest } from './downloadVersionTypes';
import { R2_APK_LATEST_URL } from './githubApkRelease';

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
    apkUrl: R2_APK_LATEST_URL,
    apkDirectUrl: R2_APK_LATEST_URL,
    appsZipUrl: R2_APK_LATEST_URL,
    appsZipDirectUrl: R2_APK_LATEST_URL,
  };
}
