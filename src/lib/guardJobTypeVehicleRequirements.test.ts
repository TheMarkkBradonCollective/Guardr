import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  guardCanEnableJobTypePreference,
  jobTypeRequiresVerifiedVehicle,
} from './guardJobTypeVehicleRequirements.ts';
import type { SecurityGuard } from '../types.ts';

function guardWithVehicleStatus(
  status: 'draft' | 'pending' | 'verified' | 'rejected',
  insurance?: SecurityGuard['vehicleInsurancePolicy']
): SecurityGuard {
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
    vehicleInsurancePolicy: insurance,
  } as SecurityGuard;
}

const verifiedInsurance = {
  id: 'vins-1',
  guardId: 'g1',
  carrier: 'State Farm',
  policyNumber: 'POL123',
  expiryDate: '2030-01-01',
  documentUrl: 'insurance.pdf',
  status: 'verified' as const,
};

const expiredInsurance = {
  ...verifiedInsurance,
  expiryDate: '2020-01-01',
};

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
  it('blocks vehicle-required types until vehicle and insurance are verified', () => {
    const unverified = guardWithVehicleStatus('pending');
    const verified = guardWithVehicleStatus('verified', verifiedInsurance);
    const expiredInsuranceGuard = guardWithVehicleStatus('verified', expiredInsurance);

    assert.equal(guardCanEnableJobTypePreference(unverified, 'vehicle-patrol'), false);
    assert.equal(guardCanEnableJobTypePreference(verified, 'vehicle-patrol'), true);
    assert.equal(guardCanEnableJobTypePreference(expiredInsuranceGuard, 'vehicle-patrol'), false);
    assert.equal(guardCanEnableJobTypePreference(unverified, 'foot-patrol'), true);
    assert.equal(guardCanEnableJobTypePreference(unverified, 'armed-escort'), false);
    assert.equal(guardCanEnableJobTypePreference(verified, 'armed-escort'), true);
    assert.equal(guardCanEnableJobTypePreference(expiredInsuranceGuard, 'armed-escort'), false);
  });
});
