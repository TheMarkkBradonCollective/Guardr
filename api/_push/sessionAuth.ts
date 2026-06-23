import type { SupabaseClient } from '@supabase/supabase-js';
import type { SessionCredentials } from './types';
import {
  verifyAccountSession,
  type PlatformRole,
  type VerifiedSession,
} from './accountSessionAuth';

export type { PlatformRole, VerifiedSession };

export async function verifySession(
  db: SupabaseClient,
  credentials: SessionCredentials | null | undefined
): Promise<VerifiedSession | null> {
  return verifyAccountSession(db, credentials);
}

export function isInternalPushAuthorized(authHeader: string | undefined): boolean {
  const secret = process.env.PUSH_INTERNAL_SECRET?.trim();
  if (!secret) return false;
  if (!authHeader?.startsWith('Bearer ')) return false;
  return authHeader.slice('Bearer '.length) === secret;
}
