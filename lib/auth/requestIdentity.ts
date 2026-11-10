/**
 * Verified per-request identity.
 *
 * The Worker verifies the signed JWT (Authorization: Bearer) once per /api request,
 * re-reads the account from the database, and stores the result here. Every
 * server-side authorization check must use this identity — never a userId, email,
 * or role sent by the client in a header, query string, or body.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import { verifyJwtWeb, type JwtPayload } from './jwt.ts';
import type { SqlDatabase } from '../db/sqlDatabase.ts';
import {
  resolvePlatformRole,
  type PlatformRole,
  type StaffDbRole,
  type StaffSideRole,
} from '../accountSessionAuth.ts';

export interface RequestIdentity {
  profileId: string;
  profileKind: 'guard' | 'client' | 'staff';
  email: string;
  platformRole: PlatformRole;
  sideRole: StaffSideRole | null;
  /** Raw staff_role from the database (Founder, Owner, Director, ...). */
  staffRole: StaffDbRole | null;
}

type Store = { identity: RequestIdentity | null };

const storage = new AsyncLocalStorage<Store>();

export function runWithRequestIdentity<T>(identity: RequestIdentity | null, fn: () => T): T {
  return storage.run({ identity }, fn);
}

/** Verified identity for the current request, or null when signed out / invalid token. */
export function currentRequestIdentity(): RequestIdentity | null {
  return storage.getStore()?.identity ?? null;
}

export function readBearer(header: string | null | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || null;
}

const PROFILE_TABLE = { guard: 'guards', client: 'clients', staff: 'staff' } as const;

/** Load the account behind a verified JWT and derive its role from the database. */
export async function identityFromJwt(
  db: SqlDatabase,
  payload: JwtPayload
): Promise<RequestIdentity | null> {
  const kind = payload.profileKind;
  if (kind !== 'guard' && kind !== 'client' && kind !== 'staff') return null;
  const profileId = String(payload.profileId ?? payload.sub ?? '');
  if (!profileId) return null;

  const { data, error } = await db
    .from(PROFILE_TABLE[kind])
    .select('*')
    .eq('id', profileId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as Record<string, unknown>;

  const emailLower = String(payload.email ?? '').trim().toLowerCase();
  const rowEmails = [row.email, row.personal_email]
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim().toLowerCase());
  if (!emailLower || !rowEmails.includes(emailLower)) return null;
  if (row.user_status === 'blocked') return null;

  const sideRole: StaffSideRole | null = row.side_role === 'Finance' ? 'Finance' : null;
  const staffRole = (typeof row.staff_role === 'string' ? row.staff_role : null) as StaffDbRole | null;
  let platformRole: PlatformRole;
  if (kind === 'client') {
    platformRole = 'client';
  } else if (kind === 'staff') {
    platformRole = resolvePlatformRole({ isStaff: true, staffRole, sideRole, legacyRole: 'staff' });
  } else {
    if (row.migrated_to_staff_at) return null;
    platformRole = resolvePlatformRole({
      isStaff: row.is_staff === true,
      staffRole,
      sideRole,
      legacyRole: row.is_staff === true ? 'staff' : 'guard',
    });
  }

  return { profileId, profileKind: kind, email: emailLower, platformRole, sideRole, staffRole };
}

export async function resolveRequestIdentity(
  db: SqlDatabase,
  authorizationHeader: string | null | undefined,
  jwtSecret: string | undefined
): Promise<RequestIdentity | null> {
  const token = readBearer(authorizationHeader);
  if (!token || !jwtSecret) return null;
  const payload = await verifyJwtWeb(token, jwtSecret);
  if (!payload) return null;
  return identityFromJwt(db, payload);
}

export function isFounderIdentity(identity: RequestIdentity | null): boolean {
  return identity?.staffRole === 'Founder' || identity?.staffRole === 'Owner';
}
