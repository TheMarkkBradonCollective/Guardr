import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sessionUserToPushRole } from './pushSubscriptionsClient';
import type { SessionUser } from '../types';

describe('sessionUserToPushRole', () => {
  it('maps guards and clients', () => {
    const guard: SessionUser = { id: 'g1', name: 'G', email: 'g@test.com', role: 'guard' };
    const client: SessionUser = { id: 'c1', name: 'C', email: 'c@test.com', role: 'client' };
    assert.equal(sessionUserToPushRole(guard), 'guard');
    assert.equal(sessionUserToPushRole(client), 'client');
  });

  it('maps staff to dispatch', () => {
    const staff: SessionUser = { id: 's1', name: 'S', email: 's@test.com', role: 'manager' };
    assert.equal(sessionUserToPushRole(staff), 'dispatch');
  });
});
