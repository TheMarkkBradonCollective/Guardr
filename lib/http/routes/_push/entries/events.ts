import { getSupabaseAdmin } from '../../../../db/adminClient.ts';
import type { VercelRequest, VercelResponse } from '../../../types.ts';
import { applyApiCors } from '../apiCors';
import { handlePushEvent } from '../handlers';


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
    const result = await handlePushEvent(db, (req.body ?? {}) as Parameters<typeof handlePushEvent>[1]);
    return res.status(result.status).json(result.body);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Push event failed';
    console.error('Push events error:', message, err);
    return res.status(500).json({ error: message });
  }
}
