export type PushRole = 'guard' | 'dispatch' | 'admin' | 'client';

export type PushNotificationType =
  | 'missed_checkin'
  | 'guard_checkin'
  | 'assignment'
  | 'emergency_alert'
  | 'support_message'
  | 'job_chat_message'
  | 'staff_message'
  | 'guard_message'
  | 'job_submitted'
  | 'guard_application'
  | 'guard_pending_approval'
  | 'client_pending_approval'
  | 'credential_pending'
  | 'payment_attention'
  | 'support_ticket'
  | 'support_ticket_status'
  | 'dispute_update'
  | 'test';

export type PlatformRole = 'client' | 'guard' | 'moderator' | 'administrator' | 'director' | 'owner';

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: PushSubscriptionKeys;
  expirationTime?: number | null;
}

export interface PushNotificationData {
  url: string;
  type: PushNotificationType;
  siteId?: string;
  guardId?: string;
  requestId?: string;
  ticketId?: string;
  priority?: 'normal' | 'high';
}

export interface PushSendPayload {
  userId?: string;
  role?: PushRole;
  title: string;
  body: string;
  type: PushNotificationType;
  url?: string;
  siteId?: string;
  guardId?: string;
  requestId?: string;
  ticketId?: string;
  priority?: 'normal' | 'high';
  /** Skip subscriptions for this user (e.g. message sender). */
  excludeUserId?: string;
}

export interface SessionCredentials {
  userId: string;
  email: string;
  role: string;
}
