import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isValidPushSubscriptionPayload } from '../../lib/push/fcm';

type PlatformRole = 'client' | 'guard' | 'moderator' | 'administrator' | 'director' | 'owner';
type PushRole = 'guard' | 'dispatch' | 'admin' | 'client';

interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

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

function platformRoleToPushRole(role: PlatformRole | string): PushRole {
  switch (role) {
    case 'guard':
      return 'guard';
    case 'moderator':
    case 'administrator':
    case 'director':
    case 'owner':
      return 'dispatch';
    case 'client':
      return 'client';
    default:
      return 'guard';
  }
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
  if (!url || !serviceKey) {
    console.error('Push: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }
  try {
    const { createClient } = await import('@supabase/supabase-js');
    return createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (err) {
    console.error('Failed to create Supabase admin client:', err);
    return null;
  }
}

async function verifyStaffSession(
  db: SupabaseClient,
  userId: string,
  email: string
): Promise<VerifiedSession | null> {
  let { data, error } = await db
    .from('staff')
    .select('id, email, staff_role')
    .eq('id', userId)
    .maybeSingle();

  if (!data && !error) {
    const byEmail = await db
      .from('staff')
      .select('id, email, staff_role')
      .eq('email', email)
      .maybeSingle();
    data = byEmail.data ?? null;
    error = byEmail.error ?? null;
  }

  if (!data && error?.code === '42P01') return null;
  if (!data || data.email?.toLowerCase() !== email) return null;

  const platformRole = resolvePlatformRole({
    isStaff: true,
    staffRole: data.staff_role ?? undefined,
    legacyRole: 'staff',
  });

  return { userId: data.id, email, role: platformRole, platformRole };
}

async function verifyFieldGuardSession(
  db: SupabaseClient,
  userId: string,
  email: string,
  credentialsRole: string
): Promise<VerifiedSession | null> {
  let { data, error } = await db
    .from('guards')
    .select('id, email, is_staff, staff_role, migrated_to_staff_at')
    .eq('id', userId)
    .maybeSingle();

  if (!data && !error) {
    const byEmail = await db
      .from('guards')
      .select('id, email, is_staff, staff_role, migrated_to_staff_at')
      .eq('email', email)
      .maybeSingle();
    data = byEmail.data ?? null;
    error = byEmail.error ?? null;
  }

  if (!data && error?.code === '42P01') return null;
  if (!data || data.email?.toLowerCase() !== email) return null;
  if (data.migrated_to_staff_at) return null;

  const platformRole = resolvePlatformRole({
    isStaff: data.is_staff,
    staffRole: data.staff_role ?? undefined,
    legacyRole: data.is_staff ? 'staff' : 'guard',
  });

  if (platformRole !== credentialsRole && credentialsRole !== 'staff' && credentialsRole !== 'auditor') {
    console.warn(
      `Push session role mismatch for ${email}: client sent ${credentialsRole}, db has ${platformRole}`
    );
  }

  return { userId: data.id, email, role: platformRole, platformRole };
}

async function verifySession(
  db: SupabaseClient,
  credentials: { userId: string; email: string; role: string } | null | undefined
): Promise<VerifiedSession | null> {
  if (!credentials?.userId || !credentials?.email || !credentials?.role) {
    return null;
  }

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
    const staffSession = await verifyStaffSession(db, userId, email);
    if (staffSession) return staffSession;
  }

  return verifyFieldGuardSession(db, userId, email, role);
}

function subscriptionId(userId: string, endpoint: string): string {
  let hash = 0;
  for (let i = 0; i < endpoint.length; i += 1) {
    hash = (hash << 5) - hash + endpoint.charCodeAt(i);
    hash |= 0;
  }
  return `push-${userId}-${Math.abs(hash)}`;
}

async function upsertPushSubscription(
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
  const { error } = await db.from('push_subscriptions').upsert(
    {
      id: subscriptionId(params.userId, params.subscription.endpoint),
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

  if (error) {
    const missingTable =
      error.code === '42P01' ||
      error.message.toLowerCase().includes('push_subscriptions') ||
      error.message.toLowerCase().includes('does not exist');
    if (missingTable) {
      throw new Error(
        'push_subscriptions table is missing. Run supabase/complete_schema_setup.sql in the Supabase SQL Editor'
      );
    }
    throw new Error(error.message);
  }
}

function jsonError(res: VercelResponse, status: number, message: string) {
  return res.status(status).json({ error: message });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return jsonError(res, 405, 'Method not allowed');
  }

  try {
    const db = await getSupabaseAdmin();
    if (!db) {
      return jsonError(
        res,
        503,
        'Database is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.'
      );
    }

    const body = parseRequestBody(req) as {
      userId?: string;
      email?: string;
      role?: string;
      subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      siteId?: string;
      quietHoursStart?: string;
      quietHoursEnd?: string;
    };

    const session = await verifySession(db, {
      userId: body.userId ?? '',
      email: body.email ?? '',
      role: body.role ?? '',
    });
    if (!session) {
      return jsonError(res, 401, 'Unauthorized — sign in again and retry');
    }

    const subscription = body.subscription;
    if (!isValidPushSubscriptionPayload(subscription ?? {})) {
      return jsonError(res, 400, 'Valid push subscription is required');
    }

    await upsertPushSubscription(db, {
      userId: session.userId,
      pushRole: platformRoleToPushRole(session.platformRole),
      subscription: {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
      },
      siteId: body.siteId,
      quietHoursStart: body.quietHoursStart,
      quietHoursEnd: body.quietHoursEnd,
    });

    return res.status(200).json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Push subscribe failed';
    console.error('Push subscribe error:', message, err);
    return jsonError(res, 500, message);
  }
}
