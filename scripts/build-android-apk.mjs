#!/usr/bin/env node
/**
 * Build Guardr Android APK (release, debug-signed for beta sideload).
 *
 * Outputs:
 *   android/app/build/outputs/apk/release/app-release.apk
 *   public/download/guardr.apk  (copied for guardr.co/download)
 */
import { copyFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const ROOT = process.cwd();
const ANDROID_HOME = process.env.ANDROID_HOME || path.join(process.env.HOME || '', 'Android', 'Sdk');
const GRADLE = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

function run(cmd, args, options = {}) {
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

console.log('→ Generating download version manifest…');
run('npm', ['run', 'generate:download-version']);

console.log('→ Auditing APK / site parity…');
run('node', ['scripts/audit-apk-parity.mjs']);

if (!existsSync(path.join(ROOT, 'android/app/google-services.json'))) {
  console.warn(
    '\n⚠ android/app/google-services.json is missing — native push toggle will be disabled in this APK.',
  );
  console.warn('  Copy android/app/google-services.json.example and fill in Firebase values before shipping push.\n');
}

console.log('→ Generating Android launcher icons…');
run('npm', ['run', 'generate:android-icons']);

console.log('→ Building web bundle for Android…');
run('npm', ['run', 'build'], {
  env: {
    VITE_APP_URL: process.env.VITE_APP_URL || 'https://guardr.co',
  },
});

console.log('→ Syncing Capacitor Android project…');
run('npx', ['cap', 'sync', 'android']);

console.log('→ Assembling release APK…');
run(GRADLE, ['assembleRelease'], {
  cwd: path.join(ROOT, 'android'),
});

const releaseApk = path.join(ROOT, 'android/app/build/outputs/apk/release/app-release.apk');
const publicDir = path.join(ROOT, 'public/download');
const publicApk = path.join(publicDir, 'guardr.apk');

await mkdir(publicDir, { recursive: true });
await copyFile(releaseApk, publicApk);

console.log('→ Post-build parity audit…');
run('node', ['scripts/audit-apk-parity.mjs']);

console.log(`\n✓ APK ready:\n  ${releaseApk}\n  ${publicApk}\n`);
console.log('Share: https://guardr.co/download/');
