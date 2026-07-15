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
  CREDENTIAL_PENDING_UPLOAD_LABEL,
  isApplicationFeedItemOpen,
  isApplicationFeedItemPending,
} from './staffApprovalsFeed.ts';
import { govIdApprovalItemId } from './guardCredentialSections.ts';

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

  it('excludes active marketplace guards from the applications feed', () => {
    const feed = buildApplicationFeed(
      [staffProvisionedGuard({ userStatus: 'active', verified: true })],
      []
    );
    assert.equal(feed.find((item) => item.id === 'g-staff'), undefined);
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
});
