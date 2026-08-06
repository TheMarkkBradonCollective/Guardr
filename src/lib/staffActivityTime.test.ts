import test from 'node:test';
import assert from 'node:assert/strict';
import {
  finalizeIdleStaffSessions,
  recordStaffActivity,
  STAFF_ACTIVITY_IDLE_MS,
} from './staffActivityTime';
import { entryHoursInPeriod, type StaffTimeEntry } from './staffTimeTracking';

test('recordStaffActivity opens a session on first action', () => {
  const result = recordStaffActivity([], {
    staffId: 'staff-1',
    staffName: 'Alex',
    at: '2026-08-05T10:00:00.000Z',
  });
  assert.equal(result.changed, true);
  assert.equal(result.entries.length, 1);
  assert.equal(result.entries[0]?.clockInAt, '2026-08-05T10:00:00.000Z');
  assert.equal(result.entries[0]?.lastActivityAt, '2026-08-05T10:00:00.000Z');
  assert.equal(result.entries[0]?.clockOutAt, undefined);
});

test('recordStaffActivity extends last activity within idle window', () => {
  const open: StaffTimeEntry = {
    id: '1',
    staffId: 'staff-1',
    staffName: 'Alex',
    clockInAt: '2026-08-05T10:00:00.000Z',
    lastActivityAt: '2026-08-05T10:00:00.000Z',
    createdAt: '2026-08-05T10:00:00.000Z',
  };
  const result = recordStaffActivity([open], {
    staffId: 'staff-1',
    staffName: 'Alex',
    at: '2026-08-05T10:10:00.000Z',
  });
  assert.equal(result.changed, true);
  assert.equal(result.entries[0]?.lastActivityAt, '2026-08-05T10:10:00.000Z');
  assert.equal(result.entries[0]?.clockInAt, '2026-08-05T10:00:00.000Z');
});

test('recordStaffActivity starts a new session after idle timeout', () => {
  const open: StaffTimeEntry = {
    id: '1',
    staffId: 'staff-1',
    staffName: 'Alex',
    clockInAt: '2026-08-05T10:00:00.000Z',
    lastActivityAt: '2026-08-05T10:00:00.000Z',
    createdAt: '2026-08-05T10:00:00.000Z',
  };
  const idleAt = new Date(new Date('2026-08-05T10:00:00.000Z').getTime() + STAFF_ACTIVITY_IDLE_MS + 1_000).toISOString();
  const result = recordStaffActivity([open], {
    staffId: 'staff-1',
    staffName: 'Alex',
    at: idleAt,
  });
  assert.equal(result.entries.length, 2);
  assert.equal(result.entries[1]?.clockOutAt, '2026-08-05T10:00:00.000Z');
  assert.equal(result.entries[0]?.clockInAt, idleAt);
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
  assert.equal(result.changed, true);
  assert.equal(result.entries[0]?.clockOutAt, '2026-08-05T10:45:00.000Z');
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
