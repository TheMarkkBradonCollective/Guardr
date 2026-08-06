import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CREDENTIAL_LINK_KEYS,
  PLATFORM_DEFAULT_CREDENTIAL_LINKS,
  credentialLinksAreEqual,
  formatCredentialLinkDisplay,
  isValidCredentialResourceUrl,
  parseCredentialResourceLinks,
  resolveCredentialLinksForActivationStep,
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
          label: 'Guard Card Courses — 8-hour group',
          price: '$49',
        },
        {
          url: 'https://www.valleyguardonline.com/',
          label: 'Valley Guard Online',
        },
      ],
      'bsis-power-to-arrest': [
        {
          url: 'https://www.valleyguardonline.com/',
          label: 'Valley Guard Online — Power to Arrest',
        },
      ],
      continuedEducation: [
        {
          url: 'https://www.guardcardcourses.com/pk102.asp',
          label: 'Guard Card Courses — 32-hour package',
          price: '$65',
        },
      ],
      'bsis-public-relations': [
        {
          url: 'https://www.guardcardcourses.com/pk102.asp',
          label: 'Guard Card Courses — Public Relations (4 hr)',
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

  it('parses legacy single-link objects, arrays, and catalog keys', () => {
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
        { url: 'https://www.valleyguardonline.com/', label: 'Valley Guard' },
      ],
      'bsis-public-relations': [
        { url: 'https://www.guardcardcourses.com/pk102.asp', label: 'Public Relations' },
      ],
    });
    assert.equal(modern?.ptaUof?.length, 2);
    assert.equal(modern?.['bsis-public-relations']?.length, 1);
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
  });

  it('includes platform defaults for all activation keys', () => {
    assert.ok(PLATFORM_DEFAULT_CREDENTIAL_LINKS.govId?.length);
    assert.ok(PLATFORM_DEFAULT_CREDENTIAL_LINKS.ptaUof?.length);
    assert.ok(isValidCredentialResourceUrl(PLATFORM_DEFAULT_CREDENTIAL_LINKS.ptaUof![0].url));
  });

  it('merges group and individual catalog keys for activation steps', () => {
    setPlatformCitiesCache(sampleCities);
    const ptaLinks = resolveCredentialLinksForActivationStep('ptaUof', sampleCities[0]);
    assert.ok(ptaLinks.some((link) => link.url.includes('guardcardcourses')));
    assert.ok(ptaLinks.some((link) => link.url.includes('valleyguardonline')));
    assert.ok(ptaLinks.some((link) => link.label?.includes('Power to Arrest')));

    const ceLinks = resolveCredentialLinksForActivationStep('continuedEducation', sampleCities[0]);
    assert.ok(ceLinks.some((link) => link.label?.includes('32-hour')));
    assert.ok(ceLinks.some((link) => link.label?.includes('Public Relations')));
  });

  it('uses guard primary service area for link resolution', () => {
    setPlatformCitiesCache(sampleCities);
    const guard = {
      serviceAreas: ['Sacramento', 'Los Angeles'],
    } as SecurityGuard;
    assert.equal(resolveGuardCredentialCityName(guard, sampleCities), 'Sacramento');
    const links = resolveCredentialLinksForGuard(guard, sampleCities);
    assert.ok(links.ptaUof.length >= 2);
  });

  it('compares credential link maps', () => {
    const a = { coi: [{ url: 'https://example.com/coi' }] };
    const b = { coi: [{ url: 'https://example.com/coi' }] };
    const c = { coi: [{ url: 'https://other.com/coi' }] };
    assert.equal(credentialLinksAreEqual(a, b), true);
    assert.equal(credentialLinksAreEqual(a, c), false);
  });

  it('knows all catalog and activation keys', () => {
    assert.ok(CREDENTIAL_LINK_KEYS.includes('bsis-public-relations'));
    assert.ok(CREDENTIAL_LINK_KEYS.includes('continuedEducation'));
  });
});
