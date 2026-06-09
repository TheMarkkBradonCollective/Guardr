import type { SupabaseClient } from '@supabase/supabase-js';
import { isPushConfigured } from './config';
import { buildNotificationData, platformRoleToPushRole, resolveNotificationUrl } from './routing';
import { isInternalPushAuthorized, verifySession } from './sessionAuth';
import { removePushSubscription, upsertPushSubscription } from './subscriptions';
import type { PushSendPayload, PushSubscriptionPayload, SessionCredentials } from './types';

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

  if (!body.subscription?.endpoint || !body.subscription?.keys?.p256dh || !body.subscription?.keys?.auth) {
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

  const { dispatchPushNotification } = await import('./delivery');
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

  const { dispatchPushNotification } = await import('./delivery');
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

export async function handlePushEvent(
  db: SupabaseClient,
  body: SessionCredentials & {
    type?: PushSendPayload['type'];
    title?: string;
    body?: string;
    guardId?: string;
    requestId?: string;
    siteId?: string;
    guardName?: string;
    location?: string;
  }
) {
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

  const defaults: Record<string, { title: string; body: string }> = {
    guard_checkin: {
      title: 'Guard check-in',
      body: body.guardName
        ? `${body.guardName} checked in${body.location ? ` at ${body.location}` : ''}`
        : 'A guard completed a check-in',
    },
    missed_checkin: {
      title: 'Missed check-in',
      body: body.guardName
        ? `${body.guardName} missed an hourly check-in`
        : 'A guard missed an hourly check-in',
    },
    assignment: {
      title: 'New assignment',
      body: body.location
        ? `You have a new assignment at ${body.location}`
        : 'You have a new assignment update',
    },
    emergency_alert: {
      title: 'Emergency alert',
      body: body.body || 'Immediate attention required on an active shift',
    },
  };

  const fallback = defaults[body.type] ?? { title: 'Guardr alert', body: body.body || 'Operational update' };
  const url = resolveNotificationUrl(body.type, {
    guardId: body.guardId,
    requestId: body.requestId,
  });

  const dispatchPayload: PushSendPayload = {
    title: body.title ?? fallback.title,
    body: body.body ?? fallback.body,
    type: body.type,
    url,
    guardId: body.guardId,
    requestId: body.requestId,
    siteId: body.siteId,
    priority: body.type === 'emergency_alert' ? 'high' : 'normal',
  };

  if (body.type === 'assignment' && body.guardId) {
    dispatchPayload.userId = body.guardId;
  }

  const { dispatchPushNotification } = await import('./delivery');
  const result = await dispatchPushNotification(db, dispatchPayload);

  return { status: 200, body: { ok: true, ...result } };
}
