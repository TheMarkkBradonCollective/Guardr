import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyApiCors } from '../apiCors';
import { handlePushTest } from '../handlers';

async function getSupabaseAdmin() {
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

function readBody(req: VercelRequest): Parameters<typeof handlePushTest>[1] {
  const raw = req.body;
  if (!raw) return {} as Parameters<typeof handlePushTest>[1];
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Parameters<typeof handlePushTest>[1];
    } catch {
      return {} as Parameters<typeof handlePushTest>[1];
    }
  }
  return raw as Parameters<typeof handlePushTest>[1];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyApiCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await getSupabaseAdmin();
    if (!db) {
      return res.status(503).json({ error: 'Database is not configured' });
    }
    const result = await handlePushTest(db, readBody(req));
    return res.status(result.status).json(result.body);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Push test failed';
    console.error('Push test error:', message, err);
    return res.status(500).json({ error: message });
  }
}
