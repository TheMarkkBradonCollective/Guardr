declare module 'pg' {
  export class Client {
    constructor(config: {
      connectionString?: string;
      ssl?: boolean | { rejectUnauthorized?: boolean };
    });
    connect(): Promise<void>;
    query(sql: string): Promise<unknown>;
    end(): Promise<void>;
  }
  const pg: { Client: typeof Client };
  export default pg;
}
