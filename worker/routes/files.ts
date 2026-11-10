import type { Hono } from 'hono';
import type { WorkerEnv } from '../app.ts';
import { currentRequestIdentity } from '../../lib/auth/requestIdentity.ts';
import { isStaffPlatformRole } from '../../lib/accountSessionAuth.ts';

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export function registerWorkerFileRoutes(app: Hono<{ Bindings: WorkerEnv }>) {
  app.post('/api/files/upload', async (c) => {
    const identity = currentRequestIdentity();
    if (!identity) return c.json({ error: 'Unauthorized' }, 401);

    const form = await c.req.formData().catch(() => null);
    const file = form?.get('file');
    if (!(file instanceof File)) return c.json({ error: 'Missing file' }, 400);
    if (file.size > MAX_UPLOAD_BYTES) return c.json({ error: 'File too large' }, 413);

    const key = `${identity.profileKind}/${identity.profileId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    await c.env.FILES.put(key, file.stream(), {
      httpMetadata: { contentType: file.type || 'application/octet-stream' },
    });

    return c.json({ key, url: `/api/files/${encodeURIComponent(key)}` });
  });

  // Private files (ID photos, documents): owner or staff only.
  app.get('/api/files/*', async (c) => {
    const identity = currentRequestIdentity();
    if (!identity) return c.json({ error: 'Unauthorized' }, 401);
    const path = c.req.path.replace(/^\/api\/files\//, '');
    let key: string;
    try {
      key = decodeURIComponent(path);
    } catch {
      return c.json({ error: 'Invalid path' }, 400);
    }
    const [kind, ownerId] = key.split('/');
    const isOwner = kind === identity.profileKind && ownerId === identity.profileId;
    if (!isOwner && !isStaffPlatformRole(identity.platformRole)) {
      return c.json({ error: 'Not allowed' }, 403);
    }
    const object = await c.env.FILES.get(key);
    if (!object) return c.notFound();
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('cache-control', 'private, no-store');
    headers.set('x-content-type-options', 'nosniff');
    return new Response(object.body, { headers });
  });
}
