import React, { useMemo, useState } from 'react';
import {
  GuardMessage,
  JobChatMessage,
  JobChatThread,
  SecurityGuard,
  SecurityRequest,
  SessionUser,
  SupportTicket,
} from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { threadForRequest } from '../../lib/jobChat';
import {
  buildGuardJobInboxRows,
  buildGuardSupportInboxRows,
  InboxRow,
  sortInboxRows,
} from '../../lib/messagesInbox';
import {
  categoryLabel,
  SUPPORT_STATUS_LABEL,
  supportStatusLabel,
  ticketsForUser,
} from '../../lib/support';
import { isStaffRole } from '../../lib/permissions';
import { sortedGuardMessages } from '../../lib/guardMessenger';
import { JobChatPanel } from '../messaging/JobChatPanel';
import { ChatThreadPanel } from '../messaging/ChatThreadPanel';
import {
  AppChatHeader,
  AppInboxList,
  AppInboxRow,
  AppItemCard,
  AppItemCardStack,
  AppScreen,
} from '../ui/app/AppPrimitives';
import { WfBadge } from '../ui/wireframe';
import { ChevronRight, FileText, LifeBuoy, MessagesSquare } from 'lucide-react';

type ActiveView =
  | { kind: 'list' }
  | { kind: 'guard-channel' }
  | { kind: 'job'; requestId: string }
  | { kind: 'support'; ticketId: string };

interface GuardMessagesPanelProps {
  upcomingJobs: GuardJobView[];
  pastJobs: GuardJobView[];
  guard: SecurityGuard;
  currentUser: SessionUser;
  jobChatThreads: JobChatThread[];
  jobChatMessages: JobChatMessage[];
  guardMessages: GuardMessage[];
  supportTickets: SupportTicket[];
  onSendJobChatMessage?: (requestId: string, body: string) => void | Promise<void>;
  onSendGuardMessage?: (body: string) => void | Promise<void>;
  onSendSupportMessage?: (ticketId: string, body: string) => void | Promise<void>;
  onRefreshGuardMessages?: () => void | Promise<void>;
  initialJobChatRequestId?: string | null;
  initialJobChatOpen?: boolean;
  onJobChatRequestIdChange?: (requestId: string | null) => void;
  onJobChatOpenChange?: (open: boolean) => void;
  initialSupportTicketId?: string | null;
  onSupportTicketIdChange?: (ticketId: string | null) => void;
  onOpenSupportCompose?: () => void;
  onOpenSupportReport?: () => void;
}

