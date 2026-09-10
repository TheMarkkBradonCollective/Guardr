/** Same-origin APK downloads on the Guardr website — not GitHub Releases. */

export const SITE_DOWNLOAD_DIR = '/download';

export const SITE_ALL_APKS_ZIP_FILE = 'Guardr-All-APKs.zip';
export const SITE_CLIENT_APK_FILE = 'Guardr-Client.apk';
export const SITE_GUARD_APK_FILE = 'Guardr-Guard.apk';
export const SITE_STAFF_APK_FILE = 'Guardr-Staff.apk';

export function siteDownloadUrl(file: string): string {
  return `${SITE_DOWNLOAD_DIR}/${file}`;
}

export const SITE_ALL_APKS_ZIP = siteDownloadUrl(SITE_ALL_APKS_ZIP_FILE);
export const SITE_CLIENT_APK = siteDownloadUrl(SITE_CLIENT_APK_FILE);
export const SITE_GUARD_APK = siteDownloadUrl(SITE_GUARD_APK_FILE);
export const SITE_STAFF_APK = siteDownloadUrl(SITE_STAFF_APK_FILE);

/** @deprecated Use SITE_ALL_APKS_ZIP — APKs download from the website, not GitHub. */
export const GITHUB_ALL_APKS_ZIP = SITE_ALL_APKS_ZIP;
/** @deprecated Use SITE_CLIENT_APK */
export const GITHUB_CLIENT_APK = SITE_CLIENT_APK;
/** @deprecated Use SITE_GUARD_APK */
export const GITHUB_GUARD_APK = SITE_GUARD_APK;
/** @deprecated Use SITE_STAFF_APK */
export const GITHUB_STAFF_APK = SITE_STAFF_APK;

export const SITE_ROLE_APKS = [
  {
    id: 'guard' as const,
    label: 'Guard',
    tagline: 'Shifts, check-in, and field work',
    file: SITE_GUARD_APK_FILE,
    url: SITE_GUARD_APK,
  },
  {
    id: 'client' as const,
    label: 'Customer',
    tagline: 'Coverage, activity, and reports',
    file: SITE_CLIENT_APK_FILE,
    url: SITE_CLIENT_APK,
  },
  {
    id: 'staff' as const,
    label: 'Staff',
    tagline: 'Operations, people, and administration',
    file: SITE_STAFF_APK_FILE,
    url: SITE_STAFF_APK,
  },
];

/** @deprecated Use SITE_ROLE_APKS */
export const GITHUB_ROLE_APKS = SITE_ROLE_APKS;
