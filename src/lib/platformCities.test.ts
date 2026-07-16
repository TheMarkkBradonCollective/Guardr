import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDefaultPlatformCities,
  checkCityAccessForRole,
  defaultSelectableCity,
  filterCitiesForStaffActor,
  getAssignableCityNamesForStaffAccess,
  getSelectableCityNamesForClients,
  getSelectableCityNamesForGuards,
  GUARDR_LAUNCH_CITY,
  mergeMissingPlatformCities,
  normalizeManagedCities,
  setPlatformCitiesCache,
  staffCanManageCity,
  waitlistAppliesToAudience,
  type PlatformCity,
} from './platformCities.ts';

const sampleCities: PlatformCity[] = [
  {
    id: 'los-angeles',
    name: 'Los Angeles',
    stateCode: 'CA',
    status: 'open',
    waitlistAudience: 'both',
    recommendOpen: false,
    sortOrder: 0,
  },
  {
    id: 'san-diego',
    name: 'San Diego',
    stateCode: 'CA',
    status: 'closed',
    waitlistAudience: 'both',
    recommendOpen: false,
    sortOrder: 1,
  },
  {
    id: 'oakland',
    name: 'Oakland',
    stateCode: 'CA',
    status: 'waitlist',
    waitlistAudience: 'guard',
    recommendOpen: true,
    sortOrder: 2,
  },
  {
    id: 'sacramento',
    name: 'Sacramento',
    stateCode: 'CA',
    status: 'waitlist',
    waitlistAudience: 'client',
    recommendOpen: false,
    sortOrder: 3,
  },
];

describe('platform city access', () => {
  it('defaults every seeded city to closed', () => {
    const defaults = buildDefaultPlatformCities();
    assert.equal(defaults.length, 483);
    assert.equal(defaults.every((city) => city.status === 'closed'), true);
  });

  it('adds newly canonical cities to an existing platform snapshot', () => {
    const merged = mergeMissingPlatformCities([
      {
        id: 'sacramento',
        name: 'Sacramento',
        stateCode: 'CA',
        status: 'open',
        waitlistAudience: 'both',
        recommendOpen: false,
        sortOrder: 0,
      },
    ]);
    assert.ok(merged.some((city) => city.name === 'Chico'));
    assert.ok(merged.some((city) => city.name === 'Sacramento'));
  });

  it('falls back to Sacramento when no markets are open', () => {
    setPlatformCitiesCache(buildDefaultPlatformCities());
    assert.equal(defaultSelectableCity('guard'), GUARDR_LAUNCH_CITY);
    assert.equal(defaultSelectableCity('client'), GUARDR_LAUNCH_CITY);
  });

  it('blocks closed cities for guards and clients', () => {
    setPlatformCitiesCache(sampleCities);
    const guard = checkCityAccessForRole('San Diego', 'guard');
    const client = checkCityAccessForRole('San Diego', 'client');
    assert.equal(guard.allowed, false);
    assert.equal(client.allowed, false);
    if (!guard.allowed) assert.equal(guard.reason, 'closed');
  });

  it('waitlists only the configured audience', () => {
    setPlatformCitiesCache(sampleCities);
    const guardOakland = checkCityAccessForRole('Oakland', 'guard');
    const clientOakland = checkCityAccessForRole('Oakland', 'client');
    assert.equal(guardOakland.allowed, false);
    if (!guardOakland.allowed) assert.equal(guardOakland.reason, 'waitlist');
    assert.equal(clientOakland.allowed, true);

    const clientSacramento = checkCityAccessForRole('Sacramento', 'client');
    const guardSacramento = checkCityAccessForRole('Sacramento', 'guard');
    assert.equal(clientSacramento.allowed, false);
    assert.equal(guardSacramento.allowed, true);
  });

  it('limits selectable service areas and job cities', () => {
    setPlatformCitiesCache(sampleCities);
    assert.deepEqual(getSelectableCityNamesForGuards(), ['Los Angeles', 'Sacramento']);
    assert.deepEqual(getSelectableCityNamesForClients(), ['Los Angeles', 'Oakland']);
  });
});

describe('staff city management scope', () => {
  it('directors manage every city and managers only assigned cities', () => {
    assert.equal(staffCanManageCity('director', [], 'Oakland'), true);
    assert.equal(staffCanManageCity('manager', ['Oakland'], 'Oakland'), true);
    assert.equal(staffCanManageCity('manager', ['Oakland'], 'San Diego'), false);
  });

  it('filters visible cities for managers', () => {
    const visible = filterCitiesForStaffActor(sampleCities, 'manager', ['Oakland', 'Los Angeles']);
    assert.deepEqual(
      visible.map((city) => city.name),
      ['Los Angeles', 'Oakland']
    );
  });

  it('limits assignable staff city access to open markets', () => {
    assert.deepEqual(getAssignableCityNamesForStaffAccess(sampleCities, 'director'), [
      'Los Angeles',
    ]);
    assert.deepEqual(
      getAssignableCityNamesForStaffAccess(sampleCities, 'manager', ['Oakland', 'Los Angeles']),
      ['Los Angeles']
    );
    assert.deepEqual(getAssignableCityNamesForStaffAccess(sampleCities, 'administrator'), []);
  });

  it('normalizes managed city lists', () => {
    assert.deepEqual(normalizeManagedCities(['los angeles', 'Not A City'], sampleCities), [
      'Los Angeles',
    ]);
  });

  it('waitlist audience helper', () => {
    assert.equal(waitlistAppliesToAudience('both', 'guard'), true);
    assert.equal(waitlistAppliesToAudience('client', 'guard'), false);
  });
});
