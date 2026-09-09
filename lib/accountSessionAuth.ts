import type { SupabaseClient } from '@supabase/supabase-js';

export type PlatformRole =
  | 'client'
  | 'guard'
  | 'support'
  | 'moderator'
  | 'administrator'
  | 'manager'
  | 'director'
  | 'owner'
  | 'finance';

export type StaffDbRole = 'Founder' | 'Owner' | 'Director' | 'Manager' | 'Administrator' | 'Moderator' | 'Support';

export type StaffSideRole = 'Finance';

export interface SessionCredentials {
  userId: string;
  email: string;
  role: string;
}

export interface VerifiedSession extends SessionCredentials {
  platformRole: PlatformRole;
  sideRole?: StaffSideRole | null;
}

const STAFF_PLATFORM_ROLES = new Set([
  'owner',
  'director',
  'manager',
  'administrator',
  'moderator',
  'support',
  'finance',
  'staff',
  'auditor',
]);

export function resolvePlatformRole(input: {
  isStaff?: boolean;
  staffRole?: StaffDbRole | null;
  sideRole?: StaffSideRole | null;
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
  if (input.isStaff && input.sideRole === 'Finance') return 'finance';
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
    role === 'owner' ||
    role === 'finance'
  );
}

/** Manager, Director, Founder ladder — or Finance desk / Finance side role */
export function hasFinancePlatformAccess(
  role: PlatformRole,
  sideRole?: StaffSideRole | null,
): boolean {
  if (sideRole === 'Finance' || role === 'finance') return true;
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
    .select('id, email, personal_email, staff_role, side_role')
    .eq('id', userId)
    .maybeSingle();

  if (!data && !error) {
    const byEmail = await db
      .from('staff')
      .select('id, email, personal_email, staff_role, side_role')
      .or(`email.eq.${emailLower},personal_email.eq.${emailLower}`)
      .maybeSingle();
    data = byEmail.data ?? null;
    error = byEmail.error ?? null;
  }

  if (!data && error?.code === '42P01') return null;
  const matchesWork = data?.email?.toLowerCase() === emailLower;
  const matchesPersonal = data?.personal_email?.toLowerCase() === emailLower;
  if (!data || (!matchesWork && !matchesPersonal)) return null;

  const sideRole = data.side_role === 'Finance' ? ('Finance' as const) : null;
  const platformRole = resolvePlatformRole({
    isStaff: true,
    staffRole: data.staff_role ?? undefined,
    sideRole,
    legacyRole: 'staff',
  });

  return {
    userId: data.id,
    email: emailLower,
    role: platformRole,
    platformRole,
    sideRole,
  };
}

async function verifyFieldGuardSession(
  db: SupabaseClient,
  userId: string,
  email: string,
  credentialsRole: string
): Promise<VerifiedSession | null> {
  let { data, error } = await db
    .from('guards')
    .select('id, email, is_staff, staff_role, side_role, migrated_to_staff_at')
    .eq('id', userId)
    .maybeSingle();

  if (!data && !error) {
    const byEmail = await db
      .from('guards')
      .select('id, email, is_staff, staff_role, side_role, migrated_to_staff_at')
      .eq('email', email)
      .maybeSingle();
    data = byEmail.data ?? null;
    error = byEmail.error ?? null;
  }

  if (!data && error?.code === '42P01') return null;
  if (!data || data.email?.toLowerCase() !== email) return null;
  if (data.migrated_to_staff_at) return null;

  const sideRole = data.side_role === 'Finance' ? ('Finance' as const) : null;
  const platformRole = resolvePlatformRole({
    isStaff: data.is_staff,
    staffRole: data.staff_role ?? undefined,
    sideRole,
    legacyRole: data.is_staff ? 'staff' : 'guard',
  });

  if (platformRole !== credentialsRole && credentialsRole !== 'staff' && credentialsRole !== 'auditor') {
    console.warn(
      `Session role mismatch for ${email}: client sent ${credentialsRole}, db has ${platformRole}`
    );
  }

  return { userId: data.id, email, role: platformRole, platformRole, sideRole };
}

/** True when the verified session is allowed to use this product app. */
export function sessionOwnsProductApp(
  session: Pick<VerifiedSession, 'platformRole'>,
  app: 'client' | 'guard' | 'staff'
): boolean {
  if (app === 'client') return session.platformRole === 'client';
  if (app === 'guard') return session.platformRole === 'guard';
  return isStaffPlatformRole(session.platformRole);
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
  if (!hasFinancePlatformAccess(session.platformRole, session.sideRole)) return null;
  return session;
}
