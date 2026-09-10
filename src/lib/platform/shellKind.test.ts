import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getShellKind, isBrowserShell, isNativeShellKind, isPwaShell } from './shellKind.ts';

describe('shellKind', () => {
  it('returns browser in the node test runner', () => {
    assert.equal(getShellKind(), 'browser');
    assert.equal(isBrowserShell(), true);
    assert.equal(isPwaShell(), false);
    assert.equal(isNativeShellKind(), false);
  });

  it('treats a baked native product app as the native shell', () => {
    const previous = globalThis.window;
    globalThis.window = { __GUARDR_NATIVE_PRODUCT_APP__: 'guard' } as Window & typeof globalThis;
    try {
      assert.equal(getShellKind(), 'native');
      assert.equal(isNativeShellKind(), true);
      assert.equal(isPwaShell(), false);
    } finally {
      globalThis.window = previous;
    }
  });
});
