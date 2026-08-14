import { PlatformRole, ClientMessage, Client, SessionUser } from '../types';
import { isClientAccountActive } from './accountStatus';
import { isStaffRole } from './permissions';
import { ROLE_LABELS } from './permissions';

const STORAGE_KEY = 'guardr_client_messages';

export function mergeClientMessages(
  existing: ClientMessage[],
  incoming: ClientMessage[]
): ClientMessage[] {
  const byId = new Map<string, ClientMessage>();
  for (const message of existing) byId.set(message.id, message);
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function appendClientMessage(messages: ClientMessage[], message: ClientMessage): ClientMessage[] {
  if (messages.some((entry) => entry.id === message.id)) return messages;
  return mergeClientMessages(messages, [message]);
}

export function removeClientMessage(messages: ClientMessage[], messageId: string): ClientMessage[] {
  return messages.filter((entry) => entry.id !== messageId);
}

export function loadClientMessagesFromStorage(): ClientMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveClientMessagesToStorage(messages: ClientMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    /* ignore */
  }
}

/** Staff and clients may read the all-clients community channel. */
export function canReadClientChat(user: Pick<SessionUser, 'role'>): boolean {
  return isStaffRole(user.role) || user.role === 'client';
}

/** Staff may moderate; only active clients may post as clients. */
export function canPostToClientChat(
  user: Pick<SessionUser, 'role'>,
  client?: Pick<Client, 'accountStatus' | 'approved'> | null
): boolean {
  if (isStaffRole(user.role)) return true;
  if (user.role !== 'client') return false;
  if (!client) return false;
  return isClientAccountActive(client);
}

export function buildClientMessage(sender: SessionUser, body: string): ClientMessage {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? `clmsg-${crypto.randomUUID()}`
      : `clmsg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return {
    id,
    senderId: sender.id,
    senderName: sender.name,
    senderRole: sender.role,
    body: body.trim(),
    createdAt: new Date().toISOString(),
  };
}

export function sortedClientMessages(messages: ClientMessage[]): ClientMessage[] {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

/** Client chat bubble label — Guardr brand, role, then person's name. */
export function clientChatSenderLabel(role: PlatformRole, name: string): string {
  const roleLabel = ROLE_LABELS[role] ?? role;
  const displayName = name.trim() || 'Client';
  return `Guardr · ${roleLabel} · ${displayName}`;
}
