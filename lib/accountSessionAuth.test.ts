import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  hasFinancePlatformAccess,
  isStaffPlatformRole,
  resolvePlatformRole,
} from './accountSessionAuth';

describe('accountSessionAuth', () => {
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
});
