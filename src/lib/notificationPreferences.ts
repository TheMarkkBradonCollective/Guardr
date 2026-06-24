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
    label: 'Guard clock-ins',
    description: 'When a guard clocks in or completes a self-audit.',
    roles: ['staff'],
  },
  {
    key: 'guardClockout',
    type: 'guard_clockout',
    label: 'Guard clock-outs',
    description: 'When a guard ends their shift.',
    roles: ['staff'],
  },
  {
    key: 'guardBreakStart',
    type: 'guard_break_start',
    label: 'Break started',
    description: 'When a guard goes on break during a shift.',
    roles: ['staff'],
  },
  {
    key: 'guardBreakEnd',
    type: 'guard_break_end',
    label: 'Break ended',
    description: 'When a guard returns from break.',
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
    roles: ['client', 'guard', 'staff'],
  },
  {
    key: 'supportMessage',
    type: 'support_message',
    label: 'Support messages',
    description: 'New replies on support tickets.',
    roles: ['client', 'guard', 'staff'],
  },
  {
    key: 'supportTicket',
    type: 'support_ticket',
    label: 'New support tickets',
    description: 'When someone opens a support chat or files a report (staff).',
    roles: ['staff'],
  },
  {
    key: 'supportTicketStatus',
    type: 'support_ticket_status',
    label: 'Support status updates',
    description: 'When staff starts reviewing or closes your ticket.',
    roles: ['client', 'guard'],
  },
  {
    key: 'disputeUpdate',
    type: 'dispute_update',
    label: 'Disputes',
    description: 'Payment or job disputes and staff resolutions.',
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
    key: 'guardMessage',
    type: 'guard_message',
    label: 'Guard chat',
    description: 'Messages in the all-guards community channel.',
    roles: ['guard'],
  },
  {
    key: 'staffMessage',
    type: 'staff_message',
    label: 'Staff chat',
    description: 'Internal messages between Guardr staff members.',
    roles: ['staff'],
  },
  {
    key: 'jobSubmitted',
    type: 'job_submitted',
    label: 'New job requests',
    description: 'When a client submits a job awaiting staff review.',
    roles: ['staff'],
  },
  {
    key: 'guardApplication',
    type: 'guard_application',
    label: 'Guard applications',
    description: 'When a guard applies to an open job offer.',
    roles: ['staff'],
  },
  {
    key: 'guardPendingApproval',
    type: 'guard_pending_approval',
    label: 'Guard account reviews',
    description: 'New guard sign-ups and accounts awaiting activation.',
    roles: ['staff'],
  },
  {
    key: 'clientPendingApproval',
    type: 'client_pending_approval',
    label: 'Client account reviews',
    description: 'New client sign-ups awaiting approval.',
    roles: ['staff'],
  },
  {
    key: 'credentialPending',
    type: 'credential_pending',
    label: 'Credential reviews',
    description: 'Government ID, guard card, and cert uploads needing review.',
    roles: ['staff'],
  },
  {
    key: 'paymentAttention',
    type: 'payment_attention',
    label: 'Payments & payouts',
    description: 'Client payments, cash deposits, and guard payout invoices.',
    roles: ['staff'],
  },
  {
    key: 'guardTrustedStatus',
    type: 'guard_trusted_status',
    label: 'Trusted guard status',
    description: 'When Guardr staff mark you as trusted or remove trusted status.',
    roles: ['guard'],
  },
  {
    key: 'clientTrustedStatus',
    type: 'client_trusted_status',
    label: 'Trusted client status',
    description: 'When Guardr staff mark your account as trusted or remove it.',
    roles: ['client'],
  },
  {
    key: 'jobRelisted',
    type: 'job_relisted',
    label: 'Job re-listed',
    description: 'When a coordinated crew is dissolved and your job returns to the marketplace.',
    roles: ['client'],
  },
  {
    key: 'teamChatMessage',
    type: 'team_chat_message',
    label: 'Crew chat',
    description: 'Messages in coordinated crew chats for multi-guard jobs.',
    roles: ['guard', 'staff'],
  },
];

