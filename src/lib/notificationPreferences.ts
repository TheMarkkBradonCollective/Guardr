import type { NotificationPreferences } from '../types';
import type { PushNotificationType } from '../../lib/push/types';

const STORAGE_KEY = 'guardr_notification_prefs';

export const NOTIFICATION_TYPE_OPTIONS: {
  key: keyof Omit<NotificationPreferences, 'userId' | 'updatedAt'>;
  type: PushNotificationType;
  label: string;
  description: string;
  roles: Array<'client' | 'guard' | 'staff'>;
}[] = [
  {
    key: 'assignment',
    type: 'assignment',
    label: 'Job assignments',
    description: 'New direct requests and picked-up jobs.',
    roles: ['guard'],
  },
  {
    key: 'guardCheckin',
    type: 'guard_checkin',
    label: 'Guard check-ins',
    description: 'When a guard clocks in or completes a self-audit.',
    roles: ['staff'],
  },
  {
    key: 'missedCheckin',
    type: 'missed_checkin',
    label: 'Missed check-ins',
    description: 'Hourly check-in reminders that were missed.',
    roles: ['staff'],
  },
  {
    key: 'emergencyAlert',
    type: 'emergency_alert',
    label: 'Emergency alerts',
    description: 'Urgent safety incidents on active shifts.',
    roles: ['guard', 'staff'],
  },
  {
    key: 'supportMessage',
    type: 'support_message',
    label: 'Support messages',
    description: 'New replies on support tickets.',
    roles: ['client', 'guard', 'staff'],
  },
  {
    key: 'jobChatMessage',
    type: 'job_chat_message',
    label: 'Job chat',
    description: 'Messages between client and guard during active jobs.',
    roles: ['client', 'guard', 'staff'],
  },
  {
    key: 'staffMessage',
    type: 'staff_message',
    label: 'Staff team chat',
    description: 'Internal messages between Guardr staff.',
    roles: ['staff'],
  },
];

export function defaultNotificationPreferences(userId: string): NotificationPreferences {
  const now = new Date().toISOString();
  return {
    userId,
    assignment: true,
    guardCheckin: true,
    missedCheckin: true,
    emergencyAlert: true,
    supportMessage: true,
    jobChatMessage: true,
    staffMessage: true,
    updatedAt: now,
  };
}

export function loadNotificationPreferencesFromStorage(userId: string): NotificationPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultNotificationPreferences(userId);
    const parsed = JSON.parse(raw) as Record<string, NotificationPreferences>;
    return parsed[userId] ?? defaultNotificationPreferences(userId);
  } catch {
    return defaultNotificationPreferences(userId);
  }
}

export function saveNotificationPreferencesToStorage(prefs: NotificationPreferences): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, NotificationPreferences>) : {};
    parsed[prefs.userId] = prefs;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    /* ignore */
  }
}

export function preferenceKeyForType(
  type: PushNotificationType
): keyof Omit<NotificationPreferences, 'userId' | 'updatedAt'> | null {
  const match = NOTIFICATION_TYPE_OPTIONS.find((o) => o.type === type);
  return match?.key ?? null;
}

export function isNotificationTypeEnabled(
  prefs: NotificationPreferences | null | undefined,
  type: PushNotificationType
): boolean {
  if (!prefs) return true;
  const key = preferenceKeyForType(type);
  if (!key) return true;
  return prefs[key];
}

export function optionsForRole(role: 'client' | 'guard' | 'staff') {
  return NOTIFICATION_TYPE_OPTIONS.filter((o) => o.roles.includes(role));
}

export function roleCategory(role: string): 'client' | 'guard' | 'staff' {
  if (role === 'client') return 'client';
  if (role === 'guard') return 'guard';
  return 'staff';
}

export function prefsToDbRow(prefs: NotificationPreferences) {
  return {
    user_id: prefs.userId,
    assignment: prefs.assignment,
    guard_checkin: prefs.guardCheckin,
    missed_checkin: prefs.missedCheckin,
    emergency_alert: prefs.emergencyAlert,
    support_message: prefs.supportMessage,
    job_chat_message: prefs.jobChatMessage,
    staff_message: prefs.staffMessage,
    updated_at: prefs.updatedAt,
  };
}

export function prefsFromDbRow(row: Record<string, unknown>): NotificationPreferences {
  return {
    userId: String(row.user_id),
    assignment: row.assignment !== false,
    guardCheckin: row.guard_checkin !== false,
    missedCheckin: row.missed_checkin !== false,
    emergencyAlert: row.emergency_alert !== false,
    supportMessage: row.support_message !== false,
    jobChatMessage: row.job_chat_message !== false,
    staffMessage: row.staff_message !== false,
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}
