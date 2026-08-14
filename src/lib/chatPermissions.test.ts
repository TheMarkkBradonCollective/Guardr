import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { canDeleteChatMessage } from './chatPermissions';
import type { SessionUser } from '../types';

function actor(role: SessionUser['role'], id = 'actor-1'): Pick<SessionUser, 'id' | 'role'> {
  return { id, role };
}

describe('canDeleteChatMessage', () => {
  it('allows users to delete their own messages in any channel', () => {
    assert.equal(
      canDeleteChatMessage(actor('client'), { senderId: 'actor-1', senderRole: 'client' }, 'support'),
      true
    );
    assert.equal(
      canDeleteChatMessage(actor('guard'), { senderId: 'actor-1', senderRole: 'guard' }, 'job_chat'),
      true
    );
  });

  it('blocks deleting others in support (not a group chat)', () => {
    assert.equal(
      canDeleteChatMessage(actor('director'), { senderId: 'user-2', senderRole: 'client' }, 'support'),
      false
    );
  });

  it('allows higher staff to delete lower staff in staff group chat', () => {
    assert.equal(
      canDeleteChatMessage(actor('director'), { senderId: 'mod-1', senderRole: 'moderator' }, 'staff'),
      true
    );
    assert.equal(
      canDeleteChatMessage(actor('moderator'), { senderId: 'dir-1', senderRole: 'director' }, 'staff'),
      false
    );
    assert.equal(
      canDeleteChatMessage(actor('moderator'), { senderId: 'mod-2', senderRole: 'moderator' }, 'staff'),
      false
    );
  });

  it('allows staff to delete guard and client messages in community group chats', () => {
    assert.equal(
      canDeleteChatMessage(actor('administrator'), { senderId: 'g-1', senderRole: 'guard' }, 'guard'),
      true
    );
    assert.equal(
      canDeleteChatMessage(actor('support'), { senderId: 'c-1', senderRole: 'client' }, 'client'),
      true
    );
    assert.equal(
      canDeleteChatMessage(actor('guard'), { senderId: 'g-2', senderRole: 'guard' }, 'guard'),
      false
    );
  });

  it('allows users to delete their own job chat messages and higher staff to delete others', () => {
    assert.equal(
      canDeleteChatMessage(actor('client'), { senderId: 'actor-1', senderRole: 'client' }, 'job_chat'),
      true
    );
    assert.equal(
      canDeleteChatMessage(actor('director'), { senderId: 'g-1', senderRole: 'guard' }, 'job_chat'),
      true
    );
    assert.equal(
      canDeleteChatMessage(actor('guard'), { senderId: 'c-1', senderRole: 'client' }, 'job_chat'),
      false
    );
  });
});
