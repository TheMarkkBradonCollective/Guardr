#!/usr/bin/env node
/**
 * Build Hire, Work, and Staff sideload APKs and zip them together.
 *
 * Outputs:
 *   public/download/Guardr-Client.apk
 *   public/download/Guardr-Guard.apk
 *   public/download/Guardr-Staff.apk
 *   public/download/Guardr-All-APKs.zip   (GitHub Release asset)
 *   public/download/guardr.apk            (combined package, existing installers)
 *
 * Each role APK uses a distinct applicationId so all three can be installed
 * on one device. Pass -PguardrProductApp=<role> through Gradle.
 */
import { copyFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  GRADLE,
  prepareAndroidWebBuild,
  ROOT,
  run,
} from './build-android-common.mjs';
import {
  ANDROID_ROLES,
  generateAndroidIcons,
  patchGoogleServicesPackage,
  restoreGoogleServices,
  rolePackage,
  writeNativeProductAppJs,
} from './android-role-build.mjs';

const PUBLIC_DOWNLOAD = path.join(ROOT, 'public/download');
const SIDELOAD_APK = path.join(
  ROOT,
  'android/app/build/outputs/apk/sideload/release/app-sideload-release.apk',
);

const { nativeFcmConfigured } = await prepareAndroidWebBuild({
  playStoreBuild: false,
  runParityAudit: true,
  removePublicApk: true,
});

await mkdir(PUBLIC_DOWNLOAD, { recursive: true });

const apkPaths = [];

try {
  for (const role of ANDROID_ROLES) {
    console.log(`\n→ Assembling ${role.id} sideload APK (${rolePackage(role.id)})…`);
    await writeNativeProductAppJs(role.id);
    generateAndroidIcons(role.id);
    const originalServices = await patchGoogleServicesPackage(rolePackage(role.id));
    try {
      run(GRADLE, ['assembleSideloadRelease', `-PguardrProductApp=${role.id}`], {
        cwd: path.join(ROOT, 'android'),
      });
    } finally {
      await restoreGoogleServices(originalServices);
    }
    if (!existsSync(SIDELOAD_APK)) {
      console.error(`✗ Missing Gradle output: ${SIDELOAD_APK}`);
      process.exit(1);
    }
    const dest = path.join(PUBLIC_DOWNLOAD, role.sideload);
    await copyFile(SIDELOAD_APK, dest);
    await copyFile(SIDELOAD_APK, path.join(PUBLIC_DOWNLOAD, role.apk));
    apkPaths.push(path.join(PUBLIC_DOWNLOAD, role.apk));
    console.log(`✓ ${role.apk}`);
  }

  console.log('\n→ Assembling combined sideload APK (com.signaturesecurity.guardr)…');
  await writeNativeProductAppJs('');
  generateAndroidIcons('');
  run(GRADLE, ['assembleSideloadRelease'], {
    cwd: path.join(ROOT, 'android'),
  });
  await copyFile(SIDELOAD_APK, path.join(PUBLIC_DOWNLOAD, 'guardr.apk'));

  const zipPath = path.join(PUBLIC_DOWNLOAD, 'Guardr-All-APKs.zip');
  console.log('\n→ Zipping Hire, Work, and Staff APKs for GitHub Releases…');
  run('zip', ['-j', '-q', zipPath, ...apkPaths]);

  console.log('→ Post-build parity audit…');
  run('node', ['scripts/audit-apk-parity.mjs']);

  console.log(`\n✓ Role APKs + zip ready:\n  ${apkPaths.join('\n  ')}\n  ${zipPath}\n`);
  console.log('  Combined (legacy): public/download/guardr.apk');
  if (nativeFcmConfigured) {
    console.log('✓ Native FCM plugin applied. Add Firebase Android apps for .client / .guard / .staff for push on those packages.');
  } else {
    console.warn('⚠ Native FCM disabled in this APK build.');
  }
  console.log('Share zip: https://github.com/TheMarkkBradonCollective/Guardr/releases/latest/download/Guardr-All-APKs.zip');
} catch (error) {
  console.error(error);
  process.exit(1);
}
