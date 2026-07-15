import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Certification, SecurityGuard } from '../types';
import { staffCanVerifyCertification, staffVerifyCertificationBlocker } from './certImagePolicy.ts';

function cert(overrides: Partial<Certification> = {}): Certification {
  return {
    id: 'c1',
    catalogId: 'bsis-pta-uof-8hr',
    name: 'PTA & UOF',
    issuer: 'BSIS',
    number: 'TR-1',
    issueDate: '2024-01-01',
    status: 'pending',
    imageUrl: 'scan',
    category: 'bsis-training',
    ...overrides,
  };
}

function pendingApplicationGuard(): Pick<
  SecurityGuard,
  'name' | 'userStatus' | 'isStaff' | 'mustChangePassword'
> {
  return {
    name: 'Jane Guard',
    userStatus: 'pending',
    isStaff: false,
    mustChangePassword: false,
  };
}

describe('staff credential verification', () => {
  it('allows staff to verify training certificates with document proof', () => {
    const training = cert();
    assert.equal(staffCanVerifyCertification(training), true);
    assert.equal(staffVerifyCertificationBlocker(training), null);
  });

  it('allows staff to verify weapons permits with document proof', () => {
    const permit = cert({
      catalogId: 'bsis-exposed-firearm',
      name: 'BSIS Exposed Firearm Permit',
      category: 'bsis-permit',
      expiryDate: '2099-12-31',
    });
    assert.equal(staffCanVerifyCertification(permit), true);
    assert.equal(staffVerifyCertificationBlocker(permit), null);
  });

  it('blocks verification without a document photo', () => {
    const missingPhoto = cert({ imageUrl: undefined });
    assert.equal(staffCanVerifyCertification(missingPhoto), false);
    assert.match(staffVerifyCertificationBlocker(missingPhoto) ?? '', /document photo required/i);
  });

  it('does not offer verify for already verified credentials without a pending update', () => {
    const verified = cert({ status: 'verified' });
    assert.equal(staffCanVerifyCertification(verified), false);
    assert.match(staffVerifyCertificationBlocker(verified) ?? '', /pending credentials/i);
  });

  it('allows verify when a verified credential has a pending update', () => {
    const verifiedWithUpdate = cert({
      status: 'verified',
      pendingUpdate: {
        submittedAt: '2026-01-01T00:00:00.000Z',
        issuer: 'BSIS',
        number: 'TR-2',
        imageUrl: 'scan-2',
        status: 'pending',
      },
    });
    assert.equal(staffCanVerifyCertification(verifiedWithUpdate), true);
    assert.equal(staffVerifyCertificationBlocker(verifiedWithUpdate), null);
  });

  it('blocks verification while guard application is pending', () => {
    const pending = cert();
    const guard = pendingApplicationGuard();
    assert.equal(staffCanVerifyCertification(pending, guard), false);
    assert.match(staffVerifyCertificationBlocker(pending, guard) ?? '', /application must be approved/i);
    assert.match(staffVerifyCertificationBlocker(pending, guard) ?? '', /Jane Guard/);
  });
});
