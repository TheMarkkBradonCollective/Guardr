import {
  CreateSupportTicketInput,
  PlatformRole,
  SecurityGuard,
  SessionUser,
  SupportMessage,
  SupportPriority,
  SupportTicket,
  SupportTicketCategory,
  SupportTicketStatus,
} from '../types';
import { isGuardAccountApproved } from './accountStatus';
import { isGuardAccountActive } from './guardAccountActivation';
import { isStaffRole } from './permissions';

const STORAGE_KEY = 'guardr_support_tickets';

export const SUPPORT_CATEGORY_OPTIONS: { id: SupportTicketCategory; label: string }[] = [
  { id: 'general', label: 'General question' },
  { id: 'account', label: 'Account & profile' },
  { id: 'payment', label: 'Payments & billing' },
  { id: 'job-issue', label: 'Job issue' },
  { id: 'safety', label: 'Safety concern' },
  { id: 'technical', label: 'Technical problem' },
  { id: 'other', label: 'Other' },
];

export const SUPPORT_PRIORITY_OPTIONS: { id: SupportPriority; label: string }[] = [
  { id: 'low', label: 'Low' },
  { id: 'normal', label: 'Normal' },
  { id: 'high', label: 'High' },
  { id: 'urgent', label: 'Urgent' },
];

export const SUPPORT_STATUS_LABEL: Record<SupportTicketStatus, string> = {
  open: 'Open',
  'in-progress': 'In progress',
  resolved: 'Resolved',
};

/** Formal reports use review language — not live “open” conversations. */
export const SUPPORT_REPORT_STATUS_LABEL: Record<SupportTicketStatus, string> = {
  open: 'Submitted',
  'in-progress': 'Under review',
  resolved: 'Closed',
};

export function supportStatusLabel(ticket: Pick<SupportTicket, 'kind' | 'status'>): string {
  if (ticket.kind === 'report') return SUPPORT_REPORT_STATUS_LABEL[ticket.status];
  return SUPPORT_STATUS_LABEL[ticket.status];
}

/** Resolved support chats may be permanently deleted by staff with inbox access */
export function isDeletableResolvedSupportChat(
  ticket: Pick<SupportTicket, 'kind' | 'status'>
): boolean {
  return ticket.kind === 'chat' && ticket.status === 'resolved';
}

export function categoryLabel(category: SupportTicketCategory): string {
  return SUPPORT_CATEGORY_OPTIONS.find((o) => o.id === category)?.label ?? category;
}

export function priorityLabel(priority: SupportPriority): string {
  return SUPPORT_PRIORITY_OPTIONS.find((o) => o.id === priority)?.label ?? priority;
}

