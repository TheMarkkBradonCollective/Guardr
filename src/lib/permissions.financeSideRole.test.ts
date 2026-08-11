import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canAccessFinancialControls,
  canAssignStaffSideRole,
  canModifyStaffMember,
  getEffectiveRolePermissions,
  hasFinanceSideRole,
  isFinanceDeskOnly,
  isStaffRole,
  resolvePlatformRole,
} from './permissions';

describe('finance side role', () => {
  it('resolves null ladder + Finance side to finance desk platform role', () => {
    assert.equal(
      resolvePlatformRole({ isStaff: true, staffRole: null, sideRole: 'Finance' }),
      'finance'
    );
  });

  it('keeps ladder role when Finance side is additive', () => {
    assert.equal(
      resolvePlatformRole({ isStaff: true, staffRole: 'Administrator', sideRole: 'Finance' }),
      'administrator'
    );
  });

  it('grants finance-only permissions to the finance desk role', () => {
    const perms = getEffectiveRolePermissions('finance');
    assert.ok(perms.includes('admin.manage_payouts'));
    assert.ok(perms.includes('admin.manage_fees'));
    assert.ok(perms.includes('director.view_all_financial_data'));
    assert.equal(perms.includes('moderator.approve_guards'), false);
    assert.equal(isStaffRole('finance'), true);
  });

  it('merges Finance side permissions onto lower ladder roles', () => {
    const perms = getEffectiveRolePermissions('administrator', undefined, 'Finance');
    assert.ok(perms.includes('admin.manage_payouts'));
    assert.ok(perms.includes('moderator.review_certifications'));
  });

  it('detects finance desk only seats', () => {
    assert.equal(
      isFinanceDeskOnly({ role: 'finance', staffRole: undefined, sideRole: 'Finance' }),
      true
    );
    assert.equal(
      isFinanceDeskOnly({ role: 'manager', staffRole: 'Manager', sideRole: 'Finance' }),
      false
    );
    assert.equal(hasFinanceSideRole({ role: 'administrator', sideRole: 'Finance' }), true);
    assert.equal(canAccessFinancialControls({ role: 'administrator', sideRole: 'Finance' }), true);
  });

  it('lets Director+ manage finance desk seats and assign side role', () => {
    assert.equal(canAssignStaffSideRole('director'), true);
    assert.equal(canAssignStaffSideRole('administrator'), false);
    assert.equal(canModifyStaffMember('director', null, 'Finance'), true);
    assert.equal(canModifyStaffMember('manager', null, 'Finance'), false);
  });
});
