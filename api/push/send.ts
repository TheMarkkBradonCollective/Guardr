import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SupabaseClient } from '@supabase/supabase-js';

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

let vapidConfigured = false;

async function sendPushToSubscriptions(
  subscriptions: Array<{ endpoint: string; p256dh: string; auth: string }>,
  message: Record<string, unknown>
): Promise<{ sent: number; failed: number }> {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey || !subscriptions.length) {
    return { sent: 0, failed: subscriptions.length };
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

  for (const sub of subscriptions) {
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
  payload: PushSendPayload
): Promise<{ sent: number; failed: number }> {
  const message = {
    title: payload.title,
    body: payload.body,
    url: payload.url ?? '/',
    eventType: payload.type,
    tag: payload.siteId ? `${payload.type}-${payload.siteId}` : payload.type,
    priority: payload.priority ?? 'normal',
  };

  if (payload.userId) {
    const { data, error } = await db
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', payload.userId);
    if (error) throw new Error(error.message);
    return sendPushToSubscriptions(data ?? [], message);
  }

  const roles = payload.role
    ? payload.role === 'dispatch'
      ? ['dispatch', 'admin']
      : [payload.role]
    : rolesForNotificationType(payload.type);

  let sent = 0;
  let failed = 0;

  for (const role of roles) {
    const { data, error } = await db
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .in('push_role', role === 'dispatch' ? ['dispatch', 'admin'] : [role]);
    if (error) throw new Error(error.message);
    const result = await sendPushToSubscriptions(data ?? [], message);
    sent += result.sent;
    failed += result.failed;
  }

  return { sent, failed };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.PUSH_INTERNAL_SECRET?.trim();
  const authHeader = req.headers.authorization;
  if (!secret || !authHeader?.startsWith('Bearer ') || authHeader.slice(7) !== secret) {
    return res.status(401).json({ error: 'Unauthorized — internal push secret required' });
  }

  if (!process.env.VAPID_PUBLIC_KEY?.trim() || !process.env.VAPID_PRIVATE_KEY?.trim()) {
    return res.status(503).json({ error: 'Web Push is not configured on the server' });
  }

  try {
    const db = await getSupabaseAdmin();
    if (!db) {
      return res.status(503).json({ error: 'Database is not configured' });
    }

    const body = (req.body ?? {}) as PushSendPayload;
    if (!body.title || !body.body || !body.type) {
      return res.status(400).json({ error: 'title, body, and type are required' });
    }

    const result = await dispatchPushNotification(db, body);
    return res.status(200).json({ ok: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Push send failed';
    console.error('Push send error:', message, err);
    return res.status(500).json({ error: message });
  }
}
