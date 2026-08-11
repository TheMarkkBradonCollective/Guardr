#!/usr/bin/env node
/**
 * Single source of truth for web + APK versions on the download page and MBC App Market catalog.
 * Writes public/download/version.json, public/version.json, APK QR code, and syncs android/app/build.gradle.
 */
import { createHash } from 'node:crypto';
import { copyFile, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import QRCode from 'qrcode';

const ROOT = process.cwd();
const APK_SLUG = 'guardr';
const APK_DIRECT_URL = 'https://www.guardr.co/download/guardr.apk';
const MBC_APK_PATH = `public/${APK_SLUG}.apk`;
const DOWNLOAD_APK_PATH = 'public/download/guardr.apk';

const RELEASE_NOTES = {
  '1.0.119':
    'Renamed all source files that contained uber in their names (gr-* CSS, mobility landing, GuardrDataTable, DirectTopHeader).',
  '1.0.118':
    'Removed third-party brand mentions from docs and comments; renamed design docs to design-patterns.md.',
  '1.0.117':
    'Homepage Download and Manuals links in nav and footer; PDF manuals on /manuals.',
  '1.0.116':
    'Print-ready PDF user manuals downloadable on website and in-app (Guide, Settings, pending screens); /manuals/*.pdf.',
  '1.0.115':
    'Staff onboarding (application, gov ID, Stripe payouts), staff pay on Payments (Prop 22 add-ons), signup clarity (Work at Guardr vs marketplace), guard timesheet read-only from clock audit.',
  '1.0.114':
    'Unified Payments page for guards, staff, and clients; guard profile Timesheet tab (read-only shift clock history).',
  '1.0.113': 'Desktop workbench alignment across staff, client, and guard pages; desktop workspace table splits and credentials fix.',
};

async function fileExists(relPath) {
  try {
    await stat(path.join(ROOT, relPath));
    return true;
  } catch {
    return false;
  }
}

async function sha256File(relPath) {
  const data = await readFile(path.join(ROOT, relPath));
  return createHash('sha256').update(data).digest('hex');
}

const pkg = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
const version = pkg.version || '1.0.0';
const numericVersion = version.split('-')[0];
const parts = numericVersion.split('.').map((part) => Number.parseInt(part, 10) || 0);
const versionCode = parts[0] * 100 + (parts[1] || 0) * 10 + (parts[2] || 0);
const apkCacheQuery = `?v=${versionCode}`;

const cacheSlug = version.replace(/\./g, '-');
const cacheName = `guardr-cache-v${cacheSlug}`;

const downloadManifest = {
  webVersion: version,
  apkVersion: version,
  apkVersionCode: versionCode,
  apkUrl: `/download/guardr.apk${apkCacheQuery}`,
  apkDirectUrl: `${APK_DIRECT_URL}${apkCacheQuery}`,
  updatedAt: new Date().toISOString(),
};

await writeFile(
  path.join(ROOT, 'public/download/version.json'),
  `${JSON.stringify(downloadManifest, null, 2)}\n`,
);

const qrPath = path.join(ROOT, 'public/download/apk-qr.png');
await QRCode.toFile(qrPath, `${APK_DIRECT_URL}${apkCacheQuery}`, {
  type: 'png',
  width: 320,
  margin: 2,
  color: { dark: '#000000', light: '#ffffff' },
});

let apkReady = false;
let apkFileSize = 0;
let apkSha256 = '';

if (await fileExists(DOWNLOAD_APK_PATH)) {
  await copyFile(path.join(ROOT, DOWNLOAD_APK_PATH), path.join(ROOT, MBC_APK_PATH));
  const apkStat = await stat(path.join(ROOT, MBC_APK_PATH));
  apkFileSize = apkStat.size;
  apkSha256 = await sha256File(MBC_APK_PATH);
  apkReady = apkFileSize > 0;
}

const releaseNotes =
  RELEASE_NOTES[numericVersion] ??
  `Guardr ${numericVersion} — security marketplace for clients, guards, and staff.`;

const catalogManifest = {
  webVersion: version,
  apk: {
    ready: apkReady,
    version: numericVersion,
    versionCode,
    url: `/${APK_SLUG}.apk`,
    downloadName: `${APK_SLUG}-v${numericVersion}.apk`,
    fileSize: apkFileSize,
    sha256: apkSha256,
    releaseNotes,
  },
  updatedAt: downloadManifest.updatedAt,
};

await writeFile(
  path.join(ROOT, 'public/version.json'),
  `${JSON.stringify(catalogManifest, null, 2)}\n`,
);

const gradlePath = path.join(ROOT, 'android/app/build.gradle');
let gradle = await readFile(gradlePath, 'utf8');
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${version}"`);
await writeFile(gradlePath, gradle);

const swPath = path.join(ROOT, 'public/sw.js');
let sw = await readFile(swPath, 'utf8');
if (!/const CACHE_NAME = 'guardr-cache-v[^']+';/.test(sw)) {
  throw new Error('public/sw.js missing CACHE_NAME constant');
}
sw = sw.replace(/const CACHE_NAME = 'guardr-cache-v[^']+';/, `const CACHE_NAME = '${cacheName}';`);
await writeFile(swPath, sw);

const serviceWorkerPath = path.join(ROOT, 'public/service-worker.js');
const serviceWorker = `// Guardr service worker entry — push + offline shell (see sw.js for implementation)
// Bust import cache on each release: v${versionCode}
importScripts('/sw.js?v=${versionCode}');
`;
await writeFile(serviceWorkerPath, serviceWorker);

console.log(`Download manifest: web/apk v${version} (code ${versionCode})`);
console.log(`MBC catalog: /version.json apk.ready=${apkReady} size=${apkFileSize}`);
if (apkReady) {
  console.log(`MBC APK: /${APK_SLUG}.apk sha256=${apkSha256.slice(0, 16)}…`);
}
console.log(`APK direct URL: ${APK_DIRECT_URL}`);
console.log(`APK QR code: public/download/apk-qr.png`);
console.log(`Service worker cache: ${cacheName}`);
