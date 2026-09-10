import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countUnreadForMainApp,
  countUnreadNotifications,
  createUserNotification,
  markMatchingNotificationsRead,
  markNotificationClicked,
  notificationsForMainApp,
  notificationsForMessenger,
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

test('main-app inbox hides conversation alerts when Messenger is available', () => {
  const rows = [
    createUserNotification({ userId: 'u1', type: 'assignment', title: 'Shift', body: 'a' }),
    createUserNotification({ userId: 'u1', type: 'job_chat_message', title: 'Chat', body: 'b' }),
  ];
  assert.equal(notificationsForMainApp(rows, true).length, 1);
  assert.equal(notificationsForMainApp(rows, false).length, 2);
  assert.equal(notificationsForMessenger(rows).length, 1);
  assert.equal(countUnreadForMainApp(rows, true), 1);
});

test('marking Messenger notifications read leaves Main App alerts unread', () => {
  const assignment = createUserNotification({ userId: 'u1', type: 'assignment', title: 'Shift', body: 'a' });
  const chat = createUserNotification({ userId: 'u1', type: 'job_chat_message', title: 'Chat', body: 'b' });
  const next = markMatchingNotificationsRead([assignment, chat], (n) => n.type === 'job_chat_message');
  assert.equal(next[0]?.readAt, undefined);
  assert.ok(next[1]?.readAt);
});
