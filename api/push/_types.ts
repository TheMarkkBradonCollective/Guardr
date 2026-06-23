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
  | 'test';

export type PlatformRole = 'client' | 'guard' | 'moderator' | 'administrator' | 'director' | 'owner';

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
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
}

export interface SessionCredentials {
  userId: string;
  email: string;
  role: string;
}

export interface VerifiedSession extends SessionCredentials {
  platformRole: PlatformRole;
}
