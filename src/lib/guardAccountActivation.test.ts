import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityGuard } from '../types';
import {
  getGuardActivationChecklist,
  getApprovedGuardsAwaitingActivation,
  getGuardPendingCredentialBadgeLabels,
  getGuardRosterAccountBadges,
  getGuardRosterAccountLabel,
  getPendingGuardAccountReviews,
  guardActivationSummaryLabel,
  guardCanStaffActivateAccount,
  guardCanStaffApproveProfile,
  GUARD_PENDING_CREDENTIALS_LABEL,
  GUARD_PENDING_CREDENTIAL_VERIFICATION_LABEL,
  isGuardAccountActive,
} from './guardAccountActivation.ts';
import { GUARD_CREDENTIAL_RESTRICTED_LABEL } from './guardCredentialExpiryEnforcement.ts';
import { guardHasSubmittedItemsForStaffReview } from './approvalSubmissions.ts';

function baseGuard(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'g1',
    name: 'Test Guard',
    email: 'guard@test.com',
    userStatus: 'pending',
    verified: false,
    certifications: [],
    ...overrides,
  } as SecurityGuard;
}

function fullyVerifiedGuard(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return baseGuard({
    userStatus: 'active',
    verified: true,
    idVerificationStatus: 'verified',
    idState: 'CA',
    idNumber: 'ID123',
    idExpiryDate: '2099-12-31',
    idFrontUrl: 'front',
    idBackUrl: 'back',
    idSelfieUrl: 'selfie',
    insurancePolicy: {
      id: 'ins-1',
      guardId: 'g1',
      carrier: 'Carrier',
      policyNumber: 'POL-1',
      expiryDate: '2099-12-31',
      documentUrl: 'doc',
      status: 'verified',
    },
    certifications: [
      {
        id: 'c1',
        catalogId: 'bsis-guard-card',
        name: 'BSIS Guard Card',
        issuer: 'BSIS',
        number: 'GC-1',
        state: 'CA',
        issueDate: '2024-01-01',
        status: 'verified',
        imageUrl: 'card',
        category: 'guard-card',
      },
      {
        id: 'c-pta',
        catalogId: 'bsis-power-to-arrest',
        name: 'Power to Arrest',
        issuer: 'BSIS',
        number: 'PTA-1',
        issueDate: '2024-01-01',
        status: 'verified',
        imageUrl: 'pta',
        category: 'bsis-training',
      },
      {
        id: 'c-uof',
        catalogId: 'bsis-appropriate-use-of-force',
        name: 'Appropriate Use of Force',
        issuer: 'BSIS',
        number: 'UOF-1',
        issueDate: '2024-01-01',
        status: 'verified',
        imageUrl: 'uof',
        category: 'bsis-training',
      },
      {
        id: 'c-pr',
        catalogId: 'bsis-public-relations',
        name: 'Public Relations',
        issuer: 'BSIS',
        number: 'PR-1',
        issueDate: '2024-01-01',
        status: 'verified',
        imageUrl: 'pr',
        category: 'bsis-training',
      },
      {
        id: 'c-obs',
        catalogId: 'bsis-observation-documentation',
        name: 'Observation and Documentation',
        issuer: 'BSIS',
        number: 'OBS-1',
        issueDate: '2024-01-01',
        status: 'verified',
        imageUrl: 'obs',
        category: 'bsis-training',
      },
      {
        id: 'c-comm',
        catalogId: 'bsis-communication',
        name: 'Communication',
        issuer: 'BSIS',
        number: 'COMM-1',
        issueDate: '2024-01-01',
        status: 'verified',
        imageUrl: 'comm',
        category: 'bsis-training',
      },
      {
        id: 'c-legal',
        catalogId: 'bsis-liability-legal',
        name: 'Liability / Legal Aspects',
        issuer: 'BSIS',
        number: 'LEG-1',
        issueDate: '2024-01-01',
        status: 'verified',
        imageUrl: 'legal',
        category: 'bsis-training',
      },
      {
        id: 'c-os',
        catalogId: 'bsis-officer-safety',
        name: 'Officer Safety',
        issuer: 'BSIS',
        number: 'OS-1',
        issueDate: '2024-01-01',
        status: 'verified',
        imageUrl: 'os',
        category: 'bsis-training',
      },
      {
        id: 'c-trespass',
        catalogId: 'bsis-trespass',
        name: 'Trespass',
        issuer: 'BSIS',
        number: 'TR-1',
        issueDate: '2024-01-01',
        status: 'verified',
        imageUrl: 'trespass',
        category: 'bsis-training',
      },
      {
        id: 'c-evac',
        catalogId: 'bsis-evacuation-procedures',
        name: 'Evacuation Procedures',
        issuer: 'BSIS',
        number: 'EV-1',
        issueDate: '2024-01-01',
        status: 'verified',
        imageUrl: 'evac',
        category: 'bsis-training',
      },
      {
        id: 'c-crowd',
        catalogId: 'bsis-monitoring-crowd-control',
        name: 'Monitoring Crowd Control',
        issuer: 'BSIS',
        number: 'CC-1',
        issueDate: '2024-01-01',
        status: 'verified',
        imageUrl: 'crowd',
        category: 'bsis-training',
      },
      {
        id: 'c-arrest',
        catalogId: 'bsis-arrest-search-seizure',
        name: 'Arrests, Search and Seizure',
        issuer: 'BSIS',
        number: 'AS-1',
        issueDate: '2024-01-01',
        status: 'verified',
        imageUrl: 'arrest',
        category: 'bsis-training',
      },
    ],
    ...overrides,
  });
}

