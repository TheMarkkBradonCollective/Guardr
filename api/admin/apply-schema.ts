import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, rateLimitKey, AUTH_RATE_LIMIT } from '../../lib/rateLimit';
import { verifyAccountSession } from '../../lib/accountSessionAuth';
import {
  applyPushSubscriptionsAppChannelSql,
  inspectPushAppChannelColumn,
} from '../../lib/schemaApply';

function bearerToken(req: VercelRequest): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim() || null;
}

function hasMigrateSecret(token: string | null): boolean {
  if (!token) return false;
  const secrets = [
    process.env.SCHEMA_APPLY_SECRET,
    process.env.CRON_SECRET,
    process.env.AUTH_BRIDGE_SECRET,
    process.env.PUSH_INTERNAL_SECRET,
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
  return secrets.includes(token);
}

async function authorize(req: VercelRequest): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (hasMigrateSecret(bearerToken(req))) return { ok: true };

  const url = process.env.SUPABASE_URL?.trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY)?.trim();
  if (!url || !serviceKey) {
    return { ok: false, status: 503, error: 'Schema migrate is not configured on the server.' };
  }

  const body = (req.body ?? {}) as { userId?: string; email?: string; role?: string };
  const db = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const session = await verifyAccountSession(db, {
    userId: body.userId ?? '',
    email: body.email ?? '',
    role: body.role ?? '',
  });
  if (!session || (session.platformRole !== 'owner' && session.platformRole !== 'director')) {
    return { ok: false, status: 401, error: 'Director or Owner session required.' };
  }
  return { ok: true };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
  const limit = checkRateLimit(rateLimitKey(ip, 'apply-schema'), AUTH_RATE_LIMIT);
  if (!limit.allowed) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }

  const auth = await authorize(req);
  if (auth.ok === false) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)?.trim();
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY
  )?.trim();

  if (req.method === 'GET') {
    if (!url || !key) {
      res.status(503).json({ error: 'Supabase is not configured.' });
      return;
    }
    const column = await inspectPushAppChannelColumn({ url, key });
    res.status(200).json({ column });
    return;
  }

  const result = await applyPushSubscriptionsAppChannelSql();
  const column =
    url && key ? await inspectPushAppChannelColumn({ url, key }) : { present: result.applied };

  res.status(result.applied || column.present ? 200 : 503).json({
    applied: result.applied,
    backend: result.backend,
    column,
    attempts: result.attempts.map((attempt) => ({
      backend: attempt.backend,
      ok: attempt.ok,
      error: 'error' in attempt ? attempt.error : undefined,
    })),
  });
}