export function defaultNotificationPreferences(userId: string): NotificationPreferences {
  const now = new Date().toISOString();
  return {
    userId,
    assignment: true,
    guardCheckin: true,
    guardClockout: true,
    guardBreakStart: true,
    guardBreakEnd: true,
    missedCheckin: true,
    emergencyAlert: true,
    supportMessage: true,
    jobChatMessage: true,
    staffMessage: true,
    guardMessage: true,
    jobSubmitted: true,
    guardApplication: true,
    guardPendingApproval: true,
    clientPendingApproval: true,
    credentialPending: true,
    paymentAttention: true,
    supportTicket: true,
    supportTicketStatus: true,
    disputeUpdate: true,
    guardTrustedStatus: true,
    clientTrustedStatus: true,
    jobRelisted: true,
    teamChatMessage: true,
    updatedAt: now,
  };
}

export function loadNotificationPreferencesFromStorage(userId: string): NotificationPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultNotificationPreferences(userId);
    const parsed = JSON.parse(raw) as Record<string, NotificationPreferences>;
    const stored = parsed[userId];
    if (!stored) return defaultNotificationPreferences(userId);
    return { ...defaultNotificationPreferences(userId), ...stored, userId };
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
    guard_clockout: prefs.guardClockout,
    guard_break_start: prefs.guardBreakStart,
    guard_break_end: prefs.guardBreakEnd,
    missed_checkin: prefs.missedCheckin,
    emergency_alert: prefs.emergencyAlert,
    support_message: prefs.supportMessage,
    job_chat_message: prefs.jobChatMessage,
    staff_message: prefs.staffMessage,
    guard_message: prefs.guardMessage,
    job_submitted: prefs.jobSubmitted,
    guard_application: prefs.guardApplication,
    guard_pending_approval: prefs.guardPendingApproval,
    client_pending_approval: prefs.clientPendingApproval,
    credential_pending: prefs.credentialPending,
    payment_attention: prefs.paymentAttention,
    support_ticket: prefs.supportTicket,
    support_ticket_status: prefs.supportTicketStatus,
    dispute_update: prefs.disputeUpdate,
    guard_trusted_status: prefs.guardTrustedStatus,
    client_trusted_status: prefs.clientTrustedStatus,
    job_relisted: prefs.jobRelisted,
    team_chat_message: prefs.teamChatMessage,
    updated_at: prefs.updatedAt,
  };
}

export function prefsFromDbRow(row: Record<string, unknown>): NotificationPreferences {
  return {
    userId: String(row.user_id),
    assignment: row.assignment !== false,
    guardCheckin: row.guard_checkin !== false,
    guardClockout: row.guard_clockout !== false,
    guardBreakStart: row.guard_break_start !== false,
    guardBreakEnd: row.guard_break_end !== false,
    missedCheckin: row.missed_checkin !== false,
    emergencyAlert: row.emergency_alert !== false,
    supportMessage: row.support_message !== false,
    jobChatMessage: row.job_chat_message !== false,
    staffMessage: row.staff_message !== false,
    guardMessage: row.guard_message !== false,
    jobSubmitted: row.job_submitted !== false,
    guardApplication: row.guard_application !== false,
    guardPendingApproval: row.guard_pending_approval !== false,
    clientPendingApproval: row.client_pending_approval !== false,
    credentialPending: row.credential_pending !== false,
    paymentAttention: row.payment_attention !== false,
    supportTicket: row.support_ticket !== false,
    supportTicketStatus: row.support_ticket_status !== false,
    disputeUpdate: row.dispute_update !== false,
    guardTrustedStatus: row.guard_trusted_status !== false,
    clientTrustedStatus: row.client_trusted_status !== false,
    jobRelisted: row.job_relisted !== false,
    teamChatMessage: row.team_chat_message !== false,
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}
