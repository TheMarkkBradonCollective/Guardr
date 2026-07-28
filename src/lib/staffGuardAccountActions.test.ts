import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  guardCanBlockAccount,
  guardCanDeactivateAccount,
  guardCanDenyApplication,
  guardCanRestoreAccountAccess,
  guardCanRevokeApplication,
} from './staffGuardAccountActions.ts';

describe('staffGuardAccountActions', () => {
  it('allows deactivate for active and approved guards', () => {
    assert.equal(guardCanDeactivateAccount('active'), true);
    assert.equal(guardCanDeactivateAccount('approved'), true);
    assert.equal(guardCanDeactivateAccount('pending'), false);
    assert.equal(guardCanDeactivateAccount('suspended'), false);
  });

  it('allows block for active, approved, and suspended guards', () => {
    assert.equal(guardCanBlockAccount('active'), true);
    assert.equal(guardCanBlockAccount('approved'), true);
    assert.equal(guardCanBlockAccount('suspended'), true);
    assert.equal(guardCanBlockAccount('blocked'), false);
    assert.equal(guardCanBlockAccount('pending'), false);
  });

  it('allows restore for suspended and blocked guards', () => {
    assert.equal(guardCanRestoreAccountAccess('suspended'), true);
    assert.equal(guardCanRestoreAccountAccess('blocked'), true);
    assert.equal(guardCanRestoreAccountAccess('active'), false);
  });

  it('scopes application deny/revoke to the right statuses', () => {
    assert.equal(guardCanDenyApplication('pending'), true);
    assert.equal(guardCanDenyApplication('approved'), false);
    assert.equal(guardCanRevokeApplication('approved'), true);
    assert.equal(guardCanRevokeApplication('active'), false);
  });
});
