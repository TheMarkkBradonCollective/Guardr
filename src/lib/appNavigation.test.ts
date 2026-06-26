import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeGuardTabForAccount } from './appNavigation';

describe('normalizeGuardTabForAccount', () => {
  it('allows active guards to use any tab', () => {
    const guard = { userStatus: 'active' as const, isStaff: false };
    assert.equal(normalizeGuardTabForAccount('map', guard), 'map');
    assert.equal(normalizeGuardTabForAccount('earnings', guard), 'earnings');
    assert.equal(normalizeGuardTabForAccount('settings', guard), 'settings');
  });

  it('allows staff guards to use any tab', () => {
    const guard = { userStatus: 'pending' as const, isStaff: true };
    assert.equal(normalizeGuardTabForAccount('map', guard), 'map');
  });

  it('routes inactive guards to activation except settings', () => {
    const guard = { userStatus: 'pending' as const, isStaff: false };
    assert.equal(normalizeGuardTabForAccount('map', guard), 'activation');
    assert.equal(normalizeGuardTabForAccount('myJobs', guard), 'activation');
    assert.equal(normalizeGuardTabForAccount('messages', guard), 'activation');
    assert.equal(normalizeGuardTabForAccount('settings', guard), 'settings');
  });

  it('routes approved-but-not-active guards to activation', () => {
    const guard = { userStatus: 'approved' as const, isStaff: false };
    assert.equal(normalizeGuardTabForAccount('map', guard), 'activation');
    assert.equal(normalizeGuardTabForAccount('settings', guard), 'settings');
  });

  it('normalizes legacy chat tabs before gating', () => {
    const guard = { userStatus: 'active' as const, isStaff: false };
    assert.equal(normalizeGuardTabForAccount('guardChat', guard), 'messages');
    assert.equal(normalizeGuardTabForAccount('support', guard), 'messages');
  });

  it('defaults unknown guard profiles to activation until profile loads', () => {
    assert.equal(normalizeGuardTabForAccount('map', undefined), 'activation');
    assert.equal(normalizeGuardTabForAccount(undefined, undefined), 'activation');
    assert.equal(normalizeGuardTabForAccount('settings', undefined), 'settings');
  });
});
