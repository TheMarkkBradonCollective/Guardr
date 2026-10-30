/**
 * Server-only Neon connection helper. Do not import from src/.
 * Uses the pooled URL for short queries and a direct client for migrations.
 */
import {
  redactSecrets,
  resolveNeonConnectionString,
  sslForConnection,
} from './databaseUrl.ts';

interface PgQueryResult {
  rows?: Record<string, unknown>[];
  rowCount?: number | null;
}

function normalizeQueryResult(result: PgQueryResult | PgQueryResult[]): {
  rows: Record<string, unknown>[];
  rowCount: number | null;
} {
  const results = Array.isArray(result) ? result : [result];
  const withRows = [...results].reverse().find((entry) => Array.isArray(entry?.rows) && entry.rows.length > 0);
  const chosen = withRows ?? results[results.length - 1] ?? {};
  return {
    rows: chosen.rows ?? [],
    rowCount: chosen.rowCount ?? null,
  };
}

interface PgClient {
  connect(): Promise<void>;
  query(sql: string): Promise<PgQueryResult | PgQueryResult[]>;
  end(): Promise<void>;
}

interface PgPool {
  query(sql: string): Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>;
  end(): Promise<void>;
}

interface PgModule {
  default?: { Client: new (config: object) => PgClient; Pool: new (config: object) => PgPool };
  Client?: new (config: object) => PgClient;
  Pool?: new (config: object) => PgPool;
}

async function loadPg(): Promise<{ Client: new (config: object) => PgClient; Pool: new (config: object) => PgPool }> {
  let pgMod: PgModule;
  try {
    pgMod = (await import('pg')) as PgModule;
  } catch (err) {
    throw new Error(
      `The pg driver is not installed (${err instanceof Error ? err.message : 'import failed'}). Run npm install.`
    );
  }
  const Client = pgMod.Client ?? pgMod.default?.Client;
  const Pool = pgMod.Pool ?? pgMod.default?.Pool;
  if (!Client || !Pool) throw new Error('pg.Client or pg.Pool is unavailable.');
  return { Client, Pool };
}

let pool: PgPool | null = null;
let poolUrl: string | undefined;

export async function getNeonPool(): Promise<PgPool> {
  const connectionString = resolveNeonConnectionString();
  if (!connectionString) {
    throw new Error(
      'Neon is not configured. Set NEON_DATABASE_URL to the pooled Neon connection string on the server. Do not expose it to the browser.'
    );
  }
  if (pool && poolUrl === connectionString) return pool;
  const { Pool } = await loadPg();
  pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 10_000,
    ssl: sslForConnection(connectionString),
  });
  poolUrl = connectionString;
  return pool;
}

export async function withPgClient<T>(
  connectionString: string,
  fn: (query: (sql: string) => Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>) => Promise<T>
): Promise<T> {
  const { Client } = await loadPg();
  const client = new Client({
    connectionString,
    ssl: sslForConnection(connectionString),
  });
  await client.connect();
  try {
    return await fn(async (sql) => normalizeQueryResult(await client.query(sql)));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'PostgreSQL query failed';
    throw new Error(redactSecrets(message));
  } finally {
    await client.end().catch(() => undefined);
  }
}

export async function closeNeonPool(): Promise<void> {
  if (!pool) return;
  await pool.end().catch(() => undefined);
  pool = null;
  poolUrl = undefined;
}
