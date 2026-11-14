import { neon, neonConfig, types as pgTypes } from '@neondatabase/serverless';
import { createSqlDatabase, type SqlDatabase, type SqlQueryFn } from './sqlDatabase.ts';
import { resolveApplicationConnectionString } from './databaseUrl.ts';

neonConfig.fetchConnectionCache = true;

let cached: SqlDatabase | null | undefined;
let cachedKey: string | undefined;

const NUMERIC_OID = 1700;

/**
 * Postgres NUMERIC arrives as a string by default. The app (built against PostgREST)
 * expects JSON numbers for money/hour columns, so API responses parse them.
 */
export const numericAsNumberTypes = {
  getTypeParser(id: number, format?: 'text' | 'binary') {
    if (id === NUMERIC_OID && format !== 'binary') {
      return (value: string) => (value === null ? null : Number(value));
    }
    return pgTypes.getTypeParser(id, format);
  },
};

export interface NeonDatabaseOptions {
  /** Return NUMERIC columns as JS numbers instead of strings. */
  numericAsNumber?: boolean;
}

function makeRunner(connectionString: string, opts: NeonDatabaseOptions = {}): SqlQueryFn {
  const sql = neon(connectionString);
  const queryOpts = opts.numericAsNumber ? { types: numericAsNumberTypes } : undefined;
  return async (query, params = []) => {
    const rows = (await (queryOpts ? sql.query(query, params, queryOpts) : sql.query(query, params))) as Record<string, unknown>[];
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

export function createNeonDatabase(connectionString: string, opts: NeonDatabaseOptions = {}): SqlDatabase {
  return createSqlDatabase(makeRunner(connectionString, opts));
}
