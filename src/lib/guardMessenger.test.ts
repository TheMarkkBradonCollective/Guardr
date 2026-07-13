import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { canPostToGuardChat, canReadGuardChat } from './guardMessenger';

describe('guardMessenger access', () => {
  it('allows staff to read and post', () => {
    assert.equal(canReadGuardChat({ role: 'moderator' }), true);
    assert.equal(canPostToGuardChat({ role: 'administrator' }), true);
    assert.equal(canPostToGuardChat({ role: 'owner' }), true);
  });

  it('allows active guards to read and post', () => {
    const guard = { userStatus: 'active' as const, isStaff: false };
    assert.equal(canReadGuardChat({ role: 'guard' }), true);
    assert.equal(canPostToGuardChat({ role: 'guard' }, guard), true);
  });

  it('blocks pending guards from posting but not reading', () => {
    const guard = { userStatus: 'pending' as const, isStaff: false };
    assert.equal(canReadGuardChat({ role: 'guard' }), true);
    assert.equal(canPostToGuardChat({ role: 'guard' }, guard), false);
  });

  it('blocks clients from guard chat', () => {
    assert.equal(canReadGuardChat({ role: 'client' }), false);
    assert.equal(canPostToGuardChat({ role: 'client' }), false);
  });
});
