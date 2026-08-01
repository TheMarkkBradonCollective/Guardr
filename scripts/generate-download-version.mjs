#!/usr/bin/env node
/**
 * Single source of truth for web + APK versions on the download page.
 * Writes public/download/version.json, APK QR code, and syncs android/app/build.gradle.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import QRCode from 'qrcode';

const ROOT = process.cwd();
const APK_DIRECT_URL = 'https://www.guardr.co/download/guardr.apk';
const pkg = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
const version = pkg.version || '1.0.0';
const numericVersion = version.split('-')[0];
const parts = numericVersion.split('.').map((part) => Number.parseInt(part, 10) || 0);
const versionCode = parts[0] * 100 + (parts[1] || 0) * 10 + (parts[2] || 0);
const apkCacheQuery = `?v=${versionCode}`;

const cacheSlug = version.replace(/\./g, '-');
const cacheName = `guardr-cache-v${cacheSlug}`;

const manifest = {
  webVersion: version,
  apkVersion: version,
  apkVersionCode: versionCode,
  apkUrl: `/download/guardr.apk${apkCacheQuery}`,
  apkDirectUrl: `${APK_DIRECT_URL}${apkCacheQuery}`,
  updatedAt: new Date().toISOString(),
};

await writeFile(
  path.join(ROOT, 'public/download/version.json'),
  `${JSON.stringify(manifest, null, 2)}\n`
);

const qrPath = path.join(ROOT, 'public/download/apk-qr.png');
await QRCode.toFile(qrPath, `${APK_DIRECT_URL}${apkCacheQuery}`, {
  type: 'png',
  width: 320,
  margin: 2,
  color: { dark: '#000000', light: '#ffffff' },
});

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
console.log(`APK direct URL: ${APK_DIRECT_URL}`);
console.log(`APK QR code: public/download/apk-qr.png`);
console.log(`Service worker cache: ${cacheName}`);
