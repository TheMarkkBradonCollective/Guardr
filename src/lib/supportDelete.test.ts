import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canDeleteResolvedSupportChat } from './permissions.ts';
import { isDeletableResolvedSupportChat } from './support.ts';

describe('resolved support chat deletion', () => {
  it('allows staff with support inbox access to delete resolved chats', () => {
    assert.equal(canDeleteResolvedSupportChat({ role: 'support' }), true);
    assert.equal(canDeleteResolvedSupportChat({ role: 'moderator' }), true);
    assert.equal(canDeleteResolvedSupportChat({ role: 'administrator' }), true);
    assert.equal(canDeleteResolvedSupportChat({ role: 'guard' }), false);
    assert.equal(canDeleteResolvedSupportChat({ role: 'client' }), false);
  });

  it('only allows deleting resolved support chats, not reports or open chats', () => {
    assert.equal(
      isDeletableResolvedSupportChat({ kind: 'chat', status: 'resolved' }),
      true
    );
    assert.equal(
      isDeletableResolvedSupportChat({ kind: 'chat', status: 'open' }),
      false
    );
    assert.equal(
      isDeletableResolvedSupportChat({ kind: 'report', status: 'resolved' }),
      false
    );
  });
});
