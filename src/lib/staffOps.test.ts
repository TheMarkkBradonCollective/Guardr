import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Client, SecurityRequest } from '../types';
import {
  normalizeStaffSection,
  resolveOverviewActionSelection,
  staffSectionFromApprovalQueue,
} from './staffOps';

describe('staff section routing', () => {
  it('includes credentials in normalized staff sections', () => {
    assert.equal(normalizeStaffSection('credentials'), 'credentials');
  });

  it('maps legacy approval queues to owning sections', () => {
    assert.equal(staffSectionFromApprovalQueue('applications'), 'applications');
    assert.equal(staffSectionFromApprovalQueue('credentials'), 'credentials');
    assert.equal(staffSectionFromApprovalQueue('guard-accounts'), 'guards');
    assert.equal(staffSectionFromApprovalQueue('client-accounts'), 'clients');
  });

  it('deep-links application overview actions to the first reviewable job', () => {
    const requests = [
      {
        id: 'job-1',
        status: 'open',
        applicants: ['g1'],
        assignedGuardId: undefined,
        pendingGuardId: undefined,
        staffApprovedGuardAt: undefined,
      } as SecurityRequest,
    ];

    const selection = resolveOverviewActionSelection(
      {
        id: 'guard-applications',
        title: '',
        description: '',
        count: 1,
        section: 'applications',
        tone: 'urgent',
      },
      { requests, guards: [], clients: [] }
    );
    assert.equal(selection.jobId, 'job-1');
  });

  it('deep-links client overview actions to the first pending client', () => {
    const clients = [{ id: 'client-1', accountStatus: 'pending', approved: false } as Client];
    const selection = resolveOverviewActionSelection(
      {
        id: 'pending-client-accounts',
        title: '',
        description: '',
        count: 1,
        section: 'clients',
        tone: 'urgent',
      },
      { requests: [], guards: [], clients }
    );
    assert.equal(selection.clientId, 'client-1');
  });
});
