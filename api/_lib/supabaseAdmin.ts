import type { SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null | undefined;
let adminPromise: Promise<SupabaseClient | null> | undefined;

export async function getSupabaseAdmin(): Promise<SupabaseClient | null> {
  if (adminClient !== undefined) return adminClient;
  if (!adminPromise) {
    adminPromise = (async () => {
      const url =
        process.env.SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.VITE_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!url || !key) return null;

      const { createClient } = await import('@supabase/supabase-js');
      return createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    })();
  }
  adminClient = await adminPromise;
  return adminClient;
}
