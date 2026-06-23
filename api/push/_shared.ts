import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  PlatformRole,
  PushRole,
  PushSubscriptionPayload,
  SessionCredentials,
  VerifiedSession,
} from './_types';

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

export function platformRoleToPushRole(role: PlatformRole | string): PushRole {
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

export function parseRequestBody<T extends Record<string, unknown>>(req: VercelRequest): T {
  const raw = req.body;
  if (!raw) return {} as T;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return {} as T;
    }
  }
  return raw as T;
}

export async function getSupabaseAdmin(): Promise<SupabaseClient | null> {
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

export async function verifySession(
  db: SupabaseClient,
  credentials: SessionCredentials | null | undefined
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
        'push_subscriptions table is missing. Run supabase/migrations/20260612120000_push_subscriptions.sql'
      );
    }
    throw new Error(error.message);
  }
}

export async function removePushSubscription(
  db: SupabaseClient,
  userId: string,
  endpoint?: string
): Promise<void> {
  let query = db.from('push_subscriptions').delete().eq('user_id', userId);
  if (endpoint) query = query.eq('endpoint', endpoint);
  const { error } = await query;
  if (error) throw new Error(error.message);
}

export function isPushConfigured(): boolean {
  return !!(process.env.VAPID_PUBLIC_KEY?.trim() && process.env.VAPID_PRIVATE_KEY?.trim());
}

export function isInternalPushAuthorized(authHeader: string | undefined): boolean {
  const secret = process.env.PUSH_INTERNAL_SECRET?.trim();
  if (!secret) return false;
  if (!authHeader?.startsWith('Bearer ')) return false;
  return authHeader.slice('Bearer '.length) === secret;
}

export function jsonError(res: VercelResponse, status: number, message: string) {
  return res.status(status).json({ error: message });
}
