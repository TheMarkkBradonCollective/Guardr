import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isExecutiveStaffRole,
  normalizeStaffManagedCitiesForRole,
  staffRequiresCityAssignment,
  validateStaffCityAssignment,
} from './staffCityAccess.ts';
import type { PlatformCity } from './platformCities.ts';

const cities: PlatformCity[] = [
  {
    id: 'sacramento',
    name: 'Sacramento',
    stateCode: 'CA',
    status: 'open',
    waitlistAudience: 'both',
    recommendOpen: false,
    sortOrder: 0,
    cityManagerId: 'manager-1',
  },
];

describe('staffCityAccess', () => {
  it('treats directors and founders as platform-wide', () => {
    assert.equal(isExecutiveStaffRole('Director'), true);
    assert.equal(staffRequiresCityAssignment('Director'), false);
    assert.deepEqual(
      normalizeStaffManagedCitiesForRole('Founder', ['Sacramento'], cities),
      []
    );
  });

  it('limits managers and below to one city', () => {
    assert.equal(staffRequiresCityAssignment('Manager'), true);
    assert.deepEqual(
      normalizeStaffManagedCitiesForRole('Administrator', ['Sacramento', 'Oakland'], cities),
      ['Sacramento']
    );
  });

  it('rejects executive city assignments', () => {
    assert.throws(
      () => validateStaffCityAssignment('Director', ['Sacramento']),
      /not assigned to a city/
    );
  });

  it('enforces one manager per city', () => {
    assert.throws(
      () =>
        validateStaffCityAssignment('Manager', ['Sacramento'], {
          staffId: 'manager-2',
          platformCities: cities,
        }),
      /already has a city manager/
    );
  });
});
