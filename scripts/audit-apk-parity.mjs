#!/usr/bin/env node
/**
 * Verify the Android APK pipeline matches the current web release.
 * Run before/after `npm run android:apk` or in CI.
 */
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const errors = [];
const warnings = [];

async function readJson(relPath) {
  const raw = await readFile(path.join(ROOT, relPath), 'utf8');
  return JSON.parse(raw);
}

async function readText(relPath) {
  return readFile(path.join(ROOT, relPath), 'utf8');
}

async function fileExists(relPath) {
  try {
    await stat(path.join(ROOT, relPath));
    return true;
  } catch {
    return false;
  }
}

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

const REQUIRED_SRC = [
  'src/lib/nativePush.ts',
  'src/lib/platform/nativeSafeArea.ts',
  'src/lib/platform/themeBranding.ts',
  'src/components/guard/GuardStripeConnectSheet.tsx',
  'src/components/ui/app/AppFormSheet.tsx',
];

const REQUIRED_CAP_PLUGINS = [
  '@capacitor/push-notifications',
  '@capacitor/status-bar',
  '@capacitor/geolocation',
  '@capacitor/camera',
];

const pkg = await readJson('package.json');
const webVersion = pkg.version;

let versionManifest;
try {
  versionManifest = await readJson('public/download/version.json');
} catch {
  fail('public/download/version.json is missing — run npm run generate:download-version');
}

if (versionManifest) {
  if (versionManifest.webVersion !== webVersion) {
    fail(`version.json webVersion ${versionManifest.webVersion} !== package.json ${webVersion}`);
  }
  if (versionManifest.apkVersion !== webVersion) {
    fail(`version.json apkVersion ${versionManifest.apkVersion} !== package.json ${webVersion}`);
  }
}

const gradle = await readText('android/app/build.gradle').catch(() => '');
const versionNameMatch = gradle.match(/versionName\s+"([^"]+)"/);
const versionCodeMatch = gradle.match(/versionCode\s+(\d+)/);
if (!versionNameMatch) {
  fail('android/app/build.gradle missing versionName');
} else if (versionNameMatch[1] !== webVersion) {
  fail(`build.gradle versionName ${versionNameMatch[1]} !== package.json ${webVersion}`);
}

const expectedCode =
  webVersion.split('.').map((p) => Number.parseInt(p, 10) || 0)[0] * 100 +
  (Number.parseInt(webVersion.split('.')[1], 10) || 0) * 10 +
  (Number.parseInt(webVersion.split('.')[2], 10) || 0);

if (versionCodeMatch && Number.parseInt(versionCodeMatch[1], 10) !== expectedCode) {
  fail(`build.gradle versionCode ${versionCodeMatch[1]} !== expected ${expectedCode}`);
}

for (const rel of REQUIRED_SRC) {
  if (!(await fileExists(rel))) {
    fail(`Missing required source file: ${rel}`);
  }
}

const capConfig = await readText('capacitor.config.ts');
if (!capConfig.includes("adjustMarginsForEdgeToEdge: 'auto'")) {
  fail('capacitor.config.ts missing adjustMarginsForEdgeToEdge: auto');
}
if (!capConfig.includes('overlaysWebView: false')) {
  warn('capacitor.config.ts StatusBar overlaysWebView may not be disabled');
}

const pluginsJsonPath = 'android/app/src/main/assets/capacitor.plugins.json';
if (await fileExists(pluginsJsonPath)) {
  const plugins = await readJson(pluginsJsonPath);
  for (const pkgName of REQUIRED_CAP_PLUGINS) {
    if (!plugins.some((entry) => entry.pkg === pkgName)) {
      warn(`Android bundle missing Capacitor plugin ${pkgName} — run npx cap sync android`);
    }
  }
} else {
  warn('android/app/src/main/assets/capacitor.plugins.json missing — run npx cap sync android');
}

if (!(await fileExists('android/app/google-services.json'))) {
  warn(
    'android/app/google-services.json is missing — APK push toggle is disabled; add Firebase config before shipping native push'
  );
}

const bundledConfigPath = 'android/app/src/main/assets/capacitor.config.json';
if (await fileExists(bundledConfigPath)) {
  const bundled = await readJson(bundledConfigPath);
  if (bundled.android?.adjustMarginsForEdgeToEdge !== 'auto') {
    warn('Bundled capacitor.config.json is stale (missing adjustMarginsForEdgeToEdge) — rebuild APK');
  }
}

const bundledIndex = 'android/app/src/main/assets/public/index.html';
if (await fileExists(bundledIndex)) {
  const html = await readText(bundledIndex);
  if (!html.includes('/apple-touch-icon.png') && !html.includes('/icons/apple-touch-icon-')) {
    warn('Bundled index.html missing apple-touch-icon path — rebuild APK');
  }
  if (!html.includes('viewport-fit=cover')) {
    warn('Bundled index.html missing viewport-fit=cover');
  }
} else {
  warn('No bundled web assets in android/ — run npm run android:apk');
}

const distIndex = 'dist/index.html';
if (await fileExists(distIndex)) {
  const distHtml = await readText(distIndex);
  const bundledHtml = (await fileExists(bundledIndex)) ? await readText(bundledIndex) : '';
  if (bundledHtml && distHtml !== bundledHtml) {
    warn('dist/index.html differs from android bundled index.html — cap sync needed');
  }
} else {
  warn('dist/ not built — run npm run build before APK assembly');
}

const apkPath = 'public/download/guardr.apk';
if (!(await fileExists(apkPath))) {
  warn('public/download/guardr.apk is missing — users cannot download the current build');
} else {
  const apkStat = await stat(path.join(ROOT, apkPath));
  const manifestTime = versionManifest?.updatedAt ? Date.parse(versionManifest.updatedAt) : 0;
  if (manifestTime && apkStat.mtimeMs < manifestTime - 60_000) {
    warn('public/download/guardr.apk is older than version.json updatedAt — rebuild and copy APK');
  }
  if (versionManifest && versionManifest.apkVersion !== webVersion) {
    warn(`Published APK (${versionManifest.apkVersion}) does not match package.json (${webVersion})`);
  }
}

console.log(`APK parity audit — target v${webVersion}`);
for (const message of warnings) {
  console.warn(`⚠ ${message}`);
}
for (const message of errors) {
  console.error(`✗ ${message}`);
}

if (errors.length > 0) {
  console.error(`\n${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
}

console.log(`✓ Version manifests aligned on v${webVersion}`);
if (warnings.length > 0) {
  console.log(`${warnings.length} warning(s) — rebuild APK if shipping to devices`);
} else {
  console.log('✓ No parity warnings');
}
