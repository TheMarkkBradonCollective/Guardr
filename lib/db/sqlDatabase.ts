/**
 * Minimal PostgREST-style client over Neon/serverless SQL.
 * Compatible enough for Guardr server routes and the browser API shim.
 */

export type SqlQueryFn = (
  sql: string,
  params?: unknown[]
) => Promise<{ rows: Record<string, unknown>[]; rowCount: number }>;

export interface DbResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
  count?: number | null;
}

type Filter =
  | { kind: 'eq'; col: string; val: unknown }
  | { kind: 'neq'; col: string; val: unknown }
  | { kind: 'in'; col: string; vals: unknown[] }
  | { kind: 'or'; expr: string };

class QueryBuilder {
  private filters: Filter[] = [];
  private orderCol: string | null = null;
  private orderAsc = true;
  private limitN: number | null = null;
  private singleRow = false;
  private maybeSingleRow = false;

  constructor(
    private readonly run: SqlQueryFn,
    private readonly table: string,
    private readonly operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert',
    private columns: string = '*',
    private payload: Record<string, unknown> | Record<string, unknown>[] | null = null,
    private upsertConflict: string | null = null
  ) {}

  select(cols = '*'): this {
    if (this.operation === 'insert' || this.operation === 'upsert') {
      this.columns = cols;
      return this;
    }
    if (this.operation === 'select') this.columns = cols;
    return this;
  }

  eq(col: string, val: unknown): this {
    this.filters.push({ kind: 'eq', col, val });
    return this;
  }

  neq(col: string, val: unknown): this {
    this.filters.push({ kind: 'neq', col, val });
    return this;
  }

  in(col: string, vals: unknown[]): this {
    this.filters.push({ kind: 'in', col, vals });
    return this;
  }

