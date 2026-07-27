import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Client, SecurityGuard } from '../types';
import {
  APPLICATION_FEED_STATUS_LABELS,
  buildApplicationFeed,
  buildStaffApprovalsFeed,
  countPendingAccountSignupApplications,
  countPendingCredentialApprovals,
  countPendingCredentialReviews,
  countPendingCredentialUploads,
  countRejectedCredentials,
  CREDENTIAL_PENDING_UPLOAD_LABEL,
  credentialFeedThumbnailUrl,
  isApplicationFeedItemOpen,
  isApplicationFeedItemPending,
  isCredentialFeedItemRejected,
} from './staffApprovalsFeed.ts';
import { activationCredentialItemId, govIdApprovalItemId } from './guardCredentialSections.ts';

function staffProvisionedGuard(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'g-staff',
    name: 'Staff Guard',
    email: 'staff-guard@test.com',
    userStatus: 'pending',
    mustChangePassword: true,
    isStaff: false,
    certifications: [],
    ...overrides,
  } as SecurityGuard;
}

function staffProvisionedClient(overrides: Partial<Client> = {}): Client {
  return {
    id: 'c-staff',
    name: 'Staff Client',
    email: 'staff-client@test.com',
    companyName: 'Staff Co',
    accountStatus: 'pending',
    approved: false,
    mustChangePassword: true,
    ...overrides,
  } as Client;
}

