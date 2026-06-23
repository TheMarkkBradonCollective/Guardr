import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SupabaseClient } from '@supabase/supabase-js';
import { verifyAccountSession } from '../../lib/accountSessionAuth';

type PushRole = 'guard' | 'dispatch' | 'admin' | 'client';
type PushNotificationType =
  | 'missed_checkin'
  | 'guard_checkin'
  | 'assignment'
  | 'emergency_alert'
  | 'support_message'
  | 'job_chat_message'
  | 'staff_message'
  | 'guard_message'
  | 'test';
type PlatformRole = 'client' | 'guard' | 'moderator' | 'administrator' | 'director' | 'owner';

interface PushSendPayload {
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

async function getSupabaseAdmin(): Promise<SupabaseClient | null> {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !serviceKey) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function resolvePlatformRole(input: {
  isStaff?: boolean;
  staffRole?: 'Owner' | 'Director' | 'Administrator' | 'Moderator';
  legacyRole?: string;
}): PlatformRole {
  if (input.legacyRole === 'client') return 'client';
  if (input.isStaff && input.staffRole) {
    switch (input.staffRole) {
      case 'Owner':
        return 'owner';
      case 'Director':
        return 'director';
      case 'Administrator':
        return 'administrator';
      case 'Moderator':
        return 'moderator';
    }
  }
  if (input.legacyRole === 'auditor') return 'moderator';
  if (input.legacyRole === 'staff') return 'administrator';
  return 'guard';
}

async function verifySession(
  db: SupabaseClient,
  credentials: { userId: string; email: string; role: string } | null | undefined
): Promise<{ userId: string } | null> {
  const session = await verifyAccountSession(db, credentials);
  if (!session) return null;
  return { userId: session.userId };
}

function resolveNotificationUrl(
  type: PushNotificationType,
  options: { requestId?: string; ticketId?: string } = {}
): string {
  switch (type) {
    case 'missed_checkin':
    case 'guard_checkin':
      return options.requestId
        ? `/staff/jobs?j=${encodeURIComponent(options.requestId)}`
        : '/staff/jobs';
    case 'assignment':
      return options.requestId
        ? `/guard/my-jobs?jc=${encodeURIComponent(options.requestId)}`
        : '/guard/my-jobs';
    case 'emergency_alert':
      if (options.requestId) return `/staff/jobs?j=${encodeURIComponent(options.requestId)}`;
      if (options.ticketId) return `/staff/support?st=${encodeURIComponent(options.ticketId)}`;
      return '/staff/incidents';
    case 'support_message':
      return options.ticketId
        ? `/staff/support?st=${encodeURIComponent(options.ticketId)}`
        : '/staff/support';
    case 'job_chat_message':
      return options.requestId
        ? `/staff/messages?mtab=jobs&jc=${encodeURIComponent(options.requestId)}`
        : '/staff/messages?mtab=jobs';
    case 'staff_message':
      return '/staff/messages?mtab=team';
    case 'guard_message':
      return '/guard/guard-chat';
    default:
      return '/';
  }
}

function rolesForNotificationType(type: PushNotificationType): PushRole[] {
  switch (type) {
    case 'missed_checkin':
    case 'guard_checkin':
      return ['dispatch', 'admin'];
    case 'assignment':
      return ['guard'];
    case 'emergency_alert':
      return ['guard', 'dispatch', 'admin'];
    case 'support_message':
      return ['dispatch', 'admin', 'client', 'guard'];
    case 'job_chat_message':
      return ['client', 'guard', 'dispatch', 'admin'];
    case 'staff_message':
      return ['dispatch', 'admin'];
    case 'guard_message':
      return ['guard'];
    default:
      return ['guard', 'dispatch'];
  }
}

function notificationTag(
  type: PushNotificationType,
  options: { requestId?: string; ticketId?: string; siteId?: string }
): string {
  if (options.requestId) return `guardr-${type}-${options.requestId}`;
  if (options.ticketId) return `guardr-${type}-${options.ticketId}`;
  if (options.siteId) return `guardr-${type}-${options.siteId}`;
  if (type === 'staff_message') return 'guardr-staff-team';
  if (type === 'guard_message') return 'guardr-guard-chat';
  return `guardr-${type}`;
}

let vapidConfigured = false;

async function sendPushToSubscriptions(
  subscriptions: Array<{ endpoint: string; p256dh: string; auth: string; user_id?: string }>,
  message: Record<string, unknown>,
  excludeUserId?: string
): Promise<{ sent: number; failed: number }> {
  const targets = excludeUserId
    ? subscriptions.filter((sub) => sub.user_id !== excludeUserId)
    : subscriptions;
  if (!targets.length) return { sent: 0, failed: 0 };
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) {
    return { sent: 0, failed: targets.length };
  }

