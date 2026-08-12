import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildStaffOpsInboxNotifications,
  isStaffOpsInboxNotification,
  loadStaffInboxReadAt,
  markStaffInboxNotificationRead,
  staffSectionFromOpsNotification,
} from './staffOpsInboxNotifications';
import { markStaffSectionViewed, syncStaffNavHandledElsewhere } from './staffOpsNavNotifications';
import type { OpsShiftViolation } from './staffOps';

const staffId = 'staff-1';

test('buildStaffOpsInboxNotifications includes open violations', () => {
  const violations: OpsShiftViolation[] = [
    {
      id: 'v1',
      violationId: 'sv1',
      requestId: 'job-1',
      guardId: 'g1',
      clientId: 'c1',
      label: 'Missed checkpoint',
      jobTitle: 'Retail patrol',
      guardName: 'Jane',
      clientName: 'Acme',
      checkpoint: 'Clock-in',
      category: 'attendance',
      description: 'No GPS at clock-in',
      source: 'system',
      status: 'auto-flagged',
      createdAt: '2026-08-12T10:00:00.000Z',
      needsReview: true,
    },
  ];
  const rows = buildStaffOpsInboxNotifications({
    staffId,
    guards: [],
    clients: [],
    violations,
    disputes: [],
    incidents: [],
    openItemsBySection: { violations: ['v1'] },
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].type, 'staff.violation.open');
  assert.match(rows[0].url ?? '', /\/staff\/violations/);
});

test('handled-by-other violations appear as inbox notifications', () => {
  let viewState = markStaffSectionViewed(
    { sections: {}, handledElsewhere: {}, selfHandledItemIds: [] },
    'violations',
    ['v1', 'v2']
  );
  viewState = syncStaffNavHandledElsewhere(viewState, 'violations', ['v2'], 'jobs');
  const rows = buildStaffOpsInboxNotifications({
    staffId,
    guards: [],
    clients: [],
    violations: [],
    disputes: [],
    incidents: [],
    openItemsBySection: { violations: ['v2'] },
    viewState,
  });
  assert.ok(rows.some((r) => r.type === 'staff.violation.handled'));
});

test('markStaffInboxNotificationRead sets readAt on reload', () => {
  if (typeof localStorage === 'undefined') return;
  const id = 'staff-ops-violation-open-v99';
  markStaffInboxNotificationRead(staffId, id);
  const read = loadStaffInboxReadAt(staffId);
  assert.ok(read[id]);
});

test('isStaffOpsInboxNotification and section resolver', () => {
  const n = {
    type: 'staff.dispute.open',
    metadata: { section: 'disputes' },
    url: '/staff/disputes',
  };
  assert.equal(isStaffOpsInboxNotification(n), true);
  assert.equal(staffSectionFromOpsNotification(n), 'disputes');
});
