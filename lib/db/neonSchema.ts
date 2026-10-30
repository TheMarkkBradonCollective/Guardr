/**
 * Turns the Supabase schema script into SQL that applies on Neon (or stock PostgreSQL).
 * The source file is not modified. Supabase-only listeners are skipped.
 * auth.uid() is provided as a local shim so existing RLS helpers still parse.
 */

export const NEON_SCHEMA_SOURCE = 'supabase/complete_schema_setup.sql';

const PUBLICATION_EXECUTE = "EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);";

const EARLY_PAYOUT_STATUS_INDEX = `CREATE INDEX IF NOT EXISTS idx_staff_comp_payouts_status
  ON staff_compensation_payouts(payout_status)
  WHERE payout_status = 'base_paid';`;

const EARLY_FUTURE_TABLE_RLS = `ALTER TABLE one_role_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_account_bindings ENABLE ROW LEVEL SECURITY;`;

const GUARDED_FUTURE_TABLE_RLS = `DO $$
BEGIN
  -- These tables are created later in the script. Skip until they exist.
  IF to_regclass('public.one_role_cases') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE one_role_cases ENABLE ROW LEVEL SECURITY';
  END IF;
  IF to_regclass('public.device_account_bindings') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE device_account_bindings ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;`;

function openTablePolicies(table: string): string {
  return `
ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ${table}_select ON ${table};
DROP POLICY IF EXISTS ${table}_insert ON ${table};
DROP POLICY IF EXISTS ${table}_update ON ${table};
DROP POLICY IF EXISTS ${table}_delete ON ${table};
CREATE POLICY ${table}_select ON ${table} FOR SELECT USING (true);
CREATE POLICY ${table}_insert ON ${table} FOR INSERT WITH CHECK (true);
CREATE POLICY ${table}_update ON ${table} FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY ${table}_delete ON ${table} FOR DELETE USING (true);
`.trim();
}

export const NEON_AUTH_SHIM = `
-- Guardr Neon compatibility shim.
-- Do not run this file against the Supabase project. The apply script refuses Supabase hosts.
-- Supabase Auth stays the application identity provider. This shim only lets existing
-- RLS helper functions compile on stock PostgreSQL. The browser never connects here.
CREATE SCHEMA IF NOT EXISTS auth;

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN current_setting('request.jwt.claim.sub', true) IS NULL THEN NULL
    WHEN btrim(current_setting('request.jwt.claim.sub', true)) = '' THEN NULL
    ELSE btrim(current_setting('request.jwt.claim.sub', true))::uuid
  END;
$$;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
`.trim();

export const REQUIRED_NEON_TABLES = [
  'guards',
  'staff',
  'clients',
  'certifications',
  'experience',
  'education',
  'security_requests',
  'payments',
  'guard_payout_invoices',
  'support_tickets',
  'support_messages',
  'push_subscriptions',
  'job_chat_threads',
  'job_chat_messages',
  'staff_messages',
  'guard_messages',
  'client_messages',
  'message_reactions',
  'chat_read_receipts',
  'user_notifications',
  'audit_log',
  'guard_availability',
  'guard_availability_date_overrides',
  'client_locations',
  'job_locations',
  'recurring_shift_templates',
  'compliance_alerts',
  'client_invoices',
  'device_account_bindings',
  'one_role_cases',
  'platform_settings',
  'platform_cities',
  'company_public_documents',
  'guard_insurance_policies',
  'notification_preferences',
  'staff_time_entries',
] as const;

export function toNeonSchema(sourceSql: string): string {
  if (!/CREATE TABLE IF NOT EXISTS guards\b/i.test(sourceSql)) {
    throw new Error('Source schema is missing the guards table.');
  }

  const publicationHits = sourceSql.split(PUBLICATION_EXECUTE).length - 1;
  if (publicationHits < 1) {
    throw new Error('Source schema no longer contains the Supabase realtime publication statement.');
  }

  if (!sourceSql.includes(EARLY_FUTURE_TABLE_RLS)) {
    throw new Error('Source schema no longer enables RLS on one_role_cases before that table is created.');
  }

  let sql = sourceSql.split(PUBLICATION_EXECUTE).join(
    '-- Skipped on Neon: there is no Supabase Realtime publication.\n        NULL;'
  );
  sql = sql.split(EARLY_FUTURE_TABLE_RLS).join(GUARDED_FUTURE_TABLE_RLS);
  if (!sql.includes(EARLY_PAYOUT_STATUS_INDEX)) {
    throw new Error('Source schema no longer creates idx_staff_comp_payouts_status before payout_status exists.');
  }
  sql = sql.split(EARLY_PAYOUT_STATUS_INDEX).join(
    '-- idx_staff_comp_payouts_status is created after payout_status is added.'
  );
  sql = sql.replace(/NOTIFY\s+pgrst\s*,\s*'reload schema'\s*;/gi, '-- Skipped on Neon: there is no PostgREST schema cache.');

  if (sql.includes('supabase_realtime') || /NOTIFY\s+pgrst/i.test(sql)) {
    throw new Error('Neon schema still contains a Supabase-only statement.');
  }
  if (!sql.includes('auth.uid()')) {
    throw new Error('Neon schema lost the auth.uid() call sites used by RLS helpers.');
  }

  for (const table of REQUIRED_NEON_TABLES) {
    if (!new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`, 'i').test(sql)) {
      throw new Error(`Neon schema is missing CREATE TABLE for ${table}.`);
    }
  }

  const tail = ['one_role_cases', 'device_account_bindings'].map(openTablePolicies).join('\n\n');
  return `${NEON_AUTH_SHIM}\n\n${sql.trim()}\n\n-- Tables created after the main RLS block still get the same open policies.\n${tail}\n\n${EARLY_PAYOUT_STATUS_INDEX}\n`;
}

export function missingRequiredTables(present: string[]): string[] {
  const have = new Set(present.map((name) => name.toLowerCase()));
  return REQUIRED_NEON_TABLES.filter((table) => !have.has(table));
}
