#!/usr/bin/env node
/**
 * Build both sideload APK (guardr.co/download) and Play Store AAB for a full release.
 */
import { spawnSync } from 'node:child_process';

function run(script) {
  const result = spawnSync('node', [script], { stdio: 'inherit', env: process.env });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('scripts/build-android-apk.mjs');
run('scripts/build-android-play.mjs');
