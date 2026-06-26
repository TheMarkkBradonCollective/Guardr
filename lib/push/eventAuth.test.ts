import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { authorizePushEvent, isStaffSession } from './eventAuth.ts';
import type { VerifiedSession } from '../accountSessionAuth.ts';

const staffSession: VerifiedSession = {
  userId: 'staff-1',
  email: 'ops@guardr.co',
  role: 'administrator',
  platformRole: 'administrator',
};

const clientSession: VerifiedSession = {
  userId: 'client-1',
  email: 'client@example.com',
  role: 'client',
  platformRole: 'client',
};

const guardSession: VerifiedSession = {
  userId: 'guard-1',
  email: 'guard@example.com',
  role: 'guard',
  platformRole: 'guard',
};

const db = {
  from: () => ({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: null }),
      }),
    }),
  }),
} as never;

describe('authorizePushEvent', () => {
  it('allows clients to notify staff about their own pending approval', async () => {
    const err = await authorizePushEvent(db, clientSession, { type: 'client_pending_approval' });
    assert.equal(err, null);
  });

  it('allows guards to notify staff about their own pending approval', async () => {
    const err = await authorizePushEvent(db, guardSession, {
      type: 'guard_pending_approval',
      guardId: 'guard-1',
    });
    assert.equal(err, null);
  });

  it('allows guards to submit credential review notifications for themselves', async () => {
    const err = await authorizePushEvent(db, guardSession, {
      type: 'credential_pending',
      guardId: 'guard-1',
    });
    assert.equal(err, null);
  });

  it('allows clients to notify staff about submitted jobs', async () => {
    const err = await authorizePushEvent(db, clientSession, { type: 'job_submitted' });
    assert.equal(err, null);
  });

  it('still requires staff for staff_message', async () => {
    const err = await authorizePushEvent(db, clientSession, { type: 'staff_message' });
    assert.equal(err, 'Only staff can send this notification type');
  });

  it('allows guards to report guard_arrived for themselves', async () => {
    const err = await authorizePushEvent(db, guardSession, {
      type: 'guard_arrived',
      guardId: 'guard-1',
      requestId: 'req-1',
    });
    assert.equal(err, null);
  });

  it('allows guards to report guard_left_site for themselves', async () => {
    const err = await authorizePushEvent(db, guardSession, {
      type: 'guard_left_site',
      guardId: 'guard-1',
      requestId: 'req-1',
    });
    assert.equal(err, null);
  });

  it('blocks non-participants from reporting guard_arrived', async () => {
    const err = await authorizePushEvent(db, clientSession, {
      type: 'guard_arrived',
      guardId: 'other-guard',
    });
    assert.notEqual(err, null);
  });

  it('allows clients to send job_open_to_guards', async () => {
    const err = await authorizePushEvent(db, clientSession, {
      type: 'job_open_to_guards',
      requestId: 'req-1',
    });
    assert.equal(err, null);
  });

  it('blocks guards from sending job_open_to_guards', async () => {
    const err = await authorizePushEvent(db, guardSession, {
      type: 'job_open_to_guards',
    });
    assert.notEqual(err, null);
  });

  it('allows clients to send client_cash_payment_requested', async () => {
    const err = await authorizePushEvent(db, clientSession, {
      type: 'client_cash_payment_requested',
    });
    assert.equal(err, null);
  });

  it('allows guards to send guard_cash_payout_requested', async () => {
    const err = await authorizePushEvent(db, guardSession, {
      type: 'guard_cash_payout_requested',
    });
    assert.equal(err, null);
  });

  it('blocks clients from sending guard_cash_payout_requested', async () => {
    const err = await authorizePushEvent(db, clientSession, {
      type: 'guard_cash_payout_requested',
    });
    assert.notEqual(err, null);
  });

  it('allows guards to send payment_attention without requestId', async () => {
    const err = await authorizePushEvent(db, guardSession, {
      type: 'payment_attention',
    });
    assert.equal(err, null);
  });

  it('blocks unrelated clients from sending payment_attention without requestId', async () => {
    const err = await authorizePushEvent(db, clientSession, {
      type: 'payment_attention',
    });
    assert.notEqual(err, null);
  });

  it('allows staff to send account_update notifications', async () => {
    const err = await authorizePushEvent(db, staffSession, {
      type: 'account_update',
      recipientUserId: 'guard-1',
    });
    assert.equal(err, null);
  });

  it('blocks clients from sending account_update notifications', async () => {
    const err = await authorizePushEvent(db, clientSession, {
      type: 'account_update',
      recipientUserId: 'guard-1',
    });
    assert.notEqual(err, null);
  });

  it('allows staff to send payout_ready notifications', async () => {
    const err = await authorizePushEvent(db, staffSession, {
      type: 'payout_ready',
      guardId: 'guard-1',
    });
    assert.equal(err, null);
  });

  it('allows job participants to send job_status_update notifications', async () => {
    const participantDb = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { client_id: 'client-1', assigned_guard_id: 'guard-1' },
            }),
          }),
        }),
      }),
    } as never;

    const clientErr = await authorizePushEvent(participantDb, clientSession, {
      type: 'job_status_update',
      requestId: 'req-1',
    });
    assert.equal(clientErr, null);

    const guardErr = await authorizePushEvent(participantDb, guardSession, {
      type: 'job_status_update',
      requestId: 'req-1',
    });
    assert.equal(guardErr, null);
  });
});

describe('isStaffSession', () => {
  it('recognizes staff platform roles', () => {
    assert.equal(isStaffSession(staffSession), true);
    assert.equal(isStaffSession(clientSession), false);
  });
});
