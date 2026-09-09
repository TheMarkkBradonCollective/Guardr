/**
 * Shared Client / Guard / Staff Android identity for build scripts.
 * Keep in sync with src/lib/productApps.ts.
 */
export const BASE_ANDROID_PACKAGE = 'com.signaturesecurity.guardr';

export const PRODUCT_ROLES = ['client', 'guard', 'staff'];

export const PRODUCT_APPS = {
  client: {
    role: 'client',
    label: 'Guardr Client',
    packageId: 'com.signaturesecurity.guardr.client',
    scheme: 'guardr-client',
    apkFile: 'guardr-client.apk',
    aabFile: 'guardr-client-play-release.aab',
  },
  guard: {
    role: 'guard',
    label: 'Guardr Guard',
    packageId: 'com.signaturesecurity.guardr.guard',
    scheme: 'guardr-guard',
    apkFile: 'guardr-guard.apk',
    aabFile: 'guardr-guard-play-release.aab',
  },
  staff: {
    role: 'staff',
    label: 'Guardr Staff',
    packageId: 'com.signaturesecurity.guardr.staff',
    scheme: 'guardr-staff',
    apkFile: 'guardr-staff.apk',
    aabFile: 'guardr-staff-play-release.aab',
  },
};

export const APPS_ZIP_FILE = 'guardr-apps.zip';
export const APPS_ZIP_DIRECT_URL = 'https://www.guardr.co/download/guardr-apps.zip';

export function capitalizeRole(role) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function parseRoleArg(argv = process.argv.slice(2)) {
  if (argv.includes('--all')) return null;
  const roleFlag = argv.find((arg) => arg.startsWith('--role='));
  if (roleFlag) {
    const role = roleFlag.slice('--role='.length);
    if (!PRODUCT_ROLES.includes(role)) {
      throw new Error(`Unknown --role=${role}. Use client, guard, or staff.`);
    }
    return role;
  }
  const envRole = process.env.GUARD_PRODUCT_APP;
  if (envRole && PRODUCT_ROLES.includes(envRole)) return envRole;
  return null;
}

export function gradleSideloadAssembleTask(role) {
  return `assembleSideload${capitalizeRole(role)}Release`;
}

export function gradlePlayBundleTask(role) {
  return `bundlePlay${capitalizeRole(role)}Release`;
}
