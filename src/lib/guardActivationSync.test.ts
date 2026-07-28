import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityGuard, SessionUser } from '../types';
import { isInactiveGuardSession } from './guardActivationSync.ts';

const guardUser: SessionUser = {
  id: 'g1',
  email: 'guard@test.com',
  name: 'Test Guard',
  role: 'guard',
};

function guard(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'g1',
    name: 'Test Guard',
    email: 'guard@test.com',
    userStatus: 'pending',
    verified: false,
    certifications: [],
    ...overrides,
  } as SecurityGuard;
}

describe('isInactiveGuardSession', () => {
  it('returns false for non-guard users', () => {
    assert.equal(
      isInactiveGuardSession({ ...guardUser, role: 'client' }, [guard()]),
      false
    );
  });

  it('treats pending and approved guards as inactive sessions', () => {
    assert.equal(isInactiveGuardSession(guardUser, [guard({ userStatus: 'pending' })]), true);
    assert.equal(isInactiveGuardSession(guardUser, [guard({ userStatus: 'approved' })]), true);
  });

  it('does not gate active guards even when credentials are incomplete', () => {
    assert.equal(
      isInactiveGuardSession(
        guardUser,
        [guard({ userStatus: 'active', verified: true, certifications: [] })]
      ),
      false
    );
  });

  it('matches guard profiles by email when session id differs', () => {
    assert.equal(
      isInactiveGuardSession(
        { ...guardUser, id: 'auth-user-id' },
        [guard({ id: 'g1', email: 'guard@test.com', userStatus: 'active' })]
      ),
      false
    );
  });
});
