/**
 * Frontend shim mimicking the subset of supabase-js the app uses, backed by /api/db/:table.
 * Usage: `const { data, error } = await db.from('guards').select('*').eq('id', x).maybeSingle();`
 */
import { getSessionToken } from './auth/sheetsAuth';

type Op = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'is' | 'ilike' | 'like';
type Action = 'select' | 'insert' | 'update' | 'upsert' | 'delete';
export interface DbError { message: string }
export interface DbResult<T> { data: T; error: DbError | null }
type Row = Record<string, unknown>;

export const isSheetsBackend = (): boolean =>
  ((import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_DATA_BACKEND ?? '') === 'sheets';

async function call(table: string, body: Record<string, unknown>): Promise<DbResult<Row[] | null>> {
  try {
    const token = getSessionToken();
    const res = await fetch(`/api/db/${encodeURIComponent(table)}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as { data?: Row[]; error?: DbError | string };
    if (!res.ok) {
      const err = typeof json.error === 'string' ? { message: json.error } : json.error ?? { message: `HTTP ${res.status}` };
      return { data: null, error: err };
    }
    return { data: json.data ?? [], error: null };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : String(e) } };
  }
}

/** Projects `select('a, b')` column lists client-side (nested selects are not supported). */
function project(rows: Row[], columns: string): Row[] {
  const cols = columns.split(',').map((c) => c.trim()).filter(Boolean);
  if (!cols.length || cols.includes('*')) return rows;
  return rows.map((r) => Object.fromEntries(cols.map((c) => [c, r[c] ?? null])));
}

export class QueryBuilder<T = Row> implements PromiseLike<DbResult<T[] | null>> {
  private filters: { column: string; op: Op; value: unknown }[] = [];
  private orders: { column: string; ascending: boolean }[] = [];
  private lim?: number;
  private off?: number;
  private columns = '*';
  private action: Action = 'select';
  private values?: Row | Row[];
  private onConflict?: string;
  private returning = false;

  constructor(private readonly table: string) {}

  select(columns = '*'): this {
    this.columns = columns;
    if (this.action !== 'select') this.returning = true;
    return this;
  }
  insert(values: Row | Row[]): this { this.action = 'insert'; this.values = values; return this; }
  update(values: Row): this { this.action = 'update'; this.values = values; return this; }
  upsert(values: Row | Row[], opts?: { onConflict?: string }): this {
    this.action = 'upsert'; this.values = values; this.onConflict = opts?.onConflict; return this;
  }
  delete(): this { this.action = 'delete'; return this; }

  private f(column: string, op: Op, value: unknown): this { this.filters.push({ column, op, value }); return this; }
  eq(c: string, v: unknown) { return this.f(c, 'eq', v); }
  neq(c: string, v: unknown) { return this.f(c, 'neq', v); }
  gt(c: string, v: unknown) { return this.f(c, 'gt', v); }
  gte(c: string, v: unknown) { return this.f(c, 'gte', v); }
  lt(c: string, v: unknown) { return this.f(c, 'lt', v); }
  lte(c: string, v: unknown) { return this.f(c, 'lte', v); }
  in(c: string, v: unknown[]) { return this.f(c, 'in', v); }
  is(c: string, v: unknown) { return this.f(c, 'is', v); }
  ilike(c: string, v: string) { return this.f(c, 'ilike', v); }
  like(c: string, v: string) { return this.f(c, 'like', v); }
  order(column: string, opts?: { ascending?: boolean }): this { this.orders.push({ column, ascending: opts?.ascending !== false }); return this; }
  limit(n: number): this { this.lim = n; return this; }
  range(from: number, to: number): this { this.off = from; this.lim = to - from + 1; return this; }

  async execute(): Promise<DbResult<T[] | null>> {
    const { data, error } = await call(this.table, {
      action: this.action, filters: this.filters, order: this.orders, limit: this.lim, offset: this.off,
      values: this.values, onConflict: this.onConflict,
    });
    if (error || !data) return { data: null, error };
    if (this.action !== 'select' && !this.returning) return { data: null, error: null };
    return { data: project(data, this.columns) as T[], error: null };
  }

  async single(): Promise<DbResult<T | null>> {
    const { data, error } = await this.execute();
    if (error) return { data: null, error };
    if (!data || data.length !== 1) return { data: null, error: { message: `Expected 1 row, got ${data?.length ?? 0}` } };
    return { data: data[0], error: null };
  }
  async maybeSingle(): Promise<DbResult<T | null>> {
    const { data, error } = await this.execute();
    if (error) return { data: null, error };
    if (data && data.length > 1) return { data: null, error: { message: 'Multiple rows returned' } };
    return { data: data?.[0] ?? null, error: null };
  }

  then<R1 = DbResult<T[] | null>, R2 = never>(
    ok?: ((v: DbResult<T[] | null>) => R1 | PromiseLike<R1>) | null,
    fail?: ((e: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return this.execute().then(ok, fail);
  }
}

export const db = { from: <T = Row>(table: string) => new QueryBuilder<T>(table) };

/** Upload a file to Drive via /api/files/upload; returns the link to store in the Sheet. */
export async function uploadFile(file: Blob, filename: string): Promise<{ url: string; id: string }> {
  const buf = new Uint8Array(await file.arrayBuffer());
  let bin = '';
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  const token = getSessionToken();
  const res = await fetch('/api/files/upload', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ filename, mimeType: file.type || 'application/octet-stream', dataBase64: btoa(bin) }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `Upload failed (${res.status})`);
  return { url: json.url, id: json.id };
}
