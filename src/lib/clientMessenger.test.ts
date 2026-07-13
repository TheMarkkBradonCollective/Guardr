import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { canPostToClientChat, canReadClientChat } from './clientMessenger';

describe('clientMessenger access', () => {
  it('allows staff to read and post', () => {
    assert.equal(canReadClientChat({ role: 'moderator' }), true);
    assert.equal(canPostToClientChat({ role: 'administrator' }), true);
    assert.equal(canPostToClientChat({ role: 'owner' }), true);
  });

  it('allows active clients to read and post', () => {
    const client = { accountStatus: 'active' as const, approved: true };
    assert.equal(canReadClientChat({ role: 'client' }), true);
    assert.equal(canPostToClientChat({ role: 'client' }, client), true);
  });

  it('blocks pending clients from posting but not reading', () => {
    const client = { accountStatus: 'pending' as const, approved: false };
    assert.equal(canReadClientChat({ role: 'client' }), true);
    assert.equal(canPostToClientChat({ role: 'client' }, client), false);
  });

  it('blocks guards from client chat', () => {
    assert.equal(canReadClientChat({ role: 'guard' }), false);
    assert.equal(canPostToClientChat({ role: 'guard' }), false);
  });
});
