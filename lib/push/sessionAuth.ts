import type { SupabaseClient } from '@supabase/supabase-js';
import type { PlatformRole, SessionCredentials } from './types';

export interface VerifiedSession extends SessionCredentials {
  platformRole: PlatformRole;
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

  if (platformRole !== role && role !== 'staff' && role !== 'auditor') {
    console.warn(`Push session role mismatch for ${email}: client sent ${role}, db has ${platformRole}`);
  }

  return { userId, email, role: platformRole, platformRole };
}

export function isInternalPushAuthorized(authHeader: string | undefined): boolean {
  const secret = process.env.PUSH_INTERNAL_SECRET?.trim();
  if (!secret) return false;
  if (!authHeader?.startsWith('Bearer ')) return false;
  return authHeader.slice('Bearer '.length) === secret;
}
