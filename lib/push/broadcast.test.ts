import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canSessionBroadcast } from './broadcast';

describe('canSessionBroadcast', () => {
  it('allows Founder and Director only', () => {
    assert.equal(canSessionBroadcast('owner'), true);
    assert.equal(canSessionBroadcast('director'), true);
    assert.equal(canSessionBroadcast('manager'), false);
    assert.equal(canSessionBroadcast('administrator'), false);
    assert.equal(canSessionBroadcast('guard'), false);
    assert.equal(canSessionBroadcast('client'), false);
  });
});
