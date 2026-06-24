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
});

describe('isStaffSession', () => {
  it('recognizes staff platform roles', () => {
    assert.equal(isStaffSession(staffSession), true);
    assert.equal(isStaffSession(clientSession), false);
  });
});
