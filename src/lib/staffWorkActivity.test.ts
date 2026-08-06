import test from 'node:test';
import assert from 'node:assert/strict';
import {
  finalizeIdleStaffSessions,
  isStaffWorkAuditAction,
  markStaffPresenceHidden,
  recordStaffTimeEvent,
  resumeStaffPresence,
  shouldEmitStaffWorkAction,
  STAFF_ACTIVITY_IDLE_MS,
} from './staffWorkActivity';
import { entryHoursInPeriod, type StaffTimeEntry } from './staffTimeTracking';

test('recordStaffTimeEvent opens a session on app presence', () => {
  const result = recordStaffTimeEvent([], {
    staffId: 'staff-1',
    staffName: 'Alex',
    kind: 'presence',
    at: '2026-08-05T10:00:00.000Z',
  });
  assert.equal(result.changed, true);
  assert.equal(result.entries[0]?.clockInAt, '2026-08-05T10:00:00.000Z');
});

test('recordStaffTimeEvent extends travel without generic clicks', () => {
  const open: StaffTimeEntry = {
    id: '1',
    staffId: 'staff-1',
    staffName: 'Alex',
    clockInAt: '2026-08-05T10:00:00.000Z',
    lastActivityAt: '2026-08-05T10:00:00.000Z',
    createdAt: '2026-08-05T10:00:00.000Z',
  };
  const result = recordStaffTimeEvent([open], {
    staffId: 'staff-1',
    staffName: 'Alex',
    kind: 'travel',
    at: '2026-08-05T10:08:00.000Z',
  });
  assert.equal(result.entries[0]?.lastActivityAt, '2026-08-05T10:08:00.000Z');
});

test('recordStaffTimeEvent counts meaningful work actions', () => {
  const open: StaffTimeEntry = {
    id: '1',
    staffId: 'staff-1',
    staffName: 'Alex',
    clockInAt: '2026-08-05T10:00:00.000Z',
    lastActivityAt: '2026-08-05T10:00:00.000Z',
    createdAt: '2026-08-05T10:00:00.000Z',
  };
  const result = recordStaffTimeEvent([open], {
    staffId: 'staff-1',
    staffName: 'Alex',
    kind: 'work',
    at: '2026-08-05T10:20:00.000Z',
  });
  assert.equal(result.entries[0]?.lastActivityAt, '2026-08-05T10:20:00.000Z');
});

test('markStaffPresenceHidden and resumeStaffPresence backfill brief app switches', () => {
  const open: StaffTimeEntry = {
    id: '1',
    staffId: 'staff-1',
    staffName: 'Alex',
    clockInAt: '2026-08-05T10:00:00.000Z',
    lastActivityAt: '2026-08-05T10:30:00.000Z',
    createdAt: '2026-08-05T10:00:00.000Z',
  };
  const hidden = markStaffPresenceHidden([open], 'staff-1', '2026-08-05T10:35:00.000Z');
  const resumed = resumeStaffPresence(hidden.entries, 'staff-1', '2026-08-05T10:37:00.000Z');
  assert.equal(resumed.entries[0]?.lastActivityAt, '2026-08-05T10:37:00.000Z');
});

test('finalizeIdleStaffSessions closes stale open sessions at last activity', () => {
  const open: StaffTimeEntry = {
    id: '1',
    staffId: 'staff-1',
    staffName: 'Alex',
    clockInAt: '2026-08-05T10:00:00.000Z',
    lastActivityAt: '2026-08-05T10:45:00.000Z',
    createdAt: '2026-08-05T10:00:00.000Z',
  };
  const now = new Date(new Date('2026-08-05T10:45:00.000Z').getTime() + STAFF_ACTIVITY_IDLE_MS);
  const result = finalizeIdleStaffSessions([open], now);
  assert.equal(result.entries[0]?.clockOutAt, '2026-08-05T10:45:00.000Z');
});

test('shouldEmitStaffWorkAction ignores sign in/out but counts all other staff audit actions', () => {
  assert.equal(shouldEmitStaffWorkAction('manager', 'sign_in'), false);
  assert.equal(shouldEmitStaffWorkAction('manager', 'sign_out'), false);
  assert.equal(shouldEmitStaffWorkAction('manager', 'guard_approved'), true);
  assert.equal(shouldEmitStaffWorkAction('owner', 'staff_compensation_payout_confirmed'), true);
  assert.equal(shouldEmitStaffWorkAction('owner', 'staff_compensation_base_paid'), true);
  assert.equal(shouldEmitStaffWorkAction('manager', 'settings_updated'), true);
  assert.equal(isStaffWorkAuditAction('job_approved'), true);
});

test('entryHoursInPeriod uses last activity for open sessions, not idle now', () => {
  const entry: StaffTimeEntry = {
    id: '2',
    staffId: 'staff-1',
    staffName: 'Alex',
    clockInAt: '2026-08-05T10:00:00.000Z',
    lastActivityAt: '2026-08-05T11:00:00.000Z',
    createdAt: '2026-08-05T10:00:00.000Z',
  };
  const hours = entryHoursInPeriod(
    entry,
    '2026-08-04T00:00:00.000Z',
    '2026-08-10T23:59:59.999Z',
    new Date('2026-08-05T15:00:00.000Z'),
  );
  assert.equal(hours, 1);
});
