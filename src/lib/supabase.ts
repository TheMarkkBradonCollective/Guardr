import { createGuardrClient, apiUrl } from './api/guardrClient.ts';

export const supabaseUrl = '';
export const supabaseAnonKey = '';

export const supabase = createGuardrClient() as any;

export async function isSupabaseConnected(): Promise<boolean> {
  try {
    const res = await fetch(apiUrl('/api/health'), { credentials: 'include' });
    if (!res.ok) return false;
    const json = (await res.json()) as { status?: string };
    return json.status === 'ok';
  } catch {
    return false;
  }
}
