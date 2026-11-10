import type { AppDb } from './db/adminClient.ts';
import { currentRequestIdentity } from './auth/requestIdentity.ts';

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

/** Director, Owner, and Founder (Founder maps to owner). Manager and below are excluded. */
export function isDirectorTierPlatformRole(role: string | null | undefined): boolean {
  return role === 'director' || role === 'owner';
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

/** True when the verified session is allowed to use this product app. */
export function sessionOwnsProductApp(
  session: Pick<VerifiedSession, 'platformRole'>,
  app: 'client' | 'guard' | 'staff'
): boolean {
  if (app === 'client') return session.platformRole === 'client';
  if (app === 'guard') return session.platformRole === 'guard';
  return isStaffPlatformRole(session.platformRole);
}

/**
 * Returns the signed-in account for this request.
 *
 * SECURITY: identity comes only from the verified JWT (see lib/auth/requestIdentity.ts),
 * with the role re-read from the database. Client-supplied userId/email/role are
 * never trusted; when they are sent they must match the verified identity.
 */
export async function verifyAccountSession(
  _db: AppDb,
  credentials: SessionCredentials | null | undefined
): Promise<VerifiedSession | null> {
  const identity = currentRequestIdentity();
  if (!identity) return null;
  if (credentials) {
    const claimedEmail = String(credentials.email ?? '').trim().toLowerCase();
    if (claimedEmail && claimedEmail !== identity.email) return null;
    if (credentials.userId && String(credentials.userId) !== identity.profileId) return null;
  }
  return {
    userId: identity.profileId,
    email: identity.email,
    role: identity.platformRole,
    platformRole: identity.platformRole,
    sideRole: identity.sideRole,
  };
}

export async function verifyFinanceStaffSession(
  db: AppDb,
  credentials: SessionCredentials | null | undefined
): Promise<VerifiedSession | null> {
  const session = await verifyAccountSession(db, credentials);
  if (!session || !isStaffPlatformRole(session.platformRole)) return null;
  if (!hasFinancePlatformAccess(session.platformRole, session.sideRole)) return null;
  return session;
}
