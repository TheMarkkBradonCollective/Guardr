/** Public R2 host for sideload APKs (Cloudflare beta track). */

export const R2_APK_PUBLIC_BASE = 'https://pub-07d688bf950545ddba9025a723c0798e.r2.dev';

/** Combined latest APK. Per-role files and the zip are not published in this bucket. */
export const R2_APK_LATEST_URL = `${R2_APK_PUBLIC_BASE}/guardr/latest.apk`;

export const GITHUB_APK_RELEASE_REPO = 'TheMarkkBradonCollective/Guardr';

/** Kept for compatibility; downloads now come from R2, not GitHub Releases. */
export const GITHUB_APK_RELEASE_TAG = 'v1.1.0-cf-beta';

export const GITHUB_APK_RELEASE_LATEST = R2_APK_LATEST_URL;

export const GITHUB_ALL_APKS_ZIP = R2_APK_LATEST_URL;
export const GITHUB_CLIENT_APK = R2_APK_LATEST_URL;
export const GITHUB_GUARD_APK = R2_APK_LATEST_URL;
export const GITHUB_STAFF_APK = R2_APK_LATEST_URL;
export const GITHUB_MESSENGER_APK = R2_APK_LATEST_URL;

export const GITHUB_ROLE_APKS = [
  {
    id: 'guard' as const,
    label: 'Guard',
    tagline: 'Shifts, check-in, and field work',
    file: 'latest.apk',
    url: GITHUB_GUARD_APK,
  },
  {
    id: 'client' as const,
    label: 'Customer',
    tagline: 'Coverage, activity, and reports',
    file: 'latest.apk',
    url: GITHUB_CLIENT_APK,
  },
  {
    id: 'staff' as const,
    label: 'Staff',
    tagline: 'Operations, people, and administration',
    file: 'latest.apk',
    url: GITHUB_STAFF_APK,
  },
];

export const GITHUB_MESSENGER_APP = {
  id: 'messenger' as const,
  label: 'Messenger',
  tagline: 'Messages, support, and team chat',
  file: 'latest.apk',
  url: GITHUB_MESSENGER_APK,
};
