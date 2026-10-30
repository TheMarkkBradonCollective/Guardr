import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertNeonMigrationTarget,
  classifyDatabaseUrl,
  describeNeonConfig,
  neonVariablePointsAtSupabase,
  redactSecrets,
  resolveMigrationConnectionString,
  resolveNeonConnectionString,
} from './databaseUrl.ts';

const POOLED = 'postgresql://guardr_owner:secret@ep-example-pooler.us-west-2.aws.neon.tech/guardr?sslmode=require';
const DIRECT = 'postgresql://guardr_owner:secret@ep-example.us-west-2.aws.neon.tech/guardr?sslmode=require';
const SUPABASE = 'postgresql://postgres:secret@db.example.supabase.co:5432/postgres';

describe('database URL classification', () => {
  it('recognizes a pooled Neon URL without treating the secret as output', () => {
    const target = classifyDatabaseUrl(POOLED);
    assert.equal(target.provider, 'neon');
    assert.equal(target.database, 'guardr');
    assert.equal(target.pooled, true);
    assert.equal(target.host, 'ep-example-pooler.us-west-2.aws.neon.tech');
    assert.equal(target.configured, true);
  });

  it('recognizes Supabase hosts, including the pooler', () => {
    assert.equal(classifyDatabaseUrl(SUPABASE).provider, 'supabase');
    assert.equal(
      classifyDatabaseUrl('postgresql://postgres.ref:secret@aws-0-us-west-1.pooler.supabase.com:6543/postgres')
        .provider,
      'supabase'
    );
  });

  it('does not use a Supabase DATABASE_URL as the Neon app connection', () => {
    const env = { DATABASE_URL: SUPABASE };
    assert.equal(resolveNeonConnectionString(env), undefined);
    assert.deepEqual(describeNeonConfig(env), { configured: false, pooled: false, databaseName: null });
  });

  it('uses NEON_DATABASE_URL for the app and refuses to migrate through the pooler', () => {
    const env = { NEON_DATABASE_URL: POOLED, DATABASE_URL: SUPABASE };
    assert.equal(resolveNeonConnectionString(env)?.includes('neon.tech'), true);
    assert.equal(describeNeonConfig(env).configured, true);
    assert.equal(describeNeonConfig(env).databaseName, 'guardr');
    assert.equal(describeNeonConfig(env).pooled, true);
    assert.throws(() => assertNeonMigrationTarget(POOLED, env), /pooled Neon connection/);
  });

  it('refuses a Supabase host even when a local override is set', () => {
    assert.throws(
      () => assertNeonMigrationTarget(SUPABASE, { GUARDR_ALLOW_NON_NEON_MIGRATION: '1' }),
      /Supabase host/
    );
  });

  it('accepts a direct Neon URL and a local test URL only when opted in', () => {
    const target = assertNeonMigrationTarget(DIRECT);
    assert.equal(target.provider, 'neon');
    assert.equal(target.pooled, false);

    assert.equal(
      resolveMigrationConnectionString({
        NEON_DATABASE_URL_UNPOOLED: DIRECT,
        NEON_DATABASE_URL: POOLED,
      }),
      DIRECT
    );

    const local = 'postgresql://postgres@127.0.0.1/guardr';
    assert.equal(resolveMigrationConnectionString({ GUARDR_SCHEMA_TEST_URL: local }), undefined);
    assert.equal(
      resolveMigrationConnectionString({
        GUARDR_SCHEMA_TEST_URL: local,
        GUARDR_ALLOW_NON_NEON_MIGRATION: '1',
      }),
      local
    );
    const localTarget = assertNeonMigrationTarget(local, { GUARDR_ALLOW_NON_NEON_MIGRATION: '1' });
    assert.equal(localTarget.provider, 'postgres');
    assert.equal(localTarget.local, true);
  });

  it('does not let a Supabase URL in a Neon variable fall through to another database', () => {
    assert.equal(neonVariablePointsAtSupabase({ NEON_DATABASE_URL_UNPOOLED: SUPABASE }), true);
    assert.equal(neonVariablePointsAtSupabase({ DATABASE_URL: SUPABASE }), false);
    const chosen = resolveMigrationConnectionString({
      NEON_DATABASE_URL_UNPOOLED: SUPABASE,
      GUARDR_ALLOW_NON_NEON_MIGRATION: '1',
      GUARDR_SCHEMA_TEST_URL: 'postgresql://postgres@127.0.0.1/guardr',
    });
    assert.equal(chosen, SUPABASE);
    assert.throws(() => assertNeonMigrationTarget(chosen as string), /Supabase host/);
  });

  it('redacts connection strings from error text', () => {
    const redacted = redactSecrets(`connect failed ${DIRECT} at Client`);
    assert.equal(redacted.includes('secret'), false);
    assert.match(redacted, /postgresql:\/\/\*\*\*/);
  });
});
