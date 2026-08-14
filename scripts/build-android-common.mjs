#!/usr/bin/env node
/**
 * Shared steps for Guardr Android sideload APK and Play Store AAB builds.
 */
import { unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { isGoogleServicesConfigured, writeGoogleServicesFromEnv } from './write-google-services.mjs';

export const ROOT = process.cwd();
export const ANDROID_HOME = process.env.ANDROID_HOME || path.join(process.env.HOME || '', 'Android', 'Sdk');
export const GRADLE = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
export const EXPECTED_ANDROID_PACKAGE = 'com.signaturesecurity.guardr';

export function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    env: { ...process.env, ANDROID_HOME, ...options.env },
    cwd: options.cwd ?? ROOT,
    shell: false,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

export async function prepareAndroidWebBuild({
  playStoreBuild = false,
  runParityAudit = true,
  removePublicApk = true,
} = {}) {
  console.log('→ Writing Firebase google-services.json (if configured)…');
  await writeGoogleServicesFromEnv();

  console.log('→ Generating download version manifest…');
  run('npm', ['run', 'generate:download-version']);

  if (runParityAudit) {
    console.log('→ Auditing APK / site parity…');
    run('node', ['scripts/audit-apk-parity.mjs']);
  }

  if (!isGoogleServicesConfigured()) {
    if (process.env.ALLOW_APK_WITHOUT_FCM === '1') {
      console.warn(
        '\n⚠ ALLOW_APK_WITHOUT_FCM=1 — building without Firebase; native push toggle will be disabled.',
      );
    } else {
      console.error(
        '\n✗ android/app/google-services.json is missing or invalid — refusing to ship without Firebase.',
      );
      console.error(
        '  Set GOOGLE_SERVICES_JSON, place secrets/google-services.json, or add android/app/google-services.json.',
      );
      console.error(`  Package must be ${EXPECTED_ANDROID_PACKAGE}. Set ALLOW_APK_WITHOUT_FCM=1 to override.\n`);
      process.exit(1);
    }
  }

  const nativeFcmConfigured = isGoogleServicesConfigured();

  console.log('→ Generating Android launcher icons…');
  run('npm', ['run', 'generate:android-icons']);

  const publicApk = path.join(ROOT, 'public/download/guardr.apk');
  if (removePublicApk && existsSync(publicApk)) {
    console.log('→ Removing public/download/guardr.apk so the sideload binary is not embedded in the next build…');
    await unlink(publicApk);
  }

  console.log(`→ Building web bundle for Android${playStoreBuild ? ' (Play Store)' : ''}…`);
  run('npm', ['run', 'build'], {
    env: {
      VITE_APP_URL: process.env.VITE_APP_URL || 'https://www.guardr.co',
      VITE_NATIVE_FCM_CONFIGURED: nativeFcmConfigured ? 'true' : 'false',
      VITE_PLAY_STORE_BUILD: playStoreBuild ? 'true' : 'false',
    },
  });

  console.log('→ Syncing Capacitor Android project…');
  run('npx', ['cap', 'sync', 'android']);

  return { nativeFcmConfigured };
}
