import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { GuardInsurancePolicy, SecurityGuard } from '../types';
import { guardCoiCanGuardEdit } from './guardInsurance.ts';

function policy(overrides: Partial<GuardInsurancePolicy> = {}): GuardInsurancePolicy {
  return {
    id: 'ins-1',
    guardId: 'g1',
    carrier: 'Acme',
    policyNumber: 'POL-1',
    documentUrl: 'coi.jpg',
    status: 'pending',
    ...overrides,
  };
}

function guard(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'g1',
    name: 'Alex',
    email: 'alex@test.com',
    certifications: [],
    insurancePolicy: policy(),
    ...overrides,
  } as SecurityGuard;
}

describe('guardCoiCanGuardEdit', () => {
  it('allows first upload when no policy is on file', () => {
    assert.equal(guardCoiCanGuardEdit(guard({ insurancePolicy: undefined })), true);
  });

  it('locks pending COI after document is submitted', () => {
    assert.equal(guardCoiCanGuardEdit(guard()), false);
  });

  it('allows edit after rejection', () => {
    assert.equal(
      guardCoiCanGuardEdit(guard({ insurancePolicy: policy({ status: 'rejected' }) })),
      true
    );
  });

  it('allows edit when staff requested an update on a verified COI', () => {
    assert.equal(
      guardCoiCanGuardEdit(
        guard({
          insurancePolicy: policy({
            status: 'verified',
            updateRequestedAt: '2026-07-21T00:00:00.000Z',
          }),
        })
      ),
      true
    );
  });

  it('keeps verified COI locked without an update request', () => {
    assert.equal(
      guardCoiCanGuardEdit(guard({ insurancePolicy: policy({ status: 'verified' }) })),
      false
    );
  });
});
