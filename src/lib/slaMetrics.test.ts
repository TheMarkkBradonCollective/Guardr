import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeSlaMetrics, formatSlaHours } from './slaMetrics.ts';
import type { SecurityRequest, SecurityGuard, Client } from '../types.ts';

const baseRequest = (overrides: Partial<SecurityRequest>): SecurityRequest =>
  ({
    id: 'req-1',
    title: 'Test',
    clientId: 'c1',
    clientName: 'Client',
    clientLogo: 'CL',
    location: 'LA',
    type: 'event',
    status: 'open',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 8 * 3600000).toISOString(),
    hourlyRate: 35,
    guardsNeeded: 1,
    applicants: [],
    ...overrides,
  }) as SecurityRequest;

test('computeSlaMetrics counts open jobs', () => {
  const requests = [
    baseRequest({ id: 'r1', status: 'open' }),
    baseRequest({ id: 'r2', status: 'pending-review' }),
    baseRequest({ id: 'r3', status: 'completed' }),
  ];
  const metrics = computeSlaMetrics(requests, [], []);
  assert.equal(metrics.openJobsCount, 1);
  assert.equal(metrics.pendingApprovalsCount, 1);
  assert.equal(metrics.jobsCompletedThisWeek, 1);
});

test('formatSlaHours formats minutes and days', () => {
  assert.equal(formatSlaHours(0.5), '30m');
  assert.equal(formatSlaHours(5), '5.0h');
  assert.equal(formatSlaHours(48), '2.0d');
});
