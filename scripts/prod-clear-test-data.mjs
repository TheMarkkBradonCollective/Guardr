/**
 * Delete all E2E / demo test accounts and associated production data.
 *
 * Usage:
 *   node scripts/prod-clear-test-data.mjs
 *   SUPABASE_CONFIG=/tmp/supabase-prod.json node scripts/prod-clear-test-data.mjs
 *   DRY_RUN=1 node scripts/prod-clear-test-data.mjs
 */
import { clearTestData } from './clear-test-data-lib.mjs';

async function main() {
  const result = await clearTestData({ label: 'manual' });
  console.log(`Guardr test-data cleanup${result.dryRun ? ' (DRY RUN)' : ''}`);
  console.log(`Supabase: ${result.supabaseUrl}`);
  console.log(
    `Found ${result.found.guards} guard(s), ${result.found.clients} client(s), ${result.found.staff} staff`
  );
  for (const email of result.emails) console.log(`  ${email}`);
  console.log(
    `${result.ok ? 'OK' : 'FAIL'} | verify | ${JSON.stringify(result.verify.remaining)}`
  );
  if (!result.ok) {
    console.error('Cleanup incomplete.');
    process.exit(1);
  }
  console.log('Test data cleared 100%.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
