/**
 * Unified auth: Supabase Auth when linked, legacy password fallback, auto-migration on sign-in.
 */

import { clientDisplayName, isClientType } from '../clientType';
import { parseAuthorizedContacts } from '../clientAuthorizedContacts';
import { parseClientCredentials } from '../clientCredentials';
import { supabase } from '../supabase';
import { verifyAccountPassword } from '../accountPasswords';
import { hashPassword, isPasswordHash, verifyPasswordHash } from './passwordHash';
import type { Client, PlatformRole, SecurityGuard, SessionUser, StaffRole, StaffSideRole } from '../../types';
import { normalizeStaffSideRole, resolvePlatformRole, isStaffRole } from '../permissions';
import { resolvePersonNameParts } from '../personName';
import { getGuardUserStatus } from '../accountStatus';
import { staffLoginEmailMatches, staffLoginEmailOrFilter, staffWorkLoginEmail } from '../staffEmail';
import { normalizeGuardIndependentContractorNumber } from '../guardContractorNumber';
import {
  ONE_ROLE_DEVICE_ACCOUNT_MESSAGE,
  ONE_ROLE_LOCK_MESSAGE,
  buildOneRoleCase,
  collectRoleAccounts,
  kindFromGuardLike,
  openHoldForAccount,
  readDeviceRoleAccount,
  withDeviceConflict,
  type OneRoleAccountRef,
  type OneRoleCase,
} from '../oneRolePolicy';
import { resolveDeviceId } from '../deviceIdentity';
import { deviceBindingBlocksAccount, fetchDeviceAccountBinding } from '../deviceBindingStore';

export type AuthRole = 'guard' | 'client' | 'staff';

export interface AuthProfile {
  table: 'guards' | 'clients' | 'staff';
  id: string;
  email: string;
  name: string;
  role: PlatformRole;
  authUserId?: string | null;
  password?: string | null;
  passwordHash?: string | null;
  mustChangePassword?: boolean;
  guard?: SecurityGuard;
  client?: Client;
}

export interface SignInResult {
  sessionUser: SessionUser;
  passwordChangeRecommended?: boolean;
  authMode: 'supabase' | 'legacy';
}

export type SignInAttemptResult =
  | { status: 'ok'; result: SignInResult }
  | { status: 'not_found' }
  | { status: 'invalid_password' }
  | { status: 'blocked' }
  | { status: 'pending_approval' }
  | { status: 'role_mismatch'; expectedPath: AuthRole; actualPath: AuthRole }
  | { status: 'one_role_hold'; case: OneRoleCase; message: string }
  | { status: 'one_role_violation'; draftCase: OneRoleCase; message: string }
  | { status: 'device_account_blocked'; message: string };

async function verifyStoredPassword(
  stored: string | null | undefined,
  storedHash: string | null | undefined,
  entered: string
): Promise<boolean> {
  if (storedHash && isPasswordHash(storedHash)) return verifyPasswordHash(storedHash, entered);
  return verifyAccountPassword(stored, entered);
}

function sessionUserFromProfile(profile: AuthProfile): SessionUser {
  const base: SessionUser = {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
  };
  if (profile.guard) {
    return {
      ...base,
      badgeNumber: profile.guard.badgeNumber,
      avatar: profile.guard.avatar,
      hourlyRate: profile.guard.hourlyRateRequirement,
      staffRole: profile.guard.staffRole,
      sideRole: profile.guard.sideRole ?? null,
    };
  }
  if (profile.client) {
    return {
      ...base,
      clientName: clientDisplayName(profile.client),
      avatar: profile.client.avatar,
    };
  }
  return base;
}

