import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  GITHUB_ALL_APKS_ZIP,
  GITHUB_CLIENT_APK,
  GITHUB_GUARD_APK,
  GITHUB_STAFF_APK,
  GITHUB_MESSENGER_APP,
  GITHUB_ROLE_APKS,
  R2_APK_LATEST_URL,
} from './githubApkRelease.ts';

const R2_APK = 'https://pub-07d688bf950545ddba9025a723c0798e.r2.dev/guardr/latest.apk';

describe('APK download URLs', () => {
  it('points every APK asset at the public R2 latest.apk', () => {
    assert.equal(R2_APK_LATEST_URL, R2_APK);
    assert.equal(GITHUB_ALL_APKS_ZIP, R2_APK);
    assert.equal(GITHUB_CLIENT_APK, R2_APK);
    assert.equal(GITHUB_GUARD_APK, R2_APK);
    assert.equal(GITHUB_STAFF_APK, R2_APK);
    assert.equal(GITHUB_MESSENGER_APP.url, R2_APK);
  });

  it('lists Client, Guard, and Staff download cards', () => {
    assert.equal(GITHUB_ROLE_APKS.map((app) => app.label).join(' '), 'Guard Customer Staff');
    assert.equal(GITHUB_ROLE_APKS.length, 3);
    assert.ok(GITHUB_ROLE_APKS.every((app) => app.url === R2_APK));
    assert.ok(!GITHUB_ROLE_APKS.map((app) => app.label).includes('Messenger'));
  });

  it('offers Messenger at the same R2 latest.apk', () => {
    assert.equal(GITHUB_MESSENGER_APP.file, 'latest.apk');
    assert.equal(GITHUB_MESSENGER_APP.url, R2_APK);
    assert.match(GITHUB_MESSENGER_APP.tagline, /Messages, support, and team chat/);
  });

  it('does not publish APK hrefs on the public /download page', () => {
    const html = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../../public/download/index.html'),
      'utf8',
    );
    assert.match(html, /Android apps are private/);
    assert.match(html, /\?auth=sign-up/);
    assert.match(html, /\?auth=sign-in/);
    assert.doesNotMatch(html, /Guardr-Guard\.apk/);
    assert.doesNotMatch(html, /Guardr-Client\.apk/);
    assert.doesNotMatch(html, /Guardr-Staff\.apk/);
    assert.doesNotMatch(html, /Guardr-Messenger\.apk/);
    assert.doesNotMatch(html, /Guardr-All-APKs\.zip/);
  });
});
