import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SupabaseClient } from '@supabase/supabase-js';

type PlatformRole = 'client' | 'guard' | 'moderator' | 'administrator' | 'director' | 'owner';

interface VerifiedSession {
  userId: string;
  email: string;
  role: string;
  platformRole: PlatformRole;
}

const STAFF_PLATFORM_ROLES = new Set([
  'owner',
  'director',
  'administrator',
  'moderator',
  'staff',
  'auditor',
]);

function resolvePlatformRole(input: {
  isStaff?: boolean;
  staffRole?: 'Founder' | 'Owner' | 'Director' | 'Administrator' | 'Moderator';
  legacyRole?: string;
}): PlatformRole {
  if (input.legacyRole === 'client') return 'client';
  if (input.isStaff && input.staffRole) {
    switch (input.staffRole) {
      case 'Founder':
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

function parseRequestBody(req: VercelRequest): Record<string, unknown> {
  const raw = req.body;
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return raw as Record<string, unknown>;
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

async function verifySession(
  db: SupabaseClient,
  credentials: { userId: string; email: string; role: string } | null | undefined
): Promise<VerifiedSession | null> {
  if (!credentials?.userId || !credentials?.email || !credentials?.role) return null;
  const email = credentials.email.trim().toLowerCase();
  const { userId, role } = credentials;

  if (role === 'client') {
    let { data } = await db.from('clients').select('id, email').eq('id', userId).maybeSingle();
    if (!data) {
      const byEmail = await db.from('clients').select('id, email').eq('email', email).maybeSingle();
      data = byEmail.data ?? null;
    }
    if (!data || data.email?.toLowerCase() !== email) return null;
    return { userId: data.id, email, role: 'client', platformRole: 'client' };
  }

  if (STAFF_PLATFORM_ROLES.has(role)) {
    let { data } = await db.from('staff').select('id, email, staff_role').eq('id', userId).maybeSingle();
    if (!data) {
      const byEmail = await db.from('staff').select('id, email, staff_role').eq('email', email).maybeSingle();
      data = byEmail.data ?? null;
    }
    if (data?.email?.toLowerCase() === email) {
      const platformRole = resolvePlatformRole({
        isStaff: true,
        staffRole: data.staff_role ?? undefined,
        legacyRole: 'staff',
      });
      return { userId: data.id, email, role: platformRole, platformRole };
    }
  }

  let { data } = await db
    .from('guards')
    .select('id, email, is_staff, staff_role, migrated_to_staff_at')
    .eq('id', userId)
    .maybeSingle();
  if (!data) {
    const byEmail = await db
      .from('guards')
      .select('id, email, is_staff, staff_role, migrated_to_staff_at')
      .eq('email', email)
      .maybeSingle();
    data = byEmail.data ?? null;
  }
  if (!data || data.email?.toLowerCase() !== email || data.migrated_to_staff_at) return null;
  const platformRole = resolvePlatformRole({
    isStaff: data.is_staff,
    staffRole: data.staff_role ?? undefined,
    legacyRole: data.is_staff ? 'staff' : 'guard',
  });
  return { userId: data.id, email, role: platformRole, platformRole };
}

function isPushConfigured(): boolean {
  return !!(process.env.VAPID_PUBLIC_KEY?.trim() && process.env.VAPID_PRIVATE_KEY?.trim());
}

function jsonError(res: VercelResponse, status: number, message: string) {
  return res.status(status).json({ error: message });
}

async function sendTestToUser(
  db: SupabaseClient,
  userId: string,
  siteId?: string
): Promise<{ sent: number; failed: number }> {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || 'mailto:support@guardr.co';
  if (!publicKey || !privateKey) return { sent: 0, failed: 0 };

  const { data: subscriptions, error } = await db
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  if (!subscriptions?.length) return { sent: 0, failed: 0 };

  const mod = await import('web-push');
  const webpush = ('default' in mod && mod.default ? mod.default : mod) as typeof import('web-push');
  webpush.setVapidDetails(subject, publicKey, privateKey);

  const message = JSON.stringify({
    title: 'Guardr test alert',
    body: 'Push notifications are working. You will receive operational alerts here.',
    url: '/',
    eventType: 'test',
    data: { url: '/', type: 'test', siteId },
    tag: siteId ? `test-${siteId}` : 'test',
    priority: 'normal',
  });

  let sent = 0;
  let failed = 0;
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        message,
        { TTL: 60 * 60, urgency: 'normal' }
      );
      sent += 1;
    } catch {
      failed += 1;
    }
  }
  return { sent, failed };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return jsonError(res, 405, 'Method not allowed');
  }

  try {
    const db = await getSupabaseAdmin();
    if (!db) {
      return jsonError(res, 503, 'Database is not configured');
    }
    if (!isPushConfigured()) {
      return jsonError(
        res,
        503,
        'Web Push is not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY on the server.'
      );
    }

    const body = parseRequestBody(req) as {
      userId?: string;
      email?: string;
      role?: string;
      siteId?: string;
    };
    const session = await verifySession(db, {
      userId: body.userId ?? '',
      email: body.email ?? '',
      role: body.role ?? '',
    });
    if (!session) {
      return jsonError(res, 401, 'Unauthorized — sign in again and retry');
    }

    const result = await sendTestToUser(db, session.userId, body.siteId);
    return res.status(200).json({ ok: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Push test failed';
    console.error('Push test error:', message, err);
    return jsonError(res, 500, message);
  }
}
