import { getSupabaseAdmin } from '../../../lib/db/adminClient.ts';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyApiCors } from '../apiCors';
import { handlePushSubscribe } from '../handlers';


function readBody(req: VercelRequest): Parameters<typeof handlePushSubscribe>[1] {
  const raw = req.body;
  if (!raw) return {} as Parameters<typeof handlePushSubscribe>[1];
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Parameters<typeof handlePushSubscribe>[1];
    } catch {
      return {} as Parameters<typeof handlePushSubscribe>[1];
    }
  }
  return raw as Parameters<typeof handlePushSubscribe>[1];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyApiCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await getSupabaseAdmin();
    if (!db) {
      return res.status(503).json({
        error: 'Database is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.',
      });
    }
    const result = await handlePushSubscribe(db, readBody(req));
    return res.status(result.status).json(result.body);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Push subscribe failed';
    console.error('Push subscribe error:', message, err);
    return res.status(500).json({ error: message });
  }
}
