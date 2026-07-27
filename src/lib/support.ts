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

/** Resolved support chats may be permanently deleted by senior staff */
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
  if (openChat.subject === ACTIVATION_SUPPORT_SUBJECT) return openChat;
  return openChat.category === 'account' ? openChat : null;
}

export function buildActivationSupportTicketForGuard(
  guard: Pick<SecurityGuard, 'id' | 'name' | 'email'>,
  staff: Pick<SessionUser, 'id' | 'name' | 'role'>
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
