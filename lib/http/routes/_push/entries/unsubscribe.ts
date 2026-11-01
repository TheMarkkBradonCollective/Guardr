import { getSupabaseAdmin } from '../../../../db/adminClient.ts';
import type { VercelRequest, VercelResponse } from '../../../types.ts';
import { applyApiCors } from '../apiCors';
import { handlePushUnsubscribe } from '../handlers';


function readBody(req: VercelRequest): Parameters<typeof handlePushUnsubscribe>[1] {
  const raw = req.body;
  if (!raw) return {} as Parameters<typeof handlePushUnsubscribe>[1];
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Parameters<typeof handlePushUnsubscribe>[1];
    } catch {
      return {} as Parameters<typeof handlePushUnsubscribe>[1];
    }
  }
  return raw as Parameters<typeof handlePushUnsubscribe>[1];
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
    const result = await handlePushUnsubscribe(db, readBody(req));
    return res.status(result.status).json(result.body);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Push unsubscribe failed';
    console.error('Push unsubscribe error:', message, err);
    return res.status(500).json({ error: message });
  }
}