describe('guard account activation gates', () => {
  it('allows application approval for pending guards without credentials on file', () => {
    const guard = baseGuard({ userStatus: 'pending' });
    assert.equal(guardCanStaffApproveProfile(guard), true);
    assert.equal(getGuardActivationChecklist(guard).canStaffApprove, true);
    assert.equal(getGuardActivationChecklist(guard).staffApprovalBlockers.length, 0);
  });

  it('blocks application approval when guard is not pending', () => {
    const guard = fullyVerifiedGuard({ userStatus: 'approved' });
    assert.equal(guardCanStaffApproveProfile(guard), false);
    assert.ok(
      getGuardActivationChecklist(guard).staffApprovalBlockers.some((b) =>
        /not pending/i.test(b)
      )
    );
  });

  it('blocks application approval when guard account is blocked', () => {
    const guard = baseGuard({ userStatus: 'blocked' });
    assert.equal(guardCanStaffApproveProfile(guard), false);
    assert.ok(
      getGuardActivationChecklist(guard).staffApprovalBlockers.some((b) => /blocked/i.test(b))
    );
  });

  it('blocks automatic activation until all five credentials are verified', () => {
    const guard = fullyVerifiedGuard({
      userStatus: 'approved',
      certifications: fullyVerifiedGuard().certifications.filter(
        (cert) => cert.catalogId !== 'bsis-public-relations'
      ),
    });

    assert.equal(guardCanStaffActivateAccount(guard), false);
    assert.ok(
      getGuardActivationChecklist(guard).staffActivationBlockers.some((b) =>
        /Continuing Education/i.test(b)
      )
    );
  });

  it('grandfathers already-active guards missing Continuing Education course certs only', () => {
    const guard = fullyVerifiedGuard({
      userStatus: 'active',
      certifications: fullyVerifiedGuard().certifications.filter(
        (cert) => cert.catalogId !== 'bsis-public-relations'
      ),
    });

    assert.equal(isGuardAccountActive(guard), true);
    assert.equal(getGuardActivationChecklist(guard).canActivate, true);
  });

  it('does not grandfather combined PTA/UOF — active guards must submit separates', () => {
    const guard = fullyVerifiedGuard({
      userStatus: 'active',
      certifications: [
        ...fullyVerifiedGuard().certifications.filter(
          (cert) =>
            cert.catalogId !== 'bsis-power-to-arrest' &&
            cert.catalogId !== 'bsis-appropriate-use-of-force'
        ),
        {
          id: 'c-combined',
          catalogId: 'bsis-pta-uof-8hr',
          name: 'PTA/UOF Combined',
          issuer: 'BSIS',
          number: 'COMB-1',
          issueDate: '2024-01-01',
          status: 'verified',
          imageUrl: 'combined',
          category: 'bsis-training',
        },
      ],
    });

    assert.equal(isGuardAccountActive(guard), false);
    assert.ok(
      getGuardActivationChecklist(guard).staffActivationBlockers.some((b) =>
        /Mandatory training|Power to Arrest|Use of Force|PTA/i.test(b)
      )
    );
  });

  it('still blocks approved (not yet active) guards missing Continuing Education courses', () => {
    const guard = fullyVerifiedGuard({
      userStatus: 'approved',
      certifications: fullyVerifiedGuard().certifications.filter(
        (cert) => cert.catalogId !== 'bsis-public-relations'
      ),
    });

    assert.equal(isGuardAccountActive(guard), false);
    assert.equal(guardCanStaffActivateAccount(guard), false);
  });

  it('treats guards as active when user_status is active and all five are verified', () => {
    const guard = fullyVerifiedGuard();
    assert.equal(isGuardAccountActive(guard), true);
    assert.equal(getGuardActivationChecklist(guard).canActivate, true);
    assert.equal(guardCanStaffActivateAccount({ ...guard, userStatus: 'approved' }), true);
  });

  it('includes pending guards in account approvals when application is ready for staff approval', () => {
    const guard = baseGuard({
      idVerificationStatus: 'not_submitted',
      certifications: [],
    });
    assert.equal(guardHasSubmittedItemsForStaffReview(guard), false);
    assert.equal(getGuardActivationChecklist(guard).canStaffApprove, true);
    assert.equal(getPendingGuardAccountReviews([guard]).length, 1);
  });

  it('includes pending guards in account approvals after credential submission', () => {
    const guard = fullyVerifiedGuard({
      userStatus: 'pending',
      idVerificationStatus: 'pending',
      insurancePolicy: {
        id: 'ins-1',
        guardId: 'g1',
        carrier: 'Carrier',
        policyNumber: 'POL-1',
        expiryDate: '2099-12-31',
        documentUrl: 'doc',
        status: 'pending',
      },
      certifications: fullyVerifiedGuard().certifications.map((cert) =>
        cert.catalogId === 'bsis-guard-card' ? { ...cert, status: 'pending' } : cert
      ),
    });
    assert.equal(guardHasSubmittedItemsForStaffReview(guard), true);
    assert.equal(getPendingGuardAccountReviews([guard]).length, 1);
  });

  it('includes approved guards in activation queue while credentials remain unverified', () => {
    const guard = baseGuard({ userStatus: 'approved', certifications: [] });
    assert.equal(getApprovedGuardsAwaitingActivation([guard]).length, 1);

    const ready = fullyVerifiedGuard({ userStatus: 'approved' });
    assert.equal(getApprovedGuardsAwaitingActivation([ready]).length, 0);
  });

  it('shows Approved + Restricted + pending credentials when expiry restricted', () => {
    const guard = baseGuard({
      userStatus: 'approved',
      verified: true,
      credentialExpiryRestricted: true,
      idVerificationStatus: 'verified',
      idState: 'CA',
      idNumber: 'ID123',
      idExpiryDate: '2020-01-01',
      idFrontUrl: 'front',
      idBackUrl: 'back',
      idSelfieUrl: 'selfie',
    });
    const badges = getGuardRosterAccountBadges(guard);
    assert.equal(badges[0]?.label, 'Approved');
    assert.equal(badges[1]?.label, GUARD_CREDENTIAL_RESTRICTED_LABEL);
    assert.ok(badges.some((badge) => badge.label === GUARD_PENDING_CREDENTIALS_LABEL));
    assert.equal(getGuardRosterAccountLabel(guard), 'Approved');
    assert.equal(guardActivationSummaryLabel(guard), 'Restricted — required credential expired');
  });

  it('shows Approved + Active roster badges for active guards', () => {
    const guard = baseGuard({ userStatus: 'active', verified: true });
    const badges = getGuardRosterAccountBadges(guard);
    assert.equal(badges.length, 2);
    assert.equal(badges[0]?.label, 'Approved');
    assert.equal(badges[1]?.label, 'Active');
  });

  it('shows Approved plus pending credentials badge when nothing is uploaded', () => {
    const guard = baseGuard({ userStatus: 'approved', verified: true });
    const badges = getGuardRosterAccountBadges(guard);
    const pendingLabels = getGuardPendingCredentialBadgeLabels(guard);
    assert.equal(badges[0]?.label, 'Approved');
    assert.deepEqual(pendingLabels, [GUARD_PENDING_CREDENTIALS_LABEL]);
    assert.ok(badges.some((badge) => badge.label === GUARD_PENDING_CREDENTIALS_LABEL));
    assert.equal(
      badges.some((badge) => badge.label === GUARD_PENDING_CREDENTIAL_VERIFICATION_LABEL),
      false
    );
  });

  it('shows both pending credentials and pending verification badges when partially uploaded', () => {
    const guard = fullyVerifiedGuard({
      userStatus: 'approved',
      verified: true,
      idVerificationStatus: 'pending',
      insurancePolicy: {
        id: 'ins-1',
        guardId: 'g1',
        carrier: 'Carrier',
        policyNumber: 'POL-1',
        expiryDate: '2099-12-31',
        documentUrl: 'doc',
        status: 'pending',
      },
      certifications: [],
    });
    const badges = getGuardRosterAccountBadges(guard);
    const pendingLabels = getGuardPendingCredentialBadgeLabels(guard);
    assert.equal(badges[0]?.label, 'Approved');
    assert.deepEqual(pendingLabels, [
      GUARD_PENDING_CREDENTIALS_LABEL,
      GUARD_PENDING_CREDENTIAL_VERIFICATION_LABEL,
    ]);
    assert.ok(badges.some((badge) => badge.label === GUARD_PENDING_CREDENTIALS_LABEL));
    assert.ok(badges.some((badge) => badge.label === GUARD_PENDING_CREDENTIAL_VERIFICATION_LABEL));
  });
});
