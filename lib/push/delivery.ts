import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildNotificationData,
  platformRoleToPushRole,
  pushRoleToPlatformRole,
  rolesForNotificationType,
  resolveNotificationUrlForRole,
} from './routing';
import { removePushSubscription } from './subscriptions';
import type { PushNotificationType, PushRole, PushSendPayload } from './types';

const PREF_COLUMN: Partial<Record<PushNotificationType, string>> = {
  assignment: 'assignment',
  guard_checkin: 'guard_checkin',
  guard_clockout: 'guard_clockout',
  guard_arrived: 'guard_arrived',
  guard_left_site: 'guard_left_site',
  guard_break_start: 'guard_break_start',
  guard_break_end: 'guard_break_end',
  missed_checkin: 'missed_checkin',
  emergency_alert: 'emergency_alert',
  support_message: 'support_message',
  job_chat_message: 'job_chat_message',
  staff_message: 'staff_message',
  guard_message: 'guard_message',
  client_message: 'client_message',
  job_submitted: 'job_submitted',
  job_open_to_guards: 'job_open_to_guards',
  guard_application: 'guard_application',
  guard_pending_approval: 'guard_pending_approval',
  client_pending_approval: 'client_pending_approval',
  credential_pending: 'credential_pending',
  payment_attention: 'payment_attention',
  client_cash_payment_requested: 'payment_attention',
  guard_cash_payout_requested: 'payment_attention',
  stripe_payment_complete: 'payment_attention',
  support_ticket: 'support_ticket',
  support_ticket_status: 'support_ticket_status',
  dispute_update: 'dispute_update',
  guard_trusted_status: 'guard_trusted_status',
  client_trusted_status: 'client_trusted_status',
  job_relisted: 'job_relisted',
  job_schedule_changed: 'assignment',
  team_chat_message: 'team_chat_message',
  account_update: 'support_ticket_status',
  job_status_update: 'assignment',
  payout_ready: 'assignment',
};

async function isTypeEnabledForUser(
  db: SupabaseClient,
  userId: string,
  type: PushNotificationType
): Promise<boolean> {
  const column = PREF_COLUMN[type];
  if (!column) return true;

  const { data, error } = await db
    .from('notification_preferences')
    .select(column)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return true;
  return (data as unknown as Record<string, boolean>)[column] !== false;
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

let vapidConfigured = false;
let webPushModule: typeof import('web-push') | null = null;

async function getWebPush() {
  if (!webPushModule) {
    const mod = await import('web-push');
    webPushModule = ('default' in mod && mod.default ? mod.default : mod) as typeof import('web-push');
  }
  return webPushModule;
}

import { isPushConfigured } from './config';

async function ensureVapidConfigured(): Promise<boolean> {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || 'mailto:support@guardr.co';

  if (!publicKey || !privateKey) return false;
  if (vapidConfigured) return true;

  const webpush = await getWebPush();
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
  if (!(await ensureVapidConfigured())) {
    return { ok: false, endpoint: subscription.endpoint };
  }

  try {
    const webpush = await getWebPush();
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

async function deliverToSubscriptions(
  db: SupabaseClient,
  subscriptions: Array<{
    endpoint: string;
    p256dh: string;
    auth: string;
    quiet_hours_start?: string | null;
    quiet_hours_end?: string | null;
    user_id?: string;
    push_role?: string | null;
  }>,
  payload: PushSendPayload
): Promise<{ sent: number; failed: number }> {
  if (!subscriptions.length) return { sent: 0, failed: 0 };
  if (!(await ensureVapidConfigured())) return { sent: 0, failed: subscriptions.length };

  const prefCache = new Map<string, boolean>();
  const filtered: typeof subscriptions = [];

  for (const sub of subscriptions) {
    if (payload.excludeUserId && sub.user_id === payload.excludeUserId) {
      continue;
    }
    if (!sub.user_id) {
      filtered.push(sub);
      continue;
    }
    let enabled = prefCache.get(sub.user_id);
    if (enabled === undefined) {
      enabled = await isTypeEnabledForUser(db, sub.user_id, payload.type);
      prefCache.set(sub.user_id, enabled);
    }
    if (enabled) filtered.push(sub);
  }

  if (!filtered.length) return { sent: 0, failed: 0 };

  const urlOptions = {
    guardId: payload.guardId,
    requestId: payload.requestId,
    ticketId: payload.ticketId,
  };

  let sent = 0;
  let failed = 0;
  const staleEndpoints: string[] = [];

  for (const sub of filtered) {
    if (
      payload.type !== 'emergency_alert' &&
      payload.priority !== 'high' &&
      isInQuietHours(sub.quiet_hours_start, sub.quiet_hours_end)
    ) {
      continue;
    }

    const platformRole = pushRoleToPlatformRole(sub.push_role);
    const data = buildNotificationData(payload.type, {
      url:
        payload.url ??
        resolveNotificationUrlForRole(payload.type, platformRole, urlOptions),
      siteId: payload.siteId,
      guardId: payload.guardId,
      requestId: payload.requestId,
      ticketId: payload.ticketId,
      priority: payload.priority,
      role: platformRole,
    });

    const message = {
      title: payload.title,
      body: payload.body,
      url: data.url,
      eventType: payload.type,
      data,
      tag: payload.siteId ? `${payload.type}-${payload.siteId}` : payload.type,
      priority: data.priority,
    };

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

export async function sendNotificationToUser(
  db: SupabaseClient,
  userId: string,
  payload: PushSendPayload
): Promise<{ sent: number; failed: number }> {
  const enabled = await isTypeEnabledForUser(db, userId, payload.type);
  if (!enabled) return { sent: 0, failed: 0 };

  const { data: subscriptions, error } = await db
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, quiet_hours_start, quiet_hours_end, user_id, push_role')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return deliverToSubscriptions(db, subscriptions ?? [], payload);
}

export async function sendNotificationToRole(
  db: SupabaseClient,
  role: PushRole,
  payload: PushSendPayload
): Promise<{ sent: number; failed: number }> {
  const roles = role === 'dispatch' ? ['dispatch', 'admin'] : [role];

  const { data: subscriptions, error } = await db
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, quiet_hours_start, quiet_hours_end, user_id, push_role')
    .in('push_role', roles);

  if (error) throw new Error(error.message);
  return deliverToSubscriptions(db, subscriptions ?? [], payload);
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

export type { PushNotificationType };
