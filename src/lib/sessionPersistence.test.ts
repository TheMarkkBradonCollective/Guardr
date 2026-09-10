import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { shouldDropStaleSession } from './sessionPersistence.ts';

describe('shouldDropStaleSession', () => {
  it('keeps the session while data is still loading', () => {
    assert.equal(
      shouldDropStaleSession({
        loading: true,
        isDbConnected: false,
        rostersHydrated: false,
        userExistsInRosters: false,
      }),
      false,
    );
  });

  it('keeps the session when the roster load failed', () => {
    assert.equal(
      shouldDropStaleSession({
        loading: false,
        isDbConnected: false,
        rostersHydrated: false,
        userExistsInRosters: false,
      }),
      false,
    );
  });

  it('drops a cached user after a successful load that does not include them', () => {
    assert.equal(
      shouldDropStaleSession({
        loading: false,
        isDbConnected: true,
        rostersHydrated: true,
        userExistsInRosters: false,
      }),
      true,
    );
  });

  it('keeps a user who is still in the loaded rosters', () => {
    assert.equal(
      shouldDropStaleSession({
        loading: false,
        isDbConnected: true,
        rostersHydrated: true,
        userExistsInRosters: true,
      }),
      false,
    );
  });
});
