import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Certification, SecurityGuard } from '../types';
import {
  captureCertApplicationSnapshot,
  captureCoiApplicationSnapshot,
  captureGovIdApplicationSnapshot,
  getApplicationSnapshotCredentialSteps,
  isApplicationCredentialSnapshotSealed,
  sealApplicationSubmissionSnapshot,
  unsealApplicationSubmissionSnapshot,
} from './applicationSubmissionSnapshot.ts';

function baseGuard(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'g1',
    name: 'Alex Guard',
    email: 'alex@test.com',
    userStatus: 'pending',
    isStaff: false,
    certifications: [],
    ...overrides,
  } as SecurityGuard;
}

function guardCard(overrides: Partial<Certification> = {}): Certification {
  return {
    id: 'cert-card',
    catalogId: 'bsis-guard-card',
    name: 'BSIS Guard Card',
    issuer: 'BSIS',
    number: 'GC-1',
    state: 'CA',
    issueDate: '2024-01-01',
    status: 'pending',
    imageUrl: 'card.jpg',
    category: 'guard-card',
    ...overrides,
  } as Certification;
}

describe('applicationSubmissionSnapshot', () => {
  it('captures first gov-id submit into the application package', () => {
    const guard = baseGuard({
      idVerificationStatus: 'pending',
      idState: 'CA',
      idNumber: 'D123',
      idExpiryDate: '2099-01-01',
      idFrontUrl: 'front.jpg',
      idBackUrl: 'back.jpg',
      idSelfieUrl: 'selfie.jpg',
    });
    const next = captureGovIdApplicationSnapshot(guard);
    assert.ok(next);
    assert.equal(next?.credentials['gov-id']?.status, 'submitted');
    assert.equal(next?.credentials['gov-id']?.documentUrl, 'front.jpg');
  });

  it('does not overwrite an existing credential slot before seal', () => {
    const first = captureGovIdApplicationSnapshot(
      baseGuard({
        idVerificationStatus: 'pending',
        idFrontUrl: 'first.jpg',
        idBackUrl: 'back.jpg',
        idSelfieUrl: 'selfie.jpg',
        idState: 'CA',
        idNumber: '1',
        idExpiryDate: '2099-01-01',
      })
    );
    assert.ok(first);
    const second = captureGovIdApplicationSnapshot(
      baseGuard({
        applicationSubmissionSnapshot: first!,
        idVerificationStatus: 'pending',
        idFrontUrl: 'second.jpg',
        idBackUrl: 'back.jpg',
        idSelfieUrl: 'selfie.jpg',
        idState: 'CA',
        idNumber: '1',
        idExpiryDate: '2099-01-01',
      })
    );
    assert.equal(second, null);
  });

  it('seals the package on approval so later live uploads do not rewrite it', () => {
    const withCard = baseGuard({
      certifications: [guardCard()],
      insurancePolicy: {
        id: 'ins-1',
        guardId: 'g1',
        carrier: 'Acme',
        policyNumber: 'P1',
        documentUrl: 'coi.jpg',
        status: 'pending',
      },
    });
    const sealed = sealApplicationSubmissionSnapshot(withCard, '2026-07-21T12:00:00.000Z');
    assert.equal(sealed.sealedAt, '2026-07-21T12:00:00.000Z');
    assert.ok(sealed.credentials['guard-card']);
    assert.ok(sealed.credentials.coi);

    const later = captureCertApplicationSnapshot(
      baseGuard({
        userStatus: 'active',
        applicationSubmissionSnapshot: sealed,
        certifications: [guardCard({ id: 'cert-card-2', imageUrl: 'new-card.jpg', number: 'GC-2' })],
      }),
      guardCard({ id: 'cert-card-2', imageUrl: 'new-card.jpg', number: 'GC-2' })
    );
    assert.equal(later, null);
    assert.equal(isApplicationCredentialSnapshotSealed({ applicationSubmissionSnapshot: sealed }), true);
  });

  it('allows replacing snapshot slots after staff requests revision', () => {
    const sealed = sealApplicationSubmissionSnapshot(
      baseGuard({
        certifications: [guardCard()],
      })
    );
    const opened = unsealApplicationSubmissionSnapshot(sealed);
    const replaced = captureCertApplicationSnapshot(
      baseGuard({
        applicationSubmissionSnapshot: opened,
        applicationRevisionRequestedAt: '2026-07-21T13:00:00.000Z',
        certifications: [guardCard({ imageUrl: 'revised.jpg', number: 'GC-9' })],
      }),
      guardCard({ imageUrl: 'revised.jpg', number: 'GC-9' })
    );
    assert.ok(replaced);
    assert.equal(replaced?.credentials['guard-card']?.documentUrl, 'revised.jpg');
  });

  it('prefers snapshot steps for the Applications checklist', () => {
    const sealed = sealApplicationSubmissionSnapshot(
      baseGuard({
        certifications: [guardCard()],
        idVerificationStatus: 'pending',
        idFrontUrl: 'front.jpg',
        idBackUrl: 'back.jpg',
        idSelfieUrl: 'selfie.jpg',
        idState: 'CA',
        idNumber: '1',
        idExpiryDate: '2099-01-01',
      })
    );
    const steps = getApplicationSnapshotCredentialSteps(
      baseGuard({
        applicationSubmissionSnapshot: sealed,
        // Live credentials changed after decision:
        certifications: [],
        idVerificationStatus: 'not_submitted',
        idFrontUrl: undefined,
      })
    );
    const card = steps.find((s) => s.key === 'guard-card');
    const gov = steps.find((s) => s.key === 'gov-id');
    assert.equal(card?.fromSnapshot, true);
    assert.equal(card?.status, 'submitted');
    assert.equal(gov?.fromSnapshot, true);
    assert.equal(gov?.status, 'submitted');
  });

  it('captures COI into the application package on first submit', () => {
    const next = captureCoiApplicationSnapshot(
      baseGuard(),
      {
        id: 'ins-1',
        guardId: 'g1',
        carrier: 'Acme',
        policyNumber: 'P1',
        documentUrl: 'coi.jpg',
        status: 'pending',
      }
    );
    assert.ok(next?.credentials.coi);
    assert.equal(next?.credentials.coi?.documentUrl, 'coi.jpg');
  });
});