function clientFromRow(row: Record<string, unknown>): Client {
  const nameParts = resolvePersonNameParts({
    firstName: typeof row.first_name === 'string' ? row.first_name : undefined,
    middleName: typeof row.middle_name === 'string' ? row.middle_name : undefined,
    lastName: typeof row.last_name === 'string' ? row.last_name : undefined,
    name: typeof row.name === 'string' ? row.name : undefined,
  });
  const accountStatus = typeof row.account_status === 'string' ? row.account_status : undefined;
  return {
    id: String(row.id),
    name: nameParts.name,
    firstName: nameParts.firstName,
    middleName: nameParts.middleName,
    lastName: nameParts.lastName,
    email: String(row.email ?? ''),
    companyName: typeof row.company_name === 'string' ? row.company_name : '',
    clientType: isClientType(row.client_type) ? row.client_type : 'business',
    phone: typeof row.phone === 'string' ? row.phone : '',
    avatar: typeof row.avatar === 'string' ? row.avatar : '',
    totalRequests: typeof row.total_requests === 'number' ? row.total_requests : 0,
    approved: accountStatus === 'active' || row.approved === true,
    accountStatus:
      accountStatus === 'pending' || accountStatus === 'active' || accountStatus === 'suspended'
        ? accountStatus
        : row.approved === false
          ? 'suspended'
          : 'active',
    password: typeof row.password === 'string' ? row.password : undefined,
    mustChangePassword: row.must_change_password === true,
    passwordHash: typeof row.password_hash === 'string' ? row.password_hash : undefined,
    authorizedContacts: parseAuthorizedContacts(row.authorized_contacts),
    credentials: parseClientCredentials(row.credentials),
  };
}

function guardFromRow(row: Record<string, unknown>, isStaff = false): SecurityGuard {
  const nameParts = resolvePersonNameParts({
    firstName: typeof row.first_name === 'string' ? row.first_name : undefined,
    middleName: typeof row.middle_name === 'string' ? row.middle_name : undefined,
    lastName: typeof row.last_name === 'string' ? row.last_name : undefined,
    name: typeof row.name === 'string' ? row.name : undefined,
  });
  const staffRole =
    row.staff_role === 'Founder' ||
    row.staff_role === 'Director' ||
    row.staff_role === 'Manager' ||
    row.staff_role === 'Administrator' ||
    row.staff_role === 'Moderator' ||
    row.staff_role === 'Support'
      ? (row.staff_role as StaffRole)
      : undefined;
  const sideRole = normalizeStaffSideRole(
    typeof row.side_role === 'string' ? row.side_role : null
  ) as StaffSideRole | undefined;
  return {
    id: String(row.id),
    name: nameParts.name,
    firstName: nameParts.firstName,
    middleName: nameParts.middleName,
    lastName: nameParts.lastName,
    email: String(row.email ?? ''),
    personalEmail:
      typeof row.personal_email === 'string' && row.personal_email.trim()
        ? row.personal_email.trim()
        : undefined,
    badgeNumber:
      typeof row.badge_number === 'string'
        ? isStaff || row.is_staff === true
          ? row.badge_number
          : normalizeGuardIndependentContractorNumber(row.badge_number)
        : '',
    avatar: typeof row.avatar === 'string' ? row.avatar : '',
    phone: typeof row.phone === 'string' ? row.phone : '',
    bio: typeof row.bio === 'string' ? row.bio : '',
    isArmed: row.is_armed === true,
    backgroundChecked: row.background_checked === true,
    verified: row.verified === true,
    rating: typeof row.rating === 'number' ? row.rating : 0,
    jobsCompleted: typeof row.jobs_completed === 'number' ? row.jobs_completed : 0,
    certifications: [],
    experience: [],
    hourlyRateRequirement:
      typeof row.hourly_rate_requirement === 'number' ? row.hourly_rate_requirement : 35,
    isStaff: isStaff || row.is_staff === true,
    staffRole,
    sideRole: sideRole ?? null,
    userStatus: getGuardUserStatus({
      userStatus:
        typeof row.user_status === 'string'
          ? (row.user_status as SecurityGuard['userStatus'])
          : undefined,
      isStaff: isStaff || row.is_staff === true,
    }),
    password: typeof row.password === 'string' ? row.password : undefined,
    mustChangePassword: row.must_change_password === true,
    passwordHash: typeof row.password_hash === 'string' ? row.password_hash : undefined,
  };
}

