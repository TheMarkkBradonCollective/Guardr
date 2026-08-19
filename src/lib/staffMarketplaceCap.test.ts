import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Client, SecurityGuard } from '../types.ts';
import {
  assertStaffCityCapacity,
  countMarketplaceUsersInCity,
  countStaffInCity,
  maxStaffSlotsForCity,
  newlyAssignedStaffCities,
  staffCityCapSnapshot,
} from './staffMarketplaceCap.ts';

function guard(partial: Partial<SecurityGuard> & { id: string }): SecurityGuard {
  return {
    id: partial.id,
    name: partial.name ?? 'Guard',
    email: `${partial.id}@example.com`,
    badgeNumber: partial.badgeNumber ?? 'G-1',
    avatar: '',
    phone: '',
    bio: '',
    isArmed: false,
    backgroundChecked: false,
    verified: false,
    rating: 0,
    jobsCompleted: 0,
    certifications: [],
    experience: [],
    ...partial,
  };
}

function client(partial: Partial<Client> & { id: string }): Client {
  return {
    id: partial.id,
    name: partial.name ?? 'Client',
    email: `${partial.id}@example.com`,
    companyName: partial.companyName ?? 'Client Co',
    phone: '',
    avatar: '',
    totalRequests: 0,
    approved: partial.accountStatus === 'active',
    ...partial,
  };
}

describe('staffMarketplaceCap', () => {
  it('counts active marketplace users in a city', () => {
    const guards = [
      guard({ id: 'g1', userStatus: 'active', serviceAreas: ['Sacramento'] }),
      guard({ id: 'g2', userStatus: 'pending', serviceAreas: ['Sacramento'] }),
      guard({ id: 'g3', userStatus: 'active', serviceAreas: ['Oakland'] }),
    ];
    const clients = [
      client({ id: 'c1', accountStatus: 'active', serviceCity: 'Sacramento' }),
      client({ id: 'c2', accountStatus: 'pending', serviceCity: 'Sacramento' }),
    ];
    assert.equal(countMarketplaceUsersInCity('Sacramento', guards, clients), 2);
  });

  it('scales staff slots with marketplace users and enforces a floor', () => {
    assert.equal(maxStaffSlotsForCity(0), 2);
    assert.equal(maxStaffSlotsForCity(150), 2);
    assert.equal(maxStaffSlotsForCity(250), 2);
    assert.equal(maxStaffSlotsForCity(300), 3);
  });

  it('counts city-scoped staff but not directors or founders', () => {
    const roster = [
      guard({ id: 's1', isStaff: true, staffRole: 'Support', userStatus: 'active', managedCities: ['Sacramento'] }),
      guard({ id: 's2', isStaff: true, staffRole: 'Director', userStatus: 'active', managedCities: [] }),
      guard({ id: 's3', isStaff: true, staffRole: 'Manager', userStatus: 'active', managedCities: ['Sacramento'] }),
    ];
    assert.equal(countStaffInCity('Sacramento', roster), 2);
  });

  it('blocks assignments when a city is at capacity', () => {
    const guards = Array.from({ length: 120 }, (_, index) =>
      guard({
        id: `g-${index}`,
        userStatus: 'active',
        serviceAreas: ['Sacramento'],
      })
    );
    const roster = [
      guard({ id: 's1', isStaff: true, staffRole: 'Support', userStatus: 'active', managedCities: ['Sacramento'] }),
      guard({ id: 's2', isStaff: true, staffRole: 'Moderator', userStatus: 'active', managedCities: ['Sacramento'] }),
    ];
    const snapshot = staffCityCapSnapshot('Sacramento', {
      guards,
      clients: [],
      staffRoster: roster,
    });
    assert.equal(snapshot.maxStaffSlots, 2);
    assert.equal(snapshot.atCapacity, true);

    assert.throws(
      () =>
        assertStaffCityCapacity(['Sacramento'], {
          guards,
          clients: [],
          staffRoster: roster,
        }),
      /at the staff cap/
    );
  });

  it('allows adding staff when capacity remains', () => {
    const guards = Array.from({ length: 120 }, (_, index) =>
      guard({
        id: `g-${index}`,
        userStatus: 'active',
        serviceAreas: ['Sacramento'],
      })
    );
    const roster = [
      guard({ id: 's1', isStaff: true, staffRole: 'Support', userStatus: 'active', managedCities: ['Sacramento'] }),
    ];
    assert.doesNotThrow(() =>
      assertStaffCityCapacity(['Sacramento'], {
        guards,
        clients: [],
        staffRoster: roster,
      })
    );
  });

  it('detects newly assigned cities', () => {
    assert.deepEqual(
      newlyAssignedStaffCities(['Sacramento'], ['Sacramento', 'Oakland']),
      ['Oakland']
    );
  });
});
