import {
  JobChatMessage,
  JobChatThreadStatus,
  SecurityRequest,
  SessionUser,
  TeamChatThread,
} from '../types';
import { isStaffRole } from './permissions';
import { guardHasJobTeamAssociation, isMultiGuardJob } from './guardTeams';

const STORAGE_THREADS = 'guardr_team_chat_threads';
const STORAGE_MESSAGES = 'guardr_team_chat_messages';

export type TeamChatMessage = JobChatMessage;

export function isTeamChatEligible(
  req: Pick<SecurityRequest, 'guardsNeeded' | 'teamLeadId' | 'guardSlots' | 'status'>
): boolean {
  if (!isMultiGuardJob(req)) return false;
  if (!req.teamLeadId && !(req.guardSlots ?? []).some((s) => s.guardId && s.status !== 'open')) {
    return false;
  }
  return req.status === 'open' || req.status === 'accepted' || req.status === 'in-progress';
}

export function isTeamChatReadOnly(req: Pick<SecurityRequest, 'status'>): boolean {
  return req.status === 'completed' || req.status === 'closed';
}

export function canParticipateInTeamChat(
  user: SessionUser,
  req: Pick<SecurityRequest, 'guardSlots' | 'status'>
): boolean {
  if (isTeamChatReadOnly(req)) return false;
  if (isStaffRole(user.role)) return true;
  if (user.role === 'guard' && guardHasJobTeamAssociation(req.guardSlots, user.id)) return true;
  return false;
}

export function loadTeamChatThreadsFromStorage(): TeamChatThread[] {
  try {
    const raw = localStorage.getItem(STORAGE_THREADS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTeamChatThreadsToStorage(threads: TeamChatThread[]): void {
  try {
    localStorage.setItem(STORAGE_THREADS, JSON.stringify(threads));
  } catch {
    /* ignore */
  }
}

export function loadTeamChatMessagesFromStorage(): TeamChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_MESSAGES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTeamChatMessagesToStorage(messages: TeamChatMessage[]): void {
  try {
    localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(messages));
  } catch {
    /* ignore */
  }
}

export function buildTeamChatThread(req: SecurityRequest): TeamChatThread {
  const now = new Date().toISOString();
  const leadId = req.teamLeadId ?? req.assignedGuardId ?? req.guardSlots?.find((s) => s.isLead)?.guardId ?? '';
  return {
    id: `tchat-${req.id}`,
    requestId: req.id,
    teamLeadId: leadId,
    status: 'active',
    createdAt: now,
  };
}

export function buildTeamChatMessage(
  thread: TeamChatThread,
  sender: SessionUser,
  body: string
): TeamChatMessage {
  return {
    id: `tmsg-${Date.now()}`,
    threadId: thread.id,
    senderId: sender.id,
    senderName: sender.name,
    senderRole: sender.role,
    body: body.trim(),
    createdAt: new Date().toISOString(),
  };
}

export function messagesForTeamThread(messages: TeamChatMessage[], threadId: string): TeamChatMessage[] {
  return messages
    .filter((m) => m.threadId === threadId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function threadForTeamRequest(threads: TeamChatThread[], requestId: string): TeamChatThread | undefined {
  return threads.find((t) => t.requestId === requestId);
}

export function teamChatRosterLabel(req: Pick<SecurityRequest, 'guardSlots' | 'guardsNeeded'>): string {
  const needed = req.guardsNeeded ?? 1;
  const filled = (req.guardSlots ?? []).filter((s) => s.guardId && s.status === 'approved').length;
  return `${filled}/${needed} on roster`;
}
