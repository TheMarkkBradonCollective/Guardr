import type { SupabaseClient } from '@supabase/supabase-js';

export type PlatformRole =
  | 'client'
  | 'guard'
  | 'support'
  | 'moderator'
  | 'administrator'
  | 'manager'
  | 'director'
  | 'owner';

export type StaffDbRole = 'Founder' | 'Owner' | 'Director' | 'Manager' | 'Administrator' | 'Moderator' | 'Support';

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
  'manager',
  'administrator',
  'moderator',
  'support',
  'staff',
  'auditor',
]);

export function resolvePlatformRole(input: {
  isStaff?: boolean;
  staffRole?: StaffDbRole;
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
      case 'Manager':
        return 'manager';
      case 'Administrator':
        return 'administrator';
      case 'Moderator':
        return 'moderator';
      case 'Support':
        return 'support';
    }
  }
  if (input.legacyRole === 'auditor') return 'moderator';
  if (input.legacyRole === 'staff') return 'administrator';
  return 'guard';
}

export function isStaffPlatformRole(role: PlatformRole): boolean {
  return (
    role === 'support' ||
    role === 'moderator' ||
    role === 'administrator' ||
    role === 'manager' ||
    role === 'director' ||
    role === 'owner'
  );
}

/** Manager, Director, and Founder — financial controls */
export function hasFinancePlatformAccess(role: PlatformRole): boolean {
  return role === 'manager' || role === 'director' || role === 'owner';
}

async function verifyStaffSession(
  db: SupabaseClient,
  userId: string,
  email: string
): Promise<VerifiedSession | null> {
  const emailLower = email.trim().toLowerCase();
  let { data, error } = await db
    .from('staff')
    .select('id, email, personal_email, staff_role')
    .eq('id', userId)
    .maybeSingle();

  if (!data && !error) {
    const byEmail = await db
      .from('staff')
      .select('id, email, personal_email, staff_role')
      .or(`email.eq.${emailLower},personal_email.eq.${emailLower}`)
      .maybeSingle();
    data = byEmail.data ?? null;
    error = byEmail.error ?? null;
  }

  if (!data && error?.code === '42P01') return null;
  const matchesWork = data?.email?.toLowerCase() === emailLower;
  const matchesPersonal = data?.personal_email?.toLowerCase() === emailLower;
  if (!data || (!matchesWork && !matchesPersonal)) return null;

  const platformRole = resolvePlatformRole({
    isStaff: true,
    staffRole: data.staff_role ?? undefined,
    legacyRole: 'staff',
  });

  return { userId: data.id, email: emailLower, role: platformRole, platformRole };
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
      `Session role mismatch for ${email}: client sent ${credentialsRole}, db has ${platformRole}`
    );
  }

  return { userId: data.id, email, role: platformRole, platformRole };
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

export async function verifyFinanceStaffSession(
  db: SupabaseClient,
  credentials: SessionCredentials | null | undefined
): Promise<VerifiedSession | null> {
  const session = await verifyAccountSession(db, credentials);
  if (!session || !isStaffPlatformRole(session.platformRole)) return null;
  if (!hasFinancePlatformAccess(session.platformRole)) return null;
  return session;
}
