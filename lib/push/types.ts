export type PushRole = 'guard' | 'dispatch' | 'admin' | 'client';

export type PushNotificationType =
  | 'missed_checkin'
  | 'guard_checkin'
  | 'guard_clockout'
  | 'guard_arrived'
  | 'guard_break_start'
  | 'guard_break_end'
  | 'guard_left_site'
  | 'assignment'
  | 'emergency_alert'
  | 'support_message'
  | 'job_chat_message'
  | 'staff_message'
  | 'guard_message'
  | 'client_message'
  | 'job_submitted'
  | 'job_open_to_guards'
  | 'guard_application'
  | 'guard_pending_approval'
  | 'client_pending_approval'
  | 'credential_pending'
  | 'payment_attention'
  | 'client_cash_payment_requested'
  | 'guard_cash_payout_requested'
  | 'stripe_payment_complete'
  | 'support_ticket'
  | 'support_ticket_status'
  | 'dispute_update'
  | 'guard_trusted_status'
  | 'client_trusted_status'
  | 'job_relisted'
  | 'job_schedule_changed'
  | 'team_chat_message'
  | 'standing_crew_invite'
  | 'account_update'
  | 'job_status_update'
  | 'payout_ready'
  | 'company_placard_expiry'
  | 'pre_shift_briefing'
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
