/**
 * Facebook / Messenger split: platform alerts belong to the main role app;
 * conversation alerts belong to Messenger (with a main-app fallback).
 */
export type NotificationChannel = 'main' | 'messenger';

const MESSAGING_TYPES = new Set<string>([
  'support_message',
  'job_chat_message',
  'staff_message',
  'guard_message',
  'client_message',
  'team_chat_message',
  'support_ticket',
  'support_ticket_status',
]);

export function isMessagingNotificationType(type: string | null | undefined): boolean {
  if (!type) return false;
  return MESSAGING_TYPES.has(type);
}

export function notificationChannelForType(type: string | null | undefined): NotificationChannel {
  return isMessagingNotificationType(type) ? 'messenger' : 'main';
}

export type PushAppChannel = 'main' | 'messenger';

/**
 * Choose which push subscriptions should receive this event.
 *
 * Messaging events: Messenger subscriptions win when present; otherwise the
 * main app is the fallback so users without Messenger still get the alert.
 * Platform events never go to Messenger (avoids duplicate message-style toasts).
 */
export function selectSubscriptionsForNotification<T extends { app_channel?: string | null }>(
  subscriptions: T[],
  type: string,
): T[] {
  if (!subscriptions.length) return subscriptions;
  const channel = notificationChannelForType(type);
  if (channel === 'messenger') {
    const messenger = subscriptions.filter((sub) => sub.app_channel === 'messenger');
    if (messenger.length > 0) return messenger;
    return subscriptions.filter((sub) => sub.app_channel !== 'messenger');
  }
  return subscriptions.filter((sub) => sub.app_channel !== 'messenger');
}

export function parsePushAppChannel(value: unknown): PushAppChannel {
  return value === 'messenger' ? 'messenger' : 'main';
}

/** Move a role-app messages URL onto the Messenger companion. */
export function messengerUrlFromAppUrl(url: string): string {
  try {
    const parsed = new URL(url, 'https://guardr.co');
    return parsed.search ? `/messenger${parsed.search}` : '/messenger';
  } catch {
    return '/messenger';
  }
}
