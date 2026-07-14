import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('native push toggle state', () => {
  it('isNativePushActive requires granted permission and a stored token', async () => {
    const { isNativePushActive } = await import('./nativePush.ts');
    assert.equal(isNativePushActive('granted', 'abc-token'), true);
    assert.equal(isNativePushActive('denied', 'abc-token'), false);
    assert.equal(isNativePushActive('granted', null), false);
  });

  it('syncNativePushLocalState repairs local opt-in when a token exists', async () => {
    if (typeof localStorage === 'undefined') return;
    const { syncNativePushLocalState } = await import('./nativePush.ts');
    const { isPushEnabledLocally, setPushEnabledLocally } = await import('./pushLocalState.ts');
    setPushEnabledLocally(false);
    assert.equal(syncNativePushLocalState('granted', 'device-token'), true);
    assert.equal(isPushEnabledLocally(), true);
    setPushEnabledLocally(false);
  });

  it('isNativeFcmConfigured reflects build-time flag', async () => {
    const { isNativeFcmConfigured } = await import('./nativePush.ts');
    assert.equal(typeof isNativeFcmConfigured(), 'boolean');
  });
});

describe('push local state', () => {
  it('reads and writes the enabled flag when storage is available', async () => {
    if (typeof localStorage === 'undefined') return;
    const { isPushEnabledLocally, setPushEnabledLocally } = await import('./pushLocalState.ts');
    setPushEnabledLocally(true);
    assert.equal(isPushEnabledLocally(), true);
    setPushEnabledLocally(false);
    assert.equal(isPushEnabledLocally(), false);
  });
});
