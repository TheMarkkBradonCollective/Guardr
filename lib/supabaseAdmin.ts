import type { SupabaseClient } from '@supabase/supabase-js';

export { getSupabaseAdmin, resetAdminClientCache } from './db/adminClient.ts';

/** @deprecated Use getSupabaseAdmin from lib/db/adminClient.ts */
export async function getSupabaseAdminLegacy(): Promise<SupabaseClient | null> {
  const { getSupabaseAdmin } = await import('./db/adminClient.ts');
  return (await getSupabaseAdmin()) as SupabaseClient | null;
}
