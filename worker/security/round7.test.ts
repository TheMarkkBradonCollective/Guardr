/**
 * Field-test round 7 (2026-11-14): server sign-out, forgot password, credential re-review,
 * team-slot guard status, unhandled save errors, map start point, availability defaults/sync,
 * and version consistency.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { isMissingTableError, isTokenRevoked, revokeToken, tokenHash } from '../../lib/auth/tokenRevocation.ts';
import { FORGOT_EMAIL_LIMIT, forgotPasswordThrottledShared } from '../../lib/auth/loginRateLimit.ts';
import { buildPasswordResetTicket, FORGOT_PASSWORD_RESPONSE } from './forgotPassword.ts';
import { editsVerifiedCredential, withRereview } from './credentialRereview.ts';
import { slotWriteGuardIds } from './jobPolicy.ts';
import { trackUnhandledWriteError } from '../../src/lib/api/guardrClient.ts';
import { resolveInitialMapView, SACRAMENTO_CENTER } from '../../src/lib/mapInitialCenter.ts';
import {
  dateOverrideToRow,
  persistGuardAvailability,
  weeklySlotFromRow,
  weeklySlotToRow,
} from '../../src/lib/guardAvailabilitySync.ts';
import { defaultAvailabilitySlots } from '../../src/lib/guardAvailability.ts';
import { APK_VERSION_CODE, APP_VERSION } from '../../lib/appVersion.generated.ts';
import type { SqlDatabase } from '../../lib/db/sqlDatabase.ts';

function fakeDb(handler: (sql: string, params: unknown[]) => { data: Record<string, unknown>[] | null; error: { message: string } | null }) {
  const calls: Array<{ sql: string; params: unknown[] }> = [];
  const db = {
    async query(sql: string, params: unknown[] = []) {
      calls.push({ sql, params });
      return handler(sql, params);
    },
  } as unknown as SqlDatabase;
  return { db, calls };
}

describe('server-side sign-out', () => {
  it('stores only a SHA-256 of the token, with its expiry', async () => {
    const { db, calls } = fakeDb(() => ({ data: [], error: null }));
    const ok = await revokeToken(db, 'header.payload.sig', { profileId: 'guard-1', exp: 2000000000 });
    assert.equal(ok, true);
    const insert = calls.find((c) => /INSERT INTO revoked_auth_tokens/.test(c.sql))!;
    assert.equal(insert.params[0], await tokenHash('header.payload.sig'));
    assert.notEqual(insert.params[0], 'header.payload.sig');
    assert.deepEqual(insert.params.slice(1), ['guard-1', 2000000000]);
  });

  it('refuses a revoked token and accepts an unknown one', async () => {
    const revokedHash = await tokenHash('bad');
    const { db } = fakeDb((_sql, params) => ({ data: params[0] === revokedHash ? [{ revoked: 1 }] : [], error: null }));
    assert.equal(await isTokenRevoked(db, 'bad'), true);
    assert.equal(await isTokenRevoked(db, 'good'), false);
  });

  it('fails open only while the table does not exist yet, and closed on other errors', async () => {
    const missing = fakeDb(() => ({ data: null, error: { message: 'relation "revoked_auth_tokens" does not exist' } }));
    assert.equal(await isTokenRevoked(missing.db, 't'), false);
    const broken = fakeDb(() => ({ data: null, error: { message: 'connection reset' } }));
    assert.equal(await isTokenRevoked(broken.db, 't'), true);
    assert.equal(isMissingTableError('column "x" does not exist'), false);
  });

  it('does not revoke without an expiry', async () => {
    const { db, calls } = fakeDb(() => ({ data: [], error: null }));
    assert.equal(await revokeToken(db, 't', { profileId: 'x' }), false);
    assert.equal(calls.length, 0);
  });
});

describe('forgot password', () => {
  it('gives one generic answer and files a high-priority Account ticket', () => {
    assert.match(FORGOT_PASSWORD_RESPONSE, /^If an account exists/);
    const { ticket, message } = buildPasswordResetTicket({
      profileId: 'guard-1', kind: 'guard', name: 'Pat', email: 'pat@x.test', ticketId: 't1', messageId: 'm1', now: '2026-11-15T00:00:00Z',
    });
    assert.equal(ticket.subject, 'Password reset request');
    assert.equal(ticket.category, 'account');
    assert.equal(ticket.priority, 'high');
    assert.equal(ticket.status, 'open');
    assert.equal(ticket.kind, 'chat');
    assert.equal(ticket.user_role, 'guard');
    assert.equal(message.ticket_id, 't1');
    assert.match(message.body, /Verify this person/);
  });

  it('is rate limited per email', async () => {
    const counts = new Map<string, number>();
    const { db } = fakeDb((_sql, params) => {
      const rows = [params[0], params[1]].map((key) => {
        const n = (counts.get(String(key)) ?? 0) + 1;
        counts.set(String(key), n);
        return { key, count: n };
      });
      return { data: rows, error: null };
    });
    const results: boolean[] = [];
    for (let i = 0; i < FORGOT_EMAIL_LIMIT + 1; i++) results.push(await forgotPasswordThrottledShared(db, 'a@b.test', '1.1.1.1', 0));
    assert.deepEqual(results, [...Array(FORGOT_EMAIL_LIMIT).fill(false), true]);
  });
});

describe('verified credentials go back to review when a guard edits them', () => {
  const verifiedCert = { id: 'c1', guard_id: 'g1', status: 'verified', number: 'G123', expiry_date: '2028-01-01T00:00:00.000Z', image_url: 'data:a' };
  it('sends a changed document back to pending', () => {
    assert.equal(editsVerifiedCredential('certifications', { number: 'G999' }, verifiedCert), true);
    assert.deepEqual(withRereview('certifications', { image_url: 'data:b' }, [verifiedCert]), { image_url: 'data:b', status: 'pending' });
  });
  it('ignores unchanged values (dates compared by day) and non-document fields', () => {
    assert.deepEqual(withRereview('certifications', { expiry_date: '2028-01-01' }, [verifiedCert]), { expiry_date: '2028-01-01' });
    assert.deepEqual(withRereview('certifications', { pending_update: null }, [verifiedCert]), { pending_update: null });
  });
  it('leaves pending or rejected credentials alone', () => {
    assert.deepEqual(withRereview('certifications', { number: 'X' }, [{ ...verifiedCert, status: 'pending' }]), { number: 'X' });
  });
  it('covers government ID fields on the guard row', () => {
    const guard = { id: 'g1', id_verification_status: 'verified', id_number: 'D1' };
    assert.deepEqual(withRereview('guards', { id_number: 'D2' }, [guard]), { id_number: 'D2', id_verification_status: 'pending' });
    assert.deepEqual(withRereview('guards', { bio: 'hi' }, [guard]), { bio: 'hi' });
  });
  it('covers insurance and vehicles', () => {
    assert.equal(editsVerifiedCredential('guard_insurance_policies', { document_url: 'new' }, { status: 'verified', document_url: 'old' }), true);
    assert.equal(editsVerifiedCredential('guard_vehicle_profiles', { plate_number: '8ABC123' }, { status: 'verified', plate_number: '7XYZ999' }), true);
    assert.equal(editsVerifiedCredential('guard_vehicle_insurance_policies', { carrier: 'B' }, { status: 'verified', carrier: 'A' }), true);
  });
});

describe('team slots check guard status', () => {
  it('checks the caller and anyone placed in a slot', () => {
    assert.deepEqual(slotWriteGuardIds('insert', [{ guard_id: 'g2', status: 'invited', invited_by_guard_id: 'g1' }], 'g1').sort(), ['g1', 'g2']);
    assert.deepEqual(slotWriteGuardIds('update', [{ status: 'pending_staff' }], 'g1'), ['g1']);
  });
  it('never blocks declining or withdrawing', () => {
    assert.deepEqual(slotWriteGuardIds('update', [{ status: 'declined' }], 'g1'), []);
    assert.deepEqual(slotWriteGuardIds('update', [{ status: 'withdrawn' }], 'g1'), []);
    assert.deepEqual(slotWriteGuardIds('delete', [], 'g1'), []);
  });
  it('does not treat a client caller as a guard', () => {
    assert.deepEqual(slotWriteGuardIds('update', [{ status: 'approved' }], null), []);
  });
});

describe('saves that ignore errors are surfaced', () => {
  const failed = () => ({ data: null, error: { message: 'Not allowed' } });
  it('announces a failed write nobody looked at', () => {
    const seen: string[] = [];
    let run: (() => void) | null = null;
    trackUnhandledWriteError('security_requests', 'update', failed(), (d) => seen.push(d.message), (fn) => { run = fn; });
    run!();
    assert.deepEqual(seen, ['Not allowed']);
  });
  it('stays quiet when the caller reads error (destructuring counts)', () => {
    const seen: string[] = [];
    let run: (() => void) | null = null;
    const { error } = trackUnhandledWriteError('t', 'insert', failed(), (d) => seen.push(d.message), (fn) => { run = fn; });
    assert.equal(error?.message, 'Not allowed');
    run!();
    assert.deepEqual(seen, []);
  });
  it('does nothing for successful writes', () => {
    let scheduled = false;
    const ok = { data: [], error: null };
    assert.equal(trackUnhandledWriteError('t', 'insert', ok, () => undefined, () => { scheduled = true; }), ok);
    assert.equal(scheduled, false);
  });
});

describe('map start point', () => {
  it('falls back to Sacramento, not Los Angeles', () => {
    const view = resolveInitialMapView({});
    assert.equal(view.source, 'default');
    assert.deepEqual([view.lat, view.lng], [SACRAMENTO_CENTER.lat, SACRAMENTO_CENTER.lng]);
    assert.ok(view.lat > 38 && view.lng < -121);
  });
  it('guards start at their last known location before a saved view', () => {
    const view = resolveInitialMapView({ lastKnown: { lat: 38.6, lng: -121.3 }, savedViewport: { lat: 34, lng: -118, zoom: 10 }, preferLastKnown: true });
    assert.equal(view.source, 'last-known');
    assert.equal(view.lat, 38.6);
  });
  it('uses the saved view, then last known, and ignores junk', () => {
    assert.equal(resolveInitialMapView({ savedViewport: { lat: 37, lng: -122, zoom: 11 } }).source, 'saved-view');
    assert.equal(resolveInitialMapView({ lastKnown: { lat: 37, lng: -122 } }).source, 'last-known');
    assert.equal(resolveInitialMapView({ lastKnown: { lat: 0, lng: 0 }, savedViewport: { lat: Number.NaN, lng: 1, zoom: 3 } }).source, 'default');
  });
});

describe('availability is saved to the server', () => {
  it('maps slots to deterministic rows and back', () => {
    const slot = defaultAvailabilitySlots('g1')[0];
    const row = weeklySlotToRow('g1', slot);
    assert.equal(row.id, 'avail-g1-0-0000');
    assert.deepEqual(weeklySlotFromRow({ ...row, start_time: '00:00:00', end_time: '23:59:00' }), { ...slot, id: row.id, notes: undefined });
    assert.equal(dateOverrideToRow('g1', { id: 'x', guardId: 'g1', date: '2026-11-20', startTime: '00:00', endTime: '23:59', isAvailable: false }).is_available, false);
  });
  it('replaces the guard’s rows and reports server errors', async () => {
    const ops: string[] = [];
    const db = {
      from(table: string) {
        return {
          select: () => ({ eq: async () => ({ data: [], error: null }) }),
          insert: async (rows: unknown) => { ops.push(`insert ${table} ${(rows as unknown[]).length}`); return { data: rows, error: null as { message: string } | null }; },
          delete: () => ({ eq: async (_c: string, v: unknown) => { ops.push(`delete ${table} ${v}`); return { data: [], error: null }; } }),
        };
      },
    };
    await persistGuardAvailability(db, 'g1', { weeklySlots: defaultAvailabilitySlots('g1'), dateOverrides: [] });
    assert.deepEqual(ops, ['delete guard_availability g1', 'insert guard_availability 7', 'delete guard_availability_date_overrides g1']);
    const failing = { ...db, from: (t: string) => ({ ...db.from(t), insert: async () => ({ data: null, error: { message: 'Not allowed' } }) }) };
    await assert.rejects(persistGuardAvailability(failing, 'g1', { weeklySlots: defaultAvailabilitySlots('g1'), dateOverrides: [] }), /Not allowed/);
  });
});

describe('version consistency', () => {
  const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
  it('package.json, version.json files, Android build, and /api/health agree', () => {
    const pkg = JSON.parse(read('package.json'));
    const download = JSON.parse(read('public/download/version.json'));
    const catalog = JSON.parse(read('public/version.json'));
    const gradle = read('android/app/build.gradle');
    assert.equal(APP_VERSION, pkg.version);
    assert.equal(download.webVersion, APP_VERSION);
    assert.equal(download.apkVersion, APP_VERSION);
    assert.equal(download.apkVersionCode, APK_VERSION_CODE);
    assert.equal(catalog.webVersion, APP_VERSION);
    assert.equal(catalog.apk.version, APP_VERSION);
    assert.equal(catalog.apk.versionCode, APK_VERSION_CODE);
    assert.match(gradle, new RegExp(`def guardrVersionName = "${APP_VERSION.replace(/\./g, '\\.')}"`));
    assert.match(gradle, new RegExp(`def guardrVersionCode = ${APK_VERSION_CODE}\\b`));
    assert.match(read('lib/http/routes/health.ts'), /version: APP_VERSION/);
  });
  it('matches the APK published at the R2 download link (1.1.1 / 1101)', () => {
    assert.equal(APP_VERSION, '1.1.1');
    assert.equal(APK_VERSION_CODE, 1101);
  });
});

describe('guards may replace their own availability rows', async () => {
  const { planQuery } = await import('./dataPolicy.ts');
  const guard = { profileId: 'g1', profileKind: 'guard', email: 'g@x.test', platformRole: 'guard', sideRole: null, staffRole: null } as never;
  it('allows delete by own guard_id and insert of own rows, not others', () => {
    const del = planQuery(guard, 'guard_availability', 'delete', [{ col: 'guard_id', op: 'eq', val: 'g1' }], undefined, undefined);
    assert.equal(del.ok, true);
    const ins = planQuery(guard, 'guard_availability', 'insert', [], [{ id: 'avail-g1-0-0000', guard_id: 'g1', day_of_week: 0, start_time: '00:00', end_time: '23:59', is_available: true }], undefined);
    assert.equal(ins.ok, true);
    const foreign = planQuery(guard, 'guard_availability_date_overrides', 'insert', [], [{ id: 'x', guard_id: 'g2', date: '2026-11-20' }], undefined);
    assert.equal(foreign.ok, false);
  });
});
