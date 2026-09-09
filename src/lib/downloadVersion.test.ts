import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveApkDownloadUrl } from './apkDownloadUrl.ts';
import type { DownloadVersionManifest } from './downloadVersionTypes.ts';

const manifest: DownloadVersionManifest = {
  webVersion: '1.0.131-beta',
  apkVersion: '1.0.131-beta',
  apkVersionCode: 231,
  apkUrl: '/download/guardr-apps.zip?v=231',
  apkDirectUrl: 'https://www.guardr.co/download/guardr-apps.zip?v=231',
  zipUrl: '/download/guardr-apps.zip?v=231',
  zipDirectUrl: 'https://www.guardr.co/download/guardr-apps.zip?v=231',
  apps: {
    client: {
      label: 'Guardr Client',
      packageId: 'com.signaturesecurity.guardr.client',
      apkUrl: '/download/guardr-client.apk?v=231',
      apkDirectUrl: 'https://www.guardr.co/download/guardr-client.apk?v=231',
    },
    guard: {
      label: 'Guardr Guard',
      packageId: 'com.signaturesecurity.guardr.guard',
      apkUrl: '/download/guardr-guard.apk?v=231',
      apkDirectUrl: 'https://www.guardr.co/download/guardr-guard.apk?v=231',
    },
    staff: {
      label: 'Guardr Staff',
      packageId: 'com.signaturesecurity.guardr.staff',
      apkUrl: '/download/guardr-staff.apk?v=231',
    },
  },
};

describe('resolveApkDownloadUrl', () => {
  it('returns the matching role APK when requested', () => {
    assert.equal(
      resolveApkDownloadUrl(manifest, 'client'),
      'https://www.guardr.co/download/guardr-client.apk?v=231',
    );
    assert.equal(resolveApkDownloadUrl(manifest, 'staff'), '/download/guardr-staff.apk?v=231');
  });

  it('falls back to the all-apps zip when no role is selected', () => {
    assert.equal(
      resolveApkDownloadUrl(manifest, 'website'),
      'https://www.guardr.co/download/guardr-apps.zip?v=231',
    );
  });
});
