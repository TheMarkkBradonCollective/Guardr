import type { SupabaseClient } from '@supabase/supabase-js';
import type { PushRole } from './pushShared';

export type PushNotificationType =
  | 'missed_checkin'
  | 'guard_checkin'
  | 'assignment'
  | 'emergency_alert'
  | 'support_message'
  | 'job_chat_message'
  | 'staff_message'
  | 'test';

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

function resolveNotificationUrl(
  type: PushNotificationType,
  options: { guardId?: string } = {}
): string {
  switch (type) {
    case 'missed_checkin':
    case 'guard_checkin':
    case 'emergency_alert':
      return '/dispatch';
    case 'assignment':
      return options.guardId ? `/guard/${options.guardId}` : '/guard';
    default:
      return '/';
  }
}

function rolesForType(type: PushNotificationType): PushRole[] {
  switch (type) {
    case 'missed_checkin':
    case 'guard_checkin':
      return ['dispatch', 'admin'];
    case 'assignment':
      return ['guard'];
    case 'emergency_alert':
      return ['guard', 'dispatch', 'admin'];
    default:
      return ['guard', 'dispatch'];
  }
}

let vapidReady = false;

async function getWebPush() {
  const mod = await import('web-push');
  return mod.default;
}

async function ensureVapid() {
  if (vapidReady) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || 'mailto:support@guardr.co';
  if (!publicKey || !privateKey) return false;
  const webpush = await getWebPush();
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidReady = true;
  return true;
}

export async function dispatchPushNotification(
  db: SupabaseClient,
  payload: PushSendPayload
): Promise<{ sent: number; failed: number }> {
  if (!(await ensureVapid())) {
    return { sent: 0, failed: 0 };
  }

  const url =
    payload.url ??
    resolveNotificationUrl(payload.type, { guardId: payload.guardId });

  const message = {
    title: payload.title,
    body: payload.body,
    data: {
      url,
      type: payload.type,
      siteId: payload.siteId,
      guardId: payload.guardId,
      requestId: payload.requestId,
      priority: payload.priority ?? (payload.type === 'emergency_alert' ? 'high' : 'normal'),
    },
    tag: payload.siteId ? `${payload.type}-${payload.siteId}` : payload.type,
    priority: payload.priority ?? (payload.type === 'emergency_alert' ? 'high' : 'normal'),
  };

  let subscriptions: Array<{ endpoint: string; p256dh: string; auth: string }> = [];

  if (payload.userId) {
    const { data, error } = await db
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', payload.userId);
    if (error) throw new Error(error.message);
    subscriptions = data ?? [];
  } else if (payload.role) {
    const roles = payload.role === 'dispatch' ? ['dispatch', 'admin'] : [payload.role];
    const { data, error } = await db
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .in('push_role', roles);
    if (error) throw new Error(error.message);
    subscriptions = data ?? [];
  } else {
    const roles = rolesForType(payload.type);
    const { data, error } = await db
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .in('push_role', roles);
    if (error) throw new Error(error.message);
    subscriptions = data ?? [];
  }

  const webpush = await getWebPush();
  let sent = 0;
  let failed = 0;
  const stale: string[] = [];

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(message),
        { TTL: 3600, urgency: message.priority === 'high' ? 'high' : 'normal' }
      );
      sent += 1;
    } catch (err: unknown) {
      failed += 1;
      const statusCode =
        err && typeof err === 'object' && 'statusCode' in err
          ? Number((err as { statusCode?: number }).statusCode)
          : undefined;
      if (statusCode === 404 || statusCode === 410) stale.push(sub.endpoint);
    }
  }

  if (stale.length) {
    await db.from('push_subscriptions').delete().in('endpoint', stale);
  }

  return { sent, failed };
}
