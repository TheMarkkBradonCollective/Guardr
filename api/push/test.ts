import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SupabaseClient } from '@supabase/supabase-js';

type PlatformRole = 'client' | 'guard' | 'moderator' | 'administrator' | 'director' | 'owner';

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
  credentials: { userId: string; email: string; role: string }
): Promise<{ userId: string; platformRole: PlatformRole } | null> {
  const email = credentials.email.trim().toLowerCase();
  const { userId, role } = credentials;

  if (role === 'client') {
    const { data } = await db.from('clients').select('id, email').eq('id', userId).maybeSingle();
    if (!data || data.email?.toLowerCase() !== email) return null;
    return { userId, platformRole: 'client' };
  }

  const { data } = await db
    .from('guards')
    .select('id, email, is_staff, staff_role')
    .eq('id', userId)
    .maybeSingle();

  if (!data || data.email?.toLowerCase() !== email) return null;

  const platformRole = resolvePlatformRole({
    isStaff: data.is_staff,
    staffRole: data.staff_role ?? undefined,
    legacyRole: data.is_staff ? 'staff' : 'guard',
  });

  if (platformRole !== role) return null;
  return { userId, platformRole };
}

function isPushConfigured(): boolean {
  return !!(process.env.VAPID_PUBLIC_KEY?.trim() && process.env.VAPID_PRIVATE_KEY?.trim());
}

let vapidReady = false;

async function sendTestToUser(
  db: SupabaseClient,
  userId: string,
  siteId?: string
): Promise<{ sent: number; failed: number }> {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || 'mailto:support@guardr.co';

  if (!publicKey || !privateKey) {
    return { sent: 0, failed: 0 };
  }

  const { data: subscriptions, error } = await db
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  if (!subscriptions?.length) {
    return { sent: 0, failed: 0 };
  }

  const { default: webpush } = await import('web-push');

  if (!vapidReady) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidReady = true;
  }

  const message = {
    title: 'Guardr test alert',
    body: 'Push notifications are working. You will receive operational alerts here.',
    data: { url: '/', type: 'test', siteId, priority: 'normal' },
    tag: siteId ? `test-${siteId}` : 'test',
    priority: 'normal',
  };

  let sent = 0;
  let failed = 0;
  const stale: string[] = [];

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(message),
        { TTL: 3600, urgency: 'normal' }
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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
      siteId?: string;
    };

    if (!body.userId || !body.email || !body.role) {
      return res.status(401).json({ error: 'Unauthorized invalid session' });
    }

    const session = await verifySession(db, {
      userId: body.userId,
      email: body.email,
      role: body.role,
    });

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized invalid session' });
    }

    if (!isPushConfigured()) {
      return res.status(503).json({
        error: 'Web Push is not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.',
      });
    }

    const result = await sendTestToUser(db, session.userId, body.siteId);

    return res.status(200).json({ ok: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Push test failed';
    console.error('Push test error:', message, err);
    return res.status(500).json({ error: message });
  }
}
