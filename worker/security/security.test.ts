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

// ---- Retest gaps: job transitions, profile scoping, audit stamping, invoices ----
import { authorizeJobUpdate, clientInitialJobStatus, serverOvertime, guardNegotiationOk } from './jobPolicy.ts';
import { scopeJobRows, approximateArea, invoicedJobIds } from './rowRules.ts';
import { buildServerInvoice, scopeProfileRows, stampAuditRows, needsSelfOnlyFilter } from './rowRules.ts';

const asClient = { profileId: 'c1', profileKind: 'client', email: 'c@x.co', platformRole: 'client', sideRole: null, staffRole: null } as const;
const asGuard = { profileId: 'g1', profileKind: 'guard', email: 'g@x.co', platformRole: 'guard', sideRole: null, staffRole: null } as const;

it('client cannot push its own job past staff review', () => {
  const old = { id: 'j', client_id: 'c1', status: 'pending-review' };
  assert.equal(authorizeJobUpdate(asClient as never, old, { status: 'open' }).ok, false);
  assert.equal(authorizeJobUpdate(asClient as never, old, { status: 'completed' }).ok, false);
  assert.equal(authorizeJobUpdate(asClient as never, old, { status: 'closed' }).ok, true);
  assert.equal(authorizeJobUpdate(asClient as never, { ...old, client_id: 'c2' }, { title: 'x' }).ok, false);
});

it('client may accept an applicant but not an arbitrary guard', () => {
  const old = { id: 'j', client_id: 'c1', status: 'open', applicants: ['g1'] };
  assert.equal(authorizeJobUpdate(asClient as never, old, { status: 'accepted', assigned_guard_id: 'g1' }).ok, true);
  assert.equal(authorizeJobUpdate(asClient as never, old, { status: 'accepted', assigned_guard_id: 'g9' }).ok, false);
});

it('guard cannot edit an open job it does not own', () => {
  const old = { id: 'j', client_id: 'c1', status: 'open', applicants: [] };
  assert.equal(authorizeJobUpdate(asGuard as never, old, { hourly_rate: 999 }).ok, false);
  assert.equal(authorizeJobUpdate(asGuard as never, old, { title: 'pwn' }).ok, false);
  assert.equal(authorizeJobUpdate(asGuard as never, old, { assigned_guard_id: 'g1', status: 'accepted' }).ok, false);
  const apply = authorizeJobUpdate(asGuard as never, old, { applicants: ['g1'], hourly_rate: 999 });
  assert.ok(apply.ok && !('hourly_rate' in apply.patch) && 'applicants' in apply.patch);
  assert.equal(authorizeJobUpdate(asGuard as never, { ...old, applicants: ['g2'] }, { applicants: [] }).ok, false);
});

it('assigned guard moves only along accepted -> in-progress -> completed', () => {
  const old = { id: 'j', client_id: 'c1', status: 'accepted', assigned_guard_id: 'g1' };
  assert.equal(authorizeJobUpdate(asGuard as never, old, { status: 'in-progress' }).ok, true);
  assert.equal(authorizeJobUpdate(asGuard as never, old, { status: 'completed' }).ok, false);
  const r = authorizeJobUpdate(asGuard as never, old, { arrived_at: 'now', hourly_rate: 1 });
  assert.ok(r.ok && !('hourly_rate' in r.patch));
});

it('new client jobs start in staff review unless auto-publish applies', () => {
  assert.equal(clientInitialJobStatus('open', { trustedClient: false, reviewMode: null, trustedAutoPublish: null }), 'pending-review');
  assert.equal(clientInitialJobStatus('open', { trustedClient: true, reviewMode: 'trusted-auto', trustedAutoPublish: true }), 'open');
  assert.equal(clientInitialJobStatus('completed', { trustedClient: true, reviewMode: 'none', trustedAutoPublish: true }), 'pending-review');
});

it('other people see only public profile columns', () => {
  const rows = [
    { id: 'g1', email: 'me@x', phone: '1' },
    { id: 'g2', name: 'B', email: 'b@x', phone: '2', id_number: 'D123', id_front_url: 'u', stripe_connect_account_id: 'acct' },
  ];
  const out = scopeProfileRows('guards', asGuard as never, rows) as Record<string, unknown>[];
  assert.equal(out[0].email, 'me@x');
  assert.deepEqual(out[1], { id: 'g2', name: 'B' });
  const staffOut = scopeProfileRows('staff', asClient as never, [{ id: 's', name: 'Fred Founder', first_name: 'Fred', email: 'f@x', id_number: '1', staff_role: 'Founder', badge_number: 'B1', user_status: 'active' }]);
  assert.deepEqual(staffOut, [{ id: 's', first_name: 'Fred', name: 'Fred' }]);
  assert.equal(needsSelfOnlyFilter('guards', asClient as never, ['email']), true);
  assert.equal(needsSelfOnlyFilter('guards', asClient as never, ['id']), false);
});

it('audit rows carry the real actor', () => {
  const [row] = stampAuditRows(asGuard as never, [{ action: 'x', actor_email: 'founder@x', actor_role: 'Founder', actor_id: 'f' }]);
  assert.equal(row.actor_id, 'g1');
  assert.equal(row.actor_email, 'g@x.co');
  assert.equal(row.actor_role, 'guard');
});

