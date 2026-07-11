#!/usr/bin/env node
/**
 * Single source of truth for web + APK versions on the download page.
 * Writes public/download/version.json and syncs android/app/build.gradle.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const pkg = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
const version = pkg.version || '1.0.0';
const parts = version.split('.').map((part) => Number.parseInt(part, 10) || 0);
const versionCode = parts[0] * 100 + (parts[1] || 0) * 10 + (parts[2] || 0);

const manifest = {
  webVersion: version,
  apkVersion: version,
  apkVersionCode: versionCode,
  apkUrl: '/download/guardr.apk',
  updatedAt: new Date().toISOString(),
};

await writeFile(
  path.join(ROOT, 'public/download/version.json'),
  `${JSON.stringify(manifest, null, 2)}\n`
);

const gradlePath = path.join(ROOT, 'android/app/build.gradle');
let gradle = await readFile(gradlePath, 'utf8');
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${version}"`);
await writeFile(gradlePath, gradle);

console.log(`Download manifest: web/apk v${version} (code ${versionCode})`);
