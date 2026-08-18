import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Client, SecurityGuard } from '../types';
import { govIdApprovalItemId } from './guardCredentialSections';
import {
  buildStaffApprovalsFeed,
  CREDENTIAL_PENDING_UPLOAD_LABEL,
  isCredentialFeedItemAwaitingStaffReview,
  isCredentialFeedItemRejected,
  type ApprovalFeedItem,
} from './staffApprovalsFeed';
import {
  isCredentialFeedItemOpen,
  isCredentialFeedItemPendingUpload,
  isCredentialFeedItemVerified,
  matchesApplicationKindFilter,
  matchesApplicationStatusFilter,
  matchesClientRosterFilter,
  matchesCredentialAudienceFilter,
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

  it('filters rejected credentials into the rejected tab', () => {
    const guard = {
      id: 'g-3',
      name: 'Rejected Guard',
      email: 'r@test.com',
      userStatus: 'active',
      verified: true,
      mustChangePassword: false,
      isStaff: false,
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
    } as SecurityGuard;

    const feed = buildStaffApprovalsFeed({ guards: [guard], clients: [], requests: [] }).filter(
      (item) => item.queue === 'credentials'
    );

    assert.equal(feed.filter((item) => matchesCredentialStatusFilter(item, 'rejected')).length, 1);
    assert.ok(isCredentialFeedItemRejected(feed[0]!));
    assert.equal(matchesCredentialStatusFilter(feed[0]!, 'verified'), false);
  });

  it('filters application kinds', () => {
    assert.equal(matchesApplicationKindFilter('guard', 'all'), true);
    assert.equal(matchesApplicationKindFilter('client', 'all'), true);
    assert.equal(matchesApplicationKindFilter('staff', 'all'), true);
    assert.equal(matchesApplicationKindFilter('guard', 'guard'), true);
    assert.equal(matchesApplicationKindFilter('guard', 'client'), false);
    assert.equal(matchesApplicationKindFilter('staff', 'staff'), true);
    assert.equal(matchesApplicationKindFilter('client', 'staff'), false);
  });

  it('filters application status all / pending / approved / denied', () => {
    const pending = { id: 'a-1', status: 'pending' } as ApprovalFeedItem;
    const approved = { id: 'a-2', status: 'approved' } as ApprovalFeedItem;
    const denied = { id: 'a-3', status: 'denied' } as ApprovalFeedItem;
    const emptyGuards: SecurityGuard[] = [];
    const emptyClients: Client[] = [];

    assert.equal(matchesApplicationStatusFilter(pending, 'all', emptyGuards, emptyClients), true);
    assert.equal(matchesApplicationStatusFilter(denied, 'all', emptyGuards, emptyClients), true);
    assert.equal(matchesApplicationStatusFilter(pending, 'pending', emptyGuards, emptyClients), true);
    assert.equal(matchesApplicationStatusFilter(approved, 'pending', emptyGuards, emptyClients), false);
    assert.equal(matchesApplicationStatusFilter(approved, 'approved', emptyGuards, emptyClients), true);
    assert.equal(matchesApplicationStatusFilter(pending, 'approved', emptyGuards, emptyClients), false);
    assert.equal(
      matchesApplicationStatusFilter(
        { ...approved, status: 'active' },
        'approved',
        emptyGuards,
        emptyClients
      ),
      true
    );
    assert.equal(matchesApplicationStatusFilter(denied, 'denied', emptyGuards, emptyClients), true);
    assert.equal(matchesApplicationStatusFilter(approved, 'denied', emptyGuards, emptyClients), false);
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
    const inactiveStaff = { id: 's-inactive', isStaff: true, userStatus: 'approved' } as SecurityGuard;
    const activeStaff = { id: 's-2', isStaff: true, userStatus: 'active' } as SecurityGuard;

    assert.equal(matchesClientRosterFilter(pendingClient, 'pending'), true);
    assert.equal(matchesClientRosterFilter(activeClient, 'active'), true);
    assert.equal(matchesStaffTeamFilter(pendingStaff, 'pending'), true);
    assert.equal(matchesStaffTeamFilter(inactiveStaff, 'inactive'), true);
    assert.equal(matchesStaffTeamFilter(inactiveStaff, 'active'), false);
    assert.equal(matchesStaffTeamFilter(activeStaff, 'active'), true);
  });

  it('filters credential feed items by staff vs guard audience', () => {
    const guard = {
      id: 'g-1',
      name: 'Field Guard',
      email: 'g@test.com',
      userStatus: 'approved',
      verified: true,
      mustChangePassword: false,
      isStaff: false,
      idVerificationStatus: 'pending',
      idFrontUrl: 'front.jpg',
      idBackUrl: 'back.jpg',
      idSelfieUrl: 'selfie.jpg',
      certifications: [],
    } as SecurityGuard;
    const staffMember = {
      id: 's-1',
      name: 'Staff Member',
      email: 's@test.com',
      userStatus: 'approved',
      mustChangePassword: false,
      isStaff: true,
      staffRole: 'Moderator',
      badgeNumber: 'MOD-00001',
      idVerificationStatus: 'pending',
      idFrontUrl: 'front.jpg',
      idBackUrl: 'back.jpg',
      idSelfieUrl: 'selfie.jpg',
      certifications: [],
    } as SecurityGuard;

    const feed = buildStaffApprovalsFeed({
      guards: [guard, staffMember],
      clients: [],
      requests: [],
    }).filter((item) => item.queue === 'credentials');

    const guardItem = feed.find((item) => item.id === govIdApprovalItemId('g-1'));
    const staffItem = feed.find((item) => item.id === govIdApprovalItemId('s-1'));
    assert.ok(guardItem);
    assert.ok(staffItem);
    assert.equal(matchesCredentialAudienceFilter(guardItem!, 'guards', [guard, staffMember]), true);
    assert.equal(matchesCredentialAudienceFilter(guardItem!, 'staff', [guard, staffMember]), false);
    assert.equal(matchesCredentialAudienceFilter(staffItem!, 'staff', [guard, staffMember]), true);
    assert.equal(matchesCredentialAudienceFilter(staffItem!, 'guards', [guard, staffMember]), false);
    assert.equal(matchesCredentialAudienceFilter(guardItem!, 'all', [guard, staffMember]), true);
    assert.equal(matchesCredentialAudienceFilter(staffItem!, 'all', [guard, staffMember]), true);
  });

  it('filters client credential feed items onto the Clients tab', () => {
    const client = {
      id: 'c-1',
      name: 'Alex Rivera',
      email: 'alex@test.com',
      companyName: '',
      clientType: 'personal',
      phone: '',
      avatar: '',
      totalRequests: 0,
      credentials: [],
    } as Client;
    const feed = buildStaffApprovalsFeed({ guards: [], clients: [client], requests: [] }).filter(
      (item) => item.queue === 'credentials'
    );
    const item = feed[0];
    assert.ok(item);
    assert.equal(matchesCredentialAudienceFilter(item!, 'clients', []), true);
    assert.equal(matchesCredentialAudienceFilter(item!, 'staff', []), false);
    assert.equal(matchesCredentialAudienceFilter(item!, 'guards', []), false);
    assert.equal(matchesCredentialAudienceFilter(item!, 'all', []), true);
  });
});
