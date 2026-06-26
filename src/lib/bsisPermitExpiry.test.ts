import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Certification, SecurityGuard } from '../types';
import { credentialRequiresExpiry } from './certCatalog.ts';
import { guardHasVerifiedCert } from './certMatching.ts';
import { guardHasCredentialOnFile } from './guardQualification.ts';
import { getCredentialUploadLabel } from './certStatus.ts';

function permitCert(overrides: Partial<Certification> = {}): Certification {
  return {
    id: 'permit-1',
    catalogId: 'bsis-exposed-firearm',
    name: 'BSIS Exposed Firearm Permit',
    issuer: 'BSIS',
    number: 'FP-1',
    issueDate: '2024-01-01',
    status: 'verified',
    imageUrl: 'scan',
    category: 'bsis-permit',
    ...overrides,
  };
}

const guardWithPermit = (cert: Certification) =>
  ({
    id: 'g1',
    certifications: [cert],
  }) as SecurityGuard;

describe('credentialRequiresExpiry', () => {
  it('requires expiry for BSIS weapons permits only', () => {
    assert.equal(credentialRequiresExpiry('bsis-exposed-firearm'), true);
    assert.equal(credentialRequiresExpiry('bsis-baton'), true);
    assert.equal(credentialRequiresExpiry('bsis-pta-uof-8hr'), false);
    assert.equal(credentialRequiresExpiry('bsis-guard-card'), false);
  });
});

describe('BSIS permit expiry enforcement', () => {
  it('does not count expired permits on file', () => {
    const guard = guardWithPermit(
      permitCert({ expiryDate: '2020-01-01', status: 'verified' })
    );
    assert.equal(guardHasCredentialOnFile(guard, 'bsis-exposed-firearm'), false);
    assert.equal(guardHasVerifiedCert(guard, 'bsis-exposed-firearm'), false);
  });

  it('counts current permits with expiry on file', () => {
    const guard = guardWithPermit(
      permitCert({ expiryDate: '2099-12-31', status: 'verified' })
    );
    assert.equal(guardHasCredentialOnFile(guard, 'bsis-exposed-firearm'), true);
    assert.equal(guardHasVerifiedCert(guard, 'bsis-exposed-firearm'), true);
  });

  it('flags permits missing expiry date', () => {
    const cert = permitCert({ expiryDate: undefined, status: 'verified' });
    const guard = guardWithPermit(cert);
    assert.equal(guardHasCredentialOnFile(guard, 'bsis-exposed-firearm'), false);
    assert.equal(getCredentialUploadLabel(cert), 'On file · Expiry required');
  });
});
