import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SecurityGuard } from '../types';
import { getCoiCredentialRecords, getGovIdCredentialRecords } from './credentialRecordBuilders';

function baseGuard(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'g-1',
    name: 'Test Guard',
    email: 'guard@test.com',
    ...overrides,
  } as SecurityGuard;
}

describe('credentialRecordBuilders', () => {
  it('builds COI records with document image and policy details', () => {
    const records = getCoiCredentialRecords(
      baseGuard({
        insurancePolicy: {
          id: 'ins-1',
          guardId: 'g-1',
          carrier: 'Acme Insurance',
          policyNumber: 'POL-123',
          expiryDate: '2030-01-01',
          documentUrl: 'https://example.com/coi.pdf',
          status: 'verified',
        },
      })
    );

    assert.equal(records.length, 1);
    assert.equal(records[0]?.label, 'Current on file');
    assert.equal(records[0]?.status, 'verified');
    assert.equal(records[0]?.images?.[0]?.url, 'https://example.com/coi.pdf');
    assert.ok(records[0]?.details?.some((detail) => detail.label === 'Policy number'));
  });

  it('builds government ID records with front/back/selfie images', () => {
    const records = getGovIdCredentialRecords(
      baseGuard({
        idVerificationStatus: 'pending',
        idState: 'CA',
        idNumber: 'D1234567',
        idExpiryDate: '2030-01-01',
        idFrontUrl: 'https://example.com/front.jpg',
        idBackUrl: 'https://example.com/back.jpg',
        idSelfieUrl: 'https://example.com/selfie.jpg',
      })
    );

    assert.equal(records.length, 1);
    assert.equal(records[0]?.status, 'pending');
    assert.equal(records[0]?.images?.length, 3);
    assert.equal(records[0]?.thumbnailUrl, 'https://example.com/front.jpg');
  });
});
