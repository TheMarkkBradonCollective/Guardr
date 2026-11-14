import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { RequestIdentity } from '../../lib/auth/requestIdentity.ts';
import { staffWriteDenial } from './staffRules.ts';
import { scopeProfileRows, scopeSharedRows } from './rowRules.ts';
import { authorizeJobUpdate, clientJobEstimatedPayout } from './jobPolicy.ts';
import { numericAsNumberTypes } from '../../lib/db/neonServerless.ts';
import { privateFileHeaders, safeStoredContentType } from '../routes/files.ts';
import { loginThrottled } from '../routes/auth.ts';

const staff = (staffRole: RequestIdentity['staffRole'], platformRole: RequestIdentity['platformRole'], sideRole: RequestIdentity['sideRole'] = null): RequestIdentity => ({
  profileId: `staff-${staffRole ?? sideRole}`, profileKind: 'staff', email: 's@example.com', platformRole, sideRole, staffRole,
});
const support = staff('Support', 'support');
const moderator = staff('Moderator', 'moderator');
const admin = staff('Administrator', 'administrator');
const manager = staff('Manager', 'manager');
const director = staff('Director', 'director');
const founder = staff('Founder', 'owner');
const financeDesk = staff(null, 'support', 'Finance');
const client: RequestIdentity = { profileId: 'client-1', profileKind: 'client', email: 'c@example.com', platformRole: 'client', sideRole: null, staffRole: null };
const guard: RequestIdentity = { profileId: 'guard-1', profileKind: 'guard', email: 'g@example.com', platformRole: 'guard', sideRole: null, staffRole: null };

const job = { id: 'job-1', status: 'pending', payment_status: 'unpaid', hourly_rate: 40 };

describe('staff tier write rules', () => {
  it('only Administrator+ changes a job status', () => {
    assert.ok(staffWriteDenial(support, 'security_requests', 'update', [{ status: 'open' }], [job]));
    assert.ok(staffWriteDenial(moderator, 'security_requests', 'update', [{ status: 'open' }], [job]));
    assert.equal(staffWriteDenial(admin, 'security_requests', 'update', [{ status: 'open' }], [job]), null);
  });

  it('re-sending an unchanged status is not a change', () => {
    assert.equal(staffWriteDenial(support, 'security_requests', 'update', [{ status: 'pending', notes: 'x' }], [job]), null);
  });

  it('only finance staff change payment fields or the payments ledger', () => {
    assert.ok(staffWriteDenial(admin, 'security_requests', 'update', [{ payment_status: 'paid' }], [job]));
    assert.equal(staffWriteDenial(manager, 'security_requests', 'update', [{ payment_status: 'paid' }], [job]), null);
    assert.equal(staffWriteDenial(financeDesk, 'security_requests', 'update', [{ payment_status: 'paid' }], [job]), null);
    assert.ok(staffWriteDenial(admin, 'payments', 'insert', [{ amount: 1 }], null));
    assert.equal(staffWriteDenial(financeDesk, 'payments', 'insert', [{ amount: 1 }], null), null);
    assert.ok(staffWriteDenial(support, 'security_requests', 'insert', [{ payment_status: 'paid' }], null));
    assert.equal(staffWriteDenial(support, 'security_requests', 'insert', [{ payment_status: 'unpaid' }], null), null);
  });

  it('finance desk cannot approve guards or change job status', () => {
    assert.ok(staffWriteDenial(financeDesk, 'security_requests', 'update', [{ status: 'open' }], [job]));
    assert.ok(staffWriteDenial(financeDesk, 'guards', 'update', [{ approved: true }], [{ id: 'g', approved: false }]));
  });

  it('Moderator+ approves guards; Support cannot', () => {
    const g = [{ id: 'g', user_status: 'pending' }];
    assert.ok(staffWriteDenial(support, 'guards', 'update', [{ user_status: 'active' }], g));
    assert.equal(staffWriteDenial(moderator, 'guards', 'update', [{ user_status: 'active' }], g), null);
  });

  it('only the Founder/Owner changes payment and fee settings', () => {
    const s = [{ id: 'default', payment_stripe_enabled: true, fee_config: { a: 1 } }];
    for (const who of [support, admin, manager, director]) {
      assert.ok(staffWriteDenial(who, 'platform_settings', 'update', [{ payment_stripe_enabled: false }], s));
    }
    assert.equal(staffWriteDenial(founder, 'platform_settings', 'update', [{ payment_stripe_enabled: false }], s), null);
    assert.equal(staffWriteDenial(director, 'platform_settings', 'update', [{ fee_config: { a: 1 } }], s), null);
  });

  it('deleting accounts or jobs needs Administrator+', () => {
    assert.ok(staffWriteDenial(support, 'clients', 'delete', [], null));
    assert.ok(staffWriteDenial(financeDesk, 'security_requests', 'delete', [], null));
    assert.equal(staffWriteDenial(admin, 'clients', 'delete', [], null), null);
  });

  it('Support edits only their own staff row', () => {
    assert.equal(staffWriteDenial(support, 'staff', 'update', [{ phone: '1' }], [{ id: support.profileId }]), null);
    assert.ok(staffWriteDenial(support, 'staff', 'update', [{ phone: '1' }], [{ id: 'staff-other' }]));
    assert.ok(staffWriteDenial(support, 'staff', 'insert', [{ email: 'x@example.com' }], null));
  });
});

