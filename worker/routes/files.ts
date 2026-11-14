import type { Hono } from 'hono';
import type { WorkerEnv } from '../app.ts';
import { currentRequestIdentity } from '../../lib/auth/requestIdentity.ts';
import { isStaffPlatformRole } from '../../lib/accountSessionAuth.ts';

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

/** Types the browser may render inline. Anything else (HTML, SVG, JS...) is a download. */
const INLINE_SAFE_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf']);

/** Normalise an uploaded content type: keep known-safe types, everything else is opaque bytes. */
export function safeStoredContentType(type: string | null | undefined): string {
  const t = String(type ?? '').split(';')[0].trim().toLowerCase();
  return INLINE_SAFE_TYPES.has(t) ? t : 'application/octet-stream';
}

/** Headers for serving a private file without letting it run script on our origin. */
export function privateFileHeaders(storedType: string | null | undefined, key: string): Headers {
  const type = safeStoredContentType(storedType);
  const headers = new Headers();
  headers.set('content-type', type);
  headers.set('cache-control', 'private, no-store');
  headers.set('x-content-type-options', 'nosniff');
  headers.set('content-security-policy', "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox");
  headers.set('cross-origin-resource-policy', 'same-origin');
  if (type === 'application/octet-stream') {
    const name = (key.split('/').pop() || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
    headers.set('content-disposition', `attachment; filename="${name}"`);
  } else {
    headers.set('content-disposition', 'inline');
  }
  return headers;
}

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
      httpMetadata: { contentType: safeStoredContentType(file.type) },
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
    const headers = privateFileHeaders(object.httpMetadata?.contentType, key);
    return new Response(object.body, { headers });
  });
}
