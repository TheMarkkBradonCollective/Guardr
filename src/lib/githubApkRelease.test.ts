import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  GITHUB_ALL_APKS_ZIP,
  GITHUB_CLIENT_APK,
  GITHUB_GUARD_APK,
  GITHUB_STAFF_APK,
  GITHUB_ROLE_APKS,
} from './githubApkRelease.ts';

describe('GitHub APK release URLs', () => {
  it('points the all-apps zip at GitHub Releases, not the website', () => {
    assert.match(GITHUB_ALL_APKS_ZIP, /github\.com\/TheMarkkBradonCollective\/Guardr\/releases\/latest\/download\/Guardr-All-APKs\.zip$/);
    assert.ok(!GITHUB_ALL_APKS_ZIP.includes('guardr.co'));
  });

  it('lists Client, Guard, and Staff APK assets', () => {
    assert.equal(GITHUB_ROLE_APKS.map((app) => app.label).join(' '), 'Hire Work Staff');
    assert.equal(GITHUB_CLIENT_APK.endsWith('Guardr-Client.apk'), true);
    assert.equal(GITHUB_GUARD_APK.endsWith('Guardr-Guard.apk'), true);
    assert.equal(GITHUB_STAFF_APK.endsWith('Guardr-Staff.apk'), true);
  });
});
