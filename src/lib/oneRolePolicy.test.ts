import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ONE_ROLE_POLICY_REASON,
  blockOneRoleCase,
  buildOneRoleCase,
  canReviewOneRoleHolds,
  collectRoleAccounts,
  conflictingAccountsFor,
  describeOneRolePair,
  groupAccountsByIdentity,
  ignoreOneRoleCase,
  kindFromSessionRole,
  normalizePhone,
  openHoldForAccount,
  withDeviceConflict,
} from './oneRolePolicy.ts';

const guard = {
  kind: 'guard' as const,
  id: 'g1',
  name: 'Alex Guard',
  email: 'alex@example.com',
  phone: '(555) 111-2222',
};
const client = {
  kind: 'client' as const,
  id: 'c1',
  name: 'Alex Customer',
  email: 'alex@example.com',
  phone: '555-000-0000',
};
const staff = {
  kind: 'staff' as const,
  id: 's1',
  name: 'Alex Staff',
  email: 'other@example.com',
  phone: '5551112222',
};

describe('one-role policy', () => {
  it('groups the same person across Guard and Customer by email', () => {
    const group = conflictingAccountsFor([guard, client], guard);
    assert.ok(group);
    assert.equal(group!.length, 2);
    assert.equal(describeOneRolePair(group!), 'Guard and Customer');
  });

  it('groups Guard and Staff by phone even when emails differ', () => {
    const group = conflictingAccountsFor([guard, staff], guard);
    assert.ok(group);
    assert.equal(normalizePhone(guard.phone), normalizePhone(staff.phone));
    assert.equal(describeOneRolePair(group!), 'Guard and Staff');
  });

  it('does not flag two guards who only share nothing', () => {
    const other = { ...guard, id: 'g2', email: 'b@example.com', phone: '9999999999' };
    assert.equal(conflictingAccountsFor([guard, other], guard), null);
  });

  it('flags the same device signing into a second role', () => {
    const result = withDeviceConflict(
      [guard, client],
      client,
      { kind: 'guard', id: 'g1' },
    );
    assert.ok(result);
    assert.equal(result!.matchKind, 'email');
  });

  it('flags a second account on the same device even when roles match', () => {
    const otherGuard = {
      kind: 'guard' as const,
      id: 'g2',
      name: 'Other Guard',
      email: 'other-guard@example.com',
      phone: '1112223333',
    };
    const result = withDeviceConflict([guard, otherGuard], otherGuard, { kind: 'guard', id: 'g1' });
    assert.ok(result);
    assert.equal(result!.matchKind, 'device');
  });

  it('flags a device conflict when email and phone do not match', () => {
    const otherClient = {
      kind: 'client' as const,
      id: 'c9',
      name: 'Other',
      email: 'other-client@example.com',
      phone: '1112223333',
    };
    const result = withDeviceConflict([guard, otherClient], otherClient, {
      kind: 'guard',
      id: 'g1',
    });
    assert.ok(result);
    assert.equal(result!.matchKind, 'device');
    assert.equal(result!.accounts.length, 2);
  });

  it('builds an open case and lets higher staff ignore or block both accounts', () => {
    const open = buildOneRoleCase({
      accounts: [guard, client],
      matchKind: 'email',
      now: '2026-09-10T00:00:00.000Z',
    });
    assert.equal(open.status, 'open');
    assert.equal(open.reason, ONE_ROLE_POLICY_REASON);
    assert.equal(openHoldForAccount([open], guard)?.id, open.id);

    const ignored = ignoreOneRoleCase(open, 'staff-manager');
    assert.equal(ignored.status, 'ignored');
    assert.equal(openHoldForAccount([ignored], guard), null);

    const blocked = blockOneRoleCase(open, 'staff-director');
    assert.equal(blocked.status, 'blocked');
    assert.equal(openHoldForAccount([blocked], client)?.status, 'blocked');
  });

  it('lets Manager and above review holds, not support', () => {
    assert.equal(canReviewOneRoleHolds('manager'), true);
    assert.equal(canReviewOneRoleHolds('director'), true);
    assert.equal(canReviewOneRoleHolds('administrator'), true);
    assert.equal(canReviewOneRoleHolds('support'), false);
    assert.equal(canReviewOneRoleHolds('moderator'), false);
  });

  it('collects staff from the guards list via isStaff', () => {
    const accounts = collectRoleAccounts(
      [
        { id: 'g1', name: 'G', email: 'g@x.com', phone: '5551112222', isStaff: false },
        { id: 's1', name: 'S', email: 's@x.com', phone: '5551112222', isStaff: true },
      ],
      [],
    );
    const groups = groupAccountsByIdentity(accounts);
    assert.equal(groups[0].length, 2);
    assert.deepEqual(groups[0].map((item) => item.kind).sort(), ['guard', 'staff']);
  });

  it('maps session roles onto one-role kinds', () => {
    assert.equal(kindFromSessionRole('client'), 'client');
    assert.equal(kindFromSessionRole('director'), 'staff');
    assert.equal(kindFromSessionRole('guard'), 'guard');
  });
});
