import { JobChatMessage, JobChatThread, PlatformRole, SecurityRequest, SessionUser } from '../types';
import { isStaffRole } from './permissions';

const STORAGE_THREADS = 'guardr_job_chat_threads';
const STORAGE_MESSAGES = 'guardr_job_chat_messages';

export function isJobChatEligible(req: Pick<SecurityRequest, 'status' | 'assignedGuardId'>): boolean {
  return (
    !!req.assignedGuardId &&
    (req.status === 'accepted' || req.status === 'in-progress')
  );
}

export function isJobChatReadOnly(req: Pick<SecurityRequest, 'status'>): boolean {
  return req.status === 'completed' || req.status === 'closed';
}

export function canParticipateInJobChat(
  user: SessionUser,
  req: Pick<SecurityRequest, 'clientId' | 'assignedGuardId' | 'status'>
): boolean {
  if (isJobChatReadOnly(req)) return false;
  if (isStaffRole(user.role)) return true;
  if (user.role === 'client' && user.id === req.clientId) return true;
  if (user.role === 'guard' && user.id === req.assignedGuardId) return true;
  return false;
}

export function loadJobChatThreadsFromStorage(): JobChatThread[] {
  try {
    const raw = localStorage.getItem(STORAGE_THREADS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveJobChatThreadsToStorage(threads: JobChatThread[]): void {
  try {
    localStorage.setItem(STORAGE_THREADS, JSON.stringify(threads));
  } catch {
    /* ignore */
  }
}

export function loadJobChatMessagesFromStorage(): JobChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_MESSAGES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveJobChatMessagesToStorage(messages: JobChatMessage[]): void {
  try {
    localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(messages));
  } catch {
    /* ignore */
  }
}

export function buildJobChatThread(req: SecurityRequest): JobChatThread {
  const now = new Date().toISOString();
  return {
    id: `jchat-${req.id}`,
    requestId: req.id,
    clientId: req.clientId,
    guardId: req.assignedGuardId!,
    status: 'active',
    createdAt: now,
  };
}

export function buildJobChatMessage(
  thread: JobChatThread,
  sender: SessionUser,
  body: string
): JobChatMessage {
  return {
    id: `jmsg-${Date.now()}`,
    threadId: thread.id,
    senderId: sender.id,
    senderName: sender.name,
    senderRole: sender.role,
    body: body.trim(),
    createdAt: new Date().toISOString(),
  };
}

export function messagesForThread(messages: JobChatMessage[], threadId: string): JobChatMessage[] {
  return messages
    .filter((m) => m.threadId === threadId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function threadForRequest(threads: JobChatThread[], requestId: string): JobChatThread | undefined {
  return threads.find((t) => t.requestId === requestId);
}

export function canOpenJobChatForRequest(
  req: Pick<SecurityRequest, 'id' | 'status' | 'assignedGuardId'>,
  jobChatThreads: JobChatThread[]
): boolean {
  return (
    isJobChatEligible(req) ||
    (isJobChatReadOnly(req) && !!threadForRequest(jobChatThreads, req.id))
  );
}

export function jobChatActionLabel(req: Pick<SecurityRequest, 'status'>): string {
  if (req.status === 'in-progress') return 'Message guard on shift';
  if (req.status === 'accepted') return 'Message guard';
  return 'View job chat history';
}

/** Best job to open when messaging a guard from their profile or directory. */
export function findMessageableRequestForGuard(
  clientId: string,
  guardId: string,
  requests: SecurityRequest[],
  jobChatThreads: JobChatThread[]
): SecurityRequest | null {
  const shared = requests.filter(
    (r) => r.clientId === clientId && r.assignedGuardId === guardId
  );

  const live = shared.filter(isJobChatEligible);
  if (live.length > 0) {
    return live.sort((a, b) => {
      if (a.status === 'in-progress' && b.status !== 'in-progress') return -1;
      if (b.status === 'in-progress' && a.status !== 'in-progress') return 1;
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    })[0];
  }

  const archived = shared
    .filter((r) => isJobChatReadOnly(r) && threadForRequest(jobChatThreads, r.id))
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  return archived[0] ?? null;
}

export function activeJobChatCount(threads: JobChatThread[]): number {
  return threads.filter((t) => t.status === 'active').length;
}

export function threadsForClient(threads: JobChatThread[], clientId: string): JobChatThread[] {
  return threads
    .filter((t) => t.clientId === clientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function clientActiveJobChatCount(threads: JobChatThread[], clientId: string): number {
  return threads.filter((t) => t.clientId === clientId && t.status === 'active').length;
}

export function isStaffSender(role: PlatformRole): boolean {
  return isStaffRole(role);
}

export function senderLabel(role: PlatformRole, name: string): string {
  if (isStaffRole(role)) return `Guardr staff (${name})`;
  return name;
}
