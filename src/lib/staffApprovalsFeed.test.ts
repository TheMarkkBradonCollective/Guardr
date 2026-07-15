import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Client, SecurityGuard } from '../types';
import {
  APPLICATION_FEED_STATUS_LABELS,
  buildApplicationFeed,
  countPendingAccountSignupApplications,
} from './staffApprovalsFeed.ts';

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
});
