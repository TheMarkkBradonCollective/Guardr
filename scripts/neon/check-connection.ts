/**
 * Read-only Neon connectivity check. Pass --smoke to run rolled-back test rows.
 *
 *   NEON_DATABASE_URL=postgresql://...-pooler.../guardr npm run db:neon:check
 */
import {
  classifyDatabaseUrl,
  neonVariablePointsAtSupabase,
  redactSecrets,
  resolveNeonConnectionString,
} from '../../lib/db/databaseUrl.ts';
import { missingRequiredTables } from '../../lib/db/neonSchema.ts';
import { NEON_SMOKE_SQL } from '../../lib/db/neonSmoke.ts';
import { withPgClient } from '../../lib/db/neonPool.ts';

async function main(): Promise<void> {
  if (neonVariablePointsAtSupabase()) {
    console.error('Refusing to check connectivity against a Supabase host.');
    process.exitCode = 2;
    return;
  }

  const connectionString = resolveNeonConnectionString() ?? process.env.GUARDR_SCHEMA_TEST_URL?.trim();
  if (!connectionString) {
    console.error(
      'Neon connectivity check did not run. Set NEON_DATABASE_URL to the pooled connection string (server-side only).'
    );
    process.exitCode = 2;
    return;
  }

  const target = classifyDatabaseUrl(connectionString);
  if (target.provider === 'supabase') {
    console.error('Refusing to check connectivity against a Supabase host.');
    process.exitCode = 2;
    return;
  }
  if (target.provider !== 'neon' && process.env.GUARDR_ALLOW_NON_NEON_MIGRATION !== '1') {
    console.error('Refusing to check connectivity: host is not neon.tech.');
    process.exitCode = 2;
    return;
  }

  const smoke = process.argv.includes('--smoke');

  await withPgClient(connectionString, async (query) => {
    const info = await query('SELECT current_database() AS database, current_setting(\'server_version\') AS version');
    const listed = await query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
    );
    const names = listed.rows.map((row) => String(row.table_name));
    const missing = missingRequiredTables(names);
    let smokeResult: Record<string, unknown> | null = null;
    if (smoke) {
      const smoked = await query(NEON_SMOKE_SQL);
      smokeResult = smoked.rows[0] ?? null;
      const leftover = await query(`SELECT count(*)::int AS leftover FROM guards WHERE id = 'neon-smoke-guard'`);
      if (Number(leftover.rows[0]?.leftover ?? 0) !== 0) {
        throw new Error('Smoke rows were not rolled back.');
      }
    }

    const report = {
      ok: missing.length === 0,
      provider: target.provider,
      database: info.rows[0]?.database ?? target.database,
      version: info.rows[0]?.version ?? null,
      pooled: target.pooled,
      tables: names.length,
      missingTables: missing,
      smoke: smokeResult,
    };
    console.log(JSON.stringify(report));
    if (missing.length) process.exitCode = 1;
  });
}

main().catch((err) => {
  console.error(redactSecrets(err instanceof Error ? err.message : 'Connectivity check failed'));
  process.exitCode = 1;
});
