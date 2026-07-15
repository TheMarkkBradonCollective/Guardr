import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Client, SecurityGuard } from '../types';
import {
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
});
