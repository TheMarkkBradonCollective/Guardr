import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { RequestIdentity } from '../../lib/auth/requestIdentity.ts';
import { identityFromJwt } from '../../lib/auth/requestIdentity.ts';
import { passwordVersion } from '../../lib/auth/passwordVersion.ts';
import { loginThrottledShared, loginWindowStart, LOGIN_RATE_SQL } from '../../lib/auth/loginRateLimit.ts';
import type { SqlDatabase } from '../../lib/db/sqlDatabase.ts';
import type { JwtPayload } from '../../lib/auth/jwt.ts';
import { privateFilterOwnerOr, scopeSharedRows } from './rowRules.ts';

const SECRET = 'test-secret';

function fakeDb(tables: Record<string, Record<string, unknown> | null>, query?: SqlDatabase['query']): SqlDatabase {
  return {
    query: query ?? (async () => ({ data: null, error: { message: 'no table' } })),
    from(table: string) {
      const chain = {
        select: () => chain,
        eq: () => chain,
        async maybeSingle() {
          return { data: tables[table] ?? null, error: null };
        },
      };
      return chain as never;
    },
  } as SqlDatabase;
}

const guardRow = { id: 'guard-1', email: 'g@example.com', user_status: 'active' };
const payload = (pwv?: string): JwtPayload => ({
  sub: 'guard-1', email: 'g@example.com', role: 'guard', profileKind: 'guard', profileId: 'guard-1', pwv, iat: 0, exp: 9e9,
});

describe('tokens stop working after a password change', () => {
  it('fingerprint is stable per hash and changes with the hash', async () => {
    const a = await passwordVersion(SECRET, 'pbkdf2$old');
    assert.equal(a, await passwordVersion(SECRET, 'pbkdf2$old'));
    assert.notEqual(a, await passwordVersion(SECRET, 'pbkdf2$new'));
    assert.notEqual(a, await passwordVersion('other-secret', 'pbkdf2$old'));
  });

  it('accepts a token whose pwv matches the current login hash', async () => {
    const db = fakeDb({ guards: guardRow, users: { password_hash: 'pbkdf2$old' } });
    const id = await identityFromJwt(db, payload(await passwordVersion(SECRET, 'pbkdf2$old')), SECRET);
    assert.equal(id?.profileId, 'guard-1');
  });

  it('rejects a token issued before the password changed', async () => {
    const db = fakeDb({ guards: guardRow, users: { password_hash: 'pbkdf2$new' } });
    assert.equal(await identityFromJwt(db, payload(await passwordVersion(SECRET, 'pbkdf2$old')), SECRET), null);
  });

  it('rejects tokens without pwv, and accounts with no login', async () => {
    assert.equal(await identityFromJwt(fakeDb({ guards: guardRow, users: { password_hash: 'h' } }), payload(), SECRET), null);
    assert.equal(await identityFromJwt(fakeDb({ guards: guardRow, users: null }), payload('x'), SECRET), null);
  });
});

describe('shared login throttle', () => {
  it('uses one-minute windows', () => {
    assert.equal(loginWindowStart(Date.UTC(2026, 10, 14, 22, 30, 45)), '2026-11-14T22:30:00.000Z');
  });

  it('counts in Neon and throttles over 10 per email or 30 per IP', async () => {
    const counts = new Map<string, number>();
    const seen: string[] = [];
    const db = fakeDb({}, async (sql, params = []) => {
      seen.push(sql);
      if (sql !== LOGIN_RATE_SQL) return { data: [], error: null };
      const rows = [params[0], params[1]].map((k) => {
        const key = `${k}|${params[2]}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
        return { key: k, count: counts.get(key) };
      });
      return { data: rows, error: null };
    });
    const now = Date.UTC(2026, 10, 14, 22, 0, 5);
    const results: boolean[] = [];
    for (let i = 0; i < 11; i++) results.push(await loginThrottledShared(db, 'victim@example.com', `10.1.0.${i}`, now));
    assert.deepEqual(results.slice(0, 10), Array(10).fill(false));
    assert.equal(results[10], true);
    // Different emails from one IP: blocked after 30.
    let ipBlocked = false;
    for (let i = 0; i < 31; i++) ipBlocked = await loginThrottledShared(db, `u${i}@example.com`, '10.9.9.9', now);
    assert.equal(ipBlocked, true);
    // Keys are hashed, never raw emails.
    assert.ok([...counts.keys()].every((k) => !k.includes('victim@example.com')));
    // Next minute starts fresh.
    assert.equal(await loginThrottledShared(db, 'victim@example.com', '10.1.0.99', now + 60_000), false);
  });

  it('falls back to the per-instance limit when the table is missing', async () => {
    const db = fakeDb({});
    const email = `fallback-${Date.now()}@example.com`;
    let blocked = false;
    for (let i = 0; i < 11; i++) blocked = await loginThrottledShared(db, email, `10.2.0.${i}`);
    assert.equal(blocked, true);
  });
});

describe('vehicle plates', () => {
  const client: RequestIdentity = { profileId: 'client-1', profileKind: 'client', email: 'c@example.com', platformRole: 'client', sideRole: null, staffRole: null };
  const staff: RequestIdentity = { profileId: 'staff-1', profileKind: 'staff', email: 's@example.com', platformRole: 'support', sideRole: null, staffRole: 'Support' };
  const rows = [
    { id: 'v1', guard_id: 'guard-1', make: 'Ford', plate_number: '8ABC123', plate_state: 'CA', front_photo_url: '/api/files/f', back_photo_url: '/api/files/b' },
    { id: 'v2', guard_id: 'guard-2', make: 'Kia', plate_number: '7XYZ999', plate_state: 'CA', front_photo_url: '/api/files/f2' },
  ];

  it('hides plates and photos except for the owner, staff, and people on an active job', () => {
    const out = scopeSharedRows('guard_vehicle_profiles', client, rows, { vehicleGuardIds: new Set(['guard-1']) }) as Record<string, unknown>[];
    assert.equal(out[0].plate_number, '8ABC123');
    assert.equal(out[1].plate_number, '');
    assert.equal(out[1].plate_state, '');
    assert.equal(out[1].front_photo_url, null);
    assert.equal(out[1].make, 'Kia');
    const own = scopeSharedRows('guard_vehicle_profiles', { ...client, profileKind: 'guard', profileId: 'guard-2', platformRole: 'guard' }, rows, {}) as Record<string, unknown>[];
    assert.equal(own[1].plate_number, '7XYZ999');
    assert.equal(own[0].plate_number, '');
    assert.equal((scopeSharedRows('guard_vehicle_profiles', staff, rows) as Record<string, unknown>[])[1].plate_number, '7XYZ999');
  });

  it('filtering by plate only matches your own vehicle', () => {
    assert.equal(privateFilterOwnerOr('guard_vehicle_profiles', client, ['plate_number']), 'guard_id.eq.client-1');
    assert.equal(privateFilterOwnerOr('guard_vehicle_profiles', client, ['guard_id']), null);
    assert.equal(privateFilterOwnerOr('job_locations', client, ['access_instructions']), 'created_by_client_id.eq.client-1');
    assert.equal(privateFilterOwnerOr('guard_vehicle_profiles', staff, ['plate_number']), null);
  });
});
