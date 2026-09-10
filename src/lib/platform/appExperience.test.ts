import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isAppExperience, isMessengerExperience } from './appExperience.ts';

describe('isAppExperience', () => {
  it('returns a boolean for the current runtime shell', () => {
    assert.equal(typeof isAppExperience(), 'boolean');
  });

  it('is false in the node test runner (no installed shell)', () => {
    assert.equal(isAppExperience(), false);
    assert.equal(isMessengerExperience(), false);
  });

  it('treats a baked messenger APK as an installed app', () => {
    const previous = globalThis.window;
    globalThis.window = { __GUARDR_NATIVE_PRODUCT_APP__: 'messenger' } as Window & typeof globalThis;
    try {
      assert.equal(isMessengerExperience(), true);
      assert.equal(isAppExperience(), true);
    } finally {
      globalThis.window = previous;
    }
  });
});
