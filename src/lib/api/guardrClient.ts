/**
 * Browser fetch client replacing @supabase/supabase-js for Worker + Neon deployment.
 */

const TOKEN_KEY = 'guardr_api_jwt';
const DEFAULT_API_ORIGIN = 'https://guardr.themarkkbrandoncollective-2d9.workers.dev';

function apiOrigin(): string {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_APP_URL?.trim().replace(/\/$/, '');
  if (env) return env;
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return DEFAULT_API_ORIGIN;
}

function apiUrl(path: string): string {
  return `${apiOrigin()}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Attach the signed-in JWT to every same-origin /api/ request. The server only
 * trusts this token (never userId/email/role sent in a body or query string).
 */
function installApiAuthFetch(): void {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;
  const marker = '__guardrApiAuthFetch';
  const w = window as unknown as Record<string, unknown>;
  if (w[marker]) return;
  w[marker] = true;
  const original = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const rawUrl = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const url = new URL(rawUrl, window.location.href);
      const sameApi =
        url.pathname.startsWith('/api/') &&
        (url.origin === window.location.origin || url.origin === apiOrigin());
      const token = sameApi ? localStorage.getItem(TOKEN_KEY) : null;
      if (token) {
        const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
        if (!headers.has('authorization')) {
          headers.set('authorization', `Bearer ${token}`);
          return original(input, { ...init, headers });
        }
      }
    } catch {
      /* fall through */
    }
    return original(input, init);
  };
}

installApiAuthFetch();

type Filter =
  | { col: string; op: 'eq'; val: unknown }
  | { col: string; op: 'neq'; val: unknown }
  | { col: string; op: 'in'; vals: unknown[] };

class ApiQueryBuilder {
  private filters: Filter[] = [];
  private operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private columns = '*';
  private payload: Record<string, unknown> | Record<string, unknown>[] | null = null;
  private upsertConflict: string | undefined;
  private wantMaybeSingle = false;
  private wantSingle = false;
  private orExpr: string | null = null;

  constructor(private readonly table: string) {}

  select(cols = '*'): this {
    if (this.operation === 'select') this.columns = cols;
    else this.columns = cols;
    return this;
  }

  insert(row: Record<string, unknown> | Record<string, unknown>[]): this {
    this.operation = 'insert';
    this.payload = row;
    return this;
  }

  update(row: Record<string, unknown>): this {
    this.operation = 'update';
    this.payload = row;
    return this;
  }

  upsert(row: Record<string, unknown> | Record<string, unknown>[], opts?: { onConflict?: string }): this {
    this.operation = 'upsert';
    this.payload = row;
    this.upsertConflict = opts?.onConflict;
    return this;
  }

  delete(): this {
    this.operation = 'delete';
    return this;
  }

  eq(col: string, val: unknown): this {
    this.filters.push({ col, op: 'eq', val });
    return this;
  }

  neq(col: string, val: unknown): this {
    this.filters.push({ col, op: 'neq', val });
    return this;
  }

  in(col: string, vals: unknown[]): this {
    this.filters.push({ col, op: 'in', vals });
    return this;
  }

  or(expr: string): this {
    this.orExpr = expr;
    return this;
  }

  order(_col: string, _opts?: { ascending?: boolean }): this {
    return this;
  }

  limit(_n: number): this {
    return this;
  }

  single(): this {
    this.wantSingle = true;
    return this;
  }

  maybeSingle(): Promise<{ data: Record<string, unknown> | null; error: { message: string; code?: string } | null }> {
    this.wantMaybeSingle = true;
    return this.run() as Promise<{ data: Record<string, unknown> | null; error: { message: string; code?: string } | null }>;
  }

  then<TResult1 = { data: unknown; error: unknown }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.run().then(onfulfilled, onrejected);
  }

  private async run(): Promise<{ data: unknown; error: { message: string; code?: string } | null }> {
    const token = localStorage.getItem(TOKEN_KEY);
    const sessionRaw = localStorage.getItem('guardr_current_user');
    let sessionHeader: string | undefined;
    if (sessionRaw) {
      try {
        const parsed = JSON.parse(sessionRaw) as { id?: string; email?: string; role?: string };
        if (parsed.id && parsed.email && parsed.role) {
          sessionHeader = JSON.stringify({ userId: parsed.id, email: parsed.email, role: parsed.role });
        }
      } catch {
        sessionHeader = undefined;
      }
    }

    const request = async (filters: Filter[]) => {
      const res = await fetch(apiUrl('/api/data/query'), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          ...(sessionHeader ? { 'x-guardr-session': sessionHeader } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          table: this.table,
          operation: this.operation,
          columns: this.columns,
          payload: this.payload ?? undefined,
          filters,
          upsertConflict: this.upsertConflict,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        data?: unknown;
        error?: { message: string; code?: string };
      };
      return { res, json };
    };

    // Worker /api/data/query only supports eq/neq/in. Emulate PostgREST or=
    // "col.eq.val,col2.eq.val2" with sequential eq lookups for maybeSingle/select.
    if (this.orExpr && this.operation === 'select') {
      const parts = this.orExpr
        .split(',')
        .map((part) => part.trim())
        .map((part) => {
          const match = /^([^.]+)\.eq\.(.*)$/.exec(part);
          return match ? { col: match[1], op: 'eq' as const, val: match[2] } : null;
        })
        .filter((part): part is { col: string; op: 'eq'; val: string } => part != null);

      if (parts.length > 0) {
        for (const part of parts) {
          const { res, json } = await request([...this.filters, part]);
          if (!res.ok) {
            return { data: null, error: json.error ?? { message: 'Request failed' } };
          }
          const rows = Array.isArray(json.data) ? json.data : json.data ? [json.data] : [];
          if (rows.length > 0) {
            if (this.wantMaybeSingle || this.wantSingle) {
              return { data: rows[0] ?? null, error: json.error ?? null };
            }
            return { data: rows, error: json.error ?? null };
          }
        }
        if (this.wantMaybeSingle || this.wantSingle) {
          return { data: null, error: null };
        }
        return { data: [], error: null };
      }
    }

    const { res, json } = await request(this.filters);
    if (!res.ok) {
      return { data: null, error: json.error ?? { message: 'Request failed' } };
    }
    if (this.wantMaybeSingle || this.wantSingle) {
      const row = Array.isArray(json.data) ? json.data[0] ?? null : json.data;
      return { data: row, error: json.error ?? null };
    }
    return { data: json.data ?? null, error: json.error ?? null };
  }
}

type RealtimeHandler = () => void;

class RealtimeChannel {
  private handlers: RealtimeHandler[] = [];
  constructor(private readonly name: string) {}

  on(_event: string, _filter: unknown, handler: RealtimeHandler): this {
    this.handlers.push(handler);
    return this;
  }

  subscribe(callback?: (status: string) => void): this {
    callback?.('SUBSCRIBED');
    const poll = async () => {
      try {
        const since = sessionStorage.getItem(`guardr_poll_${this.name}`) ?? new Date(0).toISOString();
        const res = await fetch(apiUrl(`/api/sync/poll?since=${encodeURIComponent(since)}`), { credentials: 'include' });
        const json = (await res.json()) as { changed?: string[]; serverTime?: string };
        if (json.changed?.length) {
          sessionStorage.setItem(`guardr_poll_${this.name}`, json.serverTime ?? new Date().toISOString());
          for (const h of this.handlers) h();
        }
      } catch {
        /* ignore */
      }
    };
    const id = window.setInterval(poll, 4000);
    poll();
    (this as unknown as { _pollId: number })._pollId = id;
    return this;
  }
}

export function createGuardrClient() {
  const auth = {
    async signInWithPassword(input: { email: string; password: string }) {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      });
      const json = (await res.json()) as { token?: string; user?: unknown; error?: string };
      if (!res.ok || !json.token) {
        return { data: { session: null, user: null }, error: { message: json.error ?? 'Login failed' } };
      }
      localStorage.setItem(TOKEN_KEY, json.token);
      return {
        data: {
          session: { access_token: json.token, user: json.user },
          user: json.user,
        },
        error: null,
      };
    },
    /** Server-side sign-up: creates a new guard or client profile and its login. */
    async signUp(input: {
      email: string;
      password: string;
      profileKind: 'guard' | 'client';
      profile: Record<string, unknown>;
    }) {
      const res = await fetch(apiUrl('/api/auth/signup'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
      const json = (await res.json().catch(() => ({}))) as {
        token?: string;
        error?: string;
        user?: { id: string; email: string; role: string };
      };
      if (!res.ok || !json.token) {
        return { data: { session: null, user: null }, error: { message: json.error ?? 'Signup failed' } };
      }
      localStorage.setItem(TOKEN_KEY, json.token);
      return {
        data: { session: { access_token: json.token, user: json.user ?? null }, user: json.user ?? null },
        error: null,
      };
    },
    async changePassword(newPassword: string) {
      const res = await fetch(apiUrl('/api/auth/change-password'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) return { error: { message: json.error ?? 'Could not change password' } };
      return { error: null };
    },
    async getSession() {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return { data: { session: null }, error: null };
      const res = await fetch(apiUrl('/api/auth/session'), {
        headers: { authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const json = (await res.json()) as { session?: { access_token: string; user: unknown } | null };
      return { data: { session: json.session ?? null }, error: null };
    },
    async signOut() {
      localStorage.removeItem(TOKEN_KEY);
      await fetch(apiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' });
      return { error: null };
    },
  };

  return {
    auth,
    from(table: string) {
      return {
        select: (cols?: string) => new ApiQueryBuilder(table).select(cols),
        insert: (row: Record<string, unknown> | Record<string, unknown>[]) =>
          new ApiQueryBuilder(table).insert(row),
        update: (row: Record<string, unknown>) => new ApiQueryBuilder(table).update(row),
        upsert: (row: Record<string, unknown> | Record<string, unknown>[], opts?: { onConflict?: string }) =>
          new ApiQueryBuilder(table).upsert(row, opts),
        delete: () => new ApiQueryBuilder(table).delete(),
      };
    },
    channel(name: string) {
      return new RealtimeChannel(name);
    },
    removeChannel(channel: RealtimeChannel) {
      const id = (channel as unknown as { _pollId?: number })._pollId;
      if (id) window.clearInterval(id);
    },
    storage: {
      from(_bucket: string) {
        return {
          async upload(path: string, file: File) {
            const form = new FormData();
            form.append('file', file);
            form.append('path', path);
            const token = localStorage.getItem(TOKEN_KEY);
            const res = await fetch(apiUrl('/api/files/upload'), {
              method: 'POST',
              headers: token ? { authorization: `Bearer ${token}` } : {},
              body: form,
            });
            const json = await res.json();
            if (!res.ok) return { data: null, error: json };
            return { data: json, error: null };
          },
        };
      },
    },
  };
}

export { apiUrl, apiOrigin };
