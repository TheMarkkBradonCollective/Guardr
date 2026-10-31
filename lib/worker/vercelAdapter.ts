import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

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
        body = JSON.parse(rawBody);
      } else {
        body = rawBody;
      }
    }

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

    await handler(req, res);
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
