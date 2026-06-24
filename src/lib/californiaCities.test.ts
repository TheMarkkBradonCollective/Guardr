import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  licenseStatesMatch,
  resolveGuardCardLicenseState,
  resolveJobLicenseState,
} from './californiaCities.ts';

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
