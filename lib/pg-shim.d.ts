declare module 'pg' {
  export class Client {
    constructor(config: {
      connectionString?: string;
      ssl?: boolean | { rejectUnauthorized?: boolean };
    });
    connect(): Promise<void>;
    query(
      sql: string,
      values?: unknown[]
    ): Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>;
    end(): Promise<void>;
  }
  export class Pool {
    constructor(config: {
      connectionString?: string;
      max?: number;
      idleTimeoutMillis?: number;
      ssl?: boolean | { rejectUnauthorized?: boolean };
    });
    query(
      sql: string,
      values?: unknown[]
    ): Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>;
    end(): Promise<void>;
  }
  const pg: { Client: typeof Client; Pool: typeof Pool };
  export default pg;
}
