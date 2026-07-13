import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('native push toggle state', () => {
  it('isNativePushActive requires granted permission, token, and local opt-in', async () => {
    const { isNativePushActive } = await import('./nativePush.ts');
    assert.equal(isNativePushActive('granted', 'abc-token'), false);
    assert.equal(isNativePushActive('denied', 'abc-token'), false);
    assert.equal(isNativePushActive('granted', null), false);
  });
});

describe('push local state', () => {
  it('tracks enabled flag in memory when localStorage is unavailable', async () => {
    const { isPushEnabledLocally, setPushEnabledLocally } = await import('./pushLocalState.ts');
    setPushEnabledLocally(true);
    assert.equal(isPushEnabledLocally(), true);
    setPushEnabledLocally(false);
    assert.equal(isPushEnabledLocally(), false);
  });
});