  or(expr: string): this {
    this.filters.push({ kind: 'or', expr });
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }): this {
    this.orderCol = col;
    this.orderAsc = opts?.ascending !== false;
    return this;
  }

  limit(n: number): this {
    this.limitN = n;
    return this;
  }

  single(): this {
    this.singleRow = true;
    return this;
  }

  maybeSingle(): Promise<DbResult<Record<string, unknown>>> {
    this.maybeSingleRow = true;
    return this.execute() as unknown as Promise<DbResult<Record<string, unknown>>>;
  }

  then<TResult1 = DbResult<Record<string, unknown>[]>, TResult2 = never>(
    onfulfilled?:
      | ((value: DbResult<Record<string, unknown>[]>) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private whereClause(startIdx: number): { sql: string; params: unknown[] } {
    const params: unknown[] = [];
    const parts: string[] = [];
    let idx = startIdx;

    for (const f of this.filters) {
      if (f.kind === 'eq') {
        parts.push(`${quoteIdent(f.col)} = $${idx++}`);
        params.push(f.val);
      } else if (f.kind === 'neq') {
        parts.push(`${quoteIdent(f.col)} <> $${idx++}`);
        params.push(f.val);
      } else if (f.kind === 'in') {
        if (!f.vals.length) {
          parts.push('FALSE');
        } else {
          const placeholders = f.vals.map(() => `$${idx++}`);
          params.push(...f.vals);
          parts.push(`${quoteIdent(f.col)} IN (${placeholders.join(', ')})`);
        }
      } else if (f.kind === 'or') {
        const orParts = f.expr.split(',').map((part) => part.trim());
        const orSql: string[] = [];
        for (const part of orParts) {
          const m = part.match(/^([a-z0-9_]+)\.eq\.(.+)$/i);
          if (m) {
            orSql.push(`${quoteIdent(m[1])} = $${idx++}`);
            params.push(m[2]);
          }
        }
        if (orSql.length) parts.push(`(${orSql.join(' OR ')})`);
      }
    }

    return { sql: parts.length ? ` WHERE ${parts.join(' AND ')}` : '', params };
  }

  private async execute(): Promise<DbResult<Record<string, unknown>[]>> {
    try {
      if (this.operation === 'select') {
        const { sql: where, params } = this.whereClause(1);
        let sql = `SELECT ${this.columns === '*' ? '*' : this.columns} FROM ${quoteIdent(this.table)}${where}`;
        if (this.orderCol) {
          sql += ` ORDER BY ${quoteIdent(this.orderCol)} ${this.orderAsc ? 'ASC' : 'DESC'}`;
        }
        if (this.limitN != null) sql += ` LIMIT ${this.limitN}`;
        const result = await this.run(sql, params);
        if (this.singleRow || this.maybeSingleRow) {
          const row = result.rows[0] ?? null;
          if (this.singleRow && !row) {
            return { data: null, error: { message: 'No rows', code: 'PGRST116' } };
          }
          return { data: row as unknown as Record<string, unknown>[], error: null };
        }
        return { data: result.rows, error: null, count: result.rowCount };
      }

      if (this.operation === 'insert' || this.operation === 'upsert') {
        const rows = Array.isArray(this.payload) ? this.payload : this.payload ? [this.payload] : [];
        if (!rows.length) return { data: null, error: { message: 'Empty insert' } };
        const keys = Object.keys(rows[0]);
        const allParams: unknown[] = [];
        const valueGroups: string[] = [];
        let p = 1;
        for (const row of rows) {
          const ph = keys.map(() => `$${p++}`);
          keys.forEach((k) => allParams.push(row[k]));
          valueGroups.push(`(${ph.join(', ')})`);
        }
        const conflict = this.upsertConflict ?? (this.operation === 'upsert' ? 'id' : null);
        let sql = `INSERT INTO ${quoteIdent(this.table)} (${keys.map(quoteIdent).join(', ')}) VALUES ${valueGroups.join(', ')}`;
        if (conflict) {
          const updates = keys
            .filter((k) => k !== conflict)
            .map((k) => `${quoteIdent(k)} = EXCLUDED.${quoteIdent(k)}`);
          sql += ` ON CONFLICT (${quoteIdent(conflict)}) DO UPDATE SET ${updates.join(', ')}`;
        }
        if (this.columns !== '*') {
          sql += ` RETURNING ${this.columns}`;
        } else {
          sql += ' RETURNING *';
        }
        const result = await this.run(sql, allParams);
        return { data: result.rows, error: null };
      }

      if (this.operation === 'update') {
        const row = this.payload as Record<string, unknown>;
        const keys = Object.keys(row);
        const setParts = keys.map((k, i) => `${quoteIdent(k)} = $${i + 1}`);
        const params = [...keys.map((k) => row[k])];
        const { sql: where, params: wParams } = this.whereClause(keys.length + 1);
        params.push(...wParams);
        const sql = `UPDATE ${quoteIdent(this.table)} SET ${setParts.join(', ')}${where} RETURNING *`;
        const result = await this.run(sql, params);
        return { data: result.rows, error: null };
      }

      if (this.operation === 'delete') {
        const { sql: where, params } = this.whereClause(1);
        const sql = `DELETE FROM ${quoteIdent(this.table)}${where} RETURNING *`;
        const result = await this.run(sql, params);
        return { data: result.rows, error: null };
      }

      return { data: null, error: { message: 'Unsupported operation' } };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Query failed';
      const code = message.includes('does not exist') ? '42P01' : undefined;
      return { data: null, error: { message, code } };
    }
  }
}

function quoteIdent(name: string): string {
  if (!/^[a-z_][a-z0-9_]*$/i.test(name)) {
    throw new Error(`Invalid identifier: ${name}`);
  }
  return `"${name}"`;
}

export interface SqlDatabase {
  from(table: string): {
    select(cols?: string): QueryBuilder;
    insert(row: Record<string, unknown> | Record<string, unknown>[]): QueryBuilder;
    update(row: Record<string, unknown>): QueryBuilder;
    upsert(row: Record<string, unknown> | Record<string, unknown>[], opts?: { onConflict?: string }): QueryBuilder;
    delete(): QueryBuilder;
  };
}

export function createSqlDatabase(run: SqlQueryFn): SqlDatabase {
  return {
    from(table: string) {
      return {
        select(cols = '*') {
          return new QueryBuilder(run, table, 'select', cols);
        },
        insert(row) {
          return new QueryBuilder(run, table, 'insert', '*', row);
        },
        update(row) {
          return new QueryBuilder(run, table, 'update', '*', row);
        },
        upsert(row, opts) {
          return new QueryBuilder(run, table, 'upsert', '*', row, opts?.onConflict ?? 'id');
        },
        delete() {
          return new QueryBuilder(run, table, 'delete');
        },
      };
    },
  };
}