describe('buildApplicationFeed', () => {
  it('includes staff-provisioned guard and client accounts', () => {
    const feed = buildApplicationFeed([staffProvisionedGuard()], [staffProvisionedClient()]);
    const guardItem = feed.find((item) => item.id === 'g-staff');
    const clientItem = feed.find((item) => item.id === 'c-staff');

    assert.ok(guardItem);
    assert.ok(clientItem);
    assert.equal(guardItem?.statusLabel, APPLICATION_FEED_STATUS_LABELS.pending);
    assert.equal(clientItem?.statusLabel, APPLICATION_FEED_STATUS_LABELS.pending);
  });

  it('shows Application approved after guard application approval', () => {
    const feed = buildApplicationFeed(
      [staffProvisionedGuard({ userStatus: 'approved', verified: true })],
      []
    );
    const guardItem = feed.find((item) => item.id === 'g-staff');
    assert.equal(guardItem?.status, 'approved');
    assert.equal(guardItem?.statusLabel, APPLICATION_FEED_STATUS_LABELS.approved);
  });

  it('counts staff-provisioned pending applications', () => {
    const count = countPendingAccountSignupApplications(
      [staffProvisionedGuard()],
      [staffProvisionedClient()]
    );
    assert.equal(count, 2);
  });

  it('does not count approved guards awaiting credential verification as pending applications', () => {
    const approvedWithPendingCert = staffProvisionedGuard({
      userStatus: 'approved',
      verified: true,
      certifications: [
        {
          id: 'cert-1',
          catalogId: 'bsis-guard-card',
          name: 'BSIS Guard Card',
          issuer: 'BSIS',
          number: 'GC-1',
          state: 'CA',
          issueDate: '2024-01-01',
          status: 'pending',
          imageUrl: 'card.jpg',
          category: 'guard-card',
          submittedByRole: 'guard',
        },
      ],
    });
    const feed = buildApplicationFeed([approvedWithPendingCert], []);
    const item = feed.find((entry) => entry.id === 'g-staff');
    assert.ok(item);
    assert.equal(item?.status, 'approved');
    assert.equal(isApplicationFeedItemPending(item!, [approvedWithPendingCert], []), false);
    assert.equal(isApplicationFeedItemOpen(item!, [approvedWithPendingCert], []), true);
    assert.equal(countPendingAccountSignupApplications([approvedWithPendingCert], []), 0);
  });

  it('keeps active marketplace guards in the applications feed for audit', () => {
    const feed = buildApplicationFeed(
      [staffProvisionedGuard({ userStatus: 'active', verified: true })],
      []
    );
    const item = feed.find((entry) => entry.id === 'g-staff');
    assert.ok(item);
    assert.equal(item?.status, 'active');
    assert.equal(isApplicationFeedItemOpen(item!, [staffProvisionedGuard({ userStatus: 'active', verified: true })], []), false);
  });

  it('surfaces approval and activation actors from the audit log', () => {
    const feed = buildApplicationFeed(
      [staffProvisionedGuard({ userStatus: 'active', verified: true })],
      [],
      [
        {
          id: 'a1',
          actorId: 'staff-1',
          actorEmail: 'director@guardr.test',
          actorRole: 'Director',
          action: 'guard_approved',
          entityType: 'guard',
          entityId: 'g-staff',
          createdAt: '2026-01-02T12:00:00.000Z',
        },
        {
          id: 'a2',
          actorId: 'staff-2',
          actorEmail: 'manager@guardr.test',
          actorRole: 'Manager',
          action: 'guard_activated',
          entityType: 'guard',
          entityId: 'g-staff',
          createdAt: '2026-01-03T15:30:00.000Z',
        },
      ]
    );
    const item = feed.find((entry) => entry.id === 'g-staff');
    assert.equal(item?.approvedByEmail, 'director@guardr.test');
    assert.equal(item?.approvedAt, '2026-01-02T12:00:00.000Z');
    assert.equal(item?.activatedByEmail, 'manager@guardr.test');
    assert.equal(item?.activatedAt, '2026-01-03T15:30:00.000Z');
  });

  it('includes approved client accounts in the applications feed', () => {
    const feed = buildApplicationFeed(
      [],
      [staffProvisionedClient({ accountStatus: 'active', approved: true })]
    );
    const clientItem = feed.find((item) => item.id === 'c-staff');
    assert.ok(clientItem);
    assert.equal(clientItem?.status, 'approved');
    assert.equal(isApplicationFeedItemOpen(clientItem!, [], []), true);
  });

  it('counts pending government ID and other missing activation credentials', () => {
    const guard = staffProvisionedGuard({
      userStatus: 'approved',
      verified: true,
      idVerificationStatus: 'pending',
      idState: 'CA',
      idNumber: 'ID-1',
      idExpiryDate: '2099-12-31',
      idFrontUrl: 'front.jpg',
      idBackUrl: 'back.jpg',
      idSelfieUrl: 'selfie.jpg',
      idVerificationSubmittedAt: '2026-01-01T00:00:00.000Z',
    });
    const feed = buildStaffApprovalsFeed({ guards: [guard], clients: [], requests: [] }).filter(
      (item) => item.queue === 'credentials'
    );
    const govId = feed.find((item) => item.id === govIdApprovalItemId('g-staff'));

    assert.equal(countPendingCredentialApprovals([guard]), 5);
    assert.equal(countPendingCredentialUploads([guard]), 4);
    assert.equal(countPendingCredentialReviews([guard]), 1);
    assert.equal(govId?.statusLabel, 'Pending review');
    assert.equal(
      feed.filter((item) => item.statusLabel === CREDENTIAL_PENDING_UPLOAD_LABEL).length,
      4
    );
  });

  it('includes required activation credentials awaiting guard upload in the credentials feed', () => {
    const guard = staffProvisionedGuard({
      userStatus: 'pending',
      mustChangePassword: true,
    });
    const feed = buildStaffApprovalsFeed({ guards: [guard], clients: [], requests: [] }).filter(
      (item) => item.queue === 'credentials'
    );

    assert.equal(feed.length, 5);
    assert.ok(feed.every((item) => item.status === 'pending'));
    assert.ok(feed.every((item) => item.statusLabel === CREDENTIAL_PENDING_UPLOAD_LABEL));
    assert.equal(countPendingCredentialApprovals([guard]), 5);
    assert.equal(countPendingCredentialUploads([guard]), 5);
    assert.equal(countPendingCredentialReviews([guard]), 0);
    assert.ok(feed.some((item) => item.id === govIdApprovalItemId('g-staff')));
    assert.ok(feed.some((item) => item.title.includes('BSIS Guard Card')));
  });

  it('does not duplicate pending upload rows when a credential is already submitted for review', () => {
    const guard = staffProvisionedGuard({
      userStatus: 'approved',
      verified: true,
      idVerificationStatus: 'pending',
      idState: 'CA',
      idNumber: 'ID-1',
      idExpiryDate: '2099-12-31',
      idFrontUrl: 'front.jpg',
      idBackUrl: 'back.jpg',
      idSelfieUrl: 'selfie.jpg',
      idVerificationSubmittedAt: '2026-01-01T00:00:00.000Z',
    });
    const feed = buildStaffApprovalsFeed({ guards: [guard], clients: [], requests: [] }).filter(
      (item) => item.queue === 'credentials' && item.id === govIdApprovalItemId('g-staff')
    );

    assert.equal(feed.length, 1);
    assert.equal(feed[0]?.statusLabel, 'Pending review');
  });

  it('flags government IDs with photos but not_submitted status for pending review', () => {
    const guard = staffProvisionedGuard({
      userStatus: 'approved',
      verified: true,
      idVerificationStatus: 'not_submitted',
      idFrontUrl: 'front.jpg',
      idBackUrl: 'back.jpg',
      idSelfieUrl: 'selfie.jpg',
      idState: 'CA',
      idNumber: 'ID-9',
      idExpiryDate: '2099-12-31',
    });
    const feed = buildStaffApprovalsFeed({ guards: [guard], clients: [], requests: [] }).filter(
      (item) => item.queue === 'credentials' && item.id === govIdApprovalItemId('g-staff')
    );

    assert.equal(feed.length, 1);
    assert.equal(feed[0]?.statusLabel, 'Pending review');
    assert.equal(feed[0]?.subtitle, 'Select Government ID or driver’s license');
    assert.equal(countPendingCredentialReviews([guard]), 1);
  });

  it('prompts staff to select ID vs license when type is missing on a pending ID', () => {
    const guard = staffProvisionedGuard({
      userStatus: 'approved',
      verified: true,
      idVerificationStatus: 'pending',
      idState: 'CA',
      idNumber: 'ID-1',
      idExpiryDate: '2099-12-31',
      idFrontUrl: 'front.jpg',
      idBackUrl: 'back.jpg',
      idSelfieUrl: 'selfie.jpg',
      idVerificationSubmittedAt: '2026-01-01T00:00:00.000Z',
    });
    const govId = buildStaffApprovalsFeed({ guards: [guard], clients: [], requests: [] }).find(
      (item) => item.id === govIdApprovalItemId('g-staff')
    );
    assert.equal(govId?.subtitle, 'Select Government ID or driver’s license');
  });

  it('does not show government ID photos on activation-pending credential rows', () => {
    const guard = staffProvisionedGuard({
      userStatus: 'approved',
      verified: true,
      idVerificationStatus: 'verified',
      idFrontUrl: 'front.jpg',
      idSelfieUrl: 'selfie.jpg',
    });
    const ptaItemId = activationCredentialItemId('g-staff', 'pta-uof');
    const bsisItemId = activationCredentialItemId('g-staff', '32-hour');

    assert.equal(credentialFeedThumbnailUrl([guard], ptaItemId), undefined);
    assert.equal(credentialFeedThumbnailUrl([guard], bsisItemId), undefined);
    assert.equal(credentialFeedThumbnailUrl([guard], govIdApprovalItemId('g-staff')), 'front.jpg');
  });

  it('counts rejected credentials in the rejected tab', () => {
    const guard = staffProvisionedGuard({
      userStatus: 'active',
      verified: true,
      certifications: [
        {
          id: 'cert-rejected',
          catalogId: 'bsis-guard-card',
          name: 'BSIS Guard Card',
          issuer: 'BSIS',
          number: 'GC-1',
          state: 'CA',
          issueDate: '2024-01-01',
          status: 'rejected',
          imageUrl: 'rejected.jpg',
          category: 'guard-card',
          submittedByRole: 'guard',
        },
      ],
      insurancePolicy: {
        status: 'rejected',
        documentUrl: 'coi.jpg',
        submittedAt: '2026-01-01T00:00:00.000Z',
      },
      idVerificationStatus: 'rejected',
      idFrontUrl: 'front.jpg',
    } as SecurityGuard);

    const feed = buildStaffApprovalsFeed({ guards: [guard], clients: [], requests: [] }).filter(
      (item) => item.queue === 'credentials'
    );
    const rejected = feed.filter(isCredentialFeedItemRejected);

    assert.equal(rejected.length, 3);
    assert.equal(countRejectedCredentials([guard]), 3);
    assert.ok(rejected.every((item) => item.statusLabel === 'Rejected'));
  });
});
