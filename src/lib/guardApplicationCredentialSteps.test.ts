import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SecurityGuard } from '../types';
import { getGuardApplicationCredentialSteps } from './guardApplicationCredentialSteps';
import { coiApprovalItemId, govIdApprovalItemId } from './guardCredentialSections';

function baseGuard(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'g-1',
    name: 'Test Guard',
    email: 'guard@test.com',
    certifications: [],
    ...overrides,
  } as SecurityGuard;
}

describe('getGuardApplicationCredentialSteps', () => {
  it('marks all required credentials pending when nothing is on file', () => {
    const steps = getGuardApplicationCredentialSteps(baseGuard());
    assert.equal(steps.length, 5);
    assert.ok(steps.every((step) => step.status === 'pending'));
    assert.ok(steps.every((step) => step.credentialItemId === null));
  });

  it('resolves view ids for submitted government ID and COI', () => {
    const guard = baseGuard({
      idVerificationStatus: 'pending',
      idState: 'CA',
      idNumber: 'A123',
      idExpiryDate: '2030-01-01',
      idFrontUrl: 'https://example.com/id.jpg',
      idBackUrl: 'https://example.com/id-back.jpg',
      idSelfieUrl: 'https://example.com/selfie.jpg',
      insurancePolicy: {
        id: 'ins-1',
        guardId: 'g-1',
        carrier: 'Carrier',
        policyNumber: 'POL-1',
        expiryDate: '2030-01-01',
        documentUrl: 'https://example.com/coi.pdf',
        status: 'pending',
      },
    });

    const steps = getGuardApplicationCredentialSteps(guard);
    const govId = steps.find((step) => step.key === 'gov-id');
    const coi = steps.find((step) => step.key === 'coi');

    assert.equal(govId?.status, 'submitted');
    assert.equal(govId?.credentialItemId, govIdApprovalItemId('g-1'));
    assert.equal(coi?.status, 'submitted');
    assert.equal(coi?.credentialItemId, coiApprovalItemId('g-1'));
  });
});
