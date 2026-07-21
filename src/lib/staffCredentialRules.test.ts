import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Certification, SecurityGuard } from '../types';
import {
  staffCanEditCertification,
  staffCanEditExistingCredential,
  staffCanEditGuardCoi,
  staffCanEditGuardGovernmentId,
} from './staffCredentialRules.ts';

function guard(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'g1',
    name: 'Alex',
    email: 'a@test.com',
    userStatus: 'pending',
    isStaff: false,
    certifications: [],
    ...overrides,
  } as SecurityGuard;
}

describe('staffCredentialRules', () => {
  it('allows staff to edit pending credentials before decision', () => {
    assert.equal(
      staffCanEditExistingCredential({ guard: guard(), credentialStatus: 'pending' }),
      true
    );
  });

  it('blocks staff from creating not-yet-submitted credentials', () => {
    assert.equal(
      staffCanEditExistingCredential({ guard: guard(), credentialStatus: 'not_submitted' }),
      false
    );
    assert.equal(staffCanEditExistingCredential({ guard: guard() }), false);
  });

  it('blocks staff from editing verified credentials without an update request', () => {
    assert.equal(
      staffCanEditExistingCredential({
        guard: guard({ userStatus: 'active' }),
        credentialStatus: 'verified',
      }),
      false
    );
  });

  it('blocks staff from editing rejected credentials without an update request', () => {
    assert.equal(
      staffCanEditExistingCredential({ guard: guard(), credentialStatus: 'rejected' }),
      false
    );
  });

  it('allows staff edit when an update was requested after a decision', () => {
    assert.equal(
      staffCanEditExistingCredential({
        guard: guard({ userStatus: 'active' }),
        credentialStatus: 'verified',
        updateRequested: true,
      }),
      true
    );
    assert.equal(
      staffCanEditExistingCredential({
        guard: guard(),
        credentialStatus: 'rejected',
        updateRequested: true,
      }),
      true
    );
  });

  it('gates certification / ID / COI helpers consistently', () => {
    const pendingCert = { status: 'pending', updateRequestedAt: undefined } as Certification;
    const verifiedCert = { status: 'verified', updateRequestedAt: undefined } as Certification;
    const rejectedCert = { status: 'rejected', updateRequestedAt: undefined } as Certification;
    assert.equal(staffCanEditCertification(guard(), pendingCert), true);
    assert.equal(staffCanEditCertification(guard({ userStatus: 'approved' }), verifiedCert), false);
    assert.equal(staffCanEditCertification(guard(), rejectedCert), false);

    assert.equal(
      staffCanEditGuardGovernmentId(guard({ idVerificationStatus: 'pending' })),
      true
    );
    assert.equal(
      staffCanEditGuardGovernmentId(guard({ idVerificationStatus: 'not_submitted' })),
      false
    );
    assert.equal(
      staffCanEditGuardGovernmentId(
        guard({ userStatus: 'active', idVerificationStatus: 'verified' })
      ),
      false
    );
    assert.equal(
      staffCanEditGuardGovernmentId(
        guard({
          userStatus: 'active',
          idVerificationStatus: 'verified',
          idUpdateRequestedAt: '2026-01-01T00:00:00.000Z',
        })
      ),
      true
    );

    assert.equal(
      staffCanEditGuardCoi(
        guard({
          insurancePolicy: {
            id: 'i1',
            guardId: 'g1',
            carrier: 'Acme',
            policyNumber: '1',
            documentUrl: 'c.jpg',
            status: 'pending',
          },
        })
      ),
      true
    );
    assert.equal(
      staffCanEditGuardCoi(
        guard({
          userStatus: 'active',
          insurancePolicy: {
            id: 'i1',
            guardId: 'g1',
            carrier: 'Acme',
            policyNumber: '1',
            documentUrl: 'c.jpg',
            status: 'verified',
          },
        })
      ),
      false
    );
    assert.equal(staffCanEditGuardCoi(guard({ insurancePolicy: undefined })), false);
  });
});
