/**
 * Field-test readiness fixes (2026-11-14):
 * - guards can (re)submit credentials for review,
 * - only the inbox owner writes user_notifications,
 * - clients cannot lengthen a paid shift without staff,
 * - inactive guards cannot take jobs,
 * - guards can tell a marketplace job is paid,
 * - staff password reset permissions,
 * - recipient inbox rows built on the server.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { RequestIdentity } from '../../lib/auth/requestIdentity.ts';
import { planQuery } from './dataPolicy.ts';
import { authorizeJobUpdate, guardMayTakeWork, guardPatchTakesWork, paidShiftLengthened } from './jobPolicy.ts';
import { scopeJobRows } from './rowRules.ts';
import { generateTemporaryPassword, passwordResetDenied } from './passwordReset.ts';
import { inboxRowsForPayloads } from '../../lib/push/inbox.ts';

const client: RequestIdentity = {
  profileId: 'client-1', profileKind: 'client', email: 'c@example.com', platformRole: 'client', sideRole: null, staffRole: null,
};
const guard: RequestIdentity = {
  profileId: 'guard-1', profileKind: 'guard', email: 'g@example.com', platformRole: 'guard', sideRole: null, staffRole: null,
};
const staff = (staffRole: string, id = `staff-${staffRole}`): RequestIdentity => ({
  profileId: id, profileKind: 'staff', email: `${id}@example.com`, platformRole: staffRole.toLowerCase() as never, sideRole: null, staffRole: staffRole as never,
});
const byId = (id: string) => [{ col: 'id', op: 'eq' as const, val: id }];

describe('credential resubmission', () => {
  it('lets a guard send their own ID back to pending, never to verified', () => {
    const p = planQuery(guard, 'guards', 'update', byId('guard-1'), { id_front_url: '/f', id_verification_status: 'pending' }, undefined);
    assert.deepEqual(p.ok && p.payload, { id_front_url: '/f', id_verification_status: 'pending' });
    const bad = planQuery(guard, 'guards', 'update', byId('guard-1'), { id_verification_status: 'verified', user_status: 'active' }, undefined);
    assert.equal(bad.ok && bad.noop, true);
  });

  it('lets a guard re-queue a rejected certificate or insurance as pending only', () => {
    const cert = planQuery(guard, 'certifications', 'update', byId('c1'), { image_url: '/x', status: 'pending' }, undefined);
    assert.deepEqual(cert.ok && cert.payload, { image_url: '/x', status: 'pending' });
    const certBad = planQuery(guard, 'certifications', 'update', byId('c1'), { image_url: '/x', status: 'verified' }, undefined);
    assert.deepEqual(certBad.ok && certBad.payload, { image_url: '/x' });
    const ins = planQuery(guard, 'guard_insurance_policies', 'update', [{ col: 'guard_id', op: 'eq', val: 'guard-1' }], { status: 'pending' }, undefined);
    assert.deepEqual(ins.ok && ins.payload, { status: 'pending' });
    const veh = planQuery(guard, 'guard_vehicle_profiles', 'upsert', [], { guard_id: 'guard-1', status: 'draft' }, 'guard_id');
    assert.deepEqual(veh.ok && veh.payload, { guard_id: 'guard-1', status: 'draft' });
  });

  it('clients still cannot touch review columns', () => {
    const p = planQuery(client, 'clients', 'update', byId('client-1'), { account_status: 'active', approved: true, name: 'n' }, undefined);
    assert.deepEqual(p.ok && p.payload, { name: 'n' });
  });
});

describe('user_notifications writes', () => {
  it('a guard cannot write into someone else’s inbox by naming themselves as guard_id', () => {
    const p = planQuery(guard, 'user_notifications', 'insert', [], { id: 'n1', user_id: 'client-9', guard_id: 'guard-1', type: 'x', title: 't', body: 'b' }, undefined);
    assert.equal(p.ok, false);
  });
  it('owners still write their own rows', () => {
    const p = planQuery(guard, 'user_notifications', 'insert', [], { id: 'n1', user_id: 'guard-1', type: 'x', title: 't', body: 'b' }, undefined);
    assert.equal(p.ok, true);
  });
});

describe('paid shift length', () => {
  const paid = { client_id: 'client-1', status: 'accepted', payment_status: 'paid', duration_hours: 4, start_date: '2026-12-05T16:00:00Z', end_date: '2026-12-05T20:00:00Z' };
  it('blocks a client lengthening a paid shift', () => {
    assert.ok(paidShiftLengthened(paid, { duration_hours: 10 }));
    assert.ok(paidShiftLengthened(paid, { end_date: '2026-12-06T02:00:00Z' }));
    const d = authorizeJobUpdate(client, paid, { duration_hours: 10, end_date: '2026-12-06T02:00:00Z' });
    assert.equal(d.ok, false);
  });
  it('allows moving or shortening a paid shift, and pending requests', () => {
    assert.equal(paidShiftLengthened(paid, { start_date: '2026-12-05T17:00:00Z', end_date: '2026-12-05T21:00:00Z' }), null);
    assert.equal(paidShiftLengthened(paid, { duration_hours: 3, end_date: '2026-12-05T19:00:00Z' }), null);
    const d = authorizeJobUpdate(client, paid, { pending_duration_hours: 6, schedule_change_status: 'pending_staff' });
    assert.equal(d.ok, true);
  });
  it('does not limit unpaid jobs', () => {
    assert.equal(paidShiftLengthened({ ...paid, payment_status: 'unpaid' }, { duration_hours: 10 }), null);
  });
});

describe('guards taking work', () => {
  const open = { status: 'open', applicants: ['guard-2'], assigned_guard_id: null };
  it('detects applying, holding, and accepting', () => {
    assert.equal(guardPatchTakesWork(open, { applicants: ['guard-2', 'guard-1'] }, 'guard-1'), true);
    assert.equal(guardPatchTakesWork(open, { pending_guard_id: 'guard-1' }, 'guard-1'), true);
    assert.equal(guardPatchTakesWork(open, { assigned_guard_id: 'guard-1' }, 'guard-1'), true);
  });
  it('withdrawing or negotiating on an existing application is not taking work', () => {
    const applied = { ...open, applicants: ['guard-1'] };
    assert.equal(guardPatchTakesWork(applied, { applicants: [] }, 'guard-1'), false);
    assert.equal(guardPatchTakesWork(applied, { applicants: ['guard-1'] }, 'guard-1'), false);
    assert.equal(guardPatchTakesWork({ ...open, assigned_guard_id: 'guard-1' }, { reports: [] }, 'guard-1'), false);
  });
  it('only active guards (or staff) may take work', () => {
    assert.equal(guardMayTakeWork({ user_status: 'active' }), true);
    assert.equal(guardMayTakeWork({ user_status: 'pending' }), false);
    assert.equal(guardMayTakeWork({ user_status: 'approved' }), false);
    assert.equal(guardMayTakeWork({ user_status: 'suspended' }), false);
    assert.equal(guardMayTakeWork({ user_status: 'blocked', is_staff: true }), true);
    assert.equal(guardMayTakeWork(null), false);
  });
});

describe('marketplace job view', () => {
  it('shows guards whether an open job is paid (the app hides unpaid marketplace jobs)', () => {
    const rows = scopeJobRows(guard, [{ id: 'j1', status: 'open', client_id: 'client-1', payment_status: 'paid', contact_phone: '555' }], { slotJobIds: new Set() }) as Record<string, unknown>[];
    assert.equal(rows[0].payment_status, 'paid');
    assert.equal('contact_phone' in rows[0], false);
  });
});

describe('staff password reset', () => {
  it('requires Administrator+ and never the Founder or a peer', () => {
    assert.ok(passwordResetDenied(null, { kind: 'guard', id: 'guard-1' }));
    assert.ok(passwordResetDenied(guard, { kind: 'guard', id: 'guard-2' }));
    assert.ok(passwordResetDenied(staff('Moderator'), { kind: 'guard', id: 'guard-1' }));
    assert.equal(passwordResetDenied(staff('Administrator'), { kind: 'guard', id: 'guard-1' }), null);
    assert.equal(passwordResetDenied(staff('Administrator'), { kind: 'client', id: 'client-1' }), null);
    assert.ok(passwordResetDenied(staff('Administrator'), { kind: 'staff', id: 's9', staffRole: 'Administrator' }));
    assert.equal(passwordResetDenied(staff('Director'), { kind: 'staff', id: 's9', staffRole: 'Manager' }), null);
    assert.ok(passwordResetDenied(staff('Founder'), { kind: 'staff', id: 's0', staffRole: 'Founder' }));
    const self = staff('Director', 'staff-me');
    assert.ok(passwordResetDenied(self, { kind: 'staff', id: 'staff-me', staffRole: 'Director' }));
  });
  it('temporary passwords are random, long enough, and not the public default', () => {
    const a = generateTemporaryPassword();
    const b = generateTemporaryPassword();
    assert.notEqual(a, b);
    assert.ok(a.length >= 20);
    assert.notEqual(a, '#Qwerty12345');
    assert.match(a, /^Guardr-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/);
  });
});

describe('server-side recipient inbox', () => {
  const now = new Date('2026-11-15T10:00:30Z');
  it('builds one row per targeted recipient, skipping the sender and role broadcasts', () => {
    const rows = inboxRowsForPayloads(
      [
        { userId: 'client-1', type: 'guard_en_route', title: 'Guard en route', body: 'On the way', requestId: 'j1' },
        { userId: 'client-1', type: 'guard_en_route', title: 'Guard en route', body: 'On the way', requestId: 'j1' },
        { userId: 'guard-1', type: 'guard_en_route', title: 'x', body: 'self', requestId: 'j1' },
        { role: 'admin', type: 'guard_en_route', title: 'x', body: 'staff' },
        { userId: 'client-2', type: 'guard_en_route', title: 'x', body: '   ' },
      ],
      { senderId: 'guard-1', now }
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0].user_id, 'client-1');
    assert.equal(rows[0].request_id, 'j1');
    assert.equal(rows[0].id, `evt-guard_en_route-j1-client-1-${Math.floor(now.getTime() / 60000)}`);
  });
});