  const mod = await import('web-push');
  const webpush = ('default' in mod && mod.default ? mod.default : mod) as typeof import('web-push');
  if (!vapidConfigured) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT?.trim() || 'mailto:support@guardr.co',
      publicKey,
      privateKey
    );
    vapidConfigured = true;
  }

  let sent = 0;
  let failed = 0;
  const payload = JSON.stringify(message);

  for (const sub of targets) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
        { TTL: 60 * 60, urgency: message.priority === 'high' ? 'high' : 'normal' }
      );
      sent += 1;
    } catch {
      failed += 1;
    }
  }

  return { sent, failed };
}

async function dispatchPushNotification(
  db: SupabaseClient,
  payload: PushSendPayload,
  excludeUserId?: string
): Promise<{ sent: number; failed: number }> {
  const urlOptions = { requestId: payload.requestId, ticketId: payload.ticketId };
  const message = {
    title: payload.title,
    body: payload.body,
    url: payload.url ?? resolveNotificationUrl(payload.type, urlOptions),
    eventType: payload.type,
    tag: notificationTag(payload.type, {
      requestId: payload.requestId,
      ticketId: payload.ticketId,
      siteId: payload.siteId,
    }),
    priority: payload.priority ?? (payload.type === 'emergency_alert' ? 'high' : 'normal'),
  };

  if (payload.userId) {
    if (excludeUserId && payload.userId === excludeUserId) {
      return { sent: 0, failed: 0 };
    }
    const { data, error } = await db
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth, user_id')
      .eq('user_id', payload.userId);
    if (error) throw new Error(error.message);
    return sendPushToSubscriptions(data ?? [], message, excludeUserId);
  }

  const targetRole = payload.role;
  const roles = targetRole
    ? targetRole === 'dispatch'
      ? ['dispatch', 'admin']
      : [targetRole]
    : rolesForNotificationType(payload.type);

  let sent = 0;
  let failed = 0;

  for (const role of roles) {
    const { data, error } = await db
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth, user_id')
      .in('push_role', role === 'dispatch' ? ['dispatch', 'admin'] : [role]);
    if (error) throw new Error(error.message);
    const result = await sendPushToSubscriptions(data ?? [], message, excludeUserId);
    sent += result.sent;
    failed += result.failed;
  }

  return { sent, failed };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.VAPID_PUBLIC_KEY?.trim() || !process.env.VAPID_PRIVATE_KEY?.trim()) {
    return res.status(503).json({ error: 'Web Push is not configured on the server' });
  }

  try {
    const db = await getSupabaseAdmin();
    if (!db) {
      return res.status(503).json({ error: 'Database is not configured' });
    }

    const body = (req.body ?? {}) as {
      userId?: string;
      email?: string;
      role?: string;
      type?: PushNotificationType;
      title?: string;
      body?: string;
      guardId?: string;
      requestId?: string;
      siteId?: string;
      guardName?: string;
      location?: string;
      recipientUserId?: string;
      ticketId?: string;
    };

    const session = await verifySession(db, {
      userId: body.userId ?? '',
      email: body.email ?? '',
      role: body.role ?? '',
    });
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized — sign in again and retry' });
    }

    if (!body.type) {
      return res.status(400).json({ error: 'Notification type is required' });
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
      support_message: {
        title: 'Support message',
        body: body.body || 'You have a new support message',
      },
      job_chat_message: {
        title: 'Job chat',
        body: body.body || 'New message on an active job',
      },
      staff_message: {
        title: 'Staff team chat',
        body: body.body || 'New message from the Guardr team',
      },
      guard_message: {
        title: 'Guard chat',
        body: body.body || 'New message from another guard',
      },
    };

    const fallback = defaults[body.type] ?? {
      title: 'Guardr alert',
      body: body.body || 'Operational update',
    };

    const dispatchPayload: PushSendPayload = {
      title: body.title ?? fallback.title,
      body: body.body ?? fallback.body,
      type: body.type,
      url: resolveNotificationUrl(body.type, {
        requestId: body.requestId,
        ticketId: body.ticketId,
      }),
      guardId: body.guardId,
      requestId: body.requestId,
      ticketId: body.ticketId,
      siteId: body.siteId,
      priority: body.type === 'emergency_alert' ? 'high' : 'normal',
    };

    if (body.type === 'assignment' && body.guardId) {
      dispatchPayload.userId = body.guardId;
    } else if (body.type === 'support_message' && body.recipientUserId) {
      dispatchPayload.userId = body.recipientUserId;
    } else if (body.type === 'job_chat_message' && body.recipientUserId) {
      dispatchPayload.userId = body.recipientUserId;
    } else if (
      body.type === 'staff_message' ||
      body.type === 'guard_message' ||
      (body.type === 'support_message' && !body.recipientUserId) ||
      (body.type === 'job_chat_message' && !body.recipientUserId)
    ) {
      dispatchPayload.role = body.type === 'guard_message' ? 'guard' : 'dispatch';
    }

    const result = await dispatchPushNotification(db, dispatchPayload, session.userId);
    return res.status(200).json({ ok: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Push event failed';
    console.error('Push event error:', message, err);
    return res.status(500).json({ error: message });
  }
}
