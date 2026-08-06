import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CREDENTIAL_LINK_KEYS,
  PLATFORM_DEFAULT_CREDENTIAL_LINKS,
  credentialLinksAreEqual,
  formatCredentialLinkDisplay,
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
      ptaUof: [
        {
          url: 'https://www.guardcardcourses.com/sc101.asp',
          label: 'Guard Card Courses',
          price: '$49',
        },
        {
          url: 'https://www.valleyguardonline.com/',
          label: 'Valley Guard Online',
          price: '$55',
        },
      ],
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

  it('parses legacy single-link objects and new arrays', () => {
    const legacy = parseCredentialResourceLinks({
      coi: { url: 'https://example.com/coi', label: 'Get COI' },
      ptaUof: { url: 'invalid' },
    });
    assert.deepEqual(legacy, {
      coi: [{ url: 'https://example.com/coi', label: 'Get COI' }],
    });

    const modern = parseCredentialResourceLinks({
      ptaUof: [
        { url: 'https://www.guardcardcourses.com/', label: 'GCC', price: '$49' },
        { url: 'https://www.valleyguardonline.com/', label: 'Valley Guard', price: '$55' },
      ],
    });
    assert.equal(modern?.ptaUof?.length, 2);
    assert.equal(modern?.ptaUof?.[0].price, '$49');
  });

  it('serializes link arrays with price', () => {
    const parsed = {
      coi: [{ url: 'https://example.com/coi', label: 'Get COI', price: '$120' }],
    };
    const serialized = serializeCredentialResourceLinks(parsed);
    assert.deepEqual(serialized, {
      coi: [{ url: 'https://example.com/coi', label: 'Get COI', price: '$120' }],
    });
  });

  it('formats display label with optional price', () => {
    assert.equal(
      formatCredentialLinkDisplay({ url: 'https://example.com', label: 'Guard Card Courses', price: '$49' }),
      'Guard Card Courses — $49'
    );
    assert.equal(
      formatCredentialLinkDisplay({ url: 'https://example.com', label: 'Valley Guard Online' }),
      'Valley Guard Online'
    );
  });

  it('includes platform defaults for all credential keys', () => {
    for (const key of CREDENTIAL_LINK_KEYS) {
      const entries = PLATFORM_DEFAULT_CREDENTIAL_LINKS[key];
      assert.ok(entries?.length);
      assert.ok(isValidCredentialResourceUrl(entries![0].url));
    }
  });

  it('city links are primary and platform defaults follow without duplicates', () => {
    setPlatformCitiesCache(sampleCities);
    const links = resolveCredentialLinksForCity('Sacramento', sampleCities);
    assert.equal(links.ptaUof.length, 2);
    assert.equal(links.ptaUof[0].source, 'city');
    assert.equal(links.ptaUof[0].url, 'https://www.guardcardcourses.com/sc101.asp');
    assert.equal(links.ptaUof[0].price, '$49');
    assert.equal(links.ptaUof[1].source, 'city');
    assert.equal(links.ptaUof[1].url, 'https://www.valleyguardonline.com/');
  });

  it('uses guard primary service area for link resolution', () => {
    setPlatformCitiesCache(sampleCities);
    const guard = {
      serviceAreas: ['Sacramento', 'Los Angeles'],
    } as SecurityGuard;
    assert.equal(resolveGuardCredentialCityName(guard, sampleCities), 'Sacramento');
    const links = resolveCredentialLinksForGuard(guard, sampleCities);
    assert.equal(links.ptaUof.length, 2);
    assert.equal(links.ptaUof[0].source, 'city');
  });

  it('compares credential link maps', () => {
    const a = { coi: [{ url: 'https://example.com/coi' }] };
    const b = { coi: [{ url: 'https://example.com/coi' }] };
    const c = { coi: [{ url: 'https://other.com/coi' }] };
    assert.equal(credentialLinksAreEqual(a, b), true);
    assert.equal(credentialLinksAreEqual(a, c), false);
  });
});
