import type { SupabaseClient } from '@supabase/supabase-js';
import { isValidPushSubscriptionPayload } from '../../lib/push/fcm';
import { isPushConfigured } from './config';
import { checkInEscalationDedupKey, claimNotificationDedup, missedCheckinDedupKey } from './dedup';
import { dispatchPushNotification } from './delivery';
import { buildEventDispatchPayloads } from './eventDispatch';
import { authorizePushEvent } from './eventAuth';
import { buildNotificationData, platformRoleToPushRole } from './routing';
import { isInternalPushAuthorized, verifySession } from './sessionAuth';
import { removePushSubscription, upsertPushSubscription } from './subscriptions';
import type { PushSendPayload, PushSubscriptionPayload, SessionCredentials } from './types';

export function handlePushVapidPublicKey() {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  if (!publicKey) {
    return { status: 503, body: { error: 'VAPID public key is not configured' } };
  }
  return { status: 200, body: { publicKey } };
}

export function pushNotConfiguredResponse() {
  return { status: 503, body: { error: 'Web Push is not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.' } };
}

export async function handlePushSubscribe(
  db: SupabaseClient,
  body: {
    userId?: string;
    email?: string;
    role?: string;
    subscription?: PushSubscriptionPayload;
    siteId?: string;
    quietHoursStart?: string;
    quietHoursEnd?: string;
  }
) {
  const session = await verifySession(db, {
    userId: body.userId ?? '',
    email: body.email ?? '',
    role: body.role ?? '',
  });

  if (!session) {
    return { status: 401, body: { error: 'Unauthorized — invalid session' } };
  }

  if (!isValidPushSubscriptionPayload(body.subscription ?? {})) {
    return { status: 400, body: { error: 'Valid push subscription is required' } };
  }

  await upsertPushSubscription(db, {
    userId: session.userId,
    pushRole: platformRoleToPushRole(session.platformRole),
    subscription: body.subscription,
    siteId: body.siteId,
    quietHoursStart: body.quietHoursStart,
    quietHoursEnd: body.quietHoursEnd,
  });

  return { status: 200, body: { ok: true } };
}

export async function handlePushUnsubscribe(
  db: SupabaseClient,
  body: { userId?: string; email?: string; role?: string; endpoint?: string }
) {
  const session = await verifySession(db, {
    userId: body.userId ?? '',
    email: body.email ?? '',
    role: body.role ?? '',
  });

  if (!session) {
    return { status: 401, body: { error: 'Unauthorized — invalid session' } };
  }

  await removePushSubscription(db, session.userId, body.endpoint);
  return { status: 200, body: { ok: true } };
}

export async function handlePushSend(
  db: SupabaseClient,
  authHeader: string | undefined,
  body: PushSendPayload
) {
  if (!isInternalPushAuthorized(authHeader)) {
    return { status: 401, body: { error: 'Unauthorized — internal push secret required' } };
  }

  if (!body.title || !body.body || !body.type) {
    return { status: 400, body: { error: 'title, body, and type are required' } };
  }

  if (!isPushConfigured()) {
    return pushNotConfiguredResponse();
  }

  const result = await dispatchPushNotification(db, body);
  return { status: 200, body: { ok: true, ...result } };
}

export async function handlePushTest(
  db: SupabaseClient,
  body: SessionCredentials & { siteId?: string }
) {
  const session = await verifySession(db, body);
  if (!session) {
    return { status: 401, body: { error: 'Unauthorized — invalid session' } };
  }

  if (!isPushConfigured()) {
    return pushNotConfiguredResponse();
  }

  const data = buildNotificationData('test', { siteId: body.siteId });
  const result = await dispatchPushNotification(db, {
    userId: session.userId,
    title: 'Guardr test alert',
    body: 'Push notifications are working. You will receive operational alerts here.',
    type: 'test',
    url: data.url,
    siteId: body.siteId,
  });

  return { status: 200, body: { ok: true, ...result } };
}

export interface PushEventBody extends SessionCredentials {
  type?: PushSendPayload['type'];
  title?: string;
  body?: string;
  guardId?: string;
  requestId?: string;
  siteId?: string;
  guardName?: string;
  location?: string;
  recipientUserId?: string;
  ticketId?: string;
  clientId?: string;
  priority?: 'normal' | 'high';
  checkinEscalationTier?: 'alert' | 'staff' | 'escalate';
  checkinDueBucket?: number;
}

export async function dispatchPushEvent(
  db: SupabaseClient,
  event: PushEventBody,
  options?: { skipAuth?: boolean }
): Promise<{ sent: number; failed: number }> {
  if (!event.type) {
    throw new Error('Notification type is required');
  }

  if (!isPushConfigured()) {
    throw new Error('Web Push is not configured');
  }

  const session = await verifySession(db, event);
  if (!session && !options?.skipAuth) {
    throw new Error('Unauthorized — invalid session');
  }

  if (session && !options?.skipAuth) {
    const authError = await authorizePushEvent(db, session, {
      type: event.type,
      guardId: event.guardId,
      requestId: event.requestId,
      recipientUserId: event.recipientUserId,
      ticketId: event.ticketId,
    });
    if (authError) {
      throw new Error(authError);
    }
  }

  if (event.type === 'missed_checkin' && event.requestId) {
    const tier = event.checkinEscalationTier ?? 'legacy';
    const dueBucket =
      event.checkinDueBucket ?? Math.floor(Date.now() / (60 * 60 * 1000));
    const dedupKey =
      tier === 'legacy'
        ? missedCheckinDedupKey(event.requestId, dueBucket)
        : checkInEscalationDedupKey(event.requestId, dueBucket, tier);
    const alreadySent = await claimNotificationDedup(db, dedupKey, 'missed_checkin');
    if (alreadySent) {
      return { sent: 0, failed: 0 };
    }
  }

  const excludeUserId =
    event.type === 'guard_message' || event.type === 'client_message' || event.type === 'staff_message' ? session?.userId : undefined;

  const payloads = await buildEventDispatchPayloads(db, {
    ...event,
    type: event.type,
    excludeUserId,
    clientId: event.clientId,
    priority: event.priority,
  });

  let sent = 0;
  let failed = 0;
  for (const payload of payloads) {
    const result = await dispatchPushNotification(db, payload);
    sent += result.sent;
    failed += result.failed;
  }

  return { sent, failed };
}

export async function handlePushEvent(db: SupabaseClient, body: PushEventBody) {
  const session = await verifySession(db, body);
  if (!session) {
    return { status: 401, body: { error: 'Unauthorized — invalid session' } };
  }

  if (!body.type) {
    return { status: 400, body: { error: 'Notification type is required' } };
  }

  if (!isPushConfigured()) {
    return pushNotConfiguredResponse();
  }

  try {
    const result = await dispatchPushEvent(db, body);
    return { status: 200, body: { ok: true, ...result } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Push event failed';
    const status = message.startsWith('Unauthorized') || message.includes('Not authorized') ? 403 : 500;
    return { status, body: { error: message } };
  }
}
