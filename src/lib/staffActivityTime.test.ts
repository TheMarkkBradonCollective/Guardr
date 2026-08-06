import test from 'node:test';
import assert from 'node:assert/strict';
import { recordStaffActivity } from './staffActivityTime';
import { type StaffTimeEntry } from './staffTimeTracking';

test('recordStaffActivity delegates to work events for backward compatibility', () => {
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
  assert.equal(result.entries[0]?.lastActivityAt, '2026-08-05T10:10:00.000Z');
});
