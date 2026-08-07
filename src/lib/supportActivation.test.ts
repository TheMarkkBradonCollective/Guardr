import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SecurityGuard, SupportTicket } from '../types';
import {
  ACTIVATION_SUPPORT_SUBJECT,
  buildActivationSupportTicketForGuard,
  buildMissingActivationSupportTickets,
  findActivationSupportChat,
  guardNeedsActivationSupportChat,
  GUARDR_SUPPORT_ACTOR,
  listGuardsNeedingActivationSupport,
} from './support.ts';

function guard(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'g1',
    name: 'Alex Rivera',
    email: 'alex@test.com',
    badgeNumber: 'G-100',
    avatar: '',
    phone: '',
    bio: '',
    certifications: [],
    userStatus: 'approved',
    isStaff: false,
    ...overrides,
  } as SecurityGuard;
}

describe('activation support chat', () => {
  it('builds a system-owned activation ticket for the guard', () => {
    const ticket = buildActivationSupportTicketForGuard(guard());

    assert.equal(ticket.userId, 'g1');
    assert.equal(ticket.userRole, 'guard');
    assert.equal(ticket.subject, ACTIVATION_SUPPORT_SUBJECT);
    assert.equal(ticket.messages[0]?.senderId, GUARDR_SUPPORT_ACTOR.id);
    assert.equal(ticket.messages[0]?.senderName, GUARDR_SUPPORT_ACTOR.name);
    assert.equal(ticket.messages[0]?.senderRole, 'administrator');
    assert.match(ticket.messages[0]?.body ?? '', /approved/i);
  });

  it('finds the open activation support chat for a guard', () => {
    const tickets: SupportTicket[] = [
      {
        id: 'support-1',
        userId: 'g1',
        userName: 'Alex Rivera',
        userEmail: 'alex@test.com',
        userRole: 'guard',
        kind: 'chat',
        subject: ACTIVATION_SUPPORT_SUBJECT,
        category: 'account',
        priority: 'normal',
        status: 'open',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        messages: [],
      },
    ];

    const found = findActivationSupportChat(tickets, { id: 'g1', email: 'alex@test.com' });
    assert.equal(found?.id, 'support-1');
  });

  it('lists approved guards awaiting activation without support chats', () => {
    const approvedGuard = guard();
    const activeGuard = guard({ id: 'g2', userStatus: 'active' });
    const pendingGuard = guard({ id: 'g3', userStatus: 'pending' });
    const tickets = [
      {
        id: 'support-1',
        userId: 'g4',
        userName: 'Other',
        userEmail: 'other@test.com',
        userRole: 'guard' as const,
        kind: 'chat' as const,
        subject: ACTIVATION_SUPPORT_SUBJECT,
        category: 'account' as const,
        priority: 'normal' as const,
        status: 'open' as const,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        messages: [],
      },
    ];

    assert.equal(guardNeedsActivationSupportChat(approvedGuard, tickets), true);
    assert.equal(guardNeedsActivationSupportChat(activeGuard, tickets), false);
    assert.equal(guardNeedsActivationSupportChat(pendingGuard, tickets), false);
    assert.deepEqual(
      listGuardsNeedingActivationSupport([approvedGuard, activeGuard, pendingGuard], tickets).map((g) => g.id),
      ['g1']
    );
  });

  it('builds missing activation support tickets in batch', () => {
    const tickets = buildMissingActivationSupportTickets(
      [guard(), guard({ id: 'g2', email: 'two@test.com', name: 'Blake' })],
      []
    );

    assert.equal(tickets.length, 2);
    assert.equal(tickets[0]?.userId, 'g1');
    assert.equal(tickets[1]?.userId, 'g2');
    assert.equal(tickets[0]?.messages[0]?.senderId, GUARDR_SUPPORT_ACTOR.id);
    assert.equal(tickets[0]?.messages[0]?.senderName, GUARDR_SUPPORT_ACTOR.name);
  });
});
