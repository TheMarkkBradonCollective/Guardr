import type { Express, Request, Response } from 'express';
import { getSupabaseAdmin } from './supabaseAdmin';
import {
  handlePushEvent,
  handlePushSend,
  handlePushSubscribe,
  handlePushTest,
  handlePushUnsubscribe,
} from './pushHandlers';

function getDb() {
  return getSupabaseAdmin();
}

async function runHandler(
  res: Response,
  handler: () => Promise<{ status: number; body: Record<string, unknown> }>
) {
  try {
    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database is not configured' });
    }
    const result = await handler();
    return res.status(result.status).json(result.body);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Push handler failed';
    console.error('Push route error:', message);
    return res.status(500).json({ error: message });
  }
}

export function registerPushRoutes(app: Express): void {
  app.post('/api/push/subscribe', (req: Request, res: Response) =>
    runHandler(res, () => handlePushSubscribe(getDb()!, req.body))
  );

  app.post('/api/push/unsubscribe', (req: Request, res: Response) =>
    runHandler(res, () => handlePushUnsubscribe(getDb()!, req.body))
  );

  app.post('/api/push/send', (req: Request, res: Response) =>
    runHandler(res, () => handlePushSend(getDb()!, req.headers.authorization, req.body))
  );

  app.post('/api/push/test', (req: Request, res: Response) =>
    runHandler(res, () => handlePushTest(getDb()!, req.body))
  );

  app.post('/api/push/events', (req: Request, res: Response) =>
    runHandler(res, () => handlePushEvent(getDb()!, req.body))
  );
}
