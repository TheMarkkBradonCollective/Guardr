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
} from './githubApkRelease.ts';

describe('GitHub APK release URLs', () => {
  it('points the all-apps zip at GitHub Releases', () => {
    assert.match(
      GITHUB_ALL_APKS_ZIP,
      /github\.com\/TheMarkkBradonCollective\/Guardr\/releases\/download\/v1\.1\.0-cf-beta\/Guardr-All-APKs\.zip$/
    );
  });

  it('lists Client, Guard, and Staff APK assets', () => {
    assert.equal(GITHUB_ROLE_APKS.map((app) => app.label).join(' '), 'Guard Customer Staff');
    assert.equal(GITHUB_CLIENT_APK.endsWith('Guardr-Client.apk'), true);
    assert.equal(GITHUB_GUARD_APK.endsWith('Guardr-Guard.apk'), true);
    assert.equal(GITHUB_STAFF_APK.endsWith('Guardr-Staff.apk'), true);
  });

  it('offers Messenger via GitHub release asset', () => {
    assert.equal(GITHUB_MESSENGER_APP.file, 'Guardr-Messenger.apk');
    assert.match(GITHUB_MESSENGER_APP.url, /v1\.1\.0-cf-beta\/Guardr-Messenger\.apk$/);
    assert.match(GITHUB_MESSENGER_APP.tagline, /Messages, support, and team chat/);
    assert.equal(GITHUB_ROLE_APKS.length, 3);
    assert.ok(!GITHUB_ROLE_APKS.map((app) => app.label).includes('Messenger'));
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
