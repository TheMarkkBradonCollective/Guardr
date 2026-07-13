import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://opgzwurnjkrqkjujqokh.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_j_GdBcVETxGoktiT6pdTZg_Rz4Fm82R';

const PLACEHOLDER_SUPABASE_URLS = new Set([
  'https://example.supabase.co',
  'http://example.supabase.co',
  'https://your_project_ref.supabase.co',
]);

function readEnvString(...keys: string[]): string {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  for (const key of keys) {
    const value = env?.[key]?.trim();
    if (value) return value;
  }
  return '';
}

function isPlaceholderSupabaseUrl(url: string): boolean {
  const normalized = url.trim().toLowerCase();
  if (!normalized) return true;
  if (PLACEHOLDER_SUPABASE_URLS.has(normalized)) return true;
  return normalized.includes('your_project_ref') || normalized.includes('example.supabase');
}

function isPlaceholderSupabaseKey(key: string): boolean {
  const normalized = key.trim().toLowerCase();
  if (!normalized) return true;
  if (normalized === 'placeholder') return true;
  if (normalized.startsWith('eyj...')) return true;
  return normalized.length < 20;
}

function resolveSupabaseUrl(): string {
  const candidate = readEnvString('VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL');
  return isPlaceholderSupabaseUrl(candidate) ? DEFAULT_SUPABASE_URL : candidate;
}

function resolveSupabaseAnonKey(): string {
  const candidate = readEnvString(
    'VITE_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
  );
  return isPlaceholderSupabaseKey(candidate) ? DEFAULT_SUPABASE_ANON_KEY : candidate;
}

export const supabaseUrl = resolveSupabaseUrl();
export const supabaseAnonKey = resolveSupabaseAnonKey();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Sync helper: Detects if supabase client is active and can connect
 */
export async function isSupabaseConnected(): Promise<boolean> {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  try {
    const { error } = await supabase.from('guards').select('id').limit(1);
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
