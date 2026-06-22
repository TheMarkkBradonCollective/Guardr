import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function getSupabaseAdmin(): Promise<SupabaseClient | null> {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !serviceKey) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type HandlerResult = { status: number; body: Record<string, unknown> };

export async function withPushHandler(
  req: VercelRequest,
  res: VercelResponse,
  allowedMethods: string[],
  handler: (db: SupabaseClient, req: VercelRequest) => Promise<HandlerResult>
) {
  if (!allowedMethods.includes(req.method ?? '')) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await getSupabaseAdmin();
    if (!db) {
      return res.status(503).json({ error: 'Database is not configured' });
    }
    const result = await handler(db, req);
    return res.status(result.status).json(result.body);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Push handler failed';
    console.error('Push API error:', message, err);
    return res.status(500).json({ error: message });
  }
}