it('payout invoice total comes from stored jobs', () => {
  const job = {
    id: 'j1', title: 'T', client_name: 'C', assigned_guard_id: 'g1', status: 'completed', payment_status: 'paid',
    guard_payout_method: null, guard_payout_available: true, duration_hours: '4', hourly_rate: 30, start_date: null, end_date: null,
  };
  const r = buildServerInvoice(asGuard as never, { job_ids: ['j1'], total: 99999 }, [job]);
  assert.ok(r.ok);
  if (r.ok) {
    assert.notEqual(r.row.total, 99999);
    assert.equal(r.row.status, 'open');
    assert.ok(Number(r.row.total) > 0 && Number(r.row.total) <= 120);
  }
  assert.equal(buildServerInvoice(asGuard as never, { job_ids: ['j1'] }, [{ ...job, assigned_guard_id: 'g2' }]).ok, false);
  assert.equal(buildServerInvoice(asGuard as never, { job_ids: ['j1'] }, [{ ...job, guard_payout_available: false }]).ok, false);
});


// ---- Round 3 ----
it('overtime is computed from the stored job, not the guard', () => {
  const now = Date.parse('2026-12-01T14:00:00Z');
  const old = { duration_hours: 4, hourly_rate: 30, guards_needed: 1, estimated_payout: 120, check_in_audit: { checkedAt: '2026-12-01T08:00:00Z' }, overtime_status: 'none' };
  const ot = serverOvertime(old, { checkedAt: '2026-12-01T13:30:00Z', overtimeClaimed: true }, now)!;
  assert.equal(ot.overtime_hours, 1.5);
  assert.equal(ot.overtime_amount, 45);
  const capped = serverOvertime(old, { checkedAt: '2027-12-01T00:00:00Z', overtimeClaimed: true }, now)!;
  assert.equal(capped.overtime_hours, 2); // check-out clamped to now
  const r = authorizeJobUpdate(asGuard as never, { ...old, id: 'j', status: 'accepted', assigned_guard_id: 'g1' }, { overtime_amount: 99999, overtime_hours: 500, scheduled_estimated_payout: 1 });
  assert.equal(r.ok, false);
});

it('guards edit only their own negotiation entry', () => {
  const old = [{ guardId: 'g2', offers: [1] }];
  assert.equal(guardNegotiationOk(old, [{ guardId: 'g2', offers: [1] }, { guardId: 'g1', offers: [] }], 'g1'), true);
  assert.equal(guardNegotiationOk(old, [{ guardId: 'g1', offers: [] }], 'g1'), false);
  assert.equal(guardNegotiationOk(old, [{ guardId: 'g2', offers: [9] }], 'g1'), false);
});

it('client cancels only unpaid active jobs', () => {
  assert.equal(authorizeJobUpdate(asClient as never, { client_id: 'c1', status: 'completed' }, { status: 'closed' }).ok, false);
  assert.equal(authorizeJobUpdate(asClient as never, { client_id: 'c1', status: 'open', payment_status: 'paid' }, { status: 'closed' }).ok, false);
  assert.equal(authorizeJobUpdate(asClient as never, { client_id: 'c1', status: 'in-progress', payment_status: 'unpaid' }, { status: 'closed' }).ok, true);
});

it('job rows are scoped for non-participants', () => {
  const rows = [
    { id: 'a', status: 'open', client_id: 'c9', address: '123 Main St, Sacramento, CA 95814', contact_phone: '555', site_instructions: 'x', stripe_payment_intent_id: 'pi', latitude: 38.581234, applicants: ['g1', 'g7'], price_negotiations: [{ guardId: 'g7' }] },
    { id: 'b', status: 'accepted', client_id: 'c9', assigned_guard_id: 'g7', address: 'x' },
    { id: 'c', status: 'accepted', client_id: 'c9', assigned_guard_id: 'g1', address: 'full', contact_phone: '1' },
    { id: 'd', status: 'in-progress', client_id: 'c9', address: 'team', contact_phone: '2' },
  ];
  const out = scopeJobRows(asGuard as never, rows, { slotJobIds: new Set(['d']) }) as Record<string, unknown>[];
  assert.deepEqual(out.map((r) => r.id), ['a', 'c', 'd']);
  assert.equal(out[0].address, 'Sacramento, CA');
  assert.equal(out[0].contact_phone, undefined);
  assert.equal(out[0].stripe_payment_intent_id, undefined);
  assert.equal(out[0].latitude, 38.58);
  assert.deepEqual(out[0].applicants, ['g1']);
  assert.deepEqual(out[0].price_negotiations, []);
  assert.equal(out[1].contact_phone, '1');
  assert.equal(out[2].contact_phone, '2');
  assert.equal(approximateArea('Acme HQ — 9 Elm Rd, Elk Grove, CA 95624, USA'), 'Elk Grove, CA');
});

it('one active invoice per job', () => {
  const ids = invoicedJobIds([{ job_ids: ['j1'], status: 'open' }, { job_ids: '["j2"]', status: 'completed' }, { job_ids: ['j3'], status: 'cancelled' }]);
  assert.ok(ids.has('j1') && ids.has('j2') && !ids.has('j3'));
});
