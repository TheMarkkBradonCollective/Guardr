import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Client, SecurityGuard } from '../types';
import { govIdApprovalItemId } from './guardCredentialSections';
import {
  buildStaffApprovalsFeed,
  CREDENTIAL_PENDING_UPLOAD_LABEL,
  isCredentialFeedItemAwaitingStaffReview,
} from './staffApprovalsFeed';
import {
  isCredentialFeedItemOpen,
  isCredentialFeedItemPendingUpload,
  isCredentialFeedItemVerified,
  matchesApplicationKindFilter,
  matchesClientRosterFilter,
  matchesCredentialStatusFilter,
  matchesGuardRosterFilter,
  matchesStaffTeamFilter,
} from './staffListFilters';

describe('staffListFilters', () => {
  it('splits credential items into upload, review, and verified tabs', () => {
    const guard = {
      id: 'g-1',
      name: 'Guard',
      email: 'g@test.com',
      userStatus: 'approved',
      verified: true,
      mustChangePassword: false,
      isStaff: false,
      idVerificationStatus: 'pending',
      idState: 'CA',
      idNumber: 'ID-1',
      idExpiryDate: '2099-12-31',
      idFrontUrl: 'front.jpg',
      idBackUrl: 'back.jpg',
      idSelfieUrl: 'selfie.jpg',
      idVerificationSubmittedAt: '2026-01-01T00:00:00.000Z',
      certifications: [],
    } as SecurityGuard;

    const feed = buildStaffApprovalsFeed({ guards: [guard], clients: [], requests: [] }).filter(
      (item) => item.queue === 'credentials'
    );
    const govId = feed.find((item) => item.id === govIdApprovalItemId('g-1'));
    const uploadItems = feed.filter((item) => item.statusLabel === CREDENTIAL_PENDING_UPLOAD_LABEL);

    assert.ok(govId);
    assert.equal(isCredentialFeedItemOpen(govId!), true);
    assert.equal(isCredentialFeedItemAwaitingStaffReview(govId!), true);
    assert.equal(isCredentialFeedItemPendingUpload(govId!), false);
    assert.ok(uploadItems.length > 0);
    assert.ok(uploadItems.every((item) => matchesCredentialStatusFilter(item, 'pending_upload')));
    assert.equal(
      feed.filter((item) => matchesCredentialStatusFilter(item, 'pending_review')).length,
      1
    );
    assert.equal(feed.filter((item) => matchesCredentialStatusFilter(item, 'verified')).length, 0);
  });

  it('counts verified credentials in the verified tab', () => {
    const guard = {
      id: 'g-2',
      name: 'Verified Guard',
      email: 'v@test.com',
      userStatus: 'active',
      verified: true,
      mustChangePassword: false,
      isStaff: false,
      certifications: [
        {
          id: 'cert-1',
          catalogId: 'bsis-guard-card',
          name: 'BSIS Guard Card',
          issuer: 'BSIS',
          number: 'GC-1',
          state: 'CA',
          issueDate: '2024-01-01',
          status: 'verified',
          imageUrl: 'card.jpg',
          category: 'guard-card',
          submittedByRole: 'guard',
        },
      ],
    } as SecurityGuard;

    const feed = buildStaffApprovalsFeed({ guards: [guard], clients: [], requests: [] }).filter(
      (item) => item.queue === 'credentials'
    );

    assert.equal(feed.filter((item) => matchesCredentialStatusFilter(item, 'verified')).length, 1);
    assert.ok(feed.every((item) => isCredentialFeedItemVerified(item)));
  });

  it('filters application kinds', () => {
    assert.equal(matchesApplicationKindFilter('guard', 'all'), true);
    assert.equal(matchesApplicationKindFilter('guard', 'guard'), true);
    assert.equal(matchesApplicationKindFilter('guard', 'client'), false);
  });

  it('filters guard roster tabs', () => {
    const pending = { id: 'g-1', isStaff: false, userStatus: 'pending' } as SecurityGuard;
    const activated = { id: 'g-2', isStaff: false, userStatus: 'approved', verified: true } as SecurityGuard;
    const active = { id: 'g-3', isStaff: false, userStatus: 'active', verified: true } as SecurityGuard;

    assert.equal(matchesGuardRosterFilter(pending, 'pending'), true);
    assert.equal(matchesGuardRosterFilter(activated, 'activated'), true);
    assert.equal(matchesGuardRosterFilter(active, 'active'), true);
    assert.equal(matchesGuardRosterFilter(active, 'pending'), false);
  });

  it('filters client and staff roster tabs', () => {
    const pendingClient = { id: 'c-1', accountStatus: 'pending', approved: false } as Client;
    const activeClient = { id: 'c-2', accountStatus: 'active', approved: true } as Client;
    const pendingStaff = { id: 's-1', isStaff: true, userStatus: 'pending' } as SecurityGuard;
    const activeStaff = { id: 's-2', isStaff: true, userStatus: 'active' } as SecurityGuard;

    assert.equal(matchesClientRosterFilter(pendingClient, 'pending'), true);
    assert.equal(matchesClientRosterFilter(activeClient, 'active'), true);
    assert.equal(matchesStaffTeamFilter(pendingStaff, 'pending'), true);
    assert.equal(matchesStaffTeamFilter(activeStaff, 'active'), true);
  });
});
