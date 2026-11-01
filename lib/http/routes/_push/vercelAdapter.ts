import type { VercelRequest, VercelResponse } from '../../types.ts';
import { getAppDb, type AppDb } from '../../../db/adminClient.ts';

type HandlerResult = { status: number; body: Record<string, unknown> };

export async function getSupabaseAdmin(): Promise<AppDb | null> {
  return getAppDb();
}

export async function withPushHandler(
  req: VercelRequest,
  res: VercelResponse,
  allowedMethods: string[],
  handler: (db: AppDb, req: VercelRequest) => Promise<HandlerResult>
) {
  if (!allowedMethods.includes(req.method ?? '')) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await getAppDb();
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
