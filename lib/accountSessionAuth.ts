import type { SupabaseClient } from '@supabase/supabase-js';

export type PlatformRole = 'client' | 'guard' | 'moderator' | 'administrator' | 'director' | 'owner';

export interface SessionCredentials {
  userId: string;
  email: string;
  role: string;
}

export interface VerifiedSession extends SessionCredentials {
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

export function resolvePlatformRole(input: {
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

async function verifyStaffSession(
  db: SupabaseClient,
  userId: string,
  email: string
): Promise<VerifiedSession | null> {
  const { data, error } = await db
    .from('staff')
    .select('id, email, staff_role')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data || data.email?.toLowerCase() !== email) return null;

  const platformRole = resolvePlatformRole({
    isStaff: true,
    staffRole: data.staff_role ?? undefined,
    legacyRole: 'staff',
  });

  return { userId, email, role: platformRole, platformRole };
}

async function verifyFieldGuardSession(
  db: SupabaseClient,
  userId: string,
  email: string,
  credentialsRole: string
): Promise<VerifiedSession | null> {
  const { data, error } = await db
    .from('guards')
    .select('id, email')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data || data.email?.toLowerCase() !== email) return null;

  const platformRole = resolvePlatformRole({
    legacyRole: 'guard',
  });

  if (platformRole !== credentialsRole && credentialsRole !== 'staff' && credentialsRole !== 'auditor') {
    console.warn(`Session role mismatch for ${email}: client sent ${credentialsRole}, db has ${platformRole}`);
  }

  return { userId, email, role: platformRole, platformRole };
}

export async function verifyAccountSession(
  db: SupabaseClient,
  credentials: SessionCredentials | null | undefined
): Promise<VerifiedSession | null> {
  if (!credentials?.userId || !credentials?.email || !credentials?.role) {
    return null;
  }

  const email = credentials.email.trim().toLowerCase();
  const { userId, role } = credentials;

  if (role === 'client') {
    const { data } = await db.from('clients').select('id, email').eq('id', userId).maybeSingle();
    if (!data || data.email?.toLowerCase() !== email) return null;
    return { userId, email, role: 'client', platformRole: 'client' };
  }

  if (STAFF_PLATFORM_ROLES.has(role)) {
    const staffSession = await verifyStaffSession(db, userId, email);
    if (staffSession) return staffSession;
  }

  return verifyFieldGuardSession(db, userId, email, role);
}
