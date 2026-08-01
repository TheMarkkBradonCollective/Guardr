import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isVersionOlder } from './versionCompare';

describe('versionCompare', () => {
  it('isVersionOlder detects when the live manifest is ahead of the installed bundle', () => {
    assert.equal(isVersionOlder('1.0.102-beta', '1.0.103-beta'), true);
    assert.equal(isVersionOlder('1.0.103-beta', '1.0.103-beta'), false);
    assert.equal(isVersionOlder('1.0.104-beta', '1.0.103-beta'), false);
  });
});
