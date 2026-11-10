import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { planQuery, redactRows } from './dataPolicy.ts';
import { buildSignupProfileRow } from './signupProfile.ts';
import { selectList, createSqlDatabase } from '../../lib/db/sqlDatabase.ts';
import { encodeColumnValue } from '../../lib/db/jsonbColumns.ts';
import { bindSessionCredentials } from '../../lib/worker/vercelAdapter.ts';
import { runWithRequestIdentity, type RequestIdentity } from '../../lib/auth/requestIdentity.ts';
import { verifyAccountSession } from '../../lib/accountSessionAuth.ts';

const client: RequestIdentity = {
  profileId: 'client-1', profileKind: 'client', email: 'c@example.com',
  platformRole: 'client', sideRole: null, staffRole: null,
};
const guard: RequestIdentity = {
  profileId: 'guard-1', profileKind: 'guard', email: 'g@example.com',
  platformRole: 'guard', sideRole: null, staffRole: null,
};
const support: RequestIdentity = {
  profileId: 'staff-2', profileKind: 'staff', email: 's@example.com',
  platformRole: 'support', sideRole: null, staffRole: 'Support',
};
const director: RequestIdentity = { ...support, profileId: 'staff-3', platformRole: 'director', staffRole: 'Director' };
const founder: RequestIdentity = { ...support, profileId: 'staff-1', platformRole: 'owner', staffRole: 'Founder' };

describe('data query policy', () => {
  it('rejects anonymous callers', () => {
    const p = planQuery(null, 'guards', 'select', [], undefined, undefined);
    assert.equal(p.ok, false);
    assert.equal(p.ok === false && p.status, 401);
  });

  it('refuses unfiltered update and delete, even for staff', () => {
    assert.equal(planQuery(founder, 'guards', 'update', [], { name: 'x' }, undefined).ok, false);
    assert.equal(planQuery(founder, 'guards', 'delete', [], undefined, undefined).ok, false);
  });

  it('scopes a client update to their own rows', () => {
    const p = planQuery(client, 'clients', 'update', [{ col: 'id', op: 'eq', val: 'client-2' }], { name: 'x' }, undefined);
    assert.equal(p.ok, true);
    assert.equal(p.ok && p.ownerOr, 'id.eq.client-1');
  });

  it('never writes password columns and strips approval/money columns from non-staff', () => {
    const payload = { name: 'x', password: 'p', password_hash: 'h', approved: true, account_status: 'active' };
    const p = planQuery(client, 'clients', 'update', [{ col: 'id', op: 'eq', val: 'client-1' }], payload, undefined);
    assert.equal(p.ok, true);
    assert.deepEqual(p.ok && p.payload, { name: 'x' });
    const job = { payment_status: 'paid', status: 'completed' };
    const j = planQuery(client, 'security_requests', 'update', [{ col: 'id', op: 'eq', val: 'job-1' }], job, undefined);
    assert.deepEqual(j.ok && j.payload, { status: 'completed' });
  });

  it('blocks reading or writing staff-only tables as a client or guard', () => {
    const pay = planQuery(client, 'payments', 'select', [], undefined, undefined);
    assert.equal(pay.ok && pay.noop, true);
    assert.equal(planQuery(guard, 'staff', 'insert', [], { id: 'x', staff_role: 'Director' }, undefined).ok, false);
    const comp = planQuery(guard, 'staff_compensation_payouts', 'select', [], undefined, undefined);
    assert.equal(comp.ok && comp.noop, true);
  });

  it('forces ownership on inserts', () => {
    const p = planQuery(guard, 'experience', 'insert', [], { id: 'e1', title: 't' }, undefined);
    assert.deepEqual(p.ok && p.payload, { id: 'e1', title: 't', guard_id: 'guard-1' });
    const bad = planQuery(guard, 'experience', 'insert', [], { id: 'e1', guard_id: 'guard-9' }, undefined);
    assert.equal(bad.ok, false);
  });

  it('checks upsert targets for ownership', () => {
    const p = planQuery(guard, 'job_guard_slots', 'upsert', [], { id: 's1', guard_id: 'guard-1' }, undefined);
    assert.deepEqual(p.ok && p.upsertCheck, { col: 'id', vals: ['s1'] });
  });

  it('only Director+ can change staff roles and only the Founder grants Founder/Owner', () => {
    const f = [{ col: 'id', op: 'eq' as const, val: 'staff-9' }];
    assert.equal(planQuery(support, 'staff', 'update', f, { staff_role: 'Director' }, undefined).ok, false);
    assert.equal(planQuery(director, 'staff', 'update', f, { staff_role: 'Manager' }, undefined).ok, true);
    assert.equal(planQuery(director, 'staff', 'update', f, { staff_role: 'Owner' }, undefined).ok, false);
    assert.equal(planQuery(founder, 'staff', 'update', f, { staff_role: 'Owner' }, undefined).ok, true);
  });

  it('redacts secrets from results', () => {
    assert.deepEqual(redactRows([{ id: 1, password_hash: 'x', password: 'y' }]), [{ id: 1 }]);
  });
});

