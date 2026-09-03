import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { STAFF_PLATFORM_PURPOSE, staffOverseesShiftOperations } from './staffPlatformScope';

describe('staffPlatformScope', () => {
  it('defines platform staff as compliance and payments, not shift dispatch', () => {
    assert.equal(staffOverseesShiftOperations(), false);
    assert.match(STAFF_PLATFORM_PURPOSE, /credential/i);
    assert.match(STAFF_PLATFORM_PURPOSE, /not security operations dispatch/i);
  });
});
