import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { NEON_SMOKE_SQL } from './neonSmoke.ts';
import { REQUIRED_NEON_TABLES, toNeonSchema } from './neonSchema.ts';

const source = readFileSync(new URL('../../supabase/complete_schema_setup.sql', import.meta.url), 'utf8');

describe('Neon schema transform', () => {
  it('keeps the marketplace tables and drops Supabase-only listeners', () => {
    const neon = toNeonSchema(source);
    assert.match(neon, /CREATE SCHEMA IF NOT EXISTS auth/);
    assert.match(neon, /CREATE OR REPLACE FUNCTION auth\.uid\(\)/);
    assert.match(neon, /CREATE EXTENSION IF NOT EXISTS pgcrypto/);
    assert.doesNotMatch(neon, /supabase_realtime/);
    assert.doesNotMatch(neon, /NOTIFY\s+pgrst/i);
    assert.match(source, /NOTIFY\s+pgrst/i);
    assert.match(neon, /CREATE TABLE IF NOT EXISTS guards\b/);
    for (const table of REQUIRED_NEON_TABLES) {
      assert.match(neon, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`));
    }
    assert.match(neon, /ENABLE ROW LEVEL SECURITY/);
    assert.match(neon, /CREATE POLICY audit_log_select/);
    const createCases = neon.indexOf('CREATE TABLE IF NOT EXISTS one_role_cases');
    const lateRls = neon.lastIndexOf('ALTER TABLE one_role_cases ENABLE ROW LEVEL SECURITY');
    assert.ok(createCases > 0 && lateRls > createCases);
    assert.match(neon, /CREATE POLICY one_role_cases_select/);
    assert.match(neon, /CREATE POLICY device_account_bindings_select/);
    assert.match(neon, /DO \$\$\r?\nBEGIN\r?\n  -- These tables are created later/);
    const addStatus = neon.indexOf('ADD COLUMN IF NOT EXISTS payout_status');
    const statusIndex = neon.lastIndexOf('idx_staff_comp_payouts_status');
    assert.ok(addStatus > 0 && statusIndex > addStatus);
  });

  it('does not rewrite the Supabase source file', () => {
    assert.match(source, /ALTER PUBLICATION supabase_realtime/);
    assert.match(source, /auth\.uid\(\)/);
  });

  it('rolls the smoke writes back', () => {
    assert.match(NEON_SMOKE_SQL, /^BEGIN;/);
    assert.match(NEON_SMOKE_SQL, /ROLLBACK;\s*$/);
    assert.match(NEON_SMOKE_SQL, /neon-smoke-guard@example\.com/);
    assert.doesNotMatch(NEON_SMOKE_SQL, /BEGIN;[\s\S]*COMMIT;/);
    assert.match(NEON_SMOKE_SQL, /synthetic-test-document/);
  });
});