export function GuardMessagesPanel({
  upcomingJobs,
  pastJobs,
  guard,
  currentUser,
  jobChatThreads,
  jobChatMessages,
  guardMessages,
  supportTickets,
  onSendJobChatMessage,
  onSendGuardMessage,
  onSendSupportMessage,
  onRefreshGuardMessages,
  initialJobChatRequestId = null,
  initialJobChatOpen = false,
  onJobChatRequestIdChange,
  onJobChatOpenChange,
  initialSupportTicketId = null,
  onSupportTicketIdChange,
  onOpenSupportCompose,
  onOpenSupportReport,
}: GuardMessagesPanelProps) {
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    if (initialJobChatOpen && initialJobChatRequestId) {
      return { kind: 'job', requestId: initialJobChatRequestId };
    }
    if (initialSupportTicketId) {
      return { kind: 'support', ticketId: initialSupportTicketId };
    }
    return { kind: 'list' };
  });

  const allJobs = useMemo(() => [...upcomingJobs, ...pastJobs], [upcomingJobs, pastJobs]);
  const jobById = useMemo(() => new Map(allJobs.map((j) => [j.id, j])), [allJobs]);
  const myTickets = useMemo(
    () => ticketsForUser(supportTickets, currentUser),
    [supportTickets, currentUser]
  );

  const guardChannelUpdatedAt = useMemo(() => {
    const sorted = sortedGuardMessages(guardMessages);
    return sorted[sorted.length - 1]?.createdAt ?? new Date(0).toISOString();
  }, [guardMessages]);

  const inboxRows = useMemo(() => {
    const rows: InboxRow[] = [
      {
        id: 'guard-community',
        channel: 'guard-community',
        title: 'Guard chat',
        subtitle: 'Community channel for all guards',
        preview: 'Message other guards on active shifts',
        updatedAt: guardChannelUpdatedAt,
        badge: 'Community',
        badgeTone: 'primary',
      },
      ...buildGuardJobInboxRows({
        jobs: allJobs,
        jobChatThreads,
        jobChatMessages,
      }),
      ...buildGuardSupportInboxRows({ currentUser, supportTickets }),
    ];
    return sortInboxRows(rows);
  }, [allJobs, jobChatThreads, jobChatMessages, supportTickets, currentUser, guardChannelUpdatedAt]);

  const openRow = (row: InboxRow) => {
    if (row.channel === 'guard-community') {
      setActiveView({ kind: 'guard-channel' });
      return;
    }
    if (row.requestId) {
      setActiveView({ kind: 'job', requestId: row.requestId });
      onJobChatRequestIdChange?.(row.requestId);
      onJobChatOpenChange?.(true);
      onSupportTicketIdChange?.(null);
      return;
    }
    if (row.ticketId) {
      setActiveView({ kind: 'support', ticketId: row.ticketId });
      onSupportTicketIdChange?.(row.ticketId);
      onJobChatOpenChange?.(false);
      onJobChatRequestIdChange?.(null);
    }
  };

  const backToList = () => {
    setActiveView({ kind: 'list' });
    onJobChatOpenChange?.(false);
    onJobChatRequestIdChange?.(null);
    onSupportTicketIdChange?.(null);
  };

  if (activeView.kind === 'guard-channel' && onSendGuardMessage) {
    return (
      <div className="h-full flex flex-col min-h-0 app-full-page-screen">
        <AppChatHeader
          title="Guard chat"
          subtitle="Community channel — not visible to clients or staff"
          onBack={backToList}
        />
        <div className="flex-1 min-h-0">
          <ChatThreadPanel
            messages={sortedGuardMessages(guardMessages)}
            currentUserId={currentUser.id}
            onSend={onSendGuardMessage}
            placeholder="Message other guards…"
            teamChat
            guardChatLabels
          />
        </div>
      </div>
    );
  }

  if (activeView.kind === 'job' && onSendJobChatMessage) {
    const job = jobById.get(activeView.requestId);
    if (job) {
      return (
        <div className="h-full flex flex-col min-h-0 app-full-page-screen">
          <JobChatPanel
            request={job}
            thread={threadForRequest(jobChatThreads, job.id) ?? null}
            messages={jobChatMessages}
            currentUser={currentUser}
            onSend={(body) => onSendJobChatMessage(job.id, body)}
            onBack={backToList}
          />
        </div>
      );
    }
  }

  if (activeView.kind === 'support' && onSendSupportMessage) {
    const ticket = myTickets.find((t) => t.id === activeView.ticketId);
    if (ticket) {
      const isReport = ticket.kind === 'report';
      const threadSubtitle = isReport
        ? `${categoryLabel(ticket.category)} · ${supportStatusLabel(ticket)}`
        : `${categoryLabel(ticket.category)} · ${SUPPORT_STATUS_LABEL[ticket.status]}`;

      return (
        <div className="h-full flex flex-col min-h-0 bg-brand-bg app-full-page-screen">
          <AppChatHeader title={ticket.subject} subtitle={threadSubtitle} onBack={backToList} />
          <div className="flex-1 min-h-0">
            <ChatThreadPanel
              messages={ticket.messages.map((msg) => ({
                id: msg.id,
                senderId: msg.senderId,
                senderName: isStaffRole(msg.senderRole) ? 'Guardr staff' : msg.senderName,
                senderRole: msg.senderRole,
                body: msg.body,
                createdAt: msg.createdAt,
              }))}
              currentUserId={currentUser.id}
              onSend={(body) => onSendSupportMessage(ticket.id, body)}
              placeholder={isReport ? 'Add a follow-up note…' : 'Type a message to staff…'}
              readOnly={ticket.status === 'resolved'}
              readOnlyMessage={
                isReport
                  ? 'This report is closed. File a new report if you need further help.'
                  : 'This conversation is resolved. Contact support again if you need more help.'
              }
            />
          </div>
        </div>
      );
    }
  }

  return (
    <AppScreen>
      <div className="px-5 pt-2 pb-4 border-b border-brand-border">
        <AppItemCardStack>
          <AppItemCard onClick={() => onOpenSupportCompose?.()}>
            <LifeBuoy className="w-5 h-5 shrink-0 text-brand-primary" strokeWidth={1.5} />
            <div className="flex-1 min-w-0 text-left">
              <p className="font-semibold text-sm">Contact support</p>
              <p className="text-sm text-brand-text-muted mt-0.5">Direct line to Guardr operations</p>
            </div>
            <ChevronRight className="w-5 h-5 text-brand-text-muted shrink-0" />
          </AppItemCard>
          <AppItemCard onClick={() => onOpenSupportReport?.()}>
            <FileText className="w-5 h-5 shrink-0 text-brand-primary" strokeWidth={1.5} />
            <div className="flex-1 min-w-0 text-left">
              <p className="font-semibold text-sm">File a report</p>
              <p className="text-sm text-brand-text-muted mt-0.5">Safety concern or formal complaint</p>
            </div>
            <ChevronRight className="w-5 h-5 text-brand-text-muted shrink-0" />
          </AppItemCard>
        </AppItemCardStack>
      </div>

      {inboxRows.length === 0 ? (
        <p className="app-empty-state">Conversations appear here sorted by recent activity.</p>
      ) : (
        <AppInboxList>
          {inboxRows.map((row) => (
            <AppInboxRow
              key={row.id}
              title={row.title}
              preview={row.preview}
              meta={new Date(row.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
              leading={
                row.channel === 'guard-community' ? (
                  <MessagesSquare className="w-5 h-5 text-brand-primary" />
                ) : row.channel === 'report' ? (
                  <FileText className="w-5 h-5 text-brand-primary" />
                ) : row.channel === 'support' ? (
                  <LifeBuoy className="w-5 h-5 text-brand-primary" />
                ) : undefined
              }
              badges={row.badge ? <WfBadge tone={row.badgeTone ?? 'default'}>{row.badge}</WfBadge> : undefined}
              onClick={() => openRow(row)}
            />
          ))}
        </AppInboxList>
      )}
    </AppScreen>
  );
}
