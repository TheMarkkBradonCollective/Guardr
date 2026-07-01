import type { UserNotification } from '../types';
import {
  createUserNotification,
  notificationRowFromDb,
  notificationRowToDb,
  sortNotificationsNewestFirst,
} from './notificationInbox';
import { supabase } from './supabase';

const LOCAL_KEY = 'guardr_user_notifications_v1';

function localKey(userId: string): string {
  return `${LOCAL_KEY}:${userId}`;
}

function readLocal(userId: string): UserNotification[] {
  try {
    const raw = localStorage.getItem(localKey(userId));
    if (!raw) return [];
    return sortNotificationsNewestFirst(JSON.parse(raw) as UserNotification[]);
  } catch {
    return [];
  }
}

function writeLocal(userId: string, rows: UserNotification[]): void {
  try {
    localStorage.setItem(localKey(userId), JSON.stringify(rows.slice(0, 200)));
  } catch {
    /* ignore quota */
  }
}

export async function loadUserNotifications(
  userId: string,
  isDbConnected: boolean
): Promise<UserNotification[]> {
  if (!isDbConnected) return readLocal(userId);
  const { data, error } = await supabase
    .from('user_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) {
    console.warn('loadUserNotifications:', error.message);
    return readLocal(userId);
  }
  const rows = (data ?? []).map((row) => notificationRowFromDb(row as Record<string, unknown>));
  writeLocal(userId, rows);
  return rows;
}

export async function saveUserNotification(
  notification: UserNotification,
  isDbConnected: boolean
): Promise<void> {
  const local = readLocal(notification.userId);
  const merged = sortNotificationsNewestFirst([
    notification,
    ...local.filter((n) => n.id !== notification.id),
  ]);
  writeLocal(notification.userId, merged);
  if (!isDbConnected) return;
  const { error } = await supabase
    .from('user_notifications')
    .upsert(notificationRowToDb(notification));
  if (error) console.warn('saveUserNotification:', error.message);
}

export async function persistUserNotifications(
  notifications: UserNotification[],
  userId: string,
  isDbConnected: boolean
): Promise<void> {
  writeLocal(userId, notifications);
  if (!isDbConnected) return;
  const changed = notifications.slice(0, 50);
  if (changed.length === 0) return;
  const { error } = await supabase
    .from('user_notifications')
    .upsert(changed.map(notificationRowToDb));
  if (error) console.warn('persistUserNotifications:', error.message);
}

export async function appendInboxNotification(
  input: Parameters<typeof createUserNotification>[0],
  isDbConnected: boolean
): Promise<UserNotification> {
  const notification = createUserNotification(input);
  await saveUserNotification(notification, isDbConnected);
  return notification;
}
