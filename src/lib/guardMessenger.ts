import { PlatformRole, GuardMessage, SecurityGuard, SessionUser } from '../types';
import { isGuardUserStatusActive } from './accountStatus';
import { isStaffRole } from './permissions';
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

export function removeGuardMessage(messages: GuardMessage[], messageId: string): GuardMessage[] {
  return messages.filter((entry) => entry.id !== messageId);
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

/** Staff and active guards may read the all-guards community channel. */
export function canReadGuardChat(user: Pick<SessionUser, 'role'>): boolean {
  return isStaffRole(user.role) || user.role === 'guard';
}

/** Staff may moderate; only marketplace-active guards may post as guards. */
export function canPostToGuardChat(
  user: Pick<SessionUser, 'role'>,
  guard?: Pick<SecurityGuard, 'userStatus' | 'isStaff'> | null
): boolean {
  if (isStaffRole(user.role)) return true;
  if (user.role !== 'guard') return false;
  if (!guard) return false;
  return isGuardUserStatusActive(guard);
}

/** @deprecated Use canReadGuardChat / canPostToGuardChat */
export function canAccessGuardMessenger(role: PlatformRole): boolean {
  return role === 'guard' || isStaffRole(role);
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
