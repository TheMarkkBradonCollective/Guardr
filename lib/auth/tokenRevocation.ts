/**
 * Server-side sign-out. Logging out stores SHA-256(token) until the token's own expiry, and
 * request identity refuses listed tokens. The table never holds the token itself.
 * If the table has not been created yet (migration 20261115_revoked_auth_tokens.sql), checks
 * fail open with a warning so sign-in keeps working; any other database error fails closed.
 */
import type { SqlDatabase } from '../db/sqlDatabase.ts';

export async function tokenHash(token: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function isMissingTableError(message: string | undefined | null, code?: string | null): boolean {
  return code === '42P01' || /relation\s+"?(public\.)?revoked_auth_tokens"?\s+does not exist/i.test(message ?? '');
}

export const REVOKED_CHECK_SQL = 'SELECT 1 AS revoked FROM revoked_auth_tokens WHERE token_hash = $1 LIMIT 1';
export const REVOKE_SQL = `INSERT INTO revoked_auth_tokens (token_hash, profile_id, expires_at)
VALUES ($1, $2, to_timestamp($3))
ON CONFLICT (token_hash) DO NOTHING`;

export async function isTokenRevoked(db: SqlDatabase, token: string): Promise<boolean> {
  const res = await db.query(REVOKED_CHECK_SQL, [await tokenHash(token)]).catch((err: unknown) => ({
    data: null,
    error: { message: err instanceof Error ? err.message : String(err), code: undefined as string | undefined },
  }));
  if (res.error) {
    const code = (res.error as { code?: string }).code;
    if (isMissingTableError(res.error.message, code)) {
      console.warn('revoked_auth_tokens table missing; sign-out revocation not enforced yet');
      return false;
    }
    console.error('token revocation check failed', res.error.message);
    return true;
  }
  return Array.isArray(res.data) && res.data.length > 0;
}

export async function revokeToken(
  db: SqlDatabase,
  token: string,
  payload: { profileId?: unknown; sub?: unknown; exp?: unknown }
): Promise<boolean> {
  const exp = Number(payload.exp);
  if (!Number.isFinite(exp)) return false;
  const res = await db
    .query(REVOKE_SQL, [await tokenHash(token), String(payload.profileId ?? payload.sub ?? ''), exp])
    .catch((err: unknown) => ({ data: null, error: { message: err instanceof Error ? err.message : String(err) } }));
  if (res.error) {
    console.error('token revoke failed', res.error.message);
    return false;
  }
  if (Math.random() < 0.05) {
    await db.query('DELETE FROM revoked_auth_tokens WHERE expires_at < now()').catch(() => undefined);
  }
  return true;
}
