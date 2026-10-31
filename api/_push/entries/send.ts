import { getSupabaseAdmin } from '../../../lib/db/adminClient.ts';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handlePushSend } from '../handlers';


export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await getSupabaseAdmin();
    if (!db) {
      return res.status(503).json({ error: 'Database is not configured' });
    }
    const authHeader = Array.isArray(req.headers.authorization)
      ? req.headers.authorization[0]
      : req.headers.authorization;
    const result = await handlePushSend(db, authHeader, (req.body ?? {}) as Parameters<typeof handlePushSend>[2]);
    return res.status(result.status).json(result.body);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Push send failed';
    console.error('Push send error:', message, err);
    return res.status(500).json({ error: message });
  }
}
