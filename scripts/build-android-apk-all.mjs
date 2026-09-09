#!/usr/bin/env node
/**
 * Build Client, Guard, and Staff sideload APKs and zip them together.
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
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  GRADLE,
  prepareAndroidWebBuild,
  ROOT,
  run,
} from './build-android-common.mjs';

const ROLES = [
  { id: 'client', file: 'guardr-client.apk', release: 'Guardr-Client.apk' },
  { id: 'guard', file: 'guardr-guard.apk', release: 'Guardr-Guard.apk' },
  { id: 'staff', file: 'guardr-staff.apk', release: 'Guardr-Staff.apk' },
];

const SERVICES_PATH = path.join(ROOT, 'android/app/google-services.json');
const ASSETS_PUBLIC = path.join(ROOT, 'android/app/src/main/assets/public');
const PUBLIC_DOWNLOAD = path.join(ROOT, 'public/download');
const SIDELOAD_APK = path.join(
  ROOT,
  'android/app/build/outputs/apk/sideload/release/app-sideload-release.apk',
);

function rolePackage(role) {
  return `com.signaturesecurity.guardr.${role}`;
}

async function writeNativeProductAppJs(role) {
  await mkdir(ASSETS_PUBLIC, { recursive: true });
  const dest = path.join(ASSETS_PUBLIC, 'native-product-app.js');
  const value = role || '';
  await writeFile(dest, `window.__GUARDR_NATIVE_PRODUCT_APP__='${value}';\n`);
}

async function patchGoogleServicesPackage(packageName) {
  if (!existsSync(SERVICES_PATH)) return null;
  const original = await readFile(SERVICES_PATH, 'utf8');
  const json = JSON.parse(original);
  for (const client of json.client ?? []) {
    if (client.client_info?.android_client_info) {
      client.client_info.android_client_info.package_name = packageName;
    }
  }
  await writeFile(SERVICES_PATH, `${JSON.stringify(json, null, 2)}\n`);
  return original;
}

async function restoreGoogleServices(original) {
  if (original == null) return;
  await writeFile(SERVICES_PATH, original);
}

const { nativeFcmConfigured } = await prepareAndroidWebBuild({
  playStoreBuild: false,
  runParityAudit: true,
  removePublicApk: true,
});

await mkdir(PUBLIC_DOWNLOAD, { recursive: true });

const apkPaths = [];

try {
  for (const role of ROLES) {
    console.log(`\n→ Assembling ${role.id} sideload APK (${rolePackage(role.id)})…`);
    await writeNativeProductAppJs(role.id);
    run('node', ['scripts/generate-android-icons.mjs', `--productApp=${role.id}`]);
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
    const dest = path.join(PUBLIC_DOWNLOAD, role.file);
    await copyFile(SIDELOAD_APK, dest);
    await copyFile(SIDELOAD_APK, path.join(PUBLIC_DOWNLOAD, role.release));
    apkPaths.push(path.join(PUBLIC_DOWNLOAD, role.release));
    console.log(`✓ ${role.release}`);
  }

  console.log('\n→ Assembling combined sideload APK (com.signaturesecurity.guardr)…');
  await writeNativeProductAppJs('');
  run('node', ['scripts/generate-android-icons.mjs']);
  run(GRADLE, ['assembleSideloadRelease'], {
    cwd: path.join(ROOT, 'android'),
  });
  await copyFile(SIDELOAD_APK, path.join(PUBLIC_DOWNLOAD, 'guardr.apk'));

  const zipPath = path.join(PUBLIC_DOWNLOAD, 'Guardr-All-APKs.zip');
  console.log('\n→ Zipping Client, Guard, and Staff APKs for GitHub Releases…');
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
