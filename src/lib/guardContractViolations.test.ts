import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityGuard, SecurityRequest } from '../types';
import {
  buildGuardContractViolations,
  formatContractViolationSummary,
} from './guardContractViolations';

function guard(): SecurityGuard {
  return {
    id: 'g1',
    name: 'Test Guard',
    email: 'guard@test.com',
    badgeNumber: '1',
    avatar: '',
    phone: '',
    bio: '',
    isArmed: false,
    jobsCompleted: 2,
    failedAudits: 1,
  } as SecurityGuard;
}

describe('guardContractViolations', () => {
  it('builds shift audit rows with dispute status labels', () => {
    const requests: SecurityRequest[] = [
      {
        id: 'job-1',
        title: 'Retail patrol',
        clientName: 'Client',
        clientId: 'c1',
        assignedGuardId: 'g1',
        status: 'completed',
        startDate: '2026-07-10T12:00:00.000Z',
        endDate: '2026-07-10T20:00:00.000Z',
        shiftAuditViolations: [
          {
            id: 'v1',
            checkpoint: 'start',
            source: 'client',
            category: 'uniform',
            label: 'Uniform issue',
            description: 'Client flagged uniform at start.',
            createdAt: '2026-07-10T12:05:00.000Z',
            guardId: 'g1',
            status: 'upheld',
            dispute: {
              status: 'upheld',
              guardNote: 'I was in full uniform.',
              guardSubmittedAt: '2026-07-10T13:00:00.000Z',
              disputeDeadlineAt: '2026-07-12T12:05:00.000Z',
            },
          },
        ],
      } as SecurityRequest,
    ];

    const rows = buildGuardContractViolations(guard(), requests);
    assert.equal(rows.length, 2);
    const uniformIssue = rows.find((row) => row.id === 'shift-audit-v1');
    assert.ok(uniformIssue);
    assert.equal(uniformIssue.title, 'Uniform issue');
    assert.equal(uniformIssue.statusLabel, 'Dispute rejected');
    assert.equal(formatContractViolationSummary(rows.length), '2 contract violations');
  });
});