function profileFromClient(client: Client): AuthProfile {
  return {
    table: 'clients',
    id: client.id,
    email: client.email,
    name: client.name,
    role: 'client',
    password: client.password,
    passwordHash: client.passwordHash,
    mustChangePassword: client.mustChangePassword,
    client,
  };
}

function profileFromGuard(guard: SecurityGuard): AuthProfile {
  const role = resolvePlatformRole({
    isStaff: guard.isStaff,
    staffRole: guard.staffRole,
    sideRole: guard.sideRole,
  });
  return {
    table: guard.isStaff ? 'staff' : 'guards',
    id: guard.id,
    email: guard.email,
    name: guard.name,
    role,
    password: guard.password,
    passwordHash: guard.passwordHash,
    mustChangePassword: guard.mustChangePassword,
    guard,
  };
}

function findClientProfile(emailLower: string, clients: Client[]): AuthProfile | null {
  const client = clients.find((c) => c.email.trim().toLowerCase() === emailLower);
  if (!client) return null;
  return profileFromClient(client);
}

function findGuardProfile(emailLower: string, guards: SecurityGuard[]): AuthProfile | null {
  const guard = guards.find((g) =>
    g.isStaff ? staffLoginEmailMatches(g, emailLower) : g.email.trim().toLowerCase() === emailLower
  );
  if (!guard) return null;
  return profileFromGuard(guard);
}

async function fetchClientProfileFromDb(emailLower: string): Promise<AuthProfile | null> {
  const { data, error } = await supabase.from('clients').select('*').eq('email', emailLower).maybeSingle();
  if (error || !data) return null;
  return profileFromClient(clientFromRow(data as Record<string, unknown>));
}

async function fetchGuardProfileFromDb(emailLower: string): Promise<AuthProfile | null> {
  const { data: guardRow, error: guardError } = await supabase
    .from('guards')
    .select('*')
    .eq('email', emailLower)
    .maybeSingle();
  if (!guardError && guardRow) {
    return profileFromGuard(guardFromRow(guardRow as Record<string, unknown>));
  }

  const { data: staffRow, error: staffError } = await supabase
    .from('staff')
    .select('*')
    .or(staffLoginEmailOrFilter(emailLower))
    .maybeSingle();
  if (!staffError && staffRow) {
    return profileFromGuard(guardFromRow(staffRow as Record<string, unknown>, true));
  }

  return null;
}

async function resolveProfileForSignIn(
  emailLower: string,
  guards: SecurityGuard[],
  clients: Client[]
): Promise<AuthProfile | null> {
  const inMemory =
    findClientProfile(emailLower, clients) ?? findGuardProfile(emailLower, guards);
  if (inMemory) return inMemory;

  return (await fetchClientProfileFromDb(emailLower)) ?? (await fetchGuardProfileFromDb(emailLower));
}

export async function trySupabaseSignIn(email: string, password: string): Promise<boolean> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return !error && !!data.session;
}

export async function linkAuthUserId(
  table: 'guards' | 'clients' | 'staff',
  profileId: string,
  authUserId: string
): Promise<void> {
  await supabase.from(table).update({ auth_user_id: authUserId }).eq('id', profileId);
}

export async function migratePasswordToHash(
  table: 'guards' | 'clients' | 'staff',
  profileId: string,
  password: string
): Promise<string> {
  const passwordHash = await hashPassword(password);
  await supabase.from(table).update({ password_hash: passwordHash, password: null }).eq('id', profileId);
  return passwordHash;
}

export function authPathForProfile(profile: AuthProfile): AuthRole {
  if (profile.table === 'clients' || profile.role === 'client') return 'client';
  if (
    profile.table === 'staff' ||
    profile.guard?.isStaff === true ||
    isStaffRole(profile.role)
  ) {
    return 'staff';
  }
  return 'guard';
}

