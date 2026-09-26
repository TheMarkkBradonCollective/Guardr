import assert from 'node:assert/strict';
import test from 'node:test';
import type { SecurityRequest } from '../types';
import { computeSlaMetrics } from './slaMetrics';

test('avg approval time uses createdAt to openedAt, not shift start', () => {
  const requests = [
    {
      id: 'j1',
      title: 'Test',
      description: '',
      clientId: 'c1',
      clientName: 'Client',
      clientLogo: '',
      location: 'Sacramento',
      type: 'foot-patrol',
      armedRequired: false,
      startDate: '2026-10-01T18:00:00.000Z',
      endDate: '2026-10-01T22:00:00.000Z',
      durationHours: 4,
      hourlyRate: 30,
      estimatedPayout: 100,
      assignedGuardId: null,
      requiredCertifications: [],
      applicants: [],
      status: 'open',
      openedAt: '2026-09-20T12:00:00.000Z',
      createdAt: '2026-09-18T08:00:00.000Z',
    },
  ] satisfies SecurityRequest[];
  const metrics = computeSlaMetrics(requests, [], [], []);
  assert.ok(metrics.avgTimeToApproveHours > 40, `expected ~52h, got ${metrics.avgTimeToApproveHours}`);
});
