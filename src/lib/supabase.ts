import { createClient } from '@supabase/supabase-js';

// Read values from Vite env variables or fallback to the provided keys
const supabaseUrl = 
  ((import.meta as any).env?.VITE_SUPABASE_URL as string) || 
  ((import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL as string) ||
  'https://opgzwurnjkrqkjujqokh.supabase.co';

const supabaseAnonKey = 
  ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) || 
  ((import.meta as any).env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string) ||
  'sb_publishable_j_GdBcVETxGoktiT6pdTZg_Rz4Fm82R';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Sync helper: Detects if supabase client is active and can connect
 */
export async function isSupabaseConnected(): Promise<boolean> {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  try {
    const { data, error } = await supabase.from('guards').select('id').limit(1);
    if (error) {
      console.warn('Supabase ping warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase ping exception:', err);
    return false;
  }
}
