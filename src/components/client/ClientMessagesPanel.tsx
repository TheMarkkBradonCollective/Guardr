import React, { useMemo, useState, useEffect } from 'react';
import {
  JobChatMessage,
  JobChatThread,
  SecurityGuard,
  SecurityRequest,
  SessionUser,
  SupportTicket,
} from '../../types';
import { threadForRequest } from '../../lib/jobChat';
import {
  buildClientInboxRows,
  InboxRow,
} from '../../lib/messagesInbox';
import {
  categoryLabel,
  SUPPORT_STATUS_LABEL,
  supportStatusLabel,
  ticketsForUser,
} from '../../lib/support';
import { isStaffRole } from '../../lib/permissions';
import { JobChatPanel } from '../messaging/JobChatPanel';
import { ChatThreadPanel } from '../messaging/ChatThreadPanel';
import { MessagesHubLayout } from '../messaging/MessagesHubLayout';
import { MessagesQuickActions } from '../messaging/MessagesQuickActions';
import {
  AppChatHeader,
  AppInboxList,
  AppInboxRow,
} from '../ui/app/AppPrimitives';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge } from '../ui/wireframe';
import { FileText, LifeBuoy } from 'lucide-react';
import { guardForRequest } from '../../lib/clientShift';

interface ClientMessagesPanelProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  currentUser: SessionUser;
  jobChatThreads: JobChatThread[];
  jobChatMessages: JobChatMessage[];
  supportTickets: SupportTicket[];
  onSendJobChatMessage: (requestId: string, body: string) => void | Promise<void>;
  onSendSupportMessage: (ticketId: string, body: string) => void | Promise<void>;
  initialChatRequestId?: string | null;
  initialChatOpen?: boolean;
  onChatRequestIdChange?: (requestId: string | null) => void;
  onChatOpenChange?: (open: boolean) => void;
  initialSupportTicketId?: string | null;
  onSupportTicketIdChange?: (ticketId: string | null) => void;
  onOpenCompose?: () => void;
  onOpenReport?: () => void;
}

