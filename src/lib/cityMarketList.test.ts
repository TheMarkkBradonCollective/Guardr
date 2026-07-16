import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  countCityMarketsByFilter,
  filterAndSortCityMarkets,
  sortCityMarkets,
  type CityMarketSort,
} from './cityMarketList.ts';
import type { PlatformCity } from './platformCities.ts';

const sample: PlatformCity[] = [
  {
    id: 'chico',
    name: 'Chico',
    stateCode: 'CA',
    status: 'open',
    waitlistAudience: 'both',
    recommendOpen: false,
    sortOrder: 1,
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'sacramento',
    name: 'Sacramento',
    stateCode: 'CA',
    status: 'open',
    waitlistAudience: 'both',
    recommendOpen: true,
    sortOrder: 2,
    updatedAt: '2026-01-03T00:00:00.000Z',
  },
  {
    id: 'oakland',
    name: 'Oakland',
    stateCode: 'CA',
    status: 'waitlist',
    waitlistAudience: 'guard',
    recommendOpen: false,
    sortOrder: 3,
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'los-angeles',
    name: 'Los Angeles',
    stateCode: 'CA',
    status: 'closed',
    waitlistAudience: 'both',
    recommendOpen: false,
    sortOrder: 4,
  },
];

describe('cityMarketList', () => {
  it('searches by city name and status label', () => {
    const results = filterAndSortCityMarkets(sample, { search: 'chico' });
    assert.deepEqual(results.map((city) => city.name), ['Chico']);

    const waitlist = filterAndSortCityMarkets(sample, { search: 'wait' });
    assert.deepEqual(waitlist.map((city) => city.name), ['Oakland']);
  });

  it('filters by market status and recommendation flag', () => {
    const open = filterAndSortCityMarkets(sample, { statusFilter: 'open' });
    assert.deepEqual(
      open.map((city) => city.name),
      ['Chico', 'Sacramento']
    );

    const recommended = filterAndSortCityMarkets(sample, { statusFilter: 'recommended' });
    assert.deepEqual(recommended.map((city) => city.name), ['Sacramento']);
  });

  it('sorts by name, status, and updated time', () => {
    assert.deepEqual(
      sortCityMarkets(sample, 'name-desc').map((city) => city.name),
      ['Sacramento', 'Oakland', 'Los Angeles', 'Chico']
    );
    assert.deepEqual(
      sortCityMarkets(sample, 'status').map((city) => city.name),
      ['Chico', 'Sacramento', 'Oakland', 'Los Angeles']
    );
    assert.deepEqual(
      sortCityMarkets(sample, 'updated-desc').map((city) => city.name),
      ['Sacramento', 'Chico', 'Oakland', 'Los Angeles']
    );
  });

  it('counts visible tabs from the current search', () => {
    const counts = countCityMarketsByFilter(sample, 'sac');
    assert.equal(counts.all, 1);
    assert.equal(counts.open, 1);
    assert.equal(counts.recommended, 1);
  });
});
