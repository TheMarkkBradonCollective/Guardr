/** Server-side Supabase URL (never use anon key for admin writes). */
export function getSupabaseServerUrl(): string | undefined {
  return (
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.VITE_SUPABASE_URL?.trim() ||
    undefined
  );
}

/** Service role key — accepts SUPABASE_SERVICE_ROLE_KEY or legacy SUPABASE_KEY. */
export function getSupabaseServiceRoleKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_KEY?.trim() ||
    undefined
  );
}

export function isSupabaseServerConfigured(): boolean {
  return !!(getSupabaseServerUrl() && getSupabaseServiceRoleKey());
}
