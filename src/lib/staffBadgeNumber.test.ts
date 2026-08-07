import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatStaffBadgeNumber,
  nextStaffBadgeNumber,
  nextStaffBadgeNumberForRoleChange,
  parseStaffBadgeNumber,
  staffBadgeNeedsRoleReassignment,
  validateStaffBadgeNumber,
} from './staffBadgeNumber';

test('formats role-specific badge numbers from 00001', () => {
  assert.equal(formatStaffBadgeNumber('Moderator', 1), 'MOD-00001');
  assert.equal(formatStaffBadgeNumber('Administrator', 12), 'ADM-00012');
});

test('rejects STF prefix', () => {
  assert.equal(validateStaffBadgeNumber('STF-00001', 'Moderator'), 'STF is not allowed. Use the role prefix (e.g. MOD-00001 for Moderator).');
});

test('assigns next number per role prefix', () => {
  const roster = [
    { isStaff: true as const, badgeNumber: 'OWN-00001' },
    { isStaff: true as const, badgeNumber: 'DIR-00002' },
    { isStaff: true as const, badgeNumber: 'ADM-00003' },
    { isStaff: true as const, badgeNumber: 'MOD-00001' },
  ];

  assert.equal(nextStaffBadgeNumber('Director', roster), 'DIR-00003');
  assert.equal(nextStaffBadgeNumber('Moderator', roster), 'MOD-00002');
  assert.equal(nextStaffBadgeNumber('Support', roster), 'SUP-00001');
});

test('assigns next badge on role change excluding the moving member', () => {
  const roster = [
    { id: 'staff-1', isStaff: true as const, badgeNumber: 'MOD-00001' },
    { id: 'staff-2', isStaff: true as const, badgeNumber: 'ADM-00001' },
    { id: 'staff-3', isStaff: true as const, badgeNumber: 'ADM-00002' },
  ];

  assert.equal(
    nextStaffBadgeNumberForRoleChange('Administrator', roster, 'staff-1'),
    'ADM-00003'
  );
});

test('detects when badge prefix no longer matches role', () => {
  assert.equal(staffBadgeNeedsRoleReassignment('MOD-00001', 'Administrator'), true);
  assert.equal(staffBadgeNeedsRoleReassignment('ADM-00001', 'Administrator'), false);
});
