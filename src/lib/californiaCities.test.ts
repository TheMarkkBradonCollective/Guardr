import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CALIFORNIA_CITIES,
  cityFromGeocode,
  formatServiceAreaLabel,
  guardServesJobCity,
  isCaliforniaCity,
  licenseStatesMatch,
  normalizeGuardServiceAreas,
  resolveGuardCardLicenseState,
  resolveJobLicenseState,
} from './californiaCities.ts';

describe('California incorporated cities', () => {
  it('includes all 483 municipalities', () => {
    assert.equal(CALIFORNIA_CITIES.length, 483);
  });

  it('recognizes smaller markets like Chico and Mountain House', () => {
    assert.equal(isCaliforniaCity('Chico'), true);
    assert.equal(isCaliforniaCity('Mountain House'), true);
  });

  it('prefers the longest city name in geocode text', () => {
    assert.equal(cityFromGeocode('100 Main St, South San Francisco, CA'), 'South San Francisco');
  });
});

describe('resolveGuardCardLicenseState', () => {
  it('maps California cities to CA license jurisdiction', () => {
    assert.equal(resolveGuardCardLicenseState('Los Angeles'), 'CA');
    assert.equal(resolveGuardCardLicenseState('San Francisco'), 'CA');
  });

  it('maps California state codes to CA', () => {
    assert.equal(resolveGuardCardLicenseState('CA'), 'CA');
    assert.equal(resolveGuardCardLicenseState('California'), 'CA');
  });

  it('defaults empty values to CA', () => {
    assert.equal(resolveGuardCardLicenseState(), 'CA');
    assert.equal(resolveGuardCardLicenseState(''), 'CA');
  });

  it('resolveJobLicenseState is an alias', () => {
    assert.equal(resolveJobLicenseState('Los Angeles'), 'CA');
  });
});

describe('licenseStatesMatch', () => {
  it('matches state codes to required license jurisdiction', () => {
    assert.equal(licenseStatesMatch('CA', 'CA'), true);
    assert.equal(licenseStatesMatch('ca', 'CA'), true);
  });

  it('treats legacy California city storage as CA license state', () => {
    assert.equal(licenseStatesMatch('Los Angeles', 'CA'), true);
    assert.equal(licenseStatesMatch('San Diego', 'CA'), true);
  });

  it('rejects non-matching states', () => {
    assert.equal(licenseStatesMatch('NV', 'CA'), false);
    assert.equal(licenseStatesMatch(undefined, 'CA'), false);
  });
});

describe('guard service areas', () => {
  it('normalizes California cities and drops legacy state codes', () => {
    assert.deepEqual(normalizeGuardServiceAreas(['CA', 'los angeles', 'San Diego']), [
      'Los Angeles',
      'San Diego',
    ]);
  });

  it('formats legacy statewide markers for display', () => {
    assert.equal(formatServiceAreaLabel('CA'), 'California');
    assert.equal(formatServiceAreaLabel('Los Angeles'), 'Los Angeles');
  });

  it('matches guards to job cities with legacy statewide coverage', () => {
    assert.equal(guardServesJobCity(['CA'], 'Los Angeles'), true);
    assert.equal(guardServesJobCity(['Los Angeles'], 'Los Angeles'), true);
    assert.equal(guardServesJobCity(['San Diego'], 'Los Angeles'), false);
    assert.equal(guardServesJobCity([], 'Los Angeles'), true);
  });
});
