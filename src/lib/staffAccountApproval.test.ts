import assert from 'node:assert/strict';
import test from 'node:test';
import {
  accountCanDownloadApks,
  getGuardUserStatus,
  isStaffAccountApproved,
  isStaffAccountPending,
  isStaffAccountPreActive,
  isStaffUserStatusActive,
} from './accountStatus';
import {
  canApproveStaffAccounts,
  canProposeStaffAccounts,
  getAssignableStaffRoles,
  getDefaultStaffRolePermissions,
  staffRoleRank,
} from './permissions';
import { getPendingStaffAccountReviews } from './staffAccounts';

test('staff pending status is respected for staff accounts', () => {
  const pendingStaff = { isStaff: true as const, userStatus: 'pending' as const };
  assert.equal(getGuardUserStatus(pendingStaff), 'pending');
  assert.equal(isStaffAccountPending(pendingStaff), true);
  assert.equal(isStaffUserStatusActive(pendingStaff), false);
});

test('active staff accounts are not pending', () => {
  const activeStaff = { isStaff: true as const, userStatus: 'active' as const };
  assert.equal(isStaffAccountPending(activeStaff), false);
  assert.equal(isStaffUserStatusActive(activeStaff), true);
});

test('approved staff accounts stay pre-active until activation completes', () => {
  const approvedStaff = { isStaff: true as const, userStatus: 'approved' as const };
  assert.equal(getGuardUserStatus(approvedStaff), 'approved');
  assert.equal(isStaffUserStatusActive(approvedStaff), false);
});

test('administrator can propose staff but not approve', () => {
  const admin = { role: 'administrator' as const };
  assert.equal(canProposeStaffAccounts(admin), true);
  assert.equal(canApproveStaffAccounts(admin), false);
  assert.deepEqual(getAssignableStaffRoles('administrator'), ['Support', 'Moderator']);
});

test('moderator can assign Support only', () => {
  assert.deepEqual(getAssignableStaffRoles('moderator'), ['Support']);
});

test('Support ranks below Moderator with monitoring defaults', () => {
  assert.ok(staffRoleRank('Support') < staffRoleRank('Moderator'));
  assert.deepEqual(getDefaultStaffRolePermissions('Support'), [
    'moderator.review_reports',
    'moderator.monitor_activity',
    'moderator.access_support_inbox',
    'moderator.access_messages',
    'moderator.view_violations',
  ]);
});

test('director can propose and approve staff', () => {
  const director = { role: 'director' as const };
  assert.equal(canProposeStaffAccounts(director), true);
  assert.equal(canApproveStaffAccounts(director), true);
});

test('getPendingStaffAccountReviews returns only pending staff', () => {
  const guards = [
    { id: 's1', isStaff: true, userStatus: 'pending' as const },
    { id: 's2', isStaff: true, userStatus: 'active' as const },
    { id: 'g1', isStaff: false, userStatus: 'pending' as const },
  ];
  assert.equal(getPendingStaffAccountReviews(guards as never).length, 1);
});

test('Android APK downloads stay private until the account is active', () => {
  assert.equal(
    accountCanDownloadApks({
      role: 'client',
      client: { accountStatus: 'active', approved: true },
    }),
    true,
  );
  assert.equal(
    accountCanDownloadApks({
      role: 'client',
      client: { accountStatus: 'pending', approved: false },
    }),
    false,
  );
  assert.equal(
    accountCanDownloadApks({
      role: 'client',
      client: { accountStatus: 'suspended', approved: false },
    }),
    false,
  );
  assert.equal(
    accountCanDownloadApks({
      role: 'guard',
      guard: { userStatus: 'active', isStaff: false },
    }),
    true,
  );
  assert.equal(
    accountCanDownloadApks({
      role: 'guard',
      guard: { userStatus: 'approved', isStaff: false },
    }),
    false,
  );
  assert.equal(
    accountCanDownloadApks({
      role: 'staff',
      guard: { userStatus: 'active', isStaff: true },
    }),
    true,
  );
  assert.equal(
    accountCanDownloadApks({
      role: 'staff',
      guard: { userStatus: 'pending', isStaff: true },
    }),
    false,
  );
  assert.equal(accountCanDownloadApks({ role: 'client' }), false);
  assert.equal(accountCanDownloadApks({}), false);
});
