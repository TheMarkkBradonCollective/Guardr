#!/usr/bin/env node
/**
 * Write android/keystore.properties and the Play upload keystore for release AAB builds.
 * Used locally (secrets/guardr-upload.keystore) and in CI via ANDROID_UPLOAD_KEYSTORE_BASE64.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const keystoreDir = path.join(ROOT, 'secrets');
const keystorePath = path.join(keystoreDir, 'guardr-upload.keystore');
const propsPath = path.join(ROOT, 'android/keystore.properties');
const DEFAULT_ALIAS = 'guardr-upload';

function readExistingProps() {
  if (!existsSync(propsPath)) return null;
  const raw = readFileSync(propsPath, 'utf8');
  const props = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    props[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return props;
}

export function isReleaseKeystoreConfigured() {
  const props = readExistingProps();
  if (!props?.storeFile || !props.storePassword || !props.keyAlias || !props.keyPassword) {
    return false;
  }
  const storePath = path.resolve(path.join(ROOT, 'android'), props.storeFile);
  return existsSync(storePath);
}

export async function writeKeystoreFromEnv() {
  if (isReleaseKeystoreConfigured()) {
    console.log('Release keystore: using existing android/keystore.properties');
    return true;
  }

  const base64 = process.env.ANDROID_UPLOAD_KEYSTORE_BASE64?.trim();
  const storePassword = process.env.ANDROID_KEYSTORE_PASSWORD?.trim();
  const keyPassword = process.env.ANDROID_KEY_PASSWORD?.trim() || storePassword;
  const keyAlias = process.env.ANDROID_KEY_ALIAS?.trim() || DEFAULT_ALIAS;

  if (!base64 || !storePassword) {
    return false;
  }

  await mkdir(keystoreDir, { recursive: true });
  await writeFile(keystorePath, Buffer.from(base64, 'base64'));

  const props = [
    'storeFile=../secrets/guardr-upload.keystore',
    `storePassword=${storePassword}`,
    `keyAlias=${keyAlias}`,
    `keyPassword=${keyPassword}`,
    '',
  ].join('\n');
  await writeFile(propsPath, props);
  console.log('Release keystore: wrote secrets/guardr-upload.keystore and android/keystore.properties');
  return true;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const configured = await writeKeystoreFromEnv();
  if (!configured) {
    console.warn(
      'Play upload keystore is not configured — set ANDROID_UPLOAD_KEYSTORE_BASE64 and ANDROID_KEYSTORE_PASSWORD, or add android/keystore.properties.',
    );
    process.exit(0);
  }
}
