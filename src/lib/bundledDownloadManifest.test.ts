import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { bundledDownloadVersionManifest } from './bundledDownloadManifest';
import { APP_VERSION } from './appVersion';
import { R2_APK_LATEST_URL } from './githubApkRelease';

describe('bundledDownloadVersionManifest', () => {
  it('uses package version and the public R2 APK URL', () => {
    const manifest = bundledDownloadVersionManifest();
    assert.equal(manifest.apkVersion, APP_VERSION);
    assert.equal(manifest.apkUrl, R2_APK_LATEST_URL);
    assert.equal(manifest.apkDirectUrl, R2_APK_LATEST_URL);
    assert.match(manifest.apkDirectUrl ?? '', /^https:\/\/pub-07d688bf950545ddba9025a723c0798e\.r2\.dev\/guardr\/latest\.apk$/);
  });
});
