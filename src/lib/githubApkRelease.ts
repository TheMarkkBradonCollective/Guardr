/** GitHub Release assets for sideload APKs — same pattern as MBC All-APKs. */

export const GITHUB_APK_RELEASE_REPO = 'TheMarkkBradonCollective/Guardr';

export const GITHUB_APK_RELEASE_LATEST =
  `https://github.com/${GITHUB_APK_RELEASE_REPO}/releases/latest`;

const ASSET = (name: string) =>
  `https://github.com/${GITHUB_APK_RELEASE_REPO}/releases/latest/download/${name}`;

export const GITHUB_ALL_APKS_ZIP = ASSET('Guardr-All-APKs.zip');
export const GITHUB_CLIENT_APK = ASSET('Guardr-Client.apk');
export const GITHUB_GUARD_APK = ASSET('Guardr-Guard.apk');
export const GITHUB_STAFF_APK = ASSET('Guardr-Staff.apk');

export const GITHUB_ROLE_APKS = [
  {
    id: 'guard' as const,
    label: 'Guard',
    tagline: 'Shifts, check-in, and field work',
    file: 'Guardr-Guard.apk',
    url: GITHUB_GUARD_APK,
  },
  {
    id: 'client' as const,
    label: 'Customer',
    tagline: 'Coverage, activity, and reports',
    file: 'Guardr-Client.apk',
    url: GITHUB_CLIENT_APK,
  },
  {
    id: 'staff' as const,
    label: 'Staff',
    tagline: 'Optional Android app — the same operations run in the browser',
    file: 'Guardr-Staff.apk',
    url: GITHUB_STAFF_APK,
  },
];
