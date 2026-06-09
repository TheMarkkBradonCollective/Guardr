export type PushRole = 'guard' | 'dispatch' | 'admin' | 'client';

export type PushNotificationType =
  | 'missed_checkin'
  | 'guard_checkin'
  | 'assignment'
  | 'emergency_alert'
  | 'test';

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
  priority?: 'normal' | 'high';
}

export interface SessionCredentials {
  userId: string;
  email: string;
  role: string;
}
