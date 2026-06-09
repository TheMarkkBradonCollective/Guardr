import webpush from 'web-push';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildNotificationData,
  platformRoleToPushRole,
  rolesForNotificationType,
  resolveNotificationUrl,
} from './pushRouting';
import type {
  PushNotificationType,
  PushRole,
  PushSendPayload,
  PushSubscriptionPayload,
} from './pushTypes';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

let vapidConfigured = false;

function ensureVapidConfigured(): boolean {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || 'mailto:support@guardr.co';

  if (!publicKey || !privateKey) return false;
  if (vapidConfigured) return true;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

function isInQuietHours(
  quietStart: string | null | undefined,
  quietEnd: string | null | undefined,
  now = new Date()
): boolean {
  if (!quietStart || !quietEnd) return false;

  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const current = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(quietStart);
  const end = toMinutes(quietEnd);

  if (start === end) return false;
  if (start < end) return current >= start && current < end;
  return current >= start || current < end;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

type PushSendResult =
  | { ok: true; statusCode?: undefined; endpoint?: undefined }
  | { ok: false; statusCode?: number; endpoint: string };

async function sendToSubscription(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: Record<string, unknown>,
  attempt = 0
): Promise<PushSendResult> {
  if (!ensureVapidConfigured()) {
    return { ok: false, endpoint: subscription.endpoint };
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
      {
        TTL: 60 * 60,
        urgency: payload.priority === 'high' ? 'high' : 'normal',
      }
    );
    return { ok: true };
  } catch (err: unknown) {
    const statusCode =
      err && typeof err === 'object' && 'statusCode' in err
        ? Number((err as { statusCode?: number }).statusCode)
        : undefined;

    if (attempt < MAX_RETRIES && statusCode !== 404 && statusCode !== 410) {
      await sleep(RETRY_DELAY_MS * (attempt + 1));
      return sendToSubscription(subscription, payload, attempt + 1);
    }

    return { ok: false, statusCode, endpoint: subscription.endpoint };
  }
}

async function removeInvalidSubscriptions(
  db: SupabaseClient,
  endpoints: string[]
): Promise<void> {
  if (!endpoints.length) return;
  await db.from('push_subscriptions').delete().in('endpoint', endpoints);
}

export async function upsertPushSubscription(
  db: SupabaseClient,
  params: {
    userId: string;
    pushRole: PushRole;
    subscription: PushSubscriptionPayload;
    siteId?: string;
    quietHoursStart?: string;
    quietHoursEnd?: string;
  }
): Promise<void> {
  const id = `push-${params.userId}-${Buffer.from(params.subscription.endpoint).toString('base64url').slice(-12)}`;

  await db.from('push_subscriptions').upsert(
    {
      id,
      user_id: params.userId,
      push_role: params.pushRole,
      endpoint: params.subscription.endpoint,
      p256dh: params.subscription.keys.p256dh,
      auth: params.subscription.keys.auth,
      site_id: params.siteId ?? null,
      quiet_hours_start: params.quietHoursStart ?? null,
      quiet_hours_end: params.quietHoursEnd ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' }
  );
}

export async function removePushSubscription(
  db: SupabaseClient,
  userId: string,
  endpoint?: string
): Promise<void> {
  let query = db.from('push_subscriptions').delete().eq('user_id', userId);
  if (endpoint) query = query.eq('endpoint', endpoint);
  await query;
}

export async function sendNotificationToUser(
  db: SupabaseClient,
  userId: string,
  payload: PushSendPayload
): Promise<{ sent: number; failed: number }> {
  const { data: subscriptions } = await db
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, quiet_hours_start, quiet_hours_end, push_role')
    .eq('user_id', userId);

  return deliverToSubscriptions(db, subscriptions ?? [], payload);
}

export async function sendNotificationToRole(
  db: SupabaseClient,
  role: PushRole,
  payload: PushSendPayload
): Promise<{ sent: number; failed: number }> {
  const roles = role === 'dispatch' ? ['dispatch', 'admin'] : [role];

  const { data: subscriptions } = await db
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, quiet_hours_start, quiet_hours_end, push_role')
    .in('push_role', roles);

  return deliverToSubscriptions(db, subscriptions ?? [], payload);
}

async function deliverToSubscriptions(
  db: SupabaseClient,
  subscriptions: Array<{
    endpoint: string;
    p256dh: string;
    auth: string;
    quiet_hours_start?: string | null;
    quiet_hours_end?: string | null;
    push_role?: string;
  }>,
  payload: PushSendPayload
): Promise<{ sent: number; failed: number }> {
  if (!subscriptions.length) return { sent: 0, failed: 0 };
  if (!ensureVapidConfigured()) return { sent: 0, failed: subscriptions.length };

  const data = buildNotificationData(payload.type, {
    url: payload.url ?? resolveNotificationUrl(payload.type, {
      guardId: payload.guardId,
      requestId: payload.requestId,
    }),
    siteId: payload.siteId,
    guardId: payload.guardId,
    requestId: payload.requestId,
    priority: payload.priority,
  });

  const message = {
    title: payload.title,
    body: payload.body,
    data,
    tag: payload.siteId ? `${payload.type}-${payload.siteId}` : payload.type,
    priority: data.priority,
  };

  let sent = 0;
  let failed = 0;
  const staleEndpoints: string[] = [];

  for (const sub of subscriptions) {
    if (
      payload.type !== 'emergency_alert' &&
      payload.priority !== 'high' &&
      isInQuietHours(sub.quiet_hours_start, sub.quiet_hours_end)
    ) {
      continue;
    }

    const result = await sendToSubscription(sub, message);
    if (result.ok) {
      sent += 1;
    } else {
      failed += 1;
      if (result.statusCode === 404 || result.statusCode === 410) {
        staleEndpoints.push(result.endpoint);
      }
    }
  }

  await removeInvalidSubscriptions(db, staleEndpoints);
  return { sent, failed };
}

export async function dispatchPushNotification(
  db: SupabaseClient,
  payload: PushSendPayload
): Promise<{ sent: number; failed: number }> {
  if (payload.userId) {
    return sendNotificationToUser(db, payload.userId, payload);
  }

  if (payload.role) {
    return sendNotificationToRole(db, payload.role, payload);
  }

  const roles = rolesForNotificationType(payload.type);
  let sent = 0;
  let failed = 0;

  for (const role of roles) {
    const result = await sendNotificationToRole(db, role, payload);
    sent += result.sent;
    failed += result.failed;
  }

  return { sent, failed };
}

export function mapPlatformRoleToPushRole(role: string): PushRole {
  return platformRoleToPushRole(role);
}

export function isPushConfigured(): boolean {
  return !!(process.env.VAPID_PUBLIC_KEY?.trim() && process.env.VAPID_PRIVATE_KEY?.trim());
}

export type { PushNotificationType };
