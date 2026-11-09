import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { nativeChromeForProductApp } from './branded-icon.mjs';
import { ROOT, run } from './build-android-common.mjs';
import {
  INSTALLED_CUSTOMER_BETA_VERSION_CODE,
  androidVersionCode,
} from './android-version-code.mjs';

export const ANDROID_ROLES = [
  { id: 'client', apk: 'Guardr-Client.apk', aab: 'Guardr-Client.aab', sideload: 'guardr-client.apk' },
  { id: 'guard', apk: 'Guardr-Guard.apk', aab: 'Guardr-Guard.aab', sideload: 'guardr-guard.apk' },
  { id: 'staff', apk: 'Guardr-Staff.apk', aab: 'Guardr-Staff.aab', sideload: 'guardr-staff.apk' },
];

/** Messenger APK — sign in, then messages and support for that account. */
export const ANDROID_COMPANIONS = [
  { id: 'messenger', apk: 'Guardr-Messenger.apk', aab: 'Guardr-Messenger.aab', sideload: 'guardr-messenger.apk' },
];

const SERVICES_PATH = path.join(ROOT, 'android/app/google-services.json');
const ASSETS_PUBLIC = path.join(ROOT, 'android/app/src/main/assets/public');
const CAPACITOR_CONFIG_PATH = path.join(ROOT, 'android/app/src/main/assets/capacitor.config.json');

export function rolePackage(role) {
  return `com.tmbcworks.guardr.${role}`;
}

/** Same versionCode for Customer, Guard, Staff, Messenger, and the combined APK. */
export function androidGradleVersionArgs() {
  const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const code = androidVersionCode(pkg.version);
  if (code <= INSTALLED_CUSTOMER_BETA_VERSION_CODE) {
    throw new Error(
      `Refusing versionCode ${code}. Installed Guardr customer beta 1.0.131 is versionCode ${INSTALLED_CUSTOMER_BETA_VERSION_CODE}; Android will not install a lower code as an update.`,
    );
  }
  console.log(
    `Android versionCode ${code} (versionName ${pkg.version}) for client, guard, staff, and messenger`,
  );
  return [`-PguardrVersionCode=${code}`];
}

export async function writeNativeProductAppJs(role) {
  await mkdir(ASSETS_PUBLIC, { recursive: true });
  const dest = path.join(ASSETS_PUBLIC, 'native-product-app.js');
  const value = role || '';
  await writeFile(dest, `window.__GUARDR_NATIVE_PRODUCT_APP__='${value}';\n`);
}

export async function patchGoogleServicesPackage(packageName) {
  if (!existsSync(SERVICES_PATH)) return null;
  const original = await readFile(SERVICES_PATH, 'utf8');
  const json = JSON.parse(original);
  for (const client of json.client ?? []) {
    if (client.client_info?.android_client_info) {
      client.client_info.android_client_info.package_name = packageName;
    }
  }
  await writeFile(SERVICES_PATH, `${JSON.stringify(json, null, 2)}\n`);
  return original;
}

export async function restoreGoogleServices(original) {
  if (original == null) return;
  await writeFile(SERVICES_PATH, original);
}

export async function patchCapacitorChrome(productApp) {
  if (!existsSync(CAPACITOR_CONFIG_PATH)) return null;
  const original = await readFile(CAPACITOR_CONFIG_PATH, 'utf8');
  const json = JSON.parse(original);
  const chrome = nativeChromeForProductApp(productApp);
  json.plugins = json.plugins ?? {};
  json.plugins.SplashScreen = {
    ...(json.plugins.SplashScreen ?? {}),
    backgroundColor: chrome.backgroundColor,
  };
  json.plugins.StatusBar = {
    ...(json.plugins.StatusBar ?? {}),
    style: chrome.statusBarStyle,
    backgroundColor: chrome.backgroundColor,
  };
  await writeFile(CAPACITOR_CONFIG_PATH, `${JSON.stringify(json, null, '\t')}\n`);
  return original;
}

export async function restoreCapacitorChrome(original) {
  if (original == null) return;
  await writeFile(CAPACITOR_CONFIG_PATH, original);
}

export function generateAndroidIcons(productApp) {
  const args = ['scripts/generate-android-icons.mjs'];
  if (productApp) args.push(`--productApp=${productApp}`);
  run('node', args);
}

/** Bake role icons, splash chrome, and Firebase package for one assemble, then restore. */
export async function withRoleBuildPatches(role, fn) {
  await writeNativeProductAppJs(role);
  generateAndroidIcons(role);
  const originalServices = await patchGoogleServicesPackage(rolePackage(role));
  const originalCap = await patchCapacitorChrome(role);
  try {
    await fn();
  } finally {
    await restoreGoogleServices(originalServices);
    await restoreCapacitorChrome(originalCap);
  }
}
