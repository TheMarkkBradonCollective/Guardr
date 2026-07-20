import test from 'node:test';
import assert from 'node:assert/strict';
import { inferClientShiftPhase } from './clientShift';
import type { SecurityRequest } from '../types';

function baseJob(overrides: Partial<SecurityRequest> = {}): SecurityRequest {
  return {
    id: 'job-1',
    title: 'Lobby coverage',
    clientId: 'client-1',
    clientName: 'Client',
    location: '123 Main',
    startDate: '2026-07-20T18:00:00.000Z',
    endDate: '2026-07-20T22:00:00.000Z',
    status: 'accepted',
    assignedGuardId: 'guard-1',
    applicants: ['guard-1'],
    ...overrides,
  } as SecurityRequest;
}

test('inferClientShiftPhase uses explicit enRouteAt and arrivedAt', () => {
  assert.equal(inferClientShiftPhase(baseJob()), 'scheduled');
  assert.equal(
    inferClientShiftPhase(baseJob({ enRouteAt: '2026-07-20T17:10:00.000Z' })),
    'en-route'
  );
  assert.equal(
    inferClientShiftPhase(
      baseJob({
        enRouteAt: '2026-07-20T17:10:00.000Z',
        arrivedAt: '2026-07-20T17:40:00.000Z',
      })
    ),
    'on-site'
  );
  assert.equal(
    inferClientShiftPhase(baseJob({ status: 'in-progress' })),
    'on-duty'
  );
});

test('inferClientShiftPhase does not auto-infer en-route from start proximity', () => {
  const soon = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  assert.equal(inferClientShiftPhase(baseJob({ startDate: soon })), 'scheduled');
});
