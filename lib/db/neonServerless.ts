import { neon, neonConfig } from '@neondatabase/serverless';
import { createSqlDatabase, type SqlDatabase, type SqlQueryFn } from './sqlDatabase.ts';
import { resolveApplicationConnectionString } from './databaseUrl.ts';

neonConfig.fetchConnectionCache = true;

let cached: SqlDatabase | null | undefined;
let cachedKey: string | undefined;

function makeRunner(connectionString: string): SqlQueryFn {
  const sql = neon(connectionString);
  return async (query, params = []) => {
    const rows = (await sql.query(query, params)) as Record<string, unknown>[];
    return { rows: rows ?? [], rowCount: rows?.length ?? 0 };
  };
}

/** Server-side Neon database (pooled URL). Returns null when not configured. */
export function getNeonDatabase(env?: Record<string, string | undefined>): SqlDatabase | null {
  const connectionString = resolveApplicationConnectionString(env);
  if (!connectionString) {
    cached = null;
    cachedKey = undefined;
    return null;
  }
  if (cached && cachedKey === connectionString) return cached;
  cached = createSqlDatabase(makeRunner(connectionString));
  cachedKey = connectionString;
  return cached;
}

export function resetNeonDatabaseCache(): void {
  cached = undefined;
}

export function createNeonDatabase(connectionString: string): SqlDatabase {
  return createSqlDatabase(makeRunner(connectionString));
}
