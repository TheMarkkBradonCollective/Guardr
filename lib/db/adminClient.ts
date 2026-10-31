import { getNeonDatabase } from './neonServerless.ts';
import type { SqlDatabase } from './sqlDatabase.ts';

export type AppDb = SqlDatabase;

/** Neon SQL client for Worker and local tools (requires DATABASE_URL / NEON_DATABASE_URL). */
export async function getAppDb(): Promise<AppDb | null> {
  return getNeonDatabase();
}

/** @deprecated Use getAppDb */
export async function getSupabaseAdmin(): Promise<AppDb | null> {
  return getAppDb();
}

export function resetAdminClientCache(): void {
  // no-op; pool is keyed by connection string in neonServerless
}
