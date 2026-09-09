import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT, run } from './build-android-common.mjs';

export const ANDROID_ROLES = [
  { id: 'client', apk: 'Guardr-Client.apk', aab: 'Guardr-Client.aab', sideload: 'guardr-client.apk' },
  { id: 'guard', apk: 'Guardr-Guard.apk', aab: 'Guardr-Guard.aab', sideload: 'guardr-guard.apk' },
  { id: 'staff', apk: 'Guardr-Staff.apk', aab: 'Guardr-Staff.aab', sideload: 'guardr-staff.apk' },
];

const SERVICES_PATH = path.join(ROOT, 'android/app/google-services.json');
const ASSETS_PUBLIC = path.join(ROOT, 'android/app/src/main/assets/public');

export function rolePackage(role) {
  return `com.signaturesecurity.guardr.${role}`;
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

export function generateAndroidIcons(productApp) {
  const args = ['scripts/generate-android-icons.mjs'];
  if (productApp) args.push(`--productApp=${productApp}`);
  run('node', args);
}
