import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { authPathForProfile, profileMatchesAuthPath, type AuthProfile } from './authService';

function profile(partial: Partial<AuthProfile> & Pick<AuthProfile, 'table' | 'role'>): AuthProfile {
  return {
    id: 'x',
    email: 'x@example.com',
    name: 'X',
    ...partial,
  };
}

describe('auth path matching', () => {
  it('maps client profiles to the client path', () => {
    const client = profile({ table: 'clients', role: 'client' });
    assert.equal(authPathForProfile(client), 'client');
    assert.equal(profileMatchesAuthPath(client, 'client'), true);
    assert.equal(profileMatchesAuthPath(client, 'guard'), false);
    assert.equal(profileMatchesAuthPath(client, 'staff'), false);
  });

  it('maps field guards to the guard path', () => {
    const guard = profile({
      table: 'guards',
      role: 'guard',
      guard: { isStaff: false } as AuthProfile['guard'],
    });
    assert.equal(authPathForProfile(guard), 'guard');
    assert.equal(profileMatchesAuthPath(guard, 'guard'), true);
    assert.equal(profileMatchesAuthPath(guard, 'staff'), false);
  });

  it('maps staff profiles away from the guard path', () => {
    const staff = profile({
      table: 'staff',
      role: 'support',
      guard: { isStaff: true, staffRole: 'Support' } as AuthProfile['guard'],
    });
    assert.equal(authPathForProfile(staff), 'staff');
    assert.equal(profileMatchesAuthPath(staff, 'staff'), true);
    assert.equal(profileMatchesAuthPath(staff, 'guard'), false);
  });
});
