#!/usr/bin/env node
/**
 * Write android/app/google-services.json from GOOGLE_SERVICES_JSON when set.
 * Used by local builds and GitHub Actions so push-enabled APKs share one path.
 * CI: secret GOOGLE_SERVICES_JSON must target com.tmbcworks.guardr.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const servicesPath = path.join(ROOT, 'android/app/google-services.json');
const secretsPath = path.join(ROOT, 'secrets/google-services.json');
const bundledPath = path.join(ROOT, 'firebase/guardr-tmbc/google-services.json');
const EXPECTED_PACKAGE = 'com.tmbcworks.guardr';

function hasGuardrAndroidClient(json) {
  return (json.client ?? []).some(
    (entry) =>
      entry.client_info?.android_client_info?.package_name === EXPECTED_PACKAGE,
  );
}

function validateGoogleServices(json) {
  if (!hasGuardrAndroidClient(json)) {
    throw new Error(
      `google-services.json must include an Android client for ${EXPECTED_PACKAGE}`,
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
    if (existsSync(secretsPath)) {
      const secretsRaw = readFileSync(secretsPath, 'utf8');
      let json;
      try {
        json = JSON.parse(secretsRaw);
      } catch (error) {
        throw new Error(`secrets/google-services.json is not valid JSON: ${error.message}`);
      }
      validateGoogleServices(json);
      await mkdir(path.dirname(servicesPath), { recursive: true });
      await writeFile(servicesPath, `${JSON.stringify(json, null, 2)}\n`);
      console.log(`Firebase config: copied secrets/google-services.json → android/app/`);
      return true;
    }
    if (existsSync(bundledPath)) {
      const bundledRaw = readFileSync(bundledPath, 'utf8');
      let json;
      try {
        json = JSON.parse(bundledRaw);
      } catch (error) {
        throw new Error(`firebase/guardr-tmbc/google-services.json is not valid JSON: ${error.message}`);
      }
      validateGoogleServices(json);
      await mkdir(path.dirname(servicesPath), { recursive: true });
      await writeFile(servicesPath, `${JSON.stringify(json, null, 2)}\n`);
      console.log('Firebase config: copied firebase/guardr-tmbc/google-services.json → android/app/');
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

  if (!hasGuardrAndroidClient(json)) {
    // A stale repository secret can override the valid, versioned project config.
    // Prefer the bundled Guardr Firebase config when the secret belongs to a
    // different Android package; never rewrite another Firebase app's identity.
    if (existsSync(bundledPath)) {
      const bundledRaw = readFileSync(bundledPath, 'utf8');
      let bundledJson;
      try {
        bundledJson = JSON.parse(bundledRaw);
      } catch (error) {
        throw new Error(`firebase/guardr-tmbc/google-services.json is not valid JSON: ${error.message}`);
      }
      validateGoogleServices(bundledJson);
      await mkdir(path.dirname(servicesPath), { recursive: true });
      await writeFile(servicesPath, `${JSON.stringify(bundledJson, null, 2)}\\n`);
      console.warn(
        `GOOGLE_SERVICES_JSON does not contain ${EXPECTED_PACKAGE}; using the bundled Guardr Firebase project config instead.`,
      );
      return true;
    }
    validateGoogleServices(json);
  }

  await mkdir(path.dirname(servicesPath), { recursive: true });
  await writeFile(servicesPath, `${JSON.stringify(json, null, 2)}\\n`);
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
