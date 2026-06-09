import type { VercelRequest, VercelResponse } from '@vercel/node';

export async function getSupabaseAdmin() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function runPushHandler(
  req: VercelRequest,
  res: VercelResponse,
  handler: (db: NonNullable<Awaited<ReturnType<typeof getSupabaseAdmin>>>) => Promise<{
    status: number;
    body: Record<string, unknown>;
  }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const db = await getSupabaseAdmin();
  if (!db) {
    return res.status(503).json({ error: 'Database is not configured' });
  }

  try {
    const result = await handler(db);
    return res.status(result.status).json(result.body);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Push handler failed';
    const stack = err instanceof Error ? err.stack : undefined;
    console.error('Push API error:', message, stack);
    return res.status(500).json({ error: message });
  }
}
