#!/usr/bin/env node
/**
 * Build Guardr Android APKs (sideload flavor, debug-signed for guardr.co/download).
 *
 * Default (`npm run android:apk` / `npm run android:apk:all`):
 *   three role APKs + public/download/guardr-apps.zip
 *
 * Single role:
 *   node scripts/build-android-apk.mjs --role=client
 *
 * Outputs:
 *   android/app/build/outputs/apk/sideload<Role>/release/app-sideload-<role>-release.apk
 *   public/download/guardr-client.apk
 *   public/download/guardr-guard.apk
 *   public/download/guardr-staff.apk
 *   public/download/guardr-apps.zip
 */
import { copyFile, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import {
  findGradleOutput,
  GRADLE,
  prepareAndroidWebBuild,
  PUBLIC_DOWNLOAD_DIR,
  ROOT,
  run,
} from './build-android-common.mjs';
import {
  APPS_ZIP_FILE,
  gradleSideloadAssembleTask,
  parseRoleArg,
  PRODUCT_APPS,
  PRODUCT_ROLES,
} from './product-apps.mjs';

const requestedRole = parseRoleArg();
const roles = requestedRole ? [requestedRole] : PRODUCT_ROLES;

await mkdir(PUBLIC_DOWNLOAD_DIR, { recursive: true });

const copied = [];
let nativeFcmConfigured = false;

for (const [index, role] of roles.entries()) {
  const app = PRODUCT_APPS[role];
  const { nativeFcmConfigured: fcm } = await prepareAndroidWebBuild({
    playStoreBuild: false,
    runParityAudit: index === 0,
    removePublicApk: true,
    productApp: role,
    skipPrereqs: index > 0,
  });
  nativeFcmConfigured = fcm;

  console.log(`→ Assembling sideload ${app.label} APK…`);
  run(GRADLE, [gradleSideloadAssembleTask(role)], {
    cwd: path.join(ROOT, 'android'),
  });

  const releaseApk = findGradleOutput('apk', role, 'sideload');
  if (!releaseApk) {
    console.error(`\n✗ Could not find sideload ${role} APK under android/app/build/outputs/apk\n`);
    process.exit(1);
  }

  const publicApk = path.join(PUBLIC_DOWNLOAD_DIR, app.apkFile);
  await copyFile(releaseApk, publicApk);
  copied.push({ role, releaseApk, publicApk });
  console.log(`✓ ${app.label}: ${path.relative(ROOT, publicApk)}`);
}

const zipPath = path.join(PUBLIC_DOWNLOAD_DIR, APPS_ZIP_FILE);
if (roles.length > 1) {
  console.log('→ Zipping role APKs…');
  const zipResult = spawnSync(
    'zip',
    ['-j', '-q', zipPath, ...copied.map((item) => item.publicApk)],
    { cwd: ROOT, stdio: 'inherit' },
  );
  if (zipResult.status !== 0) {
    console.error('\n✗ Failed to create guardr-apps.zip (is `zip` installed?)\n');
    process.exit(zipResult.status ?? 1);
  }
}

console.log('→ Post-build parity audit…');
run('node', ['scripts/audit-apk-parity.mjs']);

console.log('\n✓ APKs ready:');
for (const item of copied) {
  console.log(`  ${PRODUCT_APPS[item.role].label}: ${item.releaseApk}`);
  console.log(`                     ${item.publicApk}`);
}
if (roles.length > 1) {
  console.log(`  Zip: ${zipPath}`);
}
if (nativeFcmConfigured) {
  console.log('✓ Native FCM config present — push works for packages listed in google-services.json.');
} else {
  console.warn('⚠ Native FCM disabled in this APK build.');
}
console.log('Share: https://guardr.co/download/  ·  https://www.guardr.co/download/guardr-apps.zip');
