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
});
