import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Client, SecurityGuard, SecurityRequest, SupportTicket } from '../types';
import {
  buildDisputes,
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
    assert.equal(normalizeStaffSection('platform-fees'), 'platform-fees');
    assert.equal(normalizeStaffSection('staff-compensation'), 'staff-compensation');
    assert.equal(normalizeStaffSection('payment-settings'), 'platform-fees');
    assert.equal(normalizeStaffSection('staff-pay'), 'staff-compensation');
    assert.equal(normalizeStaffSection('integrations'), 'integrations');
    assert.equal(normalizeStaffSection('permissions'), 'permissions');
    assert.equal(normalizeStaffSection('agreements'), 'agreements');
    assert.equal(normalizeStaffSection('audit-log'), 'audit-log');
    assert.equal(normalizeStaffSection('locations'), 'locations');
    assert.equal(normalizeStaffSection('management'), 'management');
  });

  it('maps legacy approval queues to owning sections', () => {
    assert.equal(staffSectionFromApprovalQueue('applications'), 'applications');
    assert.equal(staffSectionFromApprovalQueue('credentials'), 'credentials');
    assert.equal(staffSectionFromApprovalQueue('guard-accounts'), 'applications');
    assert.equal(staffSectionFromApprovalQueue('client-accounts'), 'applications');
    assert.equal(staffSectionFromApprovalQueue('staff-accounts'), 'applications');
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

  it('deep-links pending staff application overview actions to the first pending staff member', () => {
    const guards = [
      {
        id: 'staff-1',
        name: 'Alex Ops',
        email: 'alex@guardr.test',
        userStatus: 'pending',
        isStaff: true,
        staffRole: 'Support',
        certifications: [],
      } as SecurityGuard,
    ];
    const selection = resolveOverviewActionSelection(
      {
        id: 'pending-staff-accounts',
        title: '',
        description: '',
        count: 1,
        section: 'applications',
        tone: 'urgent',
      },
      { requests: [], guards, clients: [] }
    );
    assert.equal(selection.guardId, 'staff-1');
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

describe('computePlatformStats active guards', () => {
  it('counts marketplace-active guard accounts, not job assignments', () => {
    const guards = [
      {
        id: 'guard-active',
        userStatus: 'active',
        isStaff: false,
        certifications: [],
      } as SecurityGuard,
      {
        id: 'guard-pending',
        userStatus: 'pending',
        isStaff: false,
        certifications: [],
      } as SecurityGuard,
      {
        id: 'staff-1',
        userStatus: 'active',
        isStaff: true,
        certifications: [],
      } as SecurityGuard,
    ];

    const stats = computePlatformStats(guards, [], []);
    assert.equal(stats.activeGuards, 1);
    assert.equal(stats.assignedGuardsOnJobs, 0);
  });

  it('counts all approved crew members on active jobs', () => {
    const guards = [
      { id: 'lead', userStatus: 'active', isStaff: false, certifications: [] } as SecurityGuard,
      { id: 'crew-1', userStatus: 'active', isStaff: false, certifications: [] } as SecurityGuard,
      { id: 'crew-2', userStatus: 'active', isStaff: false, certifications: [] } as SecurityGuard,
    ];
    const requests = [
      {
        id: 'job-1',
        status: 'accepted',
        assignedGuardId: 'lead',
        guardSlots: [
          { id: 'slot-1', jobId: 'job-1', slotIndex: 1, status: 'approved', guardId: 'lead', isLead: true },
          { id: 'slot-2', jobId: 'job-1', slotIndex: 2, status: 'approved', guardId: 'crew-1', isLead: false },
          { id: 'slot-3', jobId: 'job-1', slotIndex: 3, status: 'approved', guardId: 'crew-2', isLead: false },
        ],
      },
    ] as Parameters<typeof computePlatformStats>[2];

    const stats = computePlatformStats(guards, [], requests);
    assert.equal(stats.activeGuards, 3);
    assert.equal(stats.assignedGuardsOnJobs, 3);
  });
});

describe('buildDisputes', () => {
  const guards = [
    {
      id: 'guard-1',
      name: 'John Doe',
      email: 'g@test.com',
      userStatus: 'approved',
    } as SecurityGuard,
  ];

  it('includes open and closed overtime disputes', () => {
    const requests = [
      {
        id: 'job-open',
        title: 'Open OT',
        clientId: 'c1',
        clientName: 'Client',
        assignedGuardId: 'guard-1',
        overtimeStatus: 'disputed',
        overtimeDisputedAt: '2026-08-01T12:00:00.000Z',
        overtimeDisputeReason: 'Wrong hours',
        overtimeHours: 2,
        overtimeAmount: 80,
        endDate: '2026-08-01T10:00:00.000Z',
        hourlyRate: 40,
        guardsNeeded: 1,
      },
      {
        id: 'job-closed',
        title: 'Closed OT',
        clientId: 'c1',
        clientName: 'Client',
        assignedGuardId: 'guard-1',
        overtimeStatus: 'waived',
        overtimeDisputedAt: '2026-08-02T12:00:00.000Z',
        overtimeDisputeResolvedAt: '2026-08-03T12:00:00.000Z',
        overtimeDisputeResolution: 'Charge waived',
        overtimeDisputeReason: 'Not late',
        overtimeOriginalHours: 1,
        overtimeOriginalAmount: 40,
        endDate: '2026-08-02T10:00:00.000Z',
        hourlyRate: 40,
        guardsNeeded: 1,
      },
    ] as SecurityRequest[];

    const disputes = buildDisputes(requests, guards, []);
    assert.equal(disputes.length, 2);
    assert.equal(disputes.find((d) => d.requestId === 'job-open')?.status, 'open');
    const closed = disputes.find((d) => d.requestId === 'job-closed');
    assert.equal(closed?.status, 'resolved');
    assert.equal(closed?.resolutionNote, 'Charge waived');
  });

  it('does not include support report tickets (those stay in Support)', () => {
    const tickets = [
      {
        id: 't-closed',
        userId: 'c1',
        userName: 'Client',
        userEmail: 'c@test.com',
        userRole: 'client',
        kind: 'report',
        subject: 'Payment issue',
        category: 'payment',
        priority: 'normal',
        status: 'resolved',
        createdAt: '2026-08-01T12:00:00.000Z',
        updatedAt: '2026-08-02T12:00:00.000Z',
        messages: [{ id: 'm1', ticketId: 't-closed', senderId: 'c1', senderName: 'Client', senderRole: 'client', body: 'Refund please', createdAt: '2026-08-01T12:00:00.000Z' }],
      },
    ] as SupportTicket[];

    const disputes = buildDisputes([], guards, tickets);
    assert.equal(disputes.length, 0);
  });
});
