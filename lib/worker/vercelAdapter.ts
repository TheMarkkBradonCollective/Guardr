import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

type VercelRequest = {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type VercelResponse = {
  status(code: number): VercelResponse;
  json(body: unknown): void;
  send(body: string | Buffer): void;
  setHeader(name: string, value: string): void;
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
    if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
      const contentType = c.req.header('content-type') ?? '';
      if (contentType.includes('application/json')) {
        body = await c.req.json().catch(() => undefined);
      } else {
        body = await c.req.text().catch(() => undefined);
      }
    }

    const req: VercelRequest = {
      method: c.req.method,
      url: c.req.url,
      headers: Object.fromEntries(c.req.raw.headers.entries()),
      query,
      body,
    };

    let statusCode = 200;
    const headers = new Headers();
    let responseBody: string | null = null;

    const res: VercelResponse = {
      status(code: number) {
        statusCode = code;
        return res;
      },
      setHeader(name, value) {
        headers.set(name, value);
      },
      json(payload) {
        headers.set('content-type', 'application/json; charset=utf-8');
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
    return new Response(responseBody ?? '', {
      status: statusCode as ContentfulStatusCode,
      headers,
    });
  };
}
