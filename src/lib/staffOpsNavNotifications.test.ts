import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeStaffNavNotification,
  emptyStaffOpsNavViewState,
  markStaffSectionViewed,
  recordStaffSelfHandledItem,
  syncStaffNavHandledElsewhere,
} from './staffOpsNavNotifications';

test('unread dot when section never visited and has open items', () => {
  const state = emptyStaffOpsNavViewState();
  assert.deepEqual(computeStaffNavNotification(state, 'violations', ['v1']), { kind: 'unread' });
});

test('no dot after visiting section with same open items', () => {
  let state = markStaffSectionViewed(emptyStaffOpsNavViewState(), 'violations', ['v1', 'v2']);
  assert.equal(computeStaffNavNotification(state, 'violations', ['v1', 'v2']), undefined);
});

test('unread dot when new open item appears after visit', () => {
  let state = markStaffSectionViewed(emptyStaffOpsNavViewState(), 'violations', ['v1']);
  assert.deepEqual(computeStaffNavNotification(state, 'violations', ['v1', 'v2']), { kind: 'unread' });
});

test('handled-by-other when item closes while away and not self-resolved', () => {
  let state = markStaffSectionViewed(emptyStaffOpsNavViewState(), 'violations', ['v1', 'v2']);
  state = syncStaffNavHandledElsewhere(state, 'violations', ['v2'], 'jobs');
  assert.deepEqual(computeStaffNavNotification(state, 'violations', ['v2']), { kind: 'handled-by-other' });
});

test('no handled-by-other when current user resolved the item', () => {
  let state = markStaffSectionViewed(emptyStaffOpsNavViewState(), 'violations', ['v1']);
  state = recordStaffSelfHandledItem(state, 'v1');
  state = syncStaffNavHandledElsewhere(state, 'violations', [], 'jobs');
  assert.equal(computeStaffNavNotification(state, 'violations', []), undefined);
});

test('visiting section clears handled-by-other dot', () => {
  let state = markStaffSectionViewed(emptyStaffOpsNavViewState(), 'violations', ['v1', 'v2']);
  state = syncStaffNavHandledElsewhere(state, 'violations', ['v2'], 'jobs');
  state = markStaffSectionViewed(state, 'violations', ['v2']);
  assert.equal(computeStaffNavNotification(state, 'violations', ['v2']), undefined);
});
