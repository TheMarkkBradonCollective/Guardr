import type { SupabaseClient } from '@supabase/supabase-js';
import { getNeonDatabase } from './neonServerless.ts';

let adminClient: SupabaseClient | null | undefined;
let adminPromise: Promise<SupabaseClient | null> | undefined;

async function createSupabaseServiceClient(): Promise<SupabaseClient | null> {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Neon SQL client when DATABASE_URL is set; otherwise Supabase service role. */
export async function getSupabaseAdmin(): Promise<SupabaseClient | null> {
  const neon = getNeonDatabase();
  if (neon) return neon as unknown as SupabaseClient;

  if (adminClient !== undefined) return adminClient;
  if (!adminPromise) {
    adminPromise = createSupabaseServiceClient();
  }
  adminClient = await adminPromise;
  return adminClient;
}

export function resetAdminClientCache(): void {
  adminClient = undefined;
  adminPromise = undefined;
}
