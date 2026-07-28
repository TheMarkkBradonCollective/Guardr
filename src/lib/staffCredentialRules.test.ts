import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Certification, SecurityGuard } from '../types';
import {
  staffCanEditCertification,
  staffCanEditExistingCredential,
  staffCanEditGuardCoi,
  staffCanEditGuardGovernmentId,
  staffCanSetGovernmentIdDocumentType,
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
  it('never allows staff to edit credential data', () => {
    assert.equal(
      staffCanEditExistingCredential({ guard: guard(), credentialStatus: 'pending' }),
      false
    );
    assert.equal(
      staffCanEditExistingCredential({ guard: guard(), credentialStatus: 'not_submitted' }),
      false
    );
    assert.equal(staffCanEditExistingCredential({ guard: guard() }), false);
    assert.equal(
      staffCanEditExistingCredential({
        guard: guard({ userStatus: 'active' }),
        credentialStatus: 'verified',
      }),
      false
    );
    assert.equal(
      staffCanEditExistingCredential({
        guard: guard(),
        credentialStatus: 'rejected',
      }),
      false
    );
    assert.equal(
      staffCanEditExistingCredential({
        guard: guard({ userStatus: 'active' }),
        credentialStatus: 'verified',
        updateRequested: true,
      }),
      false
    );
  });

  it('allows staff to set government ID document type during pending review only', () => {
    assert.equal(
      staffCanSetGovernmentIdDocumentType(guard({ idVerificationStatus: 'pending' })),
      true
    );
    assert.equal(
      staffCanSetGovernmentIdDocumentType(guard({ idVerificationStatus: 'not_submitted' })),
      false
    );
    assert.equal(
      staffCanSetGovernmentIdDocumentType(
        guard({ userStatus: 'active', idVerificationStatus: 'verified' })
      ),
      false
    );
    assert.equal(
      staffCanSetGovernmentIdDocumentType(
        guard({
          userStatus: 'active',
          idVerificationStatus: 'verified',
          idDocumentType: 'state_id',
        })
      ),
      false
    );
  });

  it('gates certification / ID / COI helpers consistently', () => {
    const pendingCert = { status: 'pending', updateRequestedAt: undefined } as Certification;
    const verifiedCert = { status: 'verified', updateRequestedAt: undefined } as Certification;
    const rejectedCert = { status: 'rejected', updateRequestedAt: undefined } as Certification;
    assert.equal(staffCanEditCertification(guard(), pendingCert), false);
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
      false
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
