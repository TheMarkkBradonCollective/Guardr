#!/usr/bin/env node
/**
 * Shared steps for Guardr Android sideload APK and Play Store AAB builds.
 */
import { unlink } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { isGoogleServicesConfigured, writeGoogleServicesFromEnv } from './write-google-services.mjs';
import { APPS_ZIP_FILE, PRODUCT_APPS, PRODUCT_ROLES } from './product-apps.mjs';

export const ROOT = process.cwd();
export const ANDROID_HOME = process.env.ANDROID_HOME || path.join(process.env.HOME || '', 'Android', 'Sdk');
export const GRADLE = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
export const EXPECTED_ANDROID_PACKAGE = 'com.signaturesecurity.guardr';
export const PUBLIC_DOWNLOAD_DIR = path.join(ROOT, 'public/download');

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

export function publicDownloadApkPaths() {
  return [
    path.join(PUBLIC_DOWNLOAD_DIR, 'guardr.apk'),
    ...PRODUCT_ROLES.map((role) => path.join(PUBLIC_DOWNLOAD_DIR, PRODUCT_APPS[role].apkFile)),
    path.join(PUBLIC_DOWNLOAD_DIR, APPS_ZIP_FILE),
  ];
}

export async function removePublicDownloadBinaries() {
  for (const filePath of publicDownloadApkPaths()) {
    if (existsSync(filePath)) {
      console.log(`→ Removing ${path.relative(ROOT, filePath)} so binaries are not embedded in the next web bundle…`);
      await unlink(filePath);
    }
  }
}

function walkFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, acc);
    else acc.push(full);
  }
  return acc;
}

export function findGradleOutput(kind, role, distribution) {
  const ext = kind === 'aab' ? '.aab' : '.apk';
  const rootDir =
    kind === 'aab'
      ? path.join(ROOT, 'android/app/build/outputs/bundle')
      : path.join(ROOT, 'android/app/build/outputs/apk');
  const needle = `${distribution}-${role}-release${ext}`;
  const matches = walkFiles(rootDir).filter(
    (file) => file.endsWith(ext) && !file.includes('unsigned') && file.includes(needle),
  );
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    const exact = matches.find((file) => path.basename(file) === `app-${needle}`);
    if (exact) return exact;
  }
  return matches[0] ?? null;
}

export async function prepareAndroidWebBuild({
  playStoreBuild = false,
  runParityAudit = true,
  removePublicApk = true,
  productApp = null,
  skipPrereqs = false,
} = {}) {
  if (!skipPrereqs) {
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
        console.error(
          `  Package should include ${EXPECTED_ANDROID_PACKAGE} and/or the role suffixes .client / .guard / .staff.`,
        );
        console.error('  Set ALLOW_APK_WITHOUT_FCM=1 to override.\n');
        process.exit(1);
      }
    }

    console.log('→ Generating Android launcher icons…');
    run('npm', ['run', 'generate:android-icons']);
  }

  if (removePublicApk) {
    await removePublicDownloadBinaries();
  }

  const nativeFcmConfigured = isGoogleServicesConfigured();
  const roleLabel = productApp ? ` (${productApp} app)` : '';

  console.log(`→ Building web bundle for Android${playStoreBuild ? ' (Play Store)' : ''}${roleLabel}…`);
  run('npm', ['run', 'build'], {
    env: {
      VITE_APP_URL: process.env.VITE_APP_URL || 'https://www.guardr.co',
      VITE_NATIVE_FCM_CONFIGURED: nativeFcmConfigured ? 'true' : 'false',
      VITE_PLAY_STORE_BUILD: playStoreBuild ? 'true' : 'false',
      ...(productApp ? { VITE_PRODUCT_APP: productApp } : {}),
    },
  });

  console.log('→ Syncing Capacitor Android project…');
  run('npx', ['cap', 'sync', 'android']);

  return { nativeFcmConfigured };
}
