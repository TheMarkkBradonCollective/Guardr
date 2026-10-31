import type { Hono } from 'hono';
import type { WorkerEnv } from '../app.ts';
import { SYNC_TABLES } from '../../src/lib/useSupabaseRealtime.ts';

export function registerWorkerSyncRoutes(app: Hono<{ Bindings: WorkerEnv }>) {
  app.get('/api/sync/poll', async (c) => {
    const since = c.req.query('since');
    const sinceTs = since ? Date.parse(since) : 0;
    if (!Number.isFinite(sinceTs)) return c.json({ error: 'Invalid since' }, 400);

    const elapsed = Date.now() - sinceTs;
    const tables = SYNC_TABLES as readonly string[];
    const changed = elapsed >= 3500 ? [...tables] : [];

    return c.json({ changed, serverTime: new Date().toISOString() });
  });
}
