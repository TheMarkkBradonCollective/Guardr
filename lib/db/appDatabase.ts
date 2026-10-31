import type { SqlDatabase } from './sqlDatabase.ts';
import { getNeonDatabase } from './neonServerless.ts';
import { getSupabaseAdmin } from '../supabaseAdmin.ts';

export type AppDatabase = SqlDatabase;

/** Prefer Neon when DATABASE_URL / NEON_DATABASE_URL is configured; else Supabase service role. */
export function getAppDatabase(): AppDatabase | ReturnType<typeof getSupabaseAdmin> {
  const neon = getNeonDatabase();
  if (neon) return neon;
  return getSupabaseAdmin();
}
