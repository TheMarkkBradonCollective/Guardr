/**
 * Plain PostgreSQL schema for Neon + Cloudflare Worker (no Supabase Auth, Storage, Realtime, or RLS).
 * Source: supabase/complete_schema_setup.sql
 */

import { NEON_SCHEMA_SOURCE } from './neonSchema.ts';

export { NEON_SCHEMA_SOURCE };

const PUBLICATION_EXECUTE = "EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);";

const EARLY_PAYOUT_STATUS_INDEX = `CREATE INDEX IF NOT EXISTS idx_staff_comp_payouts_status
  ON staff_compensation_payouts(payout_status)
  WHERE payout_status = 'base_paid';`;

const EARLY_FUTURE_TABLE_RLS = `ALTER TABLE one_role_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_account_bindings ENABLE ROW LEVEL SECURITY;`;

export const PLAIN_USERS_TABLE = `
-- Application auth (replaces Supabase Auth for Worker deployment).
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  profile_kind TEXT NOT NULL CHECK (profile_kind IN ('guard', 'client', 'staff')),
  profile_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_users_profile ON users(profile_kind, profile_id);
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(lower(email));
`.trim();

export const PLAIN_SCHEMA_HEADER = `
-- Guardr plain PostgreSQL schema (Neon + Cloudflare Worker).
-- Derived from supabase/complete_schema_setup.sql — Supabase-only pieces removed.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

${PLAIN_USERS_TABLE}
`.trim();

/** Remove RLS policies, auth.uid() helpers, and Supabase-only DDL. */
function stripSupabaseOnly(sql: string): string {
  let out = sql;

  out = out.split(PUBLICATION_EXECUTE).join('-- Skipped: Supabase Realtime publication.\n        NULL;');

  out = out.replace(/NOTIFY\s+pgrst\s*,\s*'reload schema'\s*;/gi, '-- Skipped: PostgREST reload.');

  // Drop guarded early RLS on tables that do not exist yet (handled in source transform).
  out = out.split(EARLY_FUTURE_TABLE_RLS).join('-- Skipped early RLS on future tables.');

  if (out.includes(EARLY_PAYOUT_STATUS_INDEX)) {
    out = out.split(EARLY_PAYOUT_STATUS_INDEX).join(
      '-- idx_staff_comp_payouts_status is created after payout_status exists.'
    );
  }

  // Remove auth schema shim blocks if present in transformed neon output.
  out = out.replace(/CREATE SCHEMA IF NOT EXISTS auth;[\s\S]*?CREATE EXTENSION IF NOT EXISTS pgcrypto;/gi, '');

  // RLS enable + policies
  out = out.replace(/ALTER TABLE [a-z0-9_]+ ENABLE ROW LEVEL SECURITY;\s*/gi, '');
  out = out.replace(/DROP POLICY IF EXISTS [^;]+;\s*/gi, '');
  out = out.replace(/CREATE POLICY [^;]+;\s*/gi, '');

  // auth.uid() helper functions and strict RLS helpers
  out = out.replace(
    /CREATE OR REPLACE FUNCTION auth\.[\s\S]*?\$\$;[\s]*/gi,
    ''
  );
  out = out.replace(/CREATE OR REPLACE FUNCTION public\.current_[a-z_]+\(\)[\s\S]*?\$\$;[\s]*/gi, '');
  out = out.replace(
    /CREATE OR REPLACE FUNCTION public\.(auth_[a-z_]+|is_[a-z_]+)\(\)[\s\S]*?\$\$;[\s]*/gi,
    ''
  );

  // DO blocks that only add realtime publication
  out = out.replace(
    /DO \$\$[\s\S]*?supabase_realtime[\s\S]*?\$\$;\s*/gi,
    ''
  );

  if (/supabase_realtime/i.test(out)) {
    throw new Error('Plain schema still references supabase_realtime.');
  }
  if (/ENABLE ROW LEVEL SECURITY/i.test(out)) {
    throw new Error('Plain schema still enables RLS.');
  }
  if (/CREATE POLICY/i.test(out)) {
    throw new Error('Plain schema still contains policies.');
  }
  if (/auth\.uid\(\)/i.test(out)) {
    throw new Error('Plain schema still references auth.uid().');
  }

  return out;
}

export function toPlainNeonSchema(sourceSql: string): string {
  if (!/CREATE TABLE IF NOT EXISTS guards\b/i.test(sourceSql)) {
    throw new Error('Source schema is missing the guards table.');
  }

  const body = stripSupabaseOnly(sourceSql);
  const tail = `
${EARLY_PAYOUT_STATUS_INDEX}
`.trim();

  return `${PLAIN_SCHEMA_HEADER}\n\n${body.trim()}\n\n${tail}\n`;
}
