import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countUnreadNotifications,
  createUserNotification,
  markNotificationClicked,
} from './notificationInbox';

test('countUnreadNotifications ignores read rows', () => {
  const rows = [
    createUserNotification({ userId: 'u1', type: 'test', title: 'A', body: 'a' }),
    {
      ...createUserNotification({ userId: 'u1', type: 'test', title: 'B', body: 'b' }),
      readAt: new Date().toISOString(),
    },
  ];
  assert.equal(countUnreadNotifications(rows), 1);
});

test('markNotificationClicked sets read and clicked timestamps', () => {
  const row = createUserNotification({ userId: 'u1', type: 'test', title: 'A', body: 'a' });
  const next = markNotificationClicked([row], row.id);
  assert.ok(next[0]?.readAt);
  assert.ok(next[0]?.clickedAt);
});
