import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  SITE_ALL_APKS_ZIP,
  SITE_CLIENT_APK,
  SITE_GUARD_APK,
  SITE_STAFF_APK,
  SITE_ROLE_APKS,
} from './githubApkRelease.ts';

describe('Website APK download URLs', () => {
  it('serves the all-apps zip from the website, not GitHub', () => {
    assert.equal(SITE_ALL_APKS_ZIP, '/download/Guardr-All-APKs.zip');
    assert.ok(!SITE_ALL_APKS_ZIP.includes('github.com'));
  });

  it('lists Guard, Customer, and Staff APKs as same-origin downloads', () => {
    assert.equal(SITE_ROLE_APKS.map((app) => app.label).join(' '), 'Guard Customer Staff');
    assert.equal(SITE_CLIENT_APK, '/download/Guardr-Client.apk');
    assert.equal(SITE_GUARD_APK, '/download/Guardr-Guard.apk');
    assert.equal(SITE_STAFF_APK, '/download/Guardr-Staff.apk');
    for (const app of SITE_ROLE_APKS) {
      assert.equal(app.url.startsWith('/download/'), true);
      assert.ok(!app.url.includes('github.com'));
    }
  });
});
