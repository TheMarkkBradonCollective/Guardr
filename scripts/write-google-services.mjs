#!/usr/bin/env node
/**
 * Write android/app/google-services.json from GOOGLE_SERVICES_JSON when set.
 * Used by local builds and GitHub Actions so push-enabled APKs share one path.
 *
 * Role APKs use applicationIdSuffix (.client / .guard / .staff). The Google
 * Services plugin requires a matching client entry per package. If the secret
 * only contains com.signaturesecurity.guardr, this script clones that client
 * so Gradle can assemble; FCM still needs real Firebase Android apps for each
 * package — see docs/ANDROID-APK.md.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE_ANDROID_PACKAGE, PRODUCT_APPS, PRODUCT_ROLES } from './product-apps.mjs';

const ROOT = process.cwd();
const servicesPath = path.join(ROOT, 'android/app/google-services.json');
const secretsPath = path.join(ROOT, 'secrets/google-services.json');
const EXPECTED_PACKAGES = [BASE_ANDROID_PACKAGE, ...PRODUCT_ROLES.map((role) => PRODUCT_APPS[role].packageId)];

function clientPackageName(client) {
  return client?.client_info?.android_client_info?.package_name;
}

function listClientPackages(json) {
  return (json.client ?? []).map(clientPackageName).filter(Boolean);
}

export function expandGoogleServicesClients(json) {
  const clients = Array.isArray(json.client) ? [...json.client] : [];
  const existing = new Set(listClientPackages({ client: clients }));
  const template =
    clients.find((client) => clientPackageName(client) === BASE_ANDROID_PACKAGE) ?? clients[0];
  const cloned = [];

  if (!template) {
    return { json, cloned };
  }

  for (const role of PRODUCT_ROLES) {
    const packageId = PRODUCT_APPS[role].packageId;
    if (existing.has(packageId)) continue;
    const clone = JSON.parse(JSON.stringify(template));
    if (!clone.client_info) clone.client_info = {};
    if (!clone.client_info.android_client_info) clone.client_info.android_client_info = {};
    clone.client_info.android_client_info.package_name = packageId;
    clients.push(clone);
    cloned.push(packageId);
  }

  return { json: { ...json, client: clients }, cloned };
}

export function validateGoogleServices(json) {
  const packages = listClientPackages(json);
  if (!packages.some((pkg) => EXPECTED_PACKAGES.includes(pkg))) {
    throw new Error(
      `google-services.json has no Guardr Android client (expected ${EXPECTED_PACKAGES.join(', ')}); got ${packages.join(', ') || 'none'}`,
    );
  }
}

export function isGoogleServicesConfigured() {
  if (!existsSync(servicesPath)) return false;
  try {
    const json = JSON.parse(readFileSync(servicesPath, 'utf8'));
    validateGoogleServices(json);
    return true;
  } catch {
    return false;
  }
}

function warnAboutClonedPackages(cloned) {
  if (cloned.length === 0) return;
  console.warn(
    `⚠ google-services.json was missing ${cloned.join(', ')}. Cloned the existing client so Gradle can assemble.`,
  );
  console.warn(
    '  FCM will not work for those packages until you add Android apps in Firebase Console and replace GOOGLE_SERVICES_JSON.',
  );
  console.warn('  See docs/ANDROID-APK.md (Firebase for the three role APKs).');
}

async function writeExpanded(json) {
  validateGoogleServices(json);
  const { json: expanded, cloned } = expandGoogleServicesClients(json);
  await mkdir(path.dirname(servicesPath), { recursive: true });
  await writeFile(servicesPath, `${JSON.stringify(expanded, null, 2)}\n`);
  warnAboutClonedPackages(cloned);
  const packages = listClientPackages(expanded);
  console.log(`Firebase config OK for ${packages.join(', ')}`);
  return true;
}

export async function writeGoogleServicesFromEnv() {
  const raw = process.env.GOOGLE_SERVICES_JSON?.trim();
  if (!raw) {
    if (existsSync(secretsPath)) {
      const secretsRaw = readFileSync(secretsPath, 'utf8');
      let json;
      try {
        json = JSON.parse(secretsRaw);
      } catch (error) {
        throw new Error(`secrets/google-services.json is not valid JSON: ${error.message}`);
      }
      await writeExpanded(json);
      console.log('Firebase config: copied secrets/google-services.json → android/app/');
      return true;
    }
    if (existsSync(servicesPath)) {
      const json = JSON.parse(readFileSync(servicesPath, 'utf8'));
      await writeExpanded(json);
      return true;
    }
    return false;
  }

  let json;
  try {
    json = JSON.parse(raw);
  } catch (error) {
    throw new Error(`GOOGLE_SERVICES_JSON is not valid JSON: ${error.message}`);
  }

  await writeExpanded(json);
  return true;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const configured = await writeGoogleServicesFromEnv();
  if (!configured) {
    console.warn(
      'GOOGLE_SERVICES_JSON is not set and android/app/google-services.json is missing — native push will be disabled.',
    );
    process.exit(0);
  }
}
