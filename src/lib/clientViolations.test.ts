import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canClientReportViolation,
  countGuardViolationReports,
  createClientViolationReport,
  listGuardViolationReportsForGuard,
} from './clientViolations.ts';
import type { SecurityRequest } from '../types.ts';

function job(overrides: Partial<SecurityRequest> = {}): SecurityRequest {
  return {
    id: 'job-1',
    title: 'Event',
    type: 'event',
    status: 'in-progress',
    assignedGuardId: 'guard-1',
    applicants: ['guard-1'],
    startDate: '2026-01-01T18:00:00',
    endDate: '2026-01-01T22:00:00',
    location: 'LA',
    clientId: 'client-1',
    clientName: 'Client',
    hourlyRate: 30,
    guardPay: 25,
    durationHours: 4,
    estimatedPayout: 100,
    ...overrides,
  } as SecurityRequest;
}

test('canClientReportViolation allows active and completed shifts', () => {
  assert.equal(canClientReportViolation(job({ status: 'open' })), false);
  assert.equal(canClientReportViolation(job({ status: 'in-progress' })), true);
  assert.equal(canClientReportViolation(job({ status: 'completed' })), true);
});

test('countGuardViolationReports ignores job-targeted reports', () => {
  const requests = [
    job({
      clientViolationReports: [
        createClientViolationReport({
          target: 'guard',
          category: 'uniform',
          description: 'Issue',
          reportedByClientId: 'client-1',
          guardId: 'guard-1',
        }),
        createClientViolationReport({
          target: 'job',
          category: 'equipment',
          description: 'Missing radio',
          reportedByClientId: 'client-1',
        }),
      ],
    }),
  ];

  assert.equal(countGuardViolationReports('guard-1', requests), 1);
  assert.equal(listGuardViolationReportsForGuard('guard-1', requests).length, 1);
});
