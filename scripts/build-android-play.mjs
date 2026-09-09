#!/usr/bin/env node
/**
 * Build Guardr Android App Bundles for Google Play Console upload.
 *
 * Requires android/keystore.properties (see keystore.properties.example).
 *
 * Default: three role AABs (Client, Guard, Staff).
 * Single role: node scripts/build-android-play.mjs --role=guard
 *
 * Output:
 *   android/app/build/outputs/bundle/play<Role>Release/app-play-<role>-release.aab
 *   dist/play-store/guardr-<role>-play-release.aab
 */
import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { findGradleOutput, GRADLE, prepareAndroidWebBuild, ROOT, run } from './build-android-common.mjs';
import { isReleaseKeystoreConfigured, writeKeystoreFromEnv } from './write-keystore.mjs';
import { gradlePlayBundleTask, parseRoleArg, PRODUCT_APPS, PRODUCT_ROLES } from './product-apps.mjs';

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

const requestedRole = parseRoleArg();
const roles = requestedRole ? [requestedRole] : PRODUCT_ROLES;
const distDir = path.join(ROOT, 'dist/play-store');
await mkdir(distDir, { recursive: true });

let nativeFcmConfigured = false;
const copied = [];

for (const [index, role] of roles.entries()) {
  const app = PRODUCT_APPS[role];
  const { nativeFcmConfigured: fcm } = await prepareAndroidWebBuild({
    playStoreBuild: true,
    runParityAudit: false,
    removePublicApk: true,
    productApp: role,
    skipPrereqs: index > 0,
  });
  nativeFcmConfigured = fcm;

  console.log(`→ Bundling Play ${app.label} AAB…`);
  run(GRADLE, [gradlePlayBundleTask(role)], {
    cwd: path.join(ROOT, 'android'),
  });

  const releaseAab = findGradleOutput('aab', role, 'play');
  if (!releaseAab) {
    console.error(`\n✗ Could not find play ${role} AAB under android/app/build/outputs/bundle\n`);
    process.exit(1);
  }

  const distAab = path.join(distDir, app.aabFile);
  await copyFile(releaseAab, distAab);
  copied.push({ role, releaseAab, distAab });
}

console.log('\n✓ Play Store AABs ready:');
for (const item of copied) {
  console.log(`  ${PRODUCT_APPS[item.role].label}: ${item.releaseAab}`);
  console.log(`                     ${item.distAab}`);
}
if (nativeFcmConfigured) {
  console.log('✓ Native FCM config present.');
} else {
  console.warn('⚠ Native FCM disabled — push will not work on Play installs until Firebase apps exist for each package.');
}
console.log('Next: upload each dist/play-store/guardr-*-play-release.aab to its Play Console listing.');
console.log('See docs/GOOGLE-PLAY.md for the three package names, store listing, and Data safety.');
