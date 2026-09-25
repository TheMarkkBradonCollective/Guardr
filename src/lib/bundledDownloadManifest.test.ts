import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { bundledDownloadVersionManifest } from './bundledDownloadManifest';
import { APP_VERSION } from './appVersion';

describe('bundledDownloadVersionManifest', () => {
  it('uses package version and GitHub release URLs', () => {
    const manifest = bundledDownloadVersionManifest();
    assert.equal(manifest.apkVersion, APP_VERSION);
    assert.match(manifest.apkDirectUrl ?? '', /^https:\/\/github\.com\//);
  });
});
