/**
 * Apply db/neon-schema.sql to an empty Neon database.
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
import { missingRequiredTables } from '../../lib/db/neonSchema.ts';
import { withPgClient } from '../../lib/db/neonPool.ts';

async function main(): Promise<void> {
  if (neonVariablePointsAtSupabase()) {
    console.error('Refusing to run against a Supabase host.');
    process.exitCode = 2;
    return;
  }

  const connectionString = resolveMigrationConnectionString();
  if (!connectionString) {
    console.error('Set NEON_DATABASE_URL_UNPOOLED to the direct Neon connection string for the guardr database.');
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

  const sql = readFileSync(resolve(process.cwd(), 'db/neon-schema.sql'), 'utf8');

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
    if (!names.includes('users')) {
      throw new Error('users table was not created.');
    }
    console.log(
      JSON.stringify({
        ok: true,
        provider: target.provider,
        database: target.database,
        tables: names.length,
        requiredTables: missing.length === 0,
      })
    );
  });
}

main().catch((err) => {
  console.error(redactSecrets(err instanceof Error ? err.message : 'Schema apply failed'));
  process.exitCode = 1;
});
