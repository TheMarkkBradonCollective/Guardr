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

  or(_expr: string): this {
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
        filters: this.filters,
        upsertConflict: this.upsertConflict,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      data?: unknown;
      error?: { message: string; code?: string };
    };
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
    async signUp(input: { email: string; password: string; options?: { data?: Record<string, unknown> } }) {
      const res = await fetch(apiUrl('/api/auth/signup'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: input.email,
          password: input.password,
          profileKind: input.options?.data?.profileKind,
          profileId: input.options?.data?.profileId,
        }),
      });
      const json = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !json.token) {
        return { data: { session: null, user: null }, error: { message: json.error ?? 'Signup failed' } };
      }
      localStorage.setItem(TOKEN_KEY, json.token);
      return { data: { session: { access_token: json.token }, user: null }, error: null };
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
