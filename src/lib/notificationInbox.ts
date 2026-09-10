import type { UserNotification } from '../types';
import { isMessagingNotificationType } from './notificationChannel';

export function isNotificationUnread(notification: UserNotification): boolean {
  return !notification.readAt;
}

export function countUnreadNotifications(notifications: UserNotification[]): number {
  return notifications.filter(isNotificationUnread).length;
}

export function sortNotificationsNewestFirst(
  notifications: UserNotification[]
): UserNotification[] {
  return [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function markNotificationRead(
  notifications: UserNotification[],
  id: string,
  now = new Date()
): UserNotification[] {
  const stamp = now.toISOString();
  return notifications.map((n) =>
    n.id === id ? { ...n, readAt: n.readAt ?? stamp } : n
  );
}

export function markNotificationClicked(
  notifications: UserNotification[],
  id: string,
  now = new Date()
): UserNotification[] {
  const stamp = now.toISOString();
  return notifications.map((n) =>
    n.id === id ? { ...n, readAt: n.readAt ?? stamp, clickedAt: stamp } : n
  );
}

export function markAllNotificationsRead(
  notifications: UserNotification[],
  now = new Date()
): UserNotification[] {
  return markMatchingNotificationsRead(notifications, () => true, now);
}

/** Mark only the rows that match — used so Messenger cannot clear Main App alerts. */
export function markMatchingNotificationsRead(
  notifications: UserNotification[],
  match: (notification: UserNotification) => boolean,
  now = new Date()
): UserNotification[] {
  const stamp = now.toISOString();
  return notifications.map((n) =>
    match(n) && !n.readAt ? { ...n, readAt: stamp } : n
  );
}

export function upsertNotification(
  notifications: UserNotification[],
  next: UserNotification
): UserNotification[] {
  const without = notifications.filter((n) => n.id !== next.id);
  return sortNotificationsNewestFirst([next, ...without]);
}

export function notificationRowFromDb(row: Record<string, unknown>): UserNotification {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    type: String(row.type),
    title: String(row.title),
    body: String(row.body),
    url: row.url ? String(row.url) : undefined,
    requestId: row.request_id ? String(row.request_id) : undefined,
    guardId: row.guard_id ? String(row.guard_id) : undefined,
    ticketId: row.ticket_id ? String(row.ticket_id) : undefined,
    metadata:
      row.metadata && typeof row.metadata === 'object'
        ? (row.metadata as Record<string, unknown>)
        : undefined,
    createdAt: String(row.created_at),
    readAt: row.read_at ? String(row.read_at) : undefined,
    clickedAt: row.clicked_at ? String(row.clicked_at) : undefined,
  };
}

export function notificationRowToDb(notification: UserNotification) {
  return {
    id: notification.id,
    user_id: notification.userId,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    url: notification.url ?? null,
    request_id: notification.requestId ?? null,
    guard_id: notification.guardId ?? null,
    ticket_id: notification.ticketId ?? null,
    metadata: notification.metadata ?? {},
    created_at: notification.createdAt,
    read_at: notification.readAt ?? null,
    clicked_at: notification.clickedAt ?? null,
  };
}

export function createUserNotification(input: {
  userId: string;
  type: string;
  title: string;
  body: string;
  url?: string;
  requestId?: string;
  guardId?: string;
  ticketId?: string;
  metadata?: Record<string, unknown>;
  id?: string;
  now?: Date;
}): UserNotification {
  const now = input.now ?? new Date();
  return {
    id: input.id ?? `notif-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    url: input.url,
    requestId: input.requestId,
    guardId: input.guardId,
    ticketId: input.ticketId,
    metadata: input.metadata,
    createdAt: now.toISOString(),
  };
}

/** Main-app inbox: hide conversation alerts when Messenger can take them. */
export function notificationsForMainApp(
  notifications: UserNotification[],
  messengerAvailable: boolean,
): UserNotification[] {
  if (!messengerAvailable) return notifications;
  return notifications.filter((n) => !isMessagingNotificationType(n.type));
}

/** Messenger inbox: conversation alerts only. */
export function notificationsForMessenger(notifications: UserNotification[]): UserNotification[] {
  return notifications.filter((n) => isMessagingNotificationType(n.type));
}

export function countUnreadForMainApp(
  notifications: UserNotification[],
  messengerAvailable: boolean,
): number {
  return countUnreadNotifications(notificationsForMainApp(notifications, messengerAvailable));
}

export function countUnreadForMessenger(notifications: UserNotification[]): number {
  return countUnreadNotifications(notificationsForMessenger(notifications));
}
