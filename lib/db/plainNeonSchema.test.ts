import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { toPlainNeonSchema, PLAIN_USERS_TABLE } from './plainNeonSchema.ts';

const source = readFileSync(new URL('../../docs/legacy/complete_schema_setup.sql', import.meta.url), 'utf8');

describe('Plain Neon schema', () => {
  it('drops RLS, auth.uid helpers, and Supabase realtime', () => {
    const sql = toPlainNeonSchema(source);
    assert.match(sql, new RegExp(PLAIN_USERS_TABLE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 40)));
    assert.doesNotMatch(sql, /ENABLE ROW LEVEL SECURITY/i);
    assert.doesNotMatch(sql, /CREATE POLICY/i);
    assert.doesNotMatch(sql, /supabase_realtime/i);
    assert.doesNotMatch(sql, /auth\.uid\(\)/i);
    assert.match(sql, /CREATE TABLE IF NOT EXISTS guards\b/);
  });
});