function formatInboxMeta(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ClientMessagesPanel({
  requests,
  guards,
  currentUser,
  jobChatThreads,
  jobChatMessages,
  supportTickets,
  onSendJobChatMessage,
  onSendSupportMessage,
  initialChatRequestId = null,
  initialChatOpen = false,
  onChatRequestIdChange,
  onChatOpenChange,
  initialSupportTicketId = null,
  onSupportTicketIdChange,
  onOpenCompose,
  onOpenReport,
}: ClientMessagesPanelProps) {
  const [chatRequestId, setChatRequestId] = useState<string | null>(initialChatRequestId);
  const [chatOpen, setChatOpen] = useState(initialChatOpen);
  const [supportTicketId, setSupportTicketId] = useState<string | null>(initialSupportTicketId);

  useEffect(() => {
    setChatRequestId(initialChatRequestId);
    setChatOpen(initialChatOpen);
  }, [initialChatRequestId, initialChatOpen]);

  useEffect(() => {
    setSupportTicketId(initialSupportTicketId);
  }, [initialSupportTicketId]);

  const requestById = useMemo(() => new Map(requests.map((r) => [r.id, r])), [requests]);
  const myTickets = useMemo(
    () => ticketsForUser(supportTickets, currentUser),
    [supportTickets, currentUser]
  );

  const inboxRows = useMemo(
    () =>
      buildClientInboxRows({
        currentUser,
        requests,
        guards,
        jobChatThreads,
        jobChatMessages,
        supportTickets,
      }),
    [currentUser, requests, guards, jobChatThreads, jobChatMessages, supportTickets]
  );

  const openJobChat = (requestId: string) => {
    setSupportTicketId(null);
    onSupportTicketIdChange?.(null);
    setChatRequestId(requestId);
    setChatOpen(true);
    onChatRequestIdChange?.(requestId);
    onChatOpenChange?.(true);
  };

  const closeJobChat = () => {
    setChatOpen(false);
    setChatRequestId(null);
    onChatRequestIdChange?.(null);
    onChatOpenChange?.(false);
  };

  const openSupportThread = (ticketId: string) => {
    closeJobChat();
    setSupportTicketId(ticketId);
    onSupportTicketIdChange?.(ticketId);
  };

  const closeSupportThread = () => {
    setSupportTicketId(null);
    onSupportTicketIdChange?.(null);
  };

  const openRow = (row: InboxRow) => {
    if (row.requestId) {
      openJobChat(row.requestId);
      return;
    }
    if (row.ticketId) {
      openSupportThread(row.ticketId);
    }
  };

  const clearSelection = () => {
    closeJobChat();
    closeSupportThread();
  };

  const chatRequest = chatRequestId ? requestById.get(chatRequestId) ?? null : null;
  const activeTicket = supportTicketId
    ? myTickets.find((t) => t.id === supportTicketId) ?? null
    : null;

  const hasSelection = !!(chatOpen && chatRequest) || !!activeTicket;

  const isRowSelected = (row: InboxRow): boolean => {
    if (row.requestId && chatOpen && chatRequestId === row.requestId) return true;
    if (row.ticketId && supportTicketId === row.ticketId) return true;
    return false;
  };

  const renderInboxIcon = (row: InboxRow) => {
    if (row.channel === 'job') {
      const req = row.requestId ? requestById.get(row.requestId) : null;
      const guard = req ? guardForRequest(guards, req) : null;
      return (
        <ProfileAvatar
          src={guard?.avatar}
          name={guard?.name ?? 'Guard'}
          size="md"
          className="shrink-0"
        />
      );
    }
    if (row.channel === 'report') {
      return <FileText className="w-5 h-5 shrink-0 text-brand-primary" strokeWidth={1.5} />;
    }
    return <LifeBuoy className="w-5 h-5 shrink-0 text-brand-primary" strokeWidth={1.5} />;
  };

  const header = (
    <>
      <div className="app-messages-hub-lead">
        <h2 className="text-base font-bold tracking-tight">Messages</h2>
        <p>Job chats and support conversations sorted by recent activity</p>
      </div>
      <MessagesQuickActions
        onContactSupport={onOpenCompose}
        onFileReport={onOpenReport}
        supportHint="Direct line to the Guardr operations team"
        reportHint="Safety concern, dispute, or formal complaint"
      />
    </>
  );

  const list = (
    <>
      {inboxRows.length === 0 ? (
        <p className="app-empty-state">
          Job chats and support conversations appear here, sorted by recent activity.
        </p>
      ) : (
        <AppInboxList>
          {inboxRows.map((row, i) => {
            const prevRow = i > 0 ? inboxRows[i - 1] : null;
            const sectionChanged = prevRow && prevRow.channel !== row.channel;
            const isFirstRow = i === 0;
            const showSection = isFirstRow || sectionChanged;

            const sectionLabel =
              row.channel === 'job'
                ? 'Job Chats'
                : row.channel === 'support' || row.channel === 'report'
                ? 'Support'
                : null;

            return (
              <React.Fragment key={row.id}>
                {showSection && sectionLabel && (
                  <div className="app-inbox-section-head">{sectionLabel}</div>
                )}
                <AppInboxRow
                  title={row.title}
                  subtitle={row.subtitle}
                  preview={row.preview}
                  meta={formatInboxMeta(row.updatedAt)}
                  leading={renderInboxIcon(row)}
                  selected={isRowSelected(row)}
                  badges={
                    row.badge ? (
                      <WfBadge tone={row.badgeTone ?? 'default'}>{row.badge}</WfBadge>
                    ) : undefined
                  }
                  onClick={() => openRow(row)}
                />
              </React.Fragment>
            );
          })}
        </AppInboxList>
      )}
    </>
  );

  const detailView = (() => {
    if (chatOpen && chatRequest) {
      return (
        <div className="h-full flex flex-col min-h-0 app-full-page-screen">
          <JobChatPanel
            request={chatRequest}
            thread={threadForRequest(jobChatThreads, chatRequest.id) ?? null}
            messages={jobChatMessages}
            currentUser={currentUser}
            onSend={(body) => onSendJobChatMessage(chatRequest.id, body)}
            onBack={clearSelection}
            hideBackOnDesktop
          />
        </div>
      );
    }

    if (activeTicket) {
      const isReport = activeTicket.kind === 'report';
      const threadSubtitle = isReport
        ? `${categoryLabel(activeTicket.category)} · ${supportStatusLabel(activeTicket)}`
        : `${categoryLabel(activeTicket.category)} · ${SUPPORT_STATUS_LABEL[activeTicket.status]}`;

      return (
        <div className="h-full flex flex-col bg-brand-bg min-h-0 app-full-page-screen">
          <AppChatHeader
            title={activeTicket.subject}
            subtitle={threadSubtitle}
            onBack={clearSelection}
            hideBackOnDesktop
          />
          <div className="flex-1 min-h-0">
            <ChatThreadPanel
              messages={activeTicket.messages.map((msg) => ({
                id: msg.id,
                senderId: msg.senderId,
                senderName: isStaffRole(msg.senderRole) ? 'Guardr staff' : msg.senderName,
                senderRole: msg.senderRole,
                body: msg.body,
                createdAt: msg.createdAt,
              }))}
              currentUserId={currentUser.id}
              onSend={(body) => onSendSupportMessage(activeTicket.id, body)}
              placeholder={isReport ? 'Add a follow-up note…' : 'Type a message to staff…'}
              readOnly={activeTicket.status === 'resolved'}
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

    return null;
  })();

  return (
    <div className="app-messages-hub h-full min-h-0">
      <MessagesHubLayout
        header={header}
        list={list}
        detail={detailView ?? <div />}
        hasSelection={hasSelection}
        emptyDetailTitle="Your conversations"
        emptyDetailHint="Select a job chat or support thread from the inbox"
      />
    </div>
  );
}
