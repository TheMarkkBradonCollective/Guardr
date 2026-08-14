#!/usr/bin/env node
/**
 * Build Guardr Android APK (sideload flavor, debug-signed for guardr.co/download).
 *
 * Outputs:
 *   android/app/build/outputs/apk/sideload/release/app-sideload-release.apk
 *   public/download/guardr.apk  (copied for guardr.co/download)
 */
import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { GRADLE, prepareAndroidWebBuild, ROOT, run } from './build-android-common.mjs';

const { nativeFcmConfigured } = await prepareAndroidWebBuild({
  playStoreBuild: false,
  runParityAudit: true,
  removePublicApk: true,
});

console.log('→ Assembling sideload release APK…');
run(GRADLE, ['assembleSideloadRelease'], {
  cwd: path.join(ROOT, 'android'),
});

const releaseApk = path.join(
  ROOT,
  'android/app/build/outputs/apk/sideload/release/app-sideload-release.apk',
);
const publicDir = path.join(ROOT, 'public/download');
const publicApk = path.join(publicDir, 'guardr.apk');

await mkdir(publicDir, { recursive: true });
await copyFile(releaseApk, publicApk);

console.log('→ Post-build parity audit…');
run('node', ['scripts/audit-apk-parity.mjs']);

console.log(`\n✓ APK ready:\n  ${releaseApk}\n  ${publicApk}\n`);
if (nativeFcmConfigured) {
  console.log('✓ Native FCM enabled — push toggle will work after reinstall.');
} else {
  console.warn('⚠ Native FCM disabled in this APK build.');
}
console.log('Share: https://guardr.co/download/');
