/**
 * Shared login throttle backed by Neon, so the limit holds across Worker instances.
 * Fixed one-minute windows: 10 attempts per email, 30 per IP, then 429.
 * Keys are SHA-256 hashed so the table never stores emails or IPs.
 * If the table is missing or the query fails, falls back to the per-instance limiter.
 */
import type { SqlDatabase } from '../db/sqlDatabase.ts';
import { checkRateLimit } from '../rateLimit.ts';

export const LOGIN_EMAIL_LIMIT = 10;
export const LOGIN_IP_LIMIT = 30;
export const LOGIN_WINDOW_MS = 60_000;

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function loginWindowStart(now = Date.now()): string {
  return new Date(Math.floor(now / LOGIN_WINDOW_MS) * LOGIN_WINDOW_MS).toISOString();
}

export function memoryLoginThrottled(email: string, ip: string): boolean {
  const byEmail = checkRateLimit(`login:email:${email}`, { windowMs: LOGIN_WINDOW_MS, maxRequests: LOGIN_EMAIL_LIMIT });
  const byIp = checkRateLimit(`login:ip:${ip}`, { windowMs: LOGIN_WINDOW_MS, maxRequests: LOGIN_IP_LIMIT });
  return !byEmail.allowed || !byIp.allowed;
}

export const LOGIN_RATE_SQL = `INSERT INTO auth_rate_limits (key, window_start, count)
VALUES ($1, $3::timestamptz, 1), ($2, $3::timestamptz, 1)
ON CONFLICT (key, window_start) DO UPDATE SET count = auth_rate_limits.count + 1
RETURNING key, count`;

/** Count this attempt; true when the email or IP is over its limit for the current minute. */
export async function loginThrottledShared(db: SqlDatabase, email: string, ip: string, now = Date.now()): Promise<boolean> {
  const emailKey = `login:email:${await sha256(email)}`;
  const ipKey = `login:ip:${await sha256(ip)}`;
  try {
    const res = await db.query(LOGIN_RATE_SQL, [emailKey, ipKey, loginWindowStart(now)]);
    if (res.error || !Array.isArray(res.data)) throw new Error(res.error?.message ?? 'no rows');
    let throttled = false;
    for (const row of res.data) {
      const count = Number(row.count);
      if (row.key === emailKey && count > LOGIN_EMAIL_LIMIT) throttled = true;
      if (row.key === ipKey && count > LOGIN_IP_LIMIT) throttled = true;
    }
    // Housekeeping: now and then drop windows older than ten minutes.
    if (Math.random() < 0.02) {
      await db.query(`DELETE FROM auth_rate_limits WHERE window_start < now() - interval '10 minutes'`).catch(() => undefined);
    }
    return throttled;
  } catch (err) {
    console.warn('shared login throttle unavailable, using per-instance limit', err instanceof Error ? err.message : err);
    return memoryLoginThrottled(email, ip);
  }
}

export const FORGOT_EMAIL_LIMIT = 3;
export const FORGOT_IP_LIMIT = 10;

/** Forgot-password throttle: 3 requests per email and 10 per IP each minute (shared across instances). */
export async function forgotPasswordThrottledShared(
  db: SqlDatabase,
  email: string,
  ip: string,
  now = Date.now()
): Promise<boolean> {
  const emailKey = `forgot:email:${await sha256(email)}`;
  const ipKey = `forgot:ip:${await sha256(ip)}`;
  try {
    const res = await db.query(LOGIN_RATE_SQL, [emailKey, ipKey, loginWindowStart(now)]);
    if (res.error || !Array.isArray(res.data)) throw new Error(res.error?.message ?? 'no rows');
    return res.data.some(
      (row) =>
        (row.key === emailKey && Number(row.count) > FORGOT_EMAIL_LIMIT) ||
        (row.key === ipKey && Number(row.count) > FORGOT_IP_LIMIT)
    );
  } catch {
    const byEmail = checkRateLimit(`forgot:email:${email}`, { windowMs: LOGIN_WINDOW_MS, maxRequests: FORGOT_EMAIL_LIMIT });
    const byIp = checkRateLimit(`forgot:ip:${ip}`, { windowMs: LOGIN_WINDOW_MS, maxRequests: FORGOT_IP_LIMIT });
    return !byEmail.allowed || !byIp.allowed;
  }
}
