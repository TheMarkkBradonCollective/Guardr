#!/usr/bin/env node
/**
 * Write android/app/google-services.json from GOOGLE_SERVICES_JSON when set.
 * Used by local builds and GitHub Actions so push-enabled APKs share one path.
 * CI: secret GOOGLE_SERVICES_JSON must target com.signaturesecurity.guardr.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const servicesPath = path.join(ROOT, 'android/app/google-services.json');
const EXPECTED_PACKAGE = 'com.signaturesecurity.guardr';

function validateGoogleServices(json) {
  const pkg = json.client?.[0]?.client_info?.android_client_info?.package_name;
  if (pkg !== EXPECTED_PACKAGE) {
    throw new Error(
      `google-services.json package_name must be ${EXPECTED_PACKAGE}, got ${pkg ?? 'undefined'}`,
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

export async function writeGoogleServicesFromEnv() {
  const raw = process.env.GOOGLE_SERVICES_JSON?.trim();
  if (!raw) {
    if (isGoogleServicesConfigured()) {
      console.log('Firebase config: using existing android/app/google-services.json');
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

  validateGoogleServices(json);
  await mkdir(path.dirname(servicesPath), { recursive: true });
  await writeFile(servicesPath, `${JSON.stringify(json, null, 2)}\n`);
  console.log(`Firebase config OK for ${EXPECTED_PACKAGE}`);
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
