#!/usr/bin/env node
/**
 * Build sideload APKs (Guard, Customer, Staff + combined) and Play Store AABs.
 */
import { spawnSync } from 'node:child_process';

function run(script) {
  const result = spawnSync('node', [script], { stdio: 'inherit', env: process.env });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('scripts/build-android-apk-all.mjs');
run('scripts/build-android-play.mjs');
