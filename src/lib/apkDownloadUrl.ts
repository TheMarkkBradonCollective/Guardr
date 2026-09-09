import { bakedProductApp, parseProductAppRole, type ProductApp } from './productApps';
import type { DownloadVersionManifest } from './downloadVersionTypes';

/** Prefer the matching role APK; fall back to the all-apps zip. */
export function resolveApkDownloadUrl(
  manifest: DownloadVersionManifest,
  app?: ProductApp | string | null,
): string {
  const role = parseProductAppRole(app) ?? bakedProductApp();
  const roleLinks = role ? manifest.apps?.[role] : undefined;
  return (
    roleLinks?.apkDirectUrl ||
    roleLinks?.apkUrl ||
    (role && manifest.apkApps?.[role]) ||
    manifest.zipDirectUrl ||
    manifest.zipUrl ||
    manifest.appsZipDirectUrl ||
    manifest.appsZipUrl ||
    manifest.apkDirectUrl ||
    manifest.apkUrl
  );
}
