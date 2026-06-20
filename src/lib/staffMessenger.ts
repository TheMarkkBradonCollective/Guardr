import { PlatformRole, StaffMessage, SessionUser } from '../types';
import { isStaffRole } from './permissions';

const STORAGE_KEY = 'guardr_staff_messages';

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
  return {
    id: `stmsg-${Date.now()}`,
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
