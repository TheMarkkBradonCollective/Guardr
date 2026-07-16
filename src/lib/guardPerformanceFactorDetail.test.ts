import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeFactorActivityBreakdown,
  computeFactorStreak,
  isPerformanceFactorId,
} from './guardPerformanceFactorDetail.ts';
import type { SecurityRequest } from '../types.ts';

function completedJob(overrides: Partial<SecurityRequest> = {}): SecurityRequest {
  return {
    id: 'job-1',
    title: 'Event Security',
    type: 'event',
    status: 'completed',
    assignedGuardId: 'guard-1',
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

test('isPerformanceFactorId validates known factor ids', () => {
  assert.equal(isPerformanceFactorId('acceptance'), true);
  assert.equal(isPerformanceFactorId('bogus'), false);
});

test('computeFactorActivityBreakdown counts completion outcomes', () => {
  const requests = [
    completedJob({ id: 'j1' }),
    completedJob({ id: 'j2', status: 'cancelled' }),
  ];
  const breakdown = computeFactorActivityBreakdown('guard-1', 'completion', requests);
  assert.equal(breakdown.rows[0]?.count, 1);
  assert.equal(breakdown.rows[1]?.count, 1);
});

test('computeFactorStreak counts leading positive outcomes', () => {
  const requests = [
    completedJob({ id: 'j1' }),
    completedJob({ id: 'j2' }),
    completedJob({ id: 'j3', status: 'cancelled' }),
    completedJob({ id: 'j4' }),
  ];
  assert.equal(computeFactorStreak('guard-1', 'completion', requests), 2);
});
