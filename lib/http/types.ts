/** HTTP handler types for Cloudflare Worker routes (formerly Vercel serverless). */

export type HttpRequest = {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
  body?: unknown;
  /** Raw request body when the Worker adapter read it as text (e.g. Stripe webhooks). */
  rawBody?: string;
};

export type HttpResponse = {
  status(code: number): HttpResponse;
  json(body: unknown): void;
  send(body: string | Buffer): void;
  setHeader(name: string, value: string | string[]): void;
  getHeader(name: string): string | string[] | undefined;
  end(): void;
};

export type HttpHandler = (req: HttpRequest, res: HttpResponse) => void | Promise<void>;

/** @deprecated Use HttpRequest */
export type VercelRequest = HttpRequest;
/** @deprecated Use HttpResponse */
export type VercelResponse = HttpResponse;