describe('SQL builder', () => {
  it('rejects injected column lists', () => {
    assert.throws(() => selectList('id, (select password_hash from users) as x'));
    assert.throws(() => selectList('id; drop table users'));
    assert.equal(selectList('id, email'), '"id", "email"');
    assert.equal(selectList('*'), '*');
  });

  it('returns an error instead of running injected SQL', async () => {
    const seen: string[] = [];
    const db = createSqlDatabase(async (sql) => {
      seen.push(sql);
      return { rows: [], rowCount: 0 };
    });
    const r = await db.from('guards').select('id, pg_sleep(5)');
    assert.ok(r.error);
    assert.equal(seen.length, 0);
  });

  it('encodes arrays for jsonb columns as JSON text', async () => {
    assert.equal(encodeColumnValue('guards', 'service_areas', []), '[]');
    assert.equal(encodeColumnValue('guards', 'service_areas', ['Sacramento']), '["Sacramento"]');
    assert.deepEqual(encodeColumnValue('guards', 'name', ['a']), ['a']);
    const params: unknown[][] = [];
    const db = createSqlDatabase(async (_sql, p = []) => {
      params.push(p);
      return { rows: [], rowCount: 0 };
    });
    await db.from('guards').update({ skills: [] }).eq('id', 'g1');
    assert.equal(params[0][0], '[]');
  });
});

describe('session credentials', () => {
  it('replaces client-sent userId/email/role with the verified identity', () => {
    const body: Record<string, unknown> = { userId: 'staff-1', email: 'founder@x', role: 'owner', message: 'hi' };
    bindSessionCredentials(body, guard);
    assert.deepEqual(body, { userId: 'guard-1', email: 'g@example.com', role: 'guard', message: 'hi' });
    const anon: Record<string, unknown> = { userId: 'staff-1', email: 'founder@x', role: 'owner' };
    bindSessionCredentials(anon, null);
    assert.deepEqual(anon, {});
  });

  it('verifyAccountSession ignores claimed credentials without a verified token', async () => {
    const db = {} as never;
    assert.equal(await verifyAccountSession(db, { userId: 'staff-1', email: 'f@x', role: 'owner' }), null);
    const s = await runWithRequestIdentity(guard, () =>
      verifyAccountSession(db, { userId: 'guard-1', email: 'g@example.com', role: 'owner' })
    );
    assert.equal(s?.platformRole, 'guard');
    const spoof = await runWithRequestIdentity(guard, () =>
      verifyAccountSession(db, { userId: 'staff-1', email: 'founder@x', role: 'owner' })
    );
    assert.equal(spoof, null);
  });
});

describe('sign-up profile', () => {
  it('never lets a new account choose staff role, approval or ids', () => {
    const row = buildSignupProfileRow('guard', {
      id: 'x', name: 'N', is_staff: true, staff_role: 'Director', verified: true, password: 'p',
      'bad col': 1,
    });
    assert.equal(row.is_staff, false);
    assert.equal(row.staff_role, null);
    assert.equal(row.verified, false);
    assert.equal(row.user_status, 'pending');
    assert.equal('id' in row, false);
    assert.equal('password' in row, false);
    assert.equal('bad col' in row, false);
    const c = buildSignupProfileRow('client', { approved: true, account_status: 'active' });
    assert.equal(c.approved, false);
    assert.equal(c.account_status, 'pending');
  });
});