export function loadSupportTicketsFromStorage(): SupportTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSupportTicketsToStorage(tickets: SupportTicket[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch {
    /* ignore */
  }
}

export function ticketsForUser(tickets: SupportTicket[], user: Pick<SessionUser, 'id' | 'email'>): SupportTicket[] {
  const emailLower = user.email.toLowerCase();
  return tickets
    .filter((t) => t.userId === user.id || t.userEmail.toLowerCase() === emailLower)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function openTicketCount(tickets: SupportTicket[]): number {
  return tickets.filter((t) => t.status !== 'resolved').length;
}

export const ACTIVATION_SUPPORT_SUBJECT = 'Activation help';

export const GUARDR_SUPPORT_ACTOR = {
  id: 'guardr-support',
  name: 'Guardr Staff',
  role: 'administrator' as const,
};

export function isGuardrSupportSender(senderId: string, senderName?: string): boolean {
  if (senderId === GUARDR_SUPPORT_ACTOR.id) return true;
  const normalized = senderName?.trim().toLowerCase();
  return normalized === 'guardr staff' || normalized === 'guardr support';
}

export function guardNeedsActivationSupportChat(
  guard: Pick<SecurityGuard, 'id' | 'email' | 'isStaff' | 'userStatus' | 'certifications'>,
  tickets: SupportTicket[]
): boolean {
  if (guard.isStaff) return false;
  if (!isGuardAccountApproved(guard)) return false;
  if (isGuardAccountActive(guard as SecurityGuard)) return false;
  return !findActivationSupportChat(tickets, { id: guard.id, email: guard.email });
}

export function listGuardsNeedingActivationSupport(
  guards: SecurityGuard[],
  tickets: SupportTicket[]
): SecurityGuard[] {
  return guards.filter((guard) => guardNeedsActivationSupportChat(guard, tickets));
}

export function buildMissingActivationSupportTickets(
  guards: SecurityGuard[],
  tickets: SupportTicket[],
  staff: Pick<SessionUser, 'id' | 'name' | 'role'> = GUARDR_SUPPORT_ACTOR
): SupportTicket[] {
  const baseTime = Date.now();
  return listGuardsNeedingActivationSupport(guards, tickets).map((guard, index) => {
    const ticket = buildActivationSupportTicketForGuard(guard, staff);
    const ticketId = `support-${baseTime + index}`;
    const messageId = `smsg-${baseTime + index}`;
    return {
      ...ticket,
      id: ticketId,
      messages: ticket.messages.map((message) => ({
        ...message,
        id: messageId,
        ticketId,
      })),
    };
  });
}

export function findOpenSupportChat(
  tickets: SupportTicket[],
  user: Pick<SessionUser, 'id' | 'email'>
): SupportTicket | null {
  return ticketsForUser(tickets, user).find((t) => t.kind === 'chat' && t.status !== 'resolved') ?? null;
}

export function findActivationSupportChat(
  tickets: SupportTicket[],
  user: Pick<SessionUser, 'id' | 'email'>
): SupportTicket | null {
  const openChat = findOpenSupportChat(tickets, user);
  if (!openChat) return null;
  if (isActivationSupportTicket(openChat)) return openChat;
  return null;
}

export function isActivationSupportTicket(
  ticket: Pick<SupportTicket, 'kind' | 'subject'>
): boolean {
  return ticket.kind === 'chat' && ticket.subject === ACTIVATION_SUPPORT_SUBJECT;
}

const ACTIVATION_RESOLVED_MESSAGE =
  'You are now activated on Guardr. This chat is closed — open Support anytime if you need help.';

/** Close open activation help chats once the guard account is active. */
export function resolveActivationSupportTicketsForGuard(
  tickets: SupportTicket[],
  guard: Pick<SecurityGuard, 'id' | 'email' | 'name'>
): { tickets: SupportTicket[]; resolved: SupportTicket[] } {
  const emailLower = guard.email.toLowerCase();
  const now = new Date().toISOString();
  const resolved: SupportTicket[] = [];
  const next = tickets.map((ticket) => {
    if (ticket.status === 'resolved') return ticket;
    if (ticket.userId !== guard.id && ticket.userEmail.toLowerCase() !== emailLower) return ticket;
    if (!isActivationSupportTicket(ticket)) return ticket;
    const closed: SupportTicket = {
      ...ticket,
      status: 'resolved',
      updatedAt: now,
      messages: [
        ...ticket.messages,
        {
          id: `smsg-${Date.now()}-${resolved.length}`,
          ticketId: ticket.id,
          senderId: GUARDR_SUPPORT_ACTOR.id,
          senderName: GUARDR_SUPPORT_ACTOR.name,
          senderRole: GUARDR_SUPPORT_ACTOR.role,
          body: ACTIVATION_RESOLVED_MESSAGE,
          createdAt: now,
        },
      ],
    };
    resolved.push(closed);
    return closed;
  });
  if (resolved.length === 0) return { tickets, resolved };
  return { tickets: next, resolved };
}

export function buildActivationSupportTicketForGuard(
  guard: Pick<SecurityGuard, 'id' | 'name' | 'email'>,
  staff: Pick<SessionUser, 'id' | 'name' | 'role'> = GUARDR_SUPPORT_ACTOR
): SupportTicket {
  const now = new Date().toISOString();
  const ticketId = `support-${Date.now()}`;
  const firstName = guard.name.trim().split(/\s+/)[0] || guard.name;
  const body = `Hi ${firstName}, your application was approved! Upload your activation credentials on this screen, or reply here if you need help getting activated.`;
  const message: SupportMessage = {
    id: `smsg-${Date.now()}`,
    ticketId,
    senderId: staff.id,
    senderName: staff.name,
    senderRole: staff.role,
    body,
    createdAt: now,
  };

  return {
    id: ticketId,
    userId: guard.id,
    userName: guard.name,
    userEmail: guard.email,
    userRole: 'guard',
    kind: 'chat',
    subject: ACTIVATION_SUPPORT_SUBJECT,
    category: 'account',
    priority: 'normal',
    status: 'open',
    createdAt: now,
    updatedAt: now,
    messages: [message],
  };
}

export function isStaffSender(role: PlatformRole): boolean {
  return isStaffRole(role);
}

export function buildNewTicket(
  user: SessionUser,
  input: CreateSupportTicketInput
): SupportTicket {
  const now = new Date().toISOString();
  const ticketId = `support-${Date.now()}`;
  const message: SupportMessage = {
    id: `smsg-${Date.now()}`,
    ticketId,
    senderId: user.id,
    senderName: user.name,
    senderRole: user.role,
    body: input.body.trim(),
    createdAt: now,
  };

  return {
    id: ticketId,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    kind: input.kind,
    subject: input.subject.trim(),
    category: input.category,
    priority: input.priority ?? (input.kind === 'report' ? 'normal' : 'normal'),
    status: 'open',
    relatedRequestId: input.relatedRequestId,
    createdAt: now,
    updatedAt: now,
    messages: [message],
  };
}

export function appendMessage(
  ticket: SupportTicket,
  sender: SessionUser,
  body: string
): SupportTicket {
  const now = new Date().toISOString();
  const message: SupportMessage = {
    id: `smsg-${Date.now()}`,
    ticketId: ticket.id,
    senderId: sender.id,
    senderName: sender.name,
    senderRole: sender.role,
    body: body.trim(),
    createdAt: now,
  };
  return {
    ...ticket,
    updatedAt: now,
    status: ticket.status === 'resolved' && !isStaffRole(sender.role) ? 'open' : ticket.status,
    messages: [...ticket.messages, message],
  };
}
