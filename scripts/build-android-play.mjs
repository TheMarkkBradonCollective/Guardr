#!/usr/bin/env node
/**
 * Build Hire, Work, and Staff Android App Bundles for Google Play.
 *
 * Requires android/keystore.properties (see keystore.properties.example).
 *
 * Outputs:
 *   dist/play-store/Guardr-Client.aab
 *   dist/play-store/Guardr-Guard.aab
 *   dist/play-store/Guardr-Staff.aab
 */
import { copyFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { GRADLE, prepareAndroidWebBuild, ROOT, run } from './build-android-common.mjs';
import { isReleaseKeystoreConfigured, writeKeystoreFromEnv } from './write-keystore.mjs';
import {
  ANDROID_ROLES,
  generateAndroidIcons,
  rolePackage,
  withRoleBuildPatches,
  writeNativeProductAppJs,
} from './android-role-build.mjs';

console.log('→ Writing Play upload keystore (if configured)…');
await writeKeystoreFromEnv();

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

const playAab = path.join(
  ROOT,
  'android/app/build/outputs/bundle/playRelease/app-play-release.aab',
);
const distDir = path.join(ROOT, 'dist/play-store');
await mkdir(distDir, { recursive: true });

const aabPaths = [];

try {
  for (const role of ANDROID_ROLES) {
    console.log(`\n→ Bundling ${role.id} Play AAB (${rolePackage(role.id)})…`);
    await withRoleBuildPatches(role.id, async () => {
      run(GRADLE, ['bundlePlayRelease', `-PguardrProductApp=${role.id}`], {
        cwd: path.join(ROOT, 'android'),
      });
    });
    if (!existsSync(playAab)) {
      console.error(`✗ Missing Gradle output: ${playAab}`);
      process.exit(1);
    }
    const dest = path.join(distDir, role.aab);
    await copyFile(playAab, dest);
    aabPaths.push(dest);
    console.log(`✓ ${role.aab}`);
  }

  await writeNativeProductAppJs('');
  generateAndroidIcons('');

  console.log(`\n✓ Play Store AABs ready:\n  ${aabPaths.join('\n  ')}\n`);
  if (nativeFcmConfigured) {
    console.log('✓ Native FCM enabled. Add Firebase Android apps for .client / .guard / .staff.');
  } else {
    console.warn('⚠ Native FCM disabled — push will not work on Play installs.');
  }
  console.log('Next: upload each AAB to its Play Console listing (Hire, Work, Staff).');
  console.log('See docs/GOOGLE-PLAY.md for store listing, Data safety, and reviewer credentials.');
} catch (error) {
  console.error(error);
  process.exit(1);
}
