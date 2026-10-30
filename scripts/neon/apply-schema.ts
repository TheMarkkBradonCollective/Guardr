/**
 * Apply the Guardr schema to an empty Neon database.
 * Does not connect to Supabase and does not read production data.
 *
 *   NEON_DATABASE_URL_UNPOOLED=postgresql://.../guardr npm run db:neon:apply
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertNeonMigrationTarget,
  neonVariablePointsAtSupabase,
  redactSecrets,
  resolveMigrationConnectionString,
} from '../../lib/db/databaseUrl.ts';
import { missingRequiredTables, toNeonSchema } from '../../lib/db/neonSchema.ts';
import { withPgClient } from '../../lib/db/neonPool.ts';

async function main(): Promise<void> {
  if (neonVariablePointsAtSupabase()) {
    console.error(
      'Refusing to run the Neon migration against a Supabase host. The existing Supabase database is left unchanged.'
    );
    process.exitCode = 2;
    return;
  }

  const connectionString = resolveMigrationConnectionString();
  if (!connectionString) {
    console.error(
      [
        'Neon schema apply did not run.',
        'Set NEON_DATABASE_URL_UNPOOLED to the direct (non-pooler) Neon connection string for the guardr database.',
        'The pooled URL belongs in NEON_DATABASE_URL and is not used for DDL.',
        'Do not point this script at Supabase. Production traffic stays on Supabase until you choose a cutover.',
      ].join('\n')
    );
    process.exitCode = 2;
    return;
  }

  let target;
  try {
    target = assertNeonMigrationTarget(connectionString);
  } catch (err) {
    console.error(redactSecrets(err instanceof Error ? err.message : 'Invalid migration target'));
    process.exitCode = 2;
    return;
  }

  const sourcePath = resolve(process.cwd(), 'supabase/complete_schema_setup.sql');
  const sql = toNeonSchema(readFileSync(sourcePath, 'utf8'));

  await withPgClient(connectionString, async (query) => {
    await query(sql);
    const listed = await query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
       ORDER BY table_name`
    );
    const names = listed.rows.map((row) => String(row.table_name));
    const missing = missingRequiredTables(names);
    if (missing.length) {
      throw new Error(`Schema apply finished but these tables are missing: ${missing.join(', ')}`);
    }
    const authFn = await query(
      `SELECT proname
       FROM pg_proc
       JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
       WHERE nspname = 'auth' AND proname = 'uid'`
    );
    if (!authFn.rows.length) {
      throw new Error('auth.uid() shim was not created.');
    }
    console.log(
      JSON.stringify({
        ok: true,
        provider: target.provider,
        database: target.database,
        tables: names.length,
        requiredTables: missingRequiredTables(names).length === 0,
      })
    );
  });
}

main().catch((err) => {
  console.error(redactSecrets(err instanceof Error ? err.message : 'Schema apply failed'));
  process.exitCode = 1;
});
