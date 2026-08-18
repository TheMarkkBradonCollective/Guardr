#!/usr/bin/env node
/**
 * Build Guardr Android App Bundle for Google Play Console upload.
 *
 * Requires android/keystore.properties (see keystore.properties.example).
 *
 * Output:
 *   android/app/build/outputs/bundle/playRelease/app-play-release.aab
 */
import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { GRADLE, prepareAndroidWebBuild, ROOT, run } from './build-android-common.mjs';
import { isReleaseKeystoreConfigured, writeKeystoreFromEnv } from './write-keystore.mjs';

console.log('→ Writing Play upload keystore (if configured)…');
await writeKeystoreFromEnv();

const keystoreProperties = path.join(ROOT, 'android/keystore.properties');
if (!isReleaseKeystoreConfigured()) {
  console.error('\n✗ android/keystore.properties is missing.');
  console.error('  1. Copy android/keystore.properties.example → android/keystore.properties');
  console.error('  2. Generate an upload keystore (see docs/GOOGLE-PLAY.md)');
  console.error('  3. Fill in storeFile, storePassword, keyAlias, keyPassword\n');
  process.exit(1);
}

console.log('→ Checking Play Store readiness…');
run('node', ['scripts/check-play-readiness.mjs']);

const { nativeFcmConfigured } = await prepareAndroidWebBuild({
  playStoreBuild: true,
  runParityAudit: false,
  removePublicApk: true,
});

console.log('→ Bundling Play release AAB…');
run(GRADLE, ['bundlePlayRelease'], {
  cwd: path.join(ROOT, 'android'),
});

const releaseAab = path.join(
  ROOT,
  'android/app/build/outputs/bundle/playRelease/app-play-release.aab',
);
const distDir = path.join(ROOT, 'dist/play-store');
const distAab = path.join(distDir, 'guardr-play-release.aab');

await mkdir(distDir, { recursive: true });
await copyFile(releaseAab, distAab);

console.log(`\n✓ Play Store AAB ready:\n  ${releaseAab}\n  ${distAab}\n`);
if (nativeFcmConfigured) {
  console.log('✓ Native FCM enabled.');
} else {
  console.warn('⚠ Native FCM disabled — push will not work on Play installs.');
}
console.log('Next: upload dist/play-store/guardr-play-release.aab to Play Console → Internal testing.');
console.log('See docs/GOOGLE-PLAY.md for store listing, Data safety, and reviewer credentials.');
