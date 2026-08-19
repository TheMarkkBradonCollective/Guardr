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

  it('allows operations staff below Manager to work multiple cities', () => {
    const openCities = [
      {
        id: 'sacramento',
        name: 'Sacramento',
        stateCode: 'CA',
        status: 'open' as const,
        waitlistAudience: 'both' as const,
        recommendOpen: false,
        sortOrder: 0,
      },
      {
        id: 'oakland',
        name: 'Oakland',
        stateCode: 'CA',
        status: 'open' as const,
        waitlistAudience: 'both' as const,
        recommendOpen: false,
        sortOrder: 1,
      },
    ];
    assert.deepEqual(
      normalizeStaffManagedCitiesForRole('Administrator', ['Sacramento', 'Oakland'], openCities),
      ['Oakland', 'Sacramento']
    );
  });

  it('limits managers to one city', () => {
    assert.equal(staffRequiresCityAssignment('Manager'), true);
    const openCities = [
      {
        id: 'sacramento',
        name: 'Sacramento',
        stateCode: 'CA',
        status: 'open' as const,
        waitlistAudience: 'both' as const,
        recommendOpen: false,
        sortOrder: 0,
      },
      {
        id: 'oakland',
        name: 'Oakland',
        stateCode: 'CA',
        status: 'open' as const,
        waitlistAudience: 'both' as const,
        recommendOpen: false,
        sortOrder: 1,
      },
    ];
    assert.deepEqual(
      normalizeStaffManagedCitiesForRole('Manager', ['Sacramento', 'Oakland'], openCities),
      ['Oakland']
    );
    assert.throws(
      () => validateStaffCityAssignment('Manager', ['Sacramento', 'Oakland'], { platformCities: openCities }),
      /only be assigned to one city/
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
