import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { currentRequestIdentity, type RequestIdentity } from '../auth/requestIdentity.ts';

const CREDENTIAL_KEYS = ['userId', 'email', 'role'] as const;

/**
 * Legacy routes read session credentials ({ userId, email, role }) from the query
 * string or JSON body. Replace any client-sent values with the verified identity so
 * a caller can never claim to be someone else. Without a verified identity the
 * credential fields are removed and the route sees an anonymous request.
 */
export function bindSessionCredentials(
  target: Record<string, unknown> | null | undefined,
  identity: RequestIdentity | null
): void {
  if (!target || typeof target !== 'object' || Array.isArray(target)) return;
  const hasAll = CREDENTIAL_KEYS.every((k) => k in target);
  if (!hasAll) return;
  if (!identity) {
    for (const k of CREDENTIAL_KEYS) delete target[k];
    return;
  }
  target.userId = identity.profileId;
  target.email = identity.email;
  target.role = identity.platformRole;
}

type VercelRequest = {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
  body?: unknown;
  rawBody?: string;
};

type VercelResponse = {
  status(code: number): VercelResponse;
  json(body: unknown): void;
  send(body: string | Buffer): void;
  setHeader(name: string, value: string | string[]): void;
  getHeader(name: string): string | string[] | undefined;
  end(): void;
};

export function createVercelAdapter(
  handler: (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>
) {
  return async (c: Context): Promise<Response> => {
    const url = new URL(c.req.url);
    const query: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    let body: unknown = undefined;
    let rawBody: string | undefined;
    if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
      rawBody = await c.req.text().catch(() => undefined);
      const contentType = c.req.header('content-type') ?? '';
      if (rawBody !== undefined && contentType.includes('application/json')) {
        try {
          body = rawBody ? JSON.parse(rawBody) : undefined;
        } catch {
          return c.json({ error: 'Invalid JSON body' }, 400);
        }
      } else {
        body = rawBody;
      }
    }

    const identity = currentRequestIdentity();
    bindSessionCredentials(query, identity);
    bindSessionCredentials(body as Record<string, unknown> | undefined, identity);

    const req: VercelRequest = {
      method: c.req.method,
      url: c.req.url,
      headers: Object.fromEntries(c.req.raw.headers.entries()),
      query,
      body,
      rawBody,
    };

    let statusCode = 200;
    const headers = new Headers();
    let responseBody: string | null = null;
    const headerStore = new Map<string, string | string[]>();

    const res: VercelResponse = {
      status(code: number) {
        statusCode = code;
        return res;
      },
      setHeader(name, value) {
        headerStore.set(name.toLowerCase(), value);
      },
      getHeader(name) {
        return headerStore.get(name.toLowerCase());
      },
      json(payload) {
        headerStore.set('content-type', 'application/json; charset=utf-8');
        responseBody = JSON.stringify(payload);
      },
      send(payload) {
        responseBody = typeof payload === 'string' ? payload : payload.toString('utf8');
      },
      end() {
        responseBody = responseBody ?? '';
      },
    };

    try {
      await handler(req, res);
    } catch (err) {
      console.error('Route handler error:', err instanceof Error ? err.message : err);
      return c.json({ error: 'Internal error' }, 500);
    }
    headerStore.forEach((value, key) => {
      if (key === 'set-cookie' && Array.isArray(value)) {
        for (const cookie of value) headers.append('Set-Cookie', cookie);
      } else if (Array.isArray(value)) {
        headers.set(key, value.join(', '));
      } else {
        headers.set(key, value);
      }
    });
    return new Response(responseBody ?? '', {
      status: statusCode as ContentfulStatusCode,
      headers,
    });
  };
}
