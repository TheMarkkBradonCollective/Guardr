#!/usr/bin/env node
/**
 * Validate everything that can be checked before a Play Store upload.
 * Stops at items that require your credentials (keystore, Firebase, Console forms).
 */
import { existsSync, readFileSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const errors = [];
const warnings = [];
const ready = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function ok(message) {
  ready.push(message);
}

async function fileExists(relPath) {
  try {
    await stat(path.join(ROOT, relPath));
    return true;
  } catch {
    return false;
  }
}

const pkg = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
const gradle = await readFile(path.join(ROOT, 'android/app/build.gradle'), 'utf8').catch(() => '');

if (gradle.includes('flavorDimensions')) {
  ok('Gradle product flavors configured (sideload + play)');
} else {
  fail('android/app/build.gradle missing play/sideload flavors');
}

if (gradle.includes('signingConfigs')) {
  ok('Release signing config present');
} else {
  fail('android/app/build.gradle missing release signingConfigs');
}

const keystorePropsPath = path.join(ROOT, 'android/keystore.properties');
if (existsSync(keystorePropsPath)) {
  ok('android/keystore.properties exists');
  const props = readFileSync(keystorePropsPath, 'utf8');
  for (const key of ['storeFile', 'storePassword', 'keyAlias', 'keyPassword']) {
    if (!props.includes(`${key}=`) || props.includes(`${key}=YOUR_`)) {
      fail(`android/keystore.properties still has placeholder for ${key}`);
    }
  }
  const storeFileMatch = props.match(/^storeFile=(.+)$/m);
  if (storeFileMatch) {
    const storePath = path.resolve(path.dirname(keystorePropsPath), storeFileMatch[1].trim());
    if (existsSync(storePath)) {
      ok(`Upload keystore found at ${path.relative(ROOT, storePath)}`);
    } else {
      fail(`Upload keystore missing: ${storePath}`);
    }
  }
} else {
  fail('android/keystore.properties missing — copy from keystore.properties.example');
}

const mainManifest = await readFile(path.join(ROOT, 'android/app/src/main/AndroidManifest.xml'), 'utf8');
if (!mainManifest.includes('REQUEST_INSTALL_PACKAGES')) {
  ok('REQUEST_INSTALL_PACKAGES removed from main manifest (Play-safe)');
} else {
  fail('Main AndroidManifest still declares REQUEST_INSTALL_PACKAGES');
}

const sideloadManifestPath = path.join(ROOT, 'android/app/src/sideload/AndroidManifest.xml');
if (existsSync(sideloadManifestPath)) {
  const sideloadManifest = readFileSync(sideloadManifestPath, 'utf8');
  if (sideloadManifest.includes('REQUEST_INSTALL_PACKAGES')) {
    ok('REQUEST_INSTALL_PACKAGES scoped to sideload flavor only');
  } else {
    warn('Sideload manifest exists but does not declare REQUEST_INSTALL_PACKAGES');
  }
} else {
  fail('android/app/src/sideload/AndroidManifest.xml missing');
}

const googleServicesPath = path.join(ROOT, 'android/app/google-services.json');
const secretsGoogleServices = path.join(ROOT, 'secrets/google-services.json');
if (existsSync(googleServicesPath)) {
  try {
    const json = JSON.parse(readFileSync(googleServicesPath, 'utf8'));
    const pkgName = json.client?.[0]?.client_info?.android_client_info?.package_name;
    if (pkgName === 'com.signaturesecurity.guardr') {
      ok('google-services.json configured for com.signaturesecurity.guardr');
    } else {
      fail(`google-services.json package_name is ${pkgName ?? 'missing'}, expected com.signaturesecurity.guardr`);
    }
  } catch {
    fail('android/app/google-services.json is not valid JSON');
  }
} else if (existsSync(secretsGoogleServices)) {
  warn('secrets/google-services.json exists but android/app/google-services.json not copied yet — build script will copy it');
} else if (process.env.GOOGLE_SERVICES_JSON?.trim()) {
  ok('GOOGLE_SERVICES_JSON env var set (build will write google-services.json)');
} else {
  fail('Firebase google-services.json missing — native push will not work on Play builds');
}

if (await fileExists('assets/play-store/icon-512.png')) {
  ok('Play Store brand icon generated (assets/play-store/icon-512.png)');
} else {
  warn('Run npm run play:assets to generate 512×512 icons and feature graphic');
}

if (await fileExists('assets/play-store/staff-icon-512.png')) {
  ok('Staff Play icon is white + black (assets/play-store/staff-icon-512.png)');
} else {
  warn('Run npm run play:assets to generate the Staff listing icon (white field, black logo)');
}

if (await fileExists('docs/play-store-listing-copy.md')) {
  ok('Store listing copy draft available');
}

const privacyUrl = 'https://guardr.co/legal/privacy';
ok(`Privacy policy URL for Console: ${privacyUrl}`);

console.log(`Play Store readiness — Guardr v${pkg.version}\n`);

for (const message of ready) {
  console.log(`✓ ${message}`);
}
for (const message of warnings) {
  console.warn(`⚠ ${message}`);
}
for (const message of errors) {
  console.error(`✗ ${message}`);
}

console.log('\n--- Your action required ---');
console.log('1. Create upload keystore + android/keystore.properties (if not done)');
console.log('2. Add google-services.json (secrets/ or GOOGLE_SERVICES_JSON)');
console.log('3. npm run android:play  →  upload dist/play-store/Guardr-Client.aab, Guardr-Guard.aab, Guardr-Staff.aab');
console.log('4. Complete Play Console: store listing, Data safety, content rating, app access');
console.log('   See docs/GOOGLE-PLAY.md and docs/play-store-listing-copy.md\n');

if (errors.length > 0) {
  console.error(`${errors.length} blocker(s), ${warnings.length} warning(s)`);
  process.exit(1);
}

console.log(`Ready to build AAB (${warnings.length} optional warning(s)).`);
process.exit(0);
