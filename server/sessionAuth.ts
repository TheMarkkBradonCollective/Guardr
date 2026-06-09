import type { SupabaseClient } from '@supabase/supabase-js';
import { resolvePlatformRole } from '../src/lib/permissions';
import type { PlatformRole } from '../src/types';
import type { SessionCredentials } from './pushTypes';

export interface VerifiedSession extends SessionCredentials {
  platformRole: PlatformRole;
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
    const { data } = await db
      .from('clients')
      .select('id, email')
      .eq('id', userId)
      .maybeSingle();

    if (!data || data.email?.toLowerCase() !== email) return null;
    return { userId, email, role: 'client', platformRole: 'client' };
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

  return { userId, email, role, platformRole };
}

export function isInternalPushAuthorized(authHeader: string | undefined): boolean {
  const secret = process.env.PUSH_INTERNAL_SECRET?.trim();
  if (!secret) return false;
  if (!authHeader?.startsWith('Bearer ')) return false;
  return authHeader.slice('Bearer '.length) === secret;
}
