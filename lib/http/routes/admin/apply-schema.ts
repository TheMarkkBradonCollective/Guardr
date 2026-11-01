import type { AppDb } from '../../../db/adminClient.ts';
import type { VercelRequest, VercelResponse } from '../../types.ts';
import { getAppDb } from '../../../db/adminClient.ts';
import { checkRateLimit, rateLimitKey, AUTH_RATE_LIMIT } from '../../../rateLimit.ts';
import { verifyAccountSession } from '../../../accountSessionAuth.ts';
import {
  applyPushSubscriptionsAppChannelSql,
  isMissingAppChannelError,
} from '../../../schemaApply.ts';

async function inspectPushAppChannelColumn(db: AppDb): Promise<{ present: boolean; sampleError?: string }> {
  const { data, error } = await db.from('push_subscriptions').select('id,app_channel').limit(1);
  if (!error) return { present: Boolean(data) };
  if (isMissingAppChannelError(error.message)) {
    return { present: false, sampleError: error.message.slice(0, 240) };
  }
  return { present: false, sampleError: error.message.slice(0, 240) };
}

function headerString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function bearerToken(req: VercelRequest): string | null {
  const header = headerString(req.headers.authorization);
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim() || null;
}

function hasMigrateSecret(token: string | null): boolean {
  if (!token) return false;
  const secrets = [process.env.SCHEMA_APPLY_SECRET, process.env.CRON_SECRET, process.env.PUSH_INTERNAL_SECRET]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
  return secrets.includes(token);
}

async function authorize(req: VercelRequest): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (hasMigrateSecret(bearerToken(req))) return { ok: true };

  const db = await getAppDb();
  if (!db) {
    return { ok: false, status: 503, error: 'Database is not configured.' };
  }

  const body = (req.body ?? {}) as { userId?: string; email?: string; role?: string };
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

  const db = await getAppDb();
  if (!db) {
    res.status(503).json({ error: 'Database is not configured.' });
    return;
  }

  if (req.method === 'GET') {
    const inspection = await inspectPushAppChannelColumn(db);
    res.status(200).json(inspection);
    return;
  }

  const result = await applyPushSubscriptionsAppChannelSql();
  res.status(result.applied ? 200 : 500).json(result);
}
