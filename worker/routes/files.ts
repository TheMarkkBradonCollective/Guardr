import type { Hono } from 'hono';
import type { WorkerEnv } from '../app.ts';
import { verifyJwtWeb } from '../../lib/auth/jwt.ts';

export function registerWorkerFileRoutes(app: Hono<{ Bindings: WorkerEnv }>) {
  app.post('/api/files/upload', async (c) => {
    const auth = c.req.header('authorization') ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const jwt = token ? await verifyJwtWeb(token, c.env.JWT_SECRET) : null;
    if (!jwt) return c.json({ error: 'Unauthorized' }, 401);

    const form = await c.req.formData().catch(() => null);
    const file = form?.get('file');
    if (!(file instanceof File)) return c.json({ error: 'Missing file' }, 400);

    const key = `${jwt.profileKind}/${jwt.profileId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    await c.env.FILES.put(key, file.stream(), {
      httpMetadata: { contentType: file.type || 'application/octet-stream' },
    });

    return c.json({ key, url: `/api/files/${encodeURIComponent(key)}` });
  });

  app.get('/api/files/*', async (c) => {
    const path = c.req.path.replace(/^\/api\/files\//, '');
    const key = decodeURIComponent(path);
    const object = await c.env.FILES.get(key);
    if (!object) return c.notFound();
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('cache-control', 'private, max-age=3600');
    return new Response(object.body, { headers });
  });
}
