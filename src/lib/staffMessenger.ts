import { PlatformRole, StaffMessage, SessionUser } from '../types';
import { isGuardrFieldTestSender } from './support';
import { isStaffRole, ROLE_LABELS } from './permissions';

const STORAGE_KEY = 'guardr_staff_messages';

export function mergeStaffMessages(
  existing: StaffMessage[],
  incoming: StaffMessage[]
): StaffMessage[] {
  const byId = new Map<string, StaffMessage>();
  for (const message of existing) byId.set(message.id, message);
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function appendStaffMessage(messages: StaffMessage[], message: StaffMessage): StaffMessage[] {
  if (messages.some((entry) => entry.id === message.id)) return messages;
  return mergeStaffMessages(messages, [message]);
}

export function removeStaffMessage(messages: StaffMessage[], messageId: string): StaffMessage[] {
  return messages.filter((entry) => entry.id !== messageId);
}

export function loadStaffMessagesFromStorage(): StaffMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStaffMessagesToStorage(messages: StaffMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    /* ignore */
  }
}

export function canAccessStaffMessenger(role: PlatformRole): boolean {
  return isStaffRole(role);
}

export function buildStaffMessage(sender: SessionUser, body: string): StaffMessage {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? `stmsg-${crypto.randomUUID()}`
      : `stmsg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return {
    id,
    senderId: sender.id,
    senderName: sender.name,
    senderRole: sender.role,
    body: body.trim(),
    createdAt: new Date().toISOString(),
  };
}

export function sortedStaffMessages(messages: StaffMessage[]): StaffMessage[] {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

/** Staff chat bubble label — Guardr brand, role, then person's name. */
export function staffChatSenderLabel(
  role: PlatformRole,
  name: string,
  senderId?: string
): string {
  if (isGuardrFieldTestSender(senderId ?? '', name)) {
    return 'Guardr';
  }
  const roleLabel = ROLE_LABELS[role] ?? role;
  const displayName = name.trim() || 'Staff';
  return `Guardr · ${roleLabel} · ${displayName}`;
}
