import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isDirectorTierPlatformRole } from './accountSessionAuth.ts';

describe('isDirectorTierPlatformRole', () => {
  it('includes Director, Owner, and Founder (owner)', () => {
    assert.equal(isDirectorTierPlatformRole('director'), true);
    assert.equal(isDirectorTierPlatformRole('owner'), true);
  });

  it('excludes Manager and below, Finance-only, and customer roles', () => {
    for (const role of ['manager', 'administrator', 'moderator', 'support', 'finance', 'client', 'guard', null, undefined, '']) {
      assert.equal(isDirectorTierPlatformRole(role), false, String(role));
    }
  });
});
