import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  hasFinancePlatformAccess,
  isStaffPlatformRole,
  resolvePlatformRole,
} from './accountSessionAuth';

describe('accountSessionAuth', () => {
  it('maps Support staff role to support platform role', () => {
    assert.equal(
      resolvePlatformRole({ isStaff: true, staffRole: 'Support', legacyRole: 'staff' }),
      'support'
    );
  });

  it('treats support as staff without finance access', () => {
    assert.equal(isStaffPlatformRole('support'), true);
    assert.equal(hasFinancePlatformAccess('support'), false);
  });

  it('maps Manager staff role to manager platform role', () => {
    assert.equal(
      resolvePlatformRole({ isStaff: true, staffRole: 'Manager', legacyRole: 'staff' }),
      'manager'
    );
  });

  it('treats manager as staff and finance-capable', () => {
    assert.equal(isStaffPlatformRole('manager'), true);
    assert.equal(hasFinancePlatformAccess('manager'), true);
  });

  it('does not grant finance access to administrator', () => {
    assert.equal(isStaffPlatformRole('administrator'), true);
    assert.equal(hasFinancePlatformAccess('administrator'), false);
  });

  it('maps Finance side role with null ladder role to finance desk', () => {
    assert.equal(
      resolvePlatformRole({ isStaff: true, staffRole: null, sideRole: 'Finance', legacyRole: 'staff' }),
      'finance'
    );
  });

  it('grants finance access to finance desk and Finance side role', () => {
    assert.equal(isStaffPlatformRole('finance'), true);
    assert.equal(hasFinancePlatformAccess('finance'), true);
    assert.equal(hasFinancePlatformAccess('administrator', 'Finance'), true);
  });
});
