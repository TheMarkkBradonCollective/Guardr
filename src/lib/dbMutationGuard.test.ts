import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  beginActivationUploadSession,
  endActivationUploadSession,
  shouldSkipRealtimeSync,
} from './dbMutationGuard';

describe('dbMutationGuard activation upload session', () => {
  afterEach(() => {
    while (shouldSkipRealtimeSync()) {
      endActivationUploadSession();
    }
  });

  it('suppresses realtime sync while activation upload session is open', () => {
    assert.equal(shouldSkipRealtimeSync(), false);
    beginActivationUploadSession();
    assert.equal(shouldSkipRealtimeSync(), true);
    endActivationUploadSession();
    assert.equal(shouldSkipRealtimeSync(), false);
  });

  it('supports nested activation upload sessions', () => {
    beginActivationUploadSession();
    beginActivationUploadSession();
    endActivationUploadSession();
    assert.equal(shouldSkipRealtimeSync(), true);
    endActivationUploadSession();
    assert.equal(shouldSkipRealtimeSync(), false);
  });
});
