import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Client, SecurityGuard } from '../types';
import {
  computePlatformStats,
  normalizeStaffSection,
  resolveOverviewActionSelection,
  staffSectionFromApprovalQueue,
} from './staffOps';

describe('staff section routing', () => {
  it('includes credentials in normalized staff sections', () => {
    assert.equal(normalizeStaffSection('credentials'), 'credentials');
  });

  it('includes platform payment and agreements sections', () => {
    assert.equal(normalizeStaffSection('payment-settings'), 'payment-settings');
    assert.equal(normalizeStaffSection('agreements'), 'agreements');
    assert.equal(normalizeStaffSection('audit-log'), 'audit-log');
  });

  it('maps legacy approval queues to owning sections', () => {
    assert.equal(staffSectionFromApprovalQueue('applications'), 'applications');
    assert.equal(staffSectionFromApprovalQueue('credentials'), 'credentials');
    assert.equal(staffSectionFromApprovalQueue('guard-accounts'), 'applications');
    assert.equal(staffSectionFromApprovalQueue('client-accounts'), 'applications');
  });

  it('deep-links account application overview actions to the first pending guard', () => {
    const guards = [
      {
        id: 'guard-1',
        name: 'Test Guard',
        email: 'guard@test.com',
        userStatus: 'pending',
        mustChangePassword: false,
        isStaff: false,
        certifications: [],
      } as SecurityGuard,
    ];

    const selection = resolveOverviewActionSelection(
      {
        id: 'account-applications',
        title: '',
        description: '',
        count: 1,
        section: 'applications',
        tone: 'urgent',
      },
      { requests: [], guards, clients: [] }
    );
    assert.equal(selection.guardId, 'guard-1');
  });

  it('deep-links account application overview actions to the first pending client', () => {
    const clients = [{ id: 'client-1', accountStatus: 'pending', approved: false } as Client];
    const selection = resolveOverviewActionSelection(
      {
        id: 'account-applications',
        title: '',
        description: '',
        count: 1,
        section: 'applications',
        tone: 'urgent',
      },
      { requests: [], guards: [], clients }
    );
    assert.equal(selection.clientId, 'client-1');
  });

  it('deep-links credential overview actions to the first pending credential item', () => {
    const guards = [
      {
        id: 'guard-1',
        name: 'Test Guard',
        email: 'guard@test.com',
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
      } as SecurityGuard,
    ];

    const stats = computePlatformStats(guards, [], []);
    assert.equal(stats.pendingCertApprovals, 1);
    assert.equal(stats.pendingAccountApplications, 0);

    const selection = resolveOverviewActionSelection(
      {
        id: 'pending-certs',
        title: '',
        description: '',
        count: 1,
        section: 'credentials',
        tone: 'urgent',
      },
      { requests: [], guards, clients: [] }
    );
    assert.equal(selection.guardId, 'guard-1');
    assert.equal(selection.credentialItemId, 'gov-id-guard-1');
  });

  it('does not count credentials awaiting guard upload in overview stats', () => {
    const guards = [
      {
        id: 'guard-1',
        name: 'Test Guard',
        email: 'guard@test.com',
        userStatus: 'pending',
        mustChangePassword: true,
        isStaff: false,
        certifications: [],
      } as SecurityGuard,
    ];

    const stats = computePlatformStats(guards, [], []);
    assert.equal(stats.pendingCertApprovals, 0);
  });
});
