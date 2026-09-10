import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PWA_MANIFESTS, pwaIconSet, pwaInstallCopy, pwaManifestIdFromLocation } from './pwaManifests.ts';

describe('pwaManifestIdFromLocation', () => {
  it('uses Messenger on the companion route regardless of stored product app', () => {
    assert.equal(pwaManifestIdFromLocation('/messenger', 'guard'), 'messenger');
    assert.equal(pwaManifestIdFromLocation('/messenger?st=1', 'client'), 'messenger');
  });

  it('uses the operational app on its own prefix', () => {
    assert.equal(pwaManifestIdFromLocation('/guard/map', 'guard'), 'guard');
    assert.equal(pwaManifestIdFromLocation('/client/home', 'client'), 'client');
    assert.equal(pwaManifestIdFromLocation('/staff/overview', 'staff'), 'staff');
  });

  it('falls back to the website on marketing and account URLs', () => {
    assert.equal(pwaManifestIdFromLocation('/', 'website'), 'website');
    assert.equal(pwaManifestIdFromLocation('/account', 'website'), 'website');
  });
});

describe('PWA_MANIFESTS', () => {
  it('gives each app a unique start URL, scope, and href', () => {
    const hrefs = Object.values(PWA_MANIFESTS).map((item) => item.href);
    assert.equal(new Set(hrefs).size, hrefs.length);
    assert.equal(PWA_MANIFESTS.guard.startUrl, '/guard/map');
    assert.equal(PWA_MANIFESTS.messenger.scope, '/messenger');
    assert.equal(PWA_MANIFESTS.client.scope, '/client/');
  });

  it('returns install copy for each app', () => {
    assert.match(pwaInstallCopy('guard').title, /Guard/);
    assert.match(pwaInstallCopy('messenger').title, /Messenger/);
  });

  it('uses distinct homescreen icons per app', () => {
    assert.equal(pwaIconSet('client').any192, '/icons/client-192.png');
    assert.equal(pwaIconSet('guard').maskable512, '/icons/guard-maskable-512.png');
    assert.equal(pwaIconSet('staff').any512, '/icons/staff-512.png');
    assert.equal(pwaIconSet('messenger').any192, '/icons/messenger-192.png');
    assert.equal(pwaIconSet('website').any192, '/icon-192.png');
  });
});
