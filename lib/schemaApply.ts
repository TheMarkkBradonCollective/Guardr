/**
 * Apply the push_subscriptions.app_channel column using whatever
 * privileged connection the server actually has.
 *
 * PostgREST (anon or service role) cannot run DDL. This module tries, in order:
 * 1. DATABASE_URL / POSTGRES_URL / SUPABASE_DB_URL via `pg`
 * 2. Supabase Management API (SUPABASE_ACCESS_TOKEN)
 * 3. Hosted postgres-meta at /pg/query with the service role key
 */

export const PUSH_SUBSCRIPTIONS_APP_CHANNEL_SQL = `
ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS app_channel TEXT DEFAULT 'main';

UPDATE push_subscriptions
  SET app_channel = 'main'
  WHERE app_channel IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'push_subscriptions_app_channel_check'
  ) THEN
    ALTER TABLE push_subscriptions
      ADD CONSTRAINT push_subscriptions_app_channel_check
      CHECK (app_channel IN ('main', 'messenger'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_app_channel
  ON push_subscriptions (app_channel);
`.trim();

export function projectRefFromSupabaseUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    const match = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function isMissingAppChannelError(message: string | undefined | null): boolean {
  if (!message) return false;
  return /app_channel/i.test(message) && /does not exist|42703/i.test(message);
}

export type SqlBackendResult = { ok: true; backend: string } | { ok: false; backend: string; error: string };

async function applyViaPg(sql: string): Promise<SqlBackendResult> {
  const connectionString =
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.SUPABASE_DB_URL?.trim();
  if (!connectionString) {
    return { ok: false, backend: 'pg', error: 'DATABASE_URL is not set' };
  }
  let pgMod: { default?: { Client: new (config: object) => PgClient }; Client?: new (config: object) => PgClient };
  try {
    pgMod = (await import('pg')) as typeof pgMod;
  } catch (err) {
    return {
      ok: false,
      backend: 'pg',
      error: `pg driver is not installed (${err instanceof Error ? err.message : 'import failed'})`,
    };
  }
  const Client = pgMod.Client ?? pgMod.default?.Client;
  if (!Client) {
    return { ok: false, backend: 'pg', error: 'pg.Client is unavailable' };
  }
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query(sql);
    return { ok: true, backend: 'pg' };
  } catch (err) {
    return {
      ok: false,
      backend: 'pg',
      error: err instanceof Error ? err.message : 'PostgreSQL query failed',
    };
  } finally {
    await client.end().catch(() => undefined);
  }
}

interface PgClient {
  connect(): Promise<void>;
  query(sql: string): Promise<unknown>;
  end(): Promise<void>;
}

async function applyViaManagementApi(sql: string): Promise<SqlBackendResult> {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  const supabaseUrl = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
  const ref = process.env.SUPABASE_PROJECT_REF?.trim() || projectRefFromSupabaseUrl(supabaseUrl);
  if (!token) {
    return { ok: false, backend: 'management-api', error: 'SUPABASE_ACCESS_TOKEN is not set' };
  }
  if (!ref) {
    return { ok: false, backend: 'management-api', error: 'Could not resolve Supabase project ref' };
  }
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) {
    return {
      ok: false,
      backend: 'management-api',
      error: text.slice(0, 400) || `HTTP ${res.status}`,
    };
  }
  return { ok: true, backend: 'management-api' };
}

async function applyViaPostgresMeta(sql: string): Promise<SqlBackendResult> {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY)?.trim();
  if (!supabaseUrl || !serviceKey) {
    return { ok: false, backend: 'postgres-meta', error: 'SUPABASE_URL or service role key is not set' };
  }
  const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/pg/query`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) {
    return {
      ok: false,
      backend: 'postgres-meta',
      error: text.slice(0, 400) || `HTTP ${res.status}`,
    };
  }
  return { ok: true, backend: 'postgres-meta' };
}

export async function applyPushSubscriptionsAppChannelSql(
  sql = PUSH_SUBSCRIPTIONS_APP_CHANNEL_SQL
): Promise<{ applied: boolean; backend: string | null; attempts: SqlBackendResult[] }> {
  const attempts: SqlBackendResult[] = [];
  for (const runner of [applyViaPg, applyViaManagementApi, applyViaPostgresMeta]) {
    const result = await runner(sql);
    attempts.push(result);
    if (result.ok) {
      return { applied: true, backend: result.backend, attempts };
    }
  }
  return { applied: false, backend: null, attempts };
}

export async function inspectPushAppChannelColumn(input: {
  url: string;
  key: string;
}): Promise<{ present: boolean; sampleError?: string }> {
  const res = await fetch(
    `${input.url.replace(/\/$/, '')}/rest/v1/push_subscriptions?select=id,app_channel&limit=1`,
    {
      headers: {
        apikey: input.key,
        Authorization: `Bearer ${input.key}`,
      },
    }
  );
  const text = await res.text();
  if (res.ok) return { present: true };
  if (isMissingAppChannelError(text)) return { present: false, sampleError: text.slice(0, 240) };
  return { present: false, sampleError: text.slice(0, 240) };
}
