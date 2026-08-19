import {
  JobChatMessage,
  JobChatThread,
  SecurityGuard,
  SecurityRequest,
  SessionUser,
  SupportTicket,
} from '../types';
import { customerDisplayFallback } from './audienceLabels';
import { guardForRequest } from './clientShift';
import {
  formatJobChatGuardNames,
  approvedJobGuardIds,
  isJobChatEligible,
  isJobChatReadOnly,
  threadForRequest,
  threadsForClient,
} from './jobChat';
import { supportStatusLabel, ticketsForUser } from './support';

export type InboxChannelKind = 'job' | 'support' | 'report' | 'guard-community' | 'client-community' | 'staff-community';

export type InboxRow = {
  id: string;
  channel: InboxChannelKind;
  title: string;
  subtitle: string;
  preview: string;
  updatedAt: string;
  badge?: string;
  badgeTone?: 'default' | 'primary' | 'success' | 'warning';
  requestId?: string;
  ticketId?: string;
};

export function sortInboxRows(rows: InboxRow[]): InboxRow[] {
  return [...rows].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

function lastThreadMessage(messages: JobChatMessage[], threadId: string): JobChatMessage | null {
  const threadMessages = messages
    .filter((m) => m.threadId === threadId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return threadMessages[0] ?? null;
}

/** @deprecated use lastThreadMessage */
function lastJobMessage(messages: JobChatMessage[], threadId: string): JobChatMessage | null {
  return lastThreadMessage(messages, threadId);
}

export function buildClientInboxRows({
  currentUser,
  requests,
  guards,
  jobChatThreads,
  jobChatMessages,
  supportTickets,
}: {
  currentUser: SessionUser;
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  jobChatThreads: JobChatThread[];
  jobChatMessages: JobChatMessage[];
  supportTickets: SupportTicket[];
}): InboxRow[] {
  const rows: InboxRow[] = [];
  const requestById = new Map(requests.map((r) => [r.id, r]));
  const clientThreads = threadsForClient(jobChatThreads, currentUser.id);

  for (const thread of clientThreads) {
    const req = requestById.get(thread.requestId);
    if (!req) continue;
    const guardIds = approvedJobGuardIds(req);
    const guardLabel =
      guardIds.length > 1
        ? formatJobChatGuardNames(guardIds, guards)
        : (guardForRequest(guards, req)?.name ?? 'Assigned guard');
    const eligible = isJobChatEligible(req);
    const readOnly = isJobChatReadOnly(req) || thread.status === 'archived';
    const lastMessage = lastJobMessage(jobChatMessages, thread.id);
    rows.push({
      id: `job-${req.id}`,
      channel: 'job',
      title: req.title,
      subtitle: `${guardLabel} · ${req.siteName || req.location}`,
      preview: lastMessage?.body ?? 'Open conversation',
      updatedAt: lastMessage?.createdAt ?? thread.createdAt,
      badge: eligible ? 'Live' : readOnly ? 'Archived' : 'Active',
      badgeTone: eligible ? 'primary' : readOnly ? 'default' : 'success',
      requestId: req.id,
    });
  }

  for (const req of requests) {
    if (req.clientId !== currentUser.id) continue;
    if (!isJobChatEligible(req)) continue;
    if (threadForRequest(jobChatThreads, req.id)) continue;
    const guardIds = approvedJobGuardIds(req);
    const guardLabel =
      guardIds.length > 1
        ? formatJobChatGuardNames(guardIds, guards)
        : (guardForRequest(guards, req)?.name ?? 'Your guard');
    rows.push({
      id: `job-ready-${req.id}`,
      channel: 'job',
      title: req.title,
      subtitle: `${guardLabel} · ${req.siteName || req.location}`,
      preview: 'Start conversation',
      updatedAt: req.startDate,
      badge: 'Live',
      badgeTone: 'primary',
      requestId: req.id,
    });
  }

  for (const ticket of ticketsForUser(supportTickets, currentUser)) {
    const isReport = ticket.kind === 'report';
    const preview = isReport
      ? ticket.messages[0]?.body ?? 'Submitted report'
      : ticket.messages[ticket.messages.length - 1]?.body ?? 'Contact Guardr staff';
    rows.push({
      id: `support-${ticket.id}`,
      channel: isReport ? 'report' : 'support',
      title: ticket.subject,
      subtitle: isReport ? 'Formal report' : 'Guardr support',
      preview,
      updatedAt: ticket.updatedAt,
      badge: supportStatusLabel(ticket),
      badgeTone: ticket.status === 'resolved' ? 'default' : 'primary',
      ticketId: ticket.id,
    });
  }

  return sortInboxRows(rows);
}

export function clientMessagesBadge(
  threads: JobChatThread[],
  _tickets: SupportTicket[],
  user: SessionUser
): number {
  return threads.filter((t) => t.clientId === user.id && t.status === 'active').length;
}

export function clientSupportBadge(tickets: SupportTicket[], user: SessionUser): number {
  return ticketsForUser(tickets, user).filter((t) => t.kind === 'chat' && t.status !== 'resolved').length;
}

export function buildGuardJobInboxRows({
  jobs,
  jobChatThreads,
  jobChatMessages,
}: {
  jobs: Pick<SecurityRequest, 'id' | 'title' | 'siteName' | 'location' | 'status' | 'clientName' | 'startDate' | 'assignedGuardId' | 'guardSlots'>[];
  jobChatThreads: JobChatThread[];
  jobChatMessages: JobChatMessage[];
}): InboxRow[] {
  const rows: InboxRow[] = [];

  for (const job of jobs) {
    const thread = threadForRequest(jobChatThreads, job.id);
    const eligible = isJobChatEligible(job);
    const readOnly = isJobChatReadOnly(job) || thread?.status === 'archived';
    if (!eligible && !thread) continue;

    const lastMessage = thread ? lastJobMessage(jobChatMessages, thread.id) : null;
    rows.push({
      id: `job-${job.id}`,
      channel: 'job',
      title: job.title,
      subtitle: `${job.clientName ?? customerDisplayFallback()} · ${job.siteName || job.location}`,
      preview: lastMessage?.body ?? (eligible ? 'Start conversation' : 'View job chat history'),
      updatedAt: lastMessage?.createdAt ?? thread?.createdAt ?? job.startDate,
      badge: eligible ? 'Live' : readOnly ? 'Archived' : 'Active',
      badgeTone: eligible ? 'primary' : readOnly ? 'default' : 'success',
      requestId: job.id,
    });
  }

  return rows;
}

export function buildGuardSupportInboxRows({
  currentUser,
  supportTickets,
}: {
  currentUser: SessionUser;
  supportTickets: SupportTicket[];
}): InboxRow[] {
  return sortInboxRows(
    ticketsForUser(supportTickets, currentUser).map((ticket) => {
      const isReport = ticket.kind === 'report';
      const preview = isReport
        ? ticket.messages[0]?.body ?? 'Submitted report'
        : ticket.messages[ticket.messages.length - 1]?.body ?? 'Contact Guardr staff';
      return {
        id: `support-${ticket.id}`,
        channel: isReport ? 'report' : 'support',
        title: ticket.subject,
        subtitle: isReport ? 'Formal report' : 'Guardr support',
        preview,
        updatedAt: ticket.updatedAt,
        badge: supportStatusLabel(ticket),
        badgeTone: ticket.status === 'resolved' ? 'default' : 'primary',
        ticketId: ticket.id,
      };
    })
  );
}

export function buildStaffInboxRows({
  requests,
  guards,
  jobChatThreads,
  jobChatMessages,
  supportTickets,
  staffMessagesUpdatedAt,
  guardMessagesUpdatedAt,
  clientMessagesUpdatedAt,
}: {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  jobChatThreads: JobChatThread[];
  jobChatMessages: JobChatMessage[];
  supportTickets: SupportTicket[];
  staffMessagesUpdatedAt?: string;
  guardMessagesUpdatedAt?: string;
  clientMessagesUpdatedAt?: string;
}): InboxRow[] {
  const rows: InboxRow[] = [];

  rows.push({
    id: 'staff-community',
    channel: 'staff-community',
    title: 'Staff chat',
    subtitle: 'Internal team channel',
    preview: 'Message the Guardr operations team',
    updatedAt: staffMessagesUpdatedAt ?? new Date(0).toISOString(),
    badge: 'Team',
    badgeTone: 'primary',
  });

  rows.push({
    id: 'guard-community',
    channel: 'guard-community',
    title: 'Guard chat',
    subtitle: 'All-guards channel',
    preview: 'Community channel for active guards and staff',
    updatedAt: guardMessagesUpdatedAt ?? staffMessagesUpdatedAt ?? new Date(0).toISOString(),
    badge: 'Guards',
    badgeTone: 'default',
  });

  rows.push({
    id: 'client-community',
    channel: 'client-community',
    title: 'Customer chat',
    subtitle: 'All-clients channel',
    preview: 'Community channel for active clients and staff',
    updatedAt: clientMessagesUpdatedAt ?? staffMessagesUpdatedAt ?? new Date(0).toISOString(),
    badge: 'Customers',
    badgeTone: 'default',
  });

  const activeJobs = requests.filter(
    (r) =>
      isJobChatEligible(r) ||
      ((r.status === 'completed' || r.status === 'closed') && !!threadForRequest(jobChatThreads, r.id))
  );

  for (const job of activeJobs) {
    const thread = threadForRequest(jobChatThreads, job.id);
    if (!thread && job.status !== 'accepted' && job.status !== 'in-progress') continue;
    const guardLabel = formatJobChatGuardNames(approvedJobGuardIds(job), guards);
    const archived = job.status === 'completed' || job.status === 'closed';
    const lastMessage = thread ? lastJobMessage(jobChatMessages, thread.id) : null;
    const count = thread ? jobChatMessages.filter((m) => m.threadId === thread.id).length : 0;
    rows.push({
      id: `job-${job.id}`,
      channel: 'job',
      title: job.title,
      subtitle: `${job.clientName} ↔ ${guardLabel}`,
      preview: lastMessage?.body ?? (count > 0 ? `${count} messages` : archived ? 'Archived job chat' : 'Live job chat'),
      updatedAt: lastMessage?.createdAt ?? thread?.createdAt ?? job.startDate,
      badge: archived ? 'Archived' : 'Live',
      badgeTone: archived ? 'default' : 'primary',
      requestId: job.id,
    });
  }

  for (const ticket of [...supportTickets].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )) {
    const isReport = ticket.kind === 'report';
    const preview = isReport
      ? ticket.messages[0]?.body ?? 'Submitted report'
      : ticket.messages[ticket.messages.length - 1]?.body ?? 'Support conversation';
    rows.push({
      id: `support-${ticket.id}`,
      channel: isReport ? 'report' : 'support',
      title: ticket.subject,
      subtitle: `${ticket.userName} · ${ticket.kind === 'report' ? 'Report' : 'Support'}`,
      preview,
      updatedAt: ticket.updatedAt,
      badge: supportStatusLabel(ticket),
      badgeTone: ticket.status === 'resolved' ? 'default' : 'primary',
      ticketId: ticket.id,
    });
  }

  return sortInboxRows(rows);
}

export function staffMessagesBadge(
  jobChatThreads: JobChatThread[],
  _supportTickets: SupportTicket[] = [],
): number {
  return jobChatThreads.filter((t) => t.status === 'active').length;
}
