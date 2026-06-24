import {
  JobChatMessage,
  JobChatThread,
  SecurityGuard,
  SecurityRequest,
  SessionUser,
  SupportTicket,
  TeamChatMessage,
  TeamChatThread,
} from '../types';
import { guardForRequest } from './clientShift';
import { isJobChatEligible, isJobChatReadOnly, threadForRequest, threadsForClient } from './jobChat';
import { isTeamChatEligible, isTeamChatReadOnly, threadForTeamRequest } from './teamChat';
import { guardHasJobTeamAssociation, getCrewDisplayName, isMultiGuardJob, teamRosterSummary } from './guardTeams';
import { supportStatusLabel, ticketsForUser } from './support';

export type InboxChannelKind = 'job' | 'team-crew' | 'support' | 'report' | 'guard-community' | 'staff-community';

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
    const guard = guardForRequest(guards, req);
    const eligible = isJobChatEligible(req);
    const readOnly = isJobChatReadOnly(req) || thread.status === 'archived';
    const lastMessage = lastJobMessage(jobChatMessages, thread.id);
    rows.push({
      id: `job-${req.id}`,
      channel: 'job',
      title: req.title,
      subtitle: `${guard?.name ?? 'Assigned guard'} · ${req.siteName || req.location}`,
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
    const guard = guardForRequest(guards, req);
    rows.push({
      id: `job-ready-${req.id}`,
      channel: 'job',
      title: req.title,
      subtitle: `${guard?.name ?? 'Your guard'} is assigned`,
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
  tickets: SupportTicket[],
  user: SessionUser
): number {
  const activeJobs = threads.filter((t) => t.clientId === user.id && t.status === 'active').length;
  const openSupport = ticketsForUser(tickets, user).filter(
    (t) => t.kind === 'chat' && t.status !== 'resolved'
  ).length;
  return activeJobs + openSupport;
}

export function buildGuardJobInboxRows({
  jobs,
  jobChatThreads,
  jobChatMessages,
}: {
  jobs: Pick<SecurityRequest, 'id' | 'title' | 'siteName' | 'location' | 'status' | 'clientName' | 'startDate' | 'assignedGuardId'>[];
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
      subtitle: `${job.clientName ?? 'Client'} · ${job.siteName || job.location}`,
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

export function buildGuardTeamInboxRows({
  jobs,
  guardId,
  guards = [],
  teamChatThreads,
  teamChatMessages,
}: {
  jobs: Pick<
    SecurityRequest,
    | 'id'
    | 'title'
    | 'siteName'
    | 'location'
    | 'status'
    | 'startDate'
    | 'guardsNeeded'
    | 'guardSlots'
    | 'teamLeadId'
    | 'crewName'
    | 'crewDescription'
  >[];
  guardId: string;
  guards?: Pick<SecurityGuard, 'id' | 'name'>[];
  teamChatThreads: TeamChatThread[];
  teamChatMessages: TeamChatMessage[];
}): InboxRow[] {
  const rows: InboxRow[] = [];

  for (const job of jobs) {
    if (!isMultiGuardJob(job)) continue;
    if (!guardHasJobTeamAssociation(job.guardSlots, guardId)) continue;
    const eligible = isTeamChatEligible(job);
    const readOnly = isTeamChatReadOnly(job);
    if (!eligible && !readOnly) continue;

    const thread = threadForTeamRequest(teamChatThreads, job.id);
    const lastMessage = thread ? lastThreadMessage(teamChatMessages, thread.id) : null;
    const summary = teamRosterSummary(job.guardSlots, job.guardsNeeded ?? 1);
    const coordinator = job.teamLeadId ? guards.find((g) => g.id === job.teamLeadId) : undefined;
    const crewTitle = getCrewDisplayName(job, coordinator?.name);
    const descPreview = job.crewDescription?.trim();
    rows.push({
      id: `team-${job.id}`,
      channel: 'team-crew',
      title: crewTitle,
      subtitle: `${job.siteName || job.location} · ${summary.filled}/${summary.total} crew`,
      preview:
        lastMessage?.body ??
        (descPreview ? descPreview.slice(0, 120) : eligible ? 'Coordinate with your crew' : 'View team chat history'),
      updatedAt: lastMessage?.createdAt ?? thread?.createdAt ?? job.startDate,
      badge: eligible ? 'Team' : readOnly ? 'Archived' : 'Active',
      badgeTone: eligible ? 'primary' : readOnly ? 'default' : 'success',
      requestId: job.id,
    });
  }

  return rows;
}

export function buildStaffInboxRows({
  requests,
  guards,
  jobChatThreads,
  jobChatMessages,
  teamChatThreads = [],
  teamChatMessages = [],
  supportTickets,
  staffMessagesUpdatedAt,
  guardMessagesUpdatedAt,
}: {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  jobChatThreads: JobChatThread[];
  jobChatMessages: JobChatMessage[];
  teamChatThreads?: TeamChatThread[];
  teamChatMessages?: TeamChatMessage[];
  supportTickets: SupportTicket[];
  staffMessagesUpdatedAt?: string;
  guardMessagesUpdatedAt?: string;
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
    preview: 'Read and monitor the guard community channel',
    updatedAt: guardMessagesUpdatedAt ?? staffMessagesUpdatedAt ?? new Date(0).toISOString(),
    badge: 'Guards',
    badgeTone: 'default',
  });

  const activeJobs = requests.filter(
    (r) =>
      r.assignedGuardId &&
      (r.status === 'accepted' || r.status === 'in-progress' || r.status === 'completed' || r.status === 'closed')
  );

  for (const job of activeJobs) {
    const thread = threadForRequest(jobChatThreads, job.id);
    if (!thread && job.status !== 'accepted' && job.status !== 'in-progress') continue;
    const guard = guards.find((g) => g.id === job.assignedGuardId);
    const archived = job.status === 'completed' || job.status === 'closed';
    const lastMessage = thread ? lastJobMessage(jobChatMessages, thread.id) : null;
    const count = thread ? jobChatMessages.filter((m) => m.threadId === thread.id).length : 0;
    rows.push({
      id: `job-${job.id}`,
      channel: 'job',
      title: job.title,
      subtitle: `${job.clientName} ↔ ${guard?.name ?? 'Guard'}`,
      preview: lastMessage?.body ?? (count > 0 ? `${count} messages` : archived ? 'Archived job chat' : 'Live job chat'),
      updatedAt: lastMessage?.createdAt ?? thread?.createdAt ?? job.startDate,
      badge: archived ? 'Archived' : 'Live',
      badgeTone: archived ? 'default' : 'primary',
      requestId: job.id,
    });
  }

  const multiGuardJobs = requests.filter(
    (r) =>
      isMultiGuardJob(r) &&
      (r.teamLeadId || (r.guardSlots ?? []).some((s) => s.guardId && s.status !== 'open')) &&
      (r.status === 'open' || r.status === 'accepted' || r.status === 'in-progress' || r.status === 'completed' || r.status === 'closed')
  );

  for (const job of multiGuardJobs) {
    const thread = threadForTeamRequest(teamChatThreads, job.id);
    if (!thread && job.status !== 'accepted' && job.status !== 'in-progress' && job.status !== 'open') continue;
    const archived = job.status === 'completed' || job.status === 'closed';
    const lastMessage = thread ? lastThreadMessage(teamChatMessages, thread.id) : null;
    const summary = teamRosterSummary(job.guardSlots, job.guardsNeeded ?? 1);
    const count = thread ? teamChatMessages.filter((m) => m.threadId === thread.id).length : 0;
    rows.push({
      id: `team-${job.id}`,
      channel: 'team-crew',
      title: `${job.title} · Crew chat`,
      subtitle: `${job.clientName} · ${summary.filled}/${summary.total} guards`,
      preview: lastMessage?.body ?? (count > 0 ? `${count} messages` : archived ? 'Archived crew chat' : 'Live crew chat'),
      updatedAt: lastMessage?.createdAt ?? thread?.createdAt ?? job.startDate,
      badge: archived ? 'Archived' : 'Crew',
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
  supportTickets: SupportTicket[]
): number {
  const jobs = jobChatThreads.filter((t) => t.status === 'active').length;
  const support = supportTickets.filter((t) => t.kind === 'chat' && t.status !== 'resolved').length;
  return jobs + support;
}