describe('shared table scoping', () => {
  it('job chat and support messages only from your own threads/tickets', () => {
    const chat = [{ id: 1, thread_id: 't1' }, { id: 2, thread_id: 't2' }];
    assert.deepEqual(scopeSharedRows('job_chat_messages', guard, chat, { threadIds: new Set(['t1']) }), [chat[0]]);
    assert.deepEqual(scopeSharedRows('job_chat_messages', guard, chat, {}), []);
    const sup = [{ id: 1, ticket_id: 'k1' }, { id: 2, ticket_id: 'k2' }];
    assert.deepEqual(scopeSharedRows('support_messages', client, sup, { ticketIds: new Set(['k2']) }), [sup[1]]);
    assert.equal((scopeSharedRows('support_messages', support, sup) as unknown[]).length, 2);
  });

  it('guard and client messengers stay on their side', () => {
    assert.deepEqual(scopeSharedRows('guard_messages', client, [{ id: 1 }]), []);
    assert.deepEqual(scopeSharedRows('client_messages', guard, [{ id: 1 }]), []);
    assert.equal((scopeSharedRows('guard_messages', guard, [{ id: 1 }]) as unknown[]).length, 1);
  });

  it('hides location access notes and cert scans from non-owners', () => {
    const loc = [{ id: 'l', created_by_client_id: 'client-2', access_instructions: 'gate 1234', name: 'Site' }];
    const out = scopeSharedRows('job_locations', client, loc) as Record<string, unknown>[];
    assert.equal(out[0].access_instructions, null);
    assert.equal(out[0].name, 'Site');
    const own = scopeSharedRows('job_locations', { ...client, profileId: 'client-2' }, loc) as Record<string, unknown>[];
    assert.equal(own[0].access_instructions, 'gate 1234');
    const cert = [{ id: 'c', guard_id: 'guard-2', image_url: '/api/files/x', name: 'BSIS' }];
    assert.equal((scopeSharedRows('certifications', guard, cert) as Record<string, unknown>[])[0].image_url, null);
    assert.equal((scopeSharedRows('certifications', admin, cert) as Record<string, unknown>[])[0].image_url, '/api/files/x');
  });

  it('keeps hidden email/phone as empty strings so the app never crashes', () => {
    const rows = scopeProfileRows('guards', client, [{ id: 'guard-9', name: 'G', email: 'g9@example.com', phone: '555' }]) as Record<string, unknown>[];
    assert.equal(rows[0].email, '');
    assert.equal(rows[0].phone, '');
  });
});

describe('job money', () => {
  it('server computes the client price', () => {
    assert.equal(clientJobEstimatedPayout({ duration_hours: 4, hourly_rate: 40, guards_needed: 2 }), 320);
    assert.equal(clientJobEstimatedPayout({ duration_hours: '2.5', hourly_rate: '30.50' }), 76.25);
    assert.equal(clientJobEstimatedPayout({ duration_hours: 0, hourly_rate: 40 }), null);
  });

  it('a replacement offer cannot take over a completed job', () => {
    const done = { id: 'j', status: 'completed', assigned_guard_id: 'guard-2', replacement_request: { status: 'offered', offeredGuardIds: ['guard-1'] } };
    const r = authorizeJobUpdate(guard, done, { assigned_guard_id: 'guard-1' });
    assert.equal(r.ok, false);
  });

  it('NUMERIC values come back as numbers', () => {
    const parse = numericAsNumberTypes.getTypeParser(1700, 'text') as (v: string) => unknown;
    assert.equal(parse('160.00'), 160);
  });
});

describe('private file serving', () => {
  it('never serves uploaded HTML/SVG inline', () => {
    assert.equal(safeStoredContentType('text/html'), 'application/octet-stream');
    assert.equal(safeStoredContentType('image/svg+xml'), 'application/octet-stream');
    assert.equal(safeStoredContentType('image/PNG'), 'image/png');
    const h = privateFileHeaders('text/html', 'client/c1/1-evil.html');
    assert.equal(h.get('content-type'), 'application/octet-stream');
    assert.match(h.get('content-disposition') ?? '', /^attachment/);
    assert.match(h.get('content-security-policy') ?? '', /sandbox/);
    assert.equal(privateFileHeaders('image/jpeg', 'guard/g/1-id.jpg').get('content-disposition'), 'inline');
  });
});

describe('login throttle', () => {
  it('blocks after 10 tries a minute for one email', () => {
    const email = `throttle-${Date.now()}@example.com`;
    let blocked = false;
    for (let i = 0; i < 11; i++) blocked = loginThrottled(email, `10.0.0.${i}`);
    assert.equal(blocked, true);
  });
});
