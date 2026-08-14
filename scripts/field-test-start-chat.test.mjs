import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatFieldtestStaffChatStartMessage } from './field-test-lib.mjs';

describe('fieldtest Staff chat start message', () => {
  it('writes a plain-English heads-up before the run', () => {
    const text = formatFieldtestStaffChatStartMessage({
      runId: '20260814000000',
      base: 'https://www.guardr.co',
      marketCity: 'Sacramento',
      emails: { client: 'jane@guardr.test', guard: 'john@guardr.test' },
      cleanupBefore: {
        ok: true,
        found: { guards: 1, clients: 0, staff: 2 },
      },
    });

    assert.match(text, /Starting field test \(20260814000000\)/);
    assert.match(text, /We are about to run a full field test/);
    assert.match(text, /Before starting, we removed/);
    assert.match(text, /jane@guardr\.test/);
    assert.match(text, /another message here when the run finishes/);
    assert.doesNotMatch(text, /g1\/c0\/s2/);
  });
});