export function profileMatchesAuthPath(profile: AuthProfile, expectedPath: AuthRole): boolean {
  return authPathForProfile(profile) === expectedPath;
}

export async function signInWithCredentials(
  email: string,
  password: string,
  guards: SecurityGuard[],
  clients: Client[],
  expectedPath?: AuthRole,
  oneRoleCases: OneRoleCase[] = [],
): Promise<SignInAttemptResult> {
  const emailLower = email.trim().toLowerCase();
  if (!emailLower) return { status: 'not_found' };

  const profile = await resolveProfileForSignIn(emailLower, guards, clients);
  if (!profile) return { status: 'not_found' };

  if (profile.guard?.userStatus === 'blocked') {
    return { status: 'blocked' };
  }

  const passwordOk = await verifyStoredPassword(profile.password, profile.passwordHash ?? undefined, password);
  if (!passwordOk) return { status: 'invalid_password' };

  if (expectedPath && !profileMatchesAuthPath(profile, expectedPath)) {
    return {
      status: 'role_mismatch',
      expectedPath,
      actualPath: authPathForProfile(profile),
    };
  }

  const seed: OneRoleAccountRef = {
    kind:
      profile.table === 'clients' || profile.role === 'client'
        ? 'client'
        : kindFromGuardLike(profile.guard?.isStaff === true || profile.table === 'staff'),
    id: profile.id,
    name: profile.name,
    email: profile.email,
    phone: profile.guard?.phone ?? profile.client?.phone ?? '',
  };
  const existingHold = openHoldForAccount(oneRoleCases, seed);
  if (existingHold?.status === 'blocked') {
    return { status: 'blocked' };
  }
  if (existingHold?.status === 'open') {
    return { status: 'one_role_hold', case: existingHold, message: ONE_ROLE_LOCK_MESSAGE };
  }
  const deviceId = await resolveDeviceId();
  const remoteBinding = await fetchDeviceAccountBinding(deviceId);
  if (deviceBindingBlocksAccount(remoteBinding, seed)) {
    return { status: 'device_account_blocked', message: ONE_ROLE_DEVICE_ACCOUNT_MESSAGE };
  }
  const conflict = withDeviceConflict(
    collectRoleAccounts(guards, clients),
    seed,
    readDeviceRoleAccount(),
  );
  if (conflict) {
    const message =
      conflict.matchKind === 'device' ? ONE_ROLE_DEVICE_ACCOUNT_MESSAGE : ONE_ROLE_LOCK_MESSAGE;
    return {
      status: 'one_role_violation',
      draftCase: buildOneRoleCase(conflict),
      message,
    };
  }

  if (profile.authUserId) {
    const supabaseEmail = profile.guard?.isStaff
      ? staffWorkLoginEmail(profile.guard)
      : emailLower;
    const ok = await trySupabaseSignIn(supabaseEmail, password);
    if (ok) {
      return {
        status: 'ok',
        result: {
          sessionUser: sessionUserFromProfile(profile),
          passwordChangeRecommended: profile.mustChangePassword,
          authMode: 'supabase',
        },
      };
    }
  }

  if (profile.password && !profile.passwordHash) {
    void migratePasswordToHash(profile.table, profile.id, password);
  }

  return {
    status: 'ok',
    result: {
      sessionUser: sessionUserFromProfile(profile),
      passwordChangeRecommended: profile.mustChangePassword,
      authMode: 'legacy',
    },
  };
}

export async function signUpWithSupabaseAuth(
  email: string,
  password: string,
  profileId: string,
  table: 'guards' | 'clients' | 'staff'
): Promise<string | null> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error || !data.user?.id) return null;
  const passwordHash = await hashPassword(password);
  await supabase
    .from(table)
    .update({ auth_user_id: data.user.id, password_hash: passwordHash, password: null })
    .eq('id', profileId);
  if (data.session) return data.user.id;
  return data.user.id;
}

export async function restoreSupabaseSession(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

export async function signOutAuth(): Promise<void> {
  await supabase.auth.signOut();
}
