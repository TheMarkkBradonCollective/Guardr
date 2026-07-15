import test from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityGuard, SecurityRequest, GuardStandingCrewMember } from '../types';
import {
  evaluateCheckInEscalation,
  getCheckInDueAtMs,
  checkInEscalationDedupKey,
} from './checkInEscalation';

function inProgressJob(overrides: Partial<SecurityRequest> = {}): SecurityRequest {
  return {
    id: 'req-1',
    title: 'Test',
    description: 'Test',
    clientId: 'client-1',
    clientName: 'Client',
    clientLogo: 'CL',
    location: 'Site',
    type: 'other',
    armedRequired: false,
    startDate: '2026-01-01T18:00:00.000Z',
    endDate: '2026-01-02T02:00:00.000Z',
    durationHours: 8,
    hourlyRate: 30,
    estimatedPayout: 240,
    status: 'in-progress',
    assignedGuardId: 'guard-1',
    checkInAudit: { checkedAt: '2026-07-15T18:00:00.000Z' },
    ...overrides,
  } as SecurityRequest;
}

test('getCheckInDueAtMs is one hour after last activity', () => {
  const job = inProgressJob();
  const due = getCheckInDueAtMs(job, Date.parse('2026-07-15T18:30:00.000Z'));
  assert.equal(due, Date.parse('2026-07-15T19:00:00.000Z'));
});

test('evaluateCheckInEscalation returns due before overdue window', () => {
  const job = inProgressJob();
  const snapshot = evaluateCheckInEscalation(job, Date.parse('2026-07-15T19:02:00.000Z'));
  assert.equal(snapshot?.tier, 'due');
  assert.equal(snapshot?.minutesOverdue, 2);
});

test('evaluateCheckInEscalation escalates at 5/10/15 minutes overdue', () => {
  const job = inProgressJob();
  const at5 = evaluateCheckInEscalation(job, Date.parse('2026-07-15T19:05:00.000Z'));
  const at10 = evaluateCheckInEscalation(job, Date.parse('2026-07-15T19:10:00.000Z'));
  const at15 = evaluateCheckInEscalation(job, Date.parse('2026-07-15T19:15:00.000Z'));

  assert.equal(at5?.tier, 'alert');
  assert.equal(at10?.tier, 'staff');
  assert.equal(at15?.tier, 'escalate');
});

test('evaluateCheckInEscalation uses latest mid-shift audit', () => {
  const job = inProgressJob({
    midShiftAudits: [
      {
        checkedAt: '2026-07-15T20:00:00.000Z',
        selfie: '',
        uniformVerified: true,
        equipmentVerified: true,
      },
    ],
  });
  const due = getCheckInDueAtMs(job);
  assert.equal(due, Date.parse('2026-07-15T21:00:00.000Z'));
});

test('checkInEscalationDedupKey includes tier and due bucket', () => {
  assert.equal(
    checkInEscalationDedupKey('req-1', 488_000, 'alert'),
    'checkin_esc:req-1:488000:alert'
  );
});
