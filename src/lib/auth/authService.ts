/**
 * Unified auth: Supabase Auth when linked, legacy password fallback, auto-migration on sign-in.
 */

import { supabase } from '../supabase';
import { verifyAccountPassword } from '../accountPasswords';
import { hashPassword, isPasswordHash, verifyPasswordHash } from './passwordHash';
import type { Client, PlatformRole, SecurityGuard, SessionUser } from '../../types';
import { resolvePlatformRole } from '../permissions';

export type AuthRole = 'guard' | 'client';

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
    };
  }
  if (profile.client) {
    return {
      ...base,
      clientName: profile.client.companyName,
      avatar: profile.client.avatar,
    };
  }
  return base;
}

async function findGuardProfile(email: string, guards: SecurityGuard[]): Promise<AuthProfile | null> {
  const guard = guards.find((g) => g.email.toLowerCase() === email.toLowerCase());
  if (!guard) return null;
  const role = resolvePlatformRole({ isStaff: guard.isStaff, staffRole: guard.staffRole });
  return {
    table: guard.isStaff ? 'staff' : 'guards',
    id: guard.id,
    email: guard.email,
    name: guard.name,
    role,
    password: guard.password,
    passwordHash: (guard as SecurityGuard & { passwordHash?: string }).passwordHash,
    mustChangePassword: guard.mustChangePassword,
    guard,
  };
}

async function findClientProfile(email: string, clients: Client[]): Promise<AuthProfile | null> {
  const client = clients.find((c) => c.email.toLowerCase() === email.toLowerCase());
  if (!client) return null;
  return {
    table: 'clients',
    id: client.id,
    email: client.email,
    name: client.name,
    role: 'client',
    password: client.password,
    passwordHash: (client as Client & { passwordHash?: string }).passwordHash,
    mustChangePassword: client.mustChangePassword,
    client,
  };
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

export async function signInWithCredentials(
  email: string,
  password: string,
  guards: SecurityGuard[],
  clients: Client[],
  roleHint?: AuthRole
): Promise<SignInResult | null> {
  const emailLower = email.trim().toLowerCase();

  let profile: AuthProfile | null = null;
  if (roleHint === 'client') {
    profile = await findClientProfile(emailLower, clients);
  } else {
    profile = await findGuardProfile(emailLower, guards) ?? await findClientProfile(emailLower, clients);
  }

  if (!profile) return null;

  const passwordOk = await verifyStoredPassword(profile.password, profile.passwordHash ?? undefined, password);
  if (!passwordOk) return null;

  // Attempt Supabase Auth sign-in if linked
  if (profile.authUserId) {
    const ok = await trySupabaseSignIn(emailLower, password);
    if (ok) {
      return {
        sessionUser: sessionUserFromProfile(profile),
        passwordChangeRecommended: profile.mustChangePassword,
        authMode: 'supabase',
      };
    }
  }

  // Legacy path — hash password in background if still plaintext
  if (profile.password && !profile.passwordHash) {
    void migratePasswordToHash(profile.table, profile.id, password);
  }

  return {
    sessionUser: sessionUserFromProfile(profile),
    passwordChangeRecommended: profile.mustChangePassword,
    authMode: 'legacy',
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
  // Email confirmation may be required — still link auth_user_id
  return data.user.id;
}

export async function restoreSupabaseSession(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

export async function signOutAuth(): Promise<void> {
  await supabase.auth.signOut();
}
