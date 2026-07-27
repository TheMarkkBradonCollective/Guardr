import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SecurityGuard, SupportTicket } from '../types';
import {
  ACTIVATION_SUPPORT_SUBJECT,
  buildActivationSupportTicketForGuard,
  findActivationSupportChat,
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
  it('builds a staff-owned activation ticket for the guard', () => {
    const ticket = buildActivationSupportTicketForGuard(guard(), {
      id: 'staff-1',
      name: 'Staff Admin',
      role: 'administrator',
    });

    assert.equal(ticket.userId, 'g1');
    assert.equal(ticket.userRole, 'guard');
    assert.equal(ticket.subject, ACTIVATION_SUPPORT_SUBJECT);
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
});
