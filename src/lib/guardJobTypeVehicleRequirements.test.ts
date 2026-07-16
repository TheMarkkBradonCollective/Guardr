import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  guardCanEnableJobTypePreference,
  jobTypeRequiresVerifiedVehicle,
} from './guardJobTypeVehicleRequirements.ts';
import type { SecurityGuard } from '../types.ts';

function guardWithVehicleStatus(status: 'draft' | 'pending' | 'verified' | 'rejected'): SecurityGuard {
  return {
    id: 'g1',
    vehicleProfile: {
      id: 'v1',
      guardId: 'g1',
      make: 'Toyota',
      model: 'Camry',
      plateNumber: 'ABC123',
      plateState: 'CA',
      status,
    },
  } as SecurityGuard;
}

describe('jobTypeRequiresVerifiedVehicle', () => {
  it('requires vehicle for vehicle patrol, armed escort, and legacy patrol', () => {
    assert.equal(jobTypeRequiresVerifiedVehicle('vehicle-patrol'), true);
    assert.equal(jobTypeRequiresVerifiedVehicle('armed-escort'), true);
    assert.equal(jobTypeRequiresVerifiedVehicle('patrol'), true);
    assert.equal(jobTypeRequiresVerifiedVehicle('foot-patrol'), false);
    assert.equal(jobTypeRequiresVerifiedVehicle('standing-guard'), false);
  });
});

describe('guardCanEnableJobTypePreference', () => {
  it('blocks vehicle-required types until vehicle is verified', () => {
    const unverified = guardWithVehicleStatus('pending');
    const verified = guardWithVehicleStatus('verified');

    assert.equal(guardCanEnableJobTypePreference(unverified, 'vehicle-patrol'), false);
    assert.equal(guardCanEnableJobTypePreference(verified, 'vehicle-patrol'), true);
    assert.equal(guardCanEnableJobTypePreference(unverified, 'foot-patrol'), true);
    assert.equal(guardCanEnableJobTypePreference(unverified, 'armed-escort'), false);
    assert.equal(guardCanEnableJobTypePreference(verified, 'armed-escort'), true);
  });
});
