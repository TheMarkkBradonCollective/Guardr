import test from 'node:test';
import assert from 'node:assert/strict';
import {
  guardCanSubmitVehicleForApproval,
  guardDrivingPerformanceVisible,
  guardHasApprovedVehicle,
  guardHasDriversLicenseOnFile,
  guardVehicleAccessBlockedReason,
  guardVehicleTabVisible,
  staffApproveVehicleBlocker,
} from './guardVehicle.ts';
import type { SecurityGuard } from '../types.ts';

const verifiedVehicleInsurance = {
  id: 'vins-1',
  guardId: 'guard-1',
  carrier: 'State Farm',
  policyNumber: 'POL123',
  expiryDate: '2030-01-01',
  documentUrl: 'insurance.pdf',
  status: 'verified' as const,
};

const expiredVehicleInsurance = {
  ...verifiedVehicleInsurance,
  expiryDate: '2020-01-01',
  status: 'verified' as const,
};

const verifiedVehicleProfile = {
  id: 'v1',
  guardId: 'guard-1',
  make: 'Toyota',
  model: 'Camry',
  plateNumber: 'ABC123',
  plateState: 'CA',
  status: 'verified' as const,
};

const baseGuard = {
  id: 'guard-1',
  name: 'Guard One',
  idDocumentType: 'drivers_license',
  idLicenseClass: 'Class C',
  idState: 'CA',
  idNumber: 'D123',
  idExpiryDate: '2030-01-01',
  idFrontUrl: 'front.jpg',
  idBackUrl: 'back.jpg',
  idSelfieUrl: 'selfie.jpg',
  idVerificationStatus: 'verified',
} as SecurityGuard;

test('guardVehicleTabVisible requires drivers license on file', () => {
  assert.equal(guardVehicleTabVisible(baseGuard), true);
  assert.equal(guardVehicleTabVisible({ ...baseGuard, idDocumentType: 'state_id' }), false);
});

test('guardDrivingPerformanceVisible requires approved vehicle and current insurance', () => {
  assert.equal(
    guardDrivingPerformanceVisible({
      ...baseGuard,
      vehicleProfile: verifiedVehicleProfile,
      vehicleInsurancePolicy: verifiedVehicleInsurance,
    }),
    true
  );
  assert.equal(
    guardDrivingPerformanceVisible({
      ...baseGuard,
      vehicleProfile: verifiedVehicleProfile,
      vehicleInsurancePolicy: expiredVehicleInsurance,
    }),
    false
  );
  assert.equal(guardDrivingPerformanceVisible(baseGuard), false);
});

test('guardHasApprovedVehicle blocks access when vehicle insurance is expired', () => {
  assert.equal(
    guardHasApprovedVehicle({
      vehicleProfile: verifiedVehicleProfile,
      vehicleInsurancePolicy: verifiedVehicleInsurance,
    }),
    true
  );
  assert.equal(
    guardHasApprovedVehicle({
      vehicleProfile: verifiedVehicleProfile,
      vehicleInsurancePolicy: expiredVehicleInsurance,
    }),
    false
  );
  assert.match(guardVehicleAccessBlockedReason({
    vehicleProfile: verifiedVehicleProfile,
    vehicleInsurancePolicy: expiredVehicleInsurance,
  }) ?? '', /insurance has expired/i);
});

test('staffApproveVehicleBlocker requires verified license and vehicle insurance', () => {
  const blocker = staffApproveVehicleBlocker({
    ...baseGuard,
    vehicleProfile: {
      id: 'v1',
      guardId: 'guard-1',
      make: 'Toyota',
      model: 'Camry',
      plateNumber: 'ABC123',
      plateState: 'CA',
      frontPhotoUrl: 'f.jpg',
      leftSidePhotoUrl: 'l.jpg',
      rightSidePhotoUrl: 'r.jpg',
      backPhotoUrl: 'b.jpg',
      status: 'pending',
    },
  });
  assert.match(blocker ?? '', /vehicle insurance/i);
});
