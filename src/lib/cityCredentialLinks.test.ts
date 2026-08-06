import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CREDENTIAL_LINK_KEYS,
  PLATFORM_DEFAULT_CREDENTIAL_LINKS,
  credentialLinksAreEqual,
  isValidCredentialResourceUrl,
  parseCredentialResourceLinks,
  resolveCredentialLinksForCity,
  resolveCredentialLinksForGuard,
  resolveGuardCredentialCityName,
  serializeCredentialResourceLinks,
} from './cityCredentialLinks.ts';
import { setPlatformCitiesCache, type PlatformCity } from './platformCities.ts';
import type { SecurityGuard } from '../types';

const sampleCities: PlatformCity[] = [
  {
    id: 'sacramento',
    name: 'Sacramento',
    stateCode: 'CA',
    status: 'open',
    waitlistAudience: 'both',
    recommendOpen: false,
    sortOrder: 0,
    credentialResourceLinks: {
      ptaUof: {
        url: 'https://www.guardcardcourses.com/sac-pta.asp',
        label: 'Sacramento PTA/UOF — local school',
      },
    },
  },
  {
    id: 'los-angeles',
    name: 'Los Angeles',
    stateCode: 'CA',
    status: 'open',
    waitlistAudience: 'both',
    recommendOpen: false,
    sortOrder: 1,
  },
];

describe('cityCredentialLinks', () => {
  it('validates http and https URLs', () => {
    assert.equal(isValidCredentialResourceUrl('https://www.guardcardcourses.com/sc101.asp'), true);
    assert.equal(isValidCredentialResourceUrl('http://example.com'), true);
    assert.equal(isValidCredentialResourceUrl('ftp://example.com'), false);
    assert.equal(isValidCredentialResourceUrl('not-a-url'), false);
  });

  it('parses and serializes credential resource links', () => {
    const parsed = parseCredentialResourceLinks({
      coi: { url: 'https://example.com/coi', label: 'Get COI' },
      ptaUof: { url: 'invalid' },
    });
    assert.deepEqual(parsed, {
      coi: { url: 'https://example.com/coi', label: 'Get COI' },
    });
    assert.deepEqual(serializeCredentialResourceLinks(parsed), {
      coi: { url: 'https://example.com/coi', label: 'Get COI' },
    });
  });

  it('includes platform defaults for all credential keys', () => {
    for (const key of CREDENTIAL_LINK_KEYS) {
      assert.ok(PLATFORM_DEFAULT_CREDENTIAL_LINKS[key]?.url);
      assert.ok(isValidCredentialResourceUrl(PLATFORM_DEFAULT_CREDENTIAL_LINKS[key]!.url));
    }
  });

  it('city override is primary and platform default is secondary', () => {
    setPlatformCitiesCache(sampleCities);
    const links = resolveCredentialLinksForCity('Sacramento', sampleCities);
    assert.equal(links.ptaUof.length, 2);
    assert.equal(links.ptaUof[0].source, 'city');
    assert.equal(links.ptaUof[0].url, 'https://www.guardcardcourses.com/sac-pta.asp');
    assert.equal(links.ptaUof[1].source, 'platform');
    assert.equal(links.ptaUof[1].url, PLATFORM_DEFAULT_CREDENTIAL_LINKS.ptaUof!.url);
  });

  it('uses guard primary service area for link resolution', () => {
    setPlatformCitiesCache(sampleCities);
    const guard = {
      serviceAreas: ['Sacramento', 'Los Angeles'],
    } as SecurityGuard;
    assert.equal(resolveGuardCredentialCityName(guard, sampleCities), 'Sacramento');
    const links = resolveCredentialLinksForGuard(guard, sampleCities);
    assert.equal(links.ptaUof[0].source, 'city');
  });

  it('compares credential link maps', () => {
    const a = { coi: { url: 'https://example.com/coi' } };
    const b = { coi: { url: 'https://example.com/coi' } };
    const c = { coi: { url: 'https://other.com/coi' } };
    assert.equal(credentialLinksAreEqual(a, b), true);
    assert.equal(credentialLinksAreEqual(a, c), false);
  });
});
