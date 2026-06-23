import { PlatformRole, GuardMessage, SessionUser } from '../types';
import { ROLE_LABELS } from './permissions';

const STORAGE_KEY = 'guardr_guard_messages';

export function mergeGuardMessages(
  existing: GuardMessage[],
  incoming: GuardMessage[]
): GuardMessage[] {
  const byId = new Map<string, GuardMessage>();
  for (const message of existing) byId.set(message.id, message);
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function appendGuardMessage(messages: GuardMessage[], message: GuardMessage): GuardMessage[] {
  if (messages.some((entry) => entry.id === message.id)) return messages;
  return mergeGuardMessages(messages, [message]);
}

export function loadGuardMessagesFromStorage(): GuardMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGuardMessagesToStorage(messages: GuardMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    /* ignore */
  }
}

export function canAccessGuardMessenger(role: PlatformRole): boolean {
  return role === 'guard';
}

export function buildGuardMessage(sender: SessionUser, body: string): GuardMessage {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? `gdmsg-${crypto.randomUUID()}`
      : `gdmsg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return {
    id,
    senderId: sender.id,
    senderName: sender.name,
    senderRole: sender.role,
    body: body.trim(),
    createdAt: new Date().toISOString(),
  };
}

export function sortedGuardMessages(messages: GuardMessage[]): GuardMessage[] {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

/** Guard chat bubble label — Guardr brand, role, then person's name. */
export function guardChatSenderLabel(role: PlatformRole, name: string): string {
  const roleLabel = ROLE_LABELS[role] ?? role;
  const displayName = name.trim() || 'Guard';
  return `Guardr · ${roleLabel} · ${displayName}`;
}
