import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PWA_MANIFESTS, pwaIconSet, pwaInstallCopy, pwaManifestIdFromLocation } from './pwaManifests.ts';

describe('pwaManifestIdFromLocation', () => {
  it('always uses the single website manifest regardless of route or product app', () => {
    assert.equal(pwaManifestIdFromLocation('/messenger', 'guard'), 'website');
    assert.equal(pwaManifestIdFromLocation('/guard/map', 'guard'), 'website');
    assert.equal(pwaManifestIdFromLocation('/client/home', 'client'), 'website');
    assert.equal(pwaManifestIdFromLocation('/staff/overview', 'staff'), 'website');
    assert.equal(pwaManifestIdFromLocation('/', 'website'), 'website');
    assert.equal(pwaManifestIdFromLocation('/account', 'website'), 'website');
  });
});

describe('PWA_MANIFESTS', () => {
  it('uses one public install manifest for the website shell', () => {
    assert.equal(PWA_MANIFESTS.website.href, '/manifest.json');
    assert.equal(PWA_MANIFESTS.website.scope, '/');
    assert.equal(PWA_MANIFESTS.website.startUrl, '/');
  });

  it('returns unified install copy', () => {
    assert.match(pwaInstallCopy('website').title, /Install Guardr/);
    assert.match(pwaInstallCopy('guard').body, /sign in/i);
  });

  it('uses distinct homescreen icons per app', () => {
    assert.equal(pwaIconSet('client').any192, '/icons/client-192.png');
    assert.equal(pwaIconSet('guard').maskable512, '/icons/guard-maskable-512.png');
    assert.equal(pwaIconSet('staff').any512, '/icons/staff-512.png');
    assert.equal(pwaIconSet('messenger').any192, '/icons/messenger-192.png');
    assert.equal(pwaIconSet('website').any192, '/icon-192.png');
  });
});
