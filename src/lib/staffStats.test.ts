import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityGuard, SecurityRequest } from '../types';
import {
  buildStaffGuardStatRows,
  buildStaffStatsPlatformSummary,
  sortStaffGuardStatRows,
} from './staffStats';
import { buildStaffShiftViolations } from './staffOps';

function guard(id: string, name: string, overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id,
    name,
    email: `${id}@test.com`,
    badgeNumber: id.toUpperCase(),
    avatar: '',
    phone: '',
    bio: '',
    isArmed: false,
    jobsCompleted: 3,
    userStatus: 'active',
    isStaff: false,
    ...overrides,
  } as SecurityGuard;
}

describe('staffStats', () => {
  it('builds sortable guard stat rows and platform summary', () => {
    const guards = [guard('g1', 'Alpha'), guard('g2', 'Bravo', { jobsCompleted: 10 })];
    const requests = [
      {
        id: 'job-1',
        title: 'Site A',
        clientName: 'Client',
        clientId: 'c1',
        assignedGuardId: 'g1',
        status: 'completed',
        startDate: '2026-07-10T12:00:00.000Z',
        endDate: '2026-07-10T20:00:00.000Z',
        checkInAudit: {
          checkedAt: '2026-07-10T12:02:00.000Z',
          uniform: {
            uniformPresent: true,
            blackShoes: true,
            professionalAppearance: true,
          },
        },
        shiftAuditViolations: [
          {
            id: 'v1',
            checkpoint: 'start',
            source: 'system',
            category: 'skip',
            label: 'Skipped location photo',
            description: 'Guard skipped location photo.',
            createdAt: '2026-07-10T12:03:00.000Z',
            guardId: 'g1',
            status: 'auto-flagged',
          },
        ],
      } as SecurityRequest,
    ];

    const rows = buildStaffGuardStatRows(guards, requests);
    assert.equal(rows.length, 2);
    const sorted = sortStaffGuardStatRows(rows, 'name-asc');
    assert.equal(sorted[0].guardName, 'Alpha');
    const shiftViolations = buildStaffShiftViolations(requests, guards);
    const summary = buildStaffStatsPlatformSummary(rows, shiftViolations);
    assert.equal(summary.guardCount, 2);
    assert.ok(summary.violationsByCheckpoint.length >= 1);
  });
});
