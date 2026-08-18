import React, { useMemo, useState, useEffect } from 'react';
import {
  ClientMessage,
  JobChatMessage,
  JobChatThread,
  SecurityGuard,
  SecurityRequest,
  SessionUser,
  SupportTicket,
} from '../../types';
import { threadForRequest } from '../../lib/jobChat';
import { buildClientInboxRows, InboxRow } from '../../lib/messagesInbox';
import {
  categoryLabel,
  SUPPORT_STATUS_LABEL,
  supportStatusLabel,
  ticketsForUser,
} from '../../lib/support';
import { sortedClientMessages, canPostToClientChat } from '../../lib/clientMessenger';
import { canDeleteChatMessage } from '../../lib/chatPermissions';
import { JobChatPanel } from '../messaging/JobChatPanel';
import { ChatThreadPanel, type ChatBubbleMessage } from '../messaging/ChatThreadPanel';
import { MessagesHubLayout } from '../messaging/MessagesHubLayout';
import { MessagesInboxTabs } from '../messaging/MessagesInboxTabs';
import { MessagesQuickActions } from '../messaging/MessagesQuickActions';
import {
  AppChatHeader,
  AppEmptyState,
  AppInboxList,
  AppInboxRow,
} from '../ui/app/AppPrimitives';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge } from '../ui/wireframe';
import { Briefcase, FileText, LifeBuoy, MessageCircle, MessagesSquare } from 'lucide-react';
import { useLayoutFormFactor } from '../../surfaces';
import { guardForRequest } from '../../lib/clientShift';
import { EMPTY_MESSAGES_CHROME, type MessagesChrome } from '../../lib/messagesChrome';

type ActiveView =
  | { kind: 'list' }
  | { kind: 'client-channel' }
  | { kind: 'job'; requestId: string }
  | { kind: 'support'; ticketId: string };

type InboxTab = 'chats' | 'jobs' | 'support' | 'reports';

interface ClientMessagesPanelProps {
  scope?: 'messages' | 'support';
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  currentUser: SessionUser;
  accountStatus?: 'pending' | 'active' | 'suspended';
  approved?: boolean;
  jobChatThreads: JobChatThread[];
  jobChatMessages: JobChatMessage[];
  clientMessages: ClientMessage[];
  supportTickets: SupportTicket[];
  onSendJobChatMessage: (requestId: string, body: string) => void | Promise<void>;
  onSendSupportMessage: (ticketId: string, body: string) => void | Promise<void>;
  onSendClientMessage?: (body: string) => void | Promise<void>;
  onDeleteClientMessage?: (messageId: string) => void | Promise<void>;
  onDeleteJobChatMessage?: (messageId: string) => void | Promise<void>;
  onDeleteSupportMessage?: (ticketId: string, messageId: string) => void | Promise<void>;
  onRefreshClientMessages?: () => void | Promise<void>;
  initialChatRequestId?: string | null;
  initialChatOpen?: boolean;
  onChatRequestIdChange?: (requestId: string | null) => void;
  onChatOpenChange?: (open: boolean) => void;
  initialSupportTicketId?: string | null;
  onSupportTicketIdChange?: (ticketId: string | null) => void;
  onOpenCompose?: () => void;
  onOpenReport?: () => void;
  onDetailOpenChange?: (open: boolean) => void;
  onMessagesChromeChange?: (chrome: MessagesChrome) => void;
  shellHeaderTrailing?: React.ReactNode;
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
  accountStatus,
  approved,
  jobChatThreads,
  jobChatMessages,
  clientMessages,
  supportTickets,
  onSendJobChatMessage,
  onSendSupportMessage,
  onSendClientMessage,
  onDeleteClientMessage,
  onDeleteJobChatMessage,
  onDeleteSupportMessage,
  onRefreshClientMessages,
  initialChatRequestId = null,
  initialChatOpen = false,
  onChatRequestIdChange,
  onChatOpenChange,
  initialSupportTicketId = null,
  onSupportTicketIdChange,
  onOpenCompose,
  onOpenReport,
  onDetailOpenChange,
  onMessagesChromeChange,
  shellHeaderTrailing,
  scope = 'messages',
}: ClientMessagesPanelProps) {
  const formFactor = useLayoutFormFactor();
  const splitView = formFactor === 'tablet' || formFactor === 'desktop';

  const [activeView, setActiveView] = useState<ActiveView>(() => {
    if (initialChatOpen && initialChatRequestId) {
      return { kind: 'job', requestId: initialChatRequestId };
    }
    if (initialSupportTicketId) {
      return { kind: 'support', ticketId: initialSupportTicketId };
    }
    return { kind: 'list' };
  });

  const isSupportScope = scope === 'support';

  const [activeTab, setActiveTab] = useState<InboxTab>(() => {
    if (isSupportScope || initialSupportTicketId) return 'support';
    if (initialChatOpen || initialChatRequestId) return 'jobs';
    return 'chats';
  });

  useEffect(() => {
    if (!initialChatRequestId) return;
    setActiveTab('jobs');
    setActiveView({ kind: 'job', requestId: initialChatRequestId });
  }, [initialChatRequestId]);

  const requestById = useMemo(() => new Map(requests.map((r) => [r.id, r])), [requests]);
  const myTickets = useMemo(
    () => ticketsForUser(supportTickets, currentUser),
    [supportTickets, currentUser]
  );

  useEffect(() => {
    if (!initialSupportTicketId) return;
    const ticket = myTickets.find((t) => t.id === initialSupportTicketId);
    setActiveTab(ticket?.kind === 'report' ? 'reports' : 'support');
    setActiveView({ kind: 'support', ticketId: initialSupportTicketId });
  }, [initialSupportTicketId, myTickets]);

  const clientChannelUpdatedAt = useMemo(() => {
    const sorted = sortedClientMessages(clientMessages);
    return sorted[sorted.length - 1]?.createdAt ?? new Date(0).toISOString();
  }, [clientMessages]);

  const communityRow: InboxRow = {
    id: 'client-community',
    channel: 'client-community',
    title: 'Client chat',
    subtitle: '',
    preview: '',
    updatedAt: clientChannelUpdatedAt,
    badge: 'Community',
    badgeTone: 'primary',
  };

  const jobRows = useMemo(
    () =>
      buildClientInboxRows({
        currentUser,
        requests,
        guards,
        jobChatThreads,
        jobChatMessages,
        supportTickets,
      }).filter((r) => r.channel === 'job'),
    [currentUser, requests, guards, jobChatThreads, jobChatMessages, supportTickets]
  );

  const supportRowsAll = useMemo(
    () =>
      buildClientInboxRows({
        currentUser,
        requests,
        guards,
        jobChatThreads,
        jobChatMessages,
        supportTickets,
      }).filter((r) => r.channel === 'support' || r.channel === 'report'),
    [currentUser, requests, guards, jobChatThreads, jobChatMessages, supportTickets]
  );

  const tabRows = useMemo((): InboxRow[] => {
    if (isSupportScope) {
      return supportRowsAll.filter((r) =>
        activeTab === 'reports' ? r.channel === 'report' : r.channel === 'support'
      );
    }
    switch (activeTab) {
      case 'chats': return [communityRow];
      case 'jobs': return jobRows;
      case 'support': return supportRowsAll;
    }
  }, [activeTab, communityRow, isSupportScope, jobRows, supportRowsAll]);

  const openRow = (row: InboxRow) => {
    if (row.channel === 'client-community') {
      setActiveView({ kind: 'client-channel' });
      onChatRequestIdChange?.(null);
      onChatOpenChange?.(false);
      onSupportTicketIdChange?.(null);
      return;
    }
    if (row.requestId) {
      setActiveView({ kind: 'job', requestId: row.requestId });
      onChatRequestIdChange?.(row.requestId);
      onChatOpenChange?.(true);
      onSupportTicketIdChange?.(null);
      return;
    }
    if (row.ticketId) {
      setActiveView({ kind: 'support', ticketId: row.ticketId });
      onSupportTicketIdChange?.(row.ticketId);
      onChatRequestIdChange?.(null);
      onChatOpenChange?.(false);
    }
  };

  const backToList = () => {
    setActiveView({ kind: 'list' });
    onChatOpenChange?.(false);
    onChatRequestIdChange?.(null);
    onSupportTicketIdChange?.(null);
  };

  const isRowSelected = (row: InboxRow): boolean => {
    if (row.channel === 'client-community' && activeView.kind === 'client-channel') return true;
    if (row.requestId && activeView.kind === 'job' && activeView.requestId === row.requestId) return true;
    if (row.ticketId && activeView.kind === 'support' && activeView.ticketId === row.ticketId) return true;
    return false;
  };

  const hasSelection = activeView.kind !== 'list';
  const embedHeaderInShell = !splitView && hasSelection;

  useEffect(() => {
    onDetailOpenChange?.(formFactor === 'mobile' && hasSelection);
  }, [formFactor, hasSelection, onDetailOpenChange]);

  const renderInboxIcon = (row: InboxRow) => {
    if (row.channel === 'client-community') {
      return <MessagesSquare className="w-5 h-5 text-brand-primary" />;
    }
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
    if (row.channel === 'report') return <FileText className="w-5 h-5 shrink-0 text-brand-primary" strokeWidth={1.5} />;
    return <LifeBuoy className="w-5 h-5 shrink-0 text-brand-primary" strokeWidth={1.5} />;
  };

  const header = isSupportScope ? (
    <MessagesInboxTabs
      activeTab={activeTab}
      onTabChange={(tabId) => {
        setActiveTab(tabId as InboxTab);
        setActiveView({ kind: 'list' });
        onSupportTicketIdChange?.(null);
      }}
      tabs={[
        { id: 'support', label: 'Support', icon: <LifeBuoy className="w-3.5 h-3.5" strokeWidth={2} /> },
        { id: 'reports', label: 'Reports', icon: <FileText className="w-3.5 h-3.5" strokeWidth={2} /> },
      ]}
    />
  ) : (
    <MessagesInboxTabs
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as InboxTab)}
      tabs={[
        { id: 'chats', label: 'Chats', icon: <MessagesSquare className="w-3.5 h-3.5" strokeWidth={2} /> },
        { id: 'jobs', label: 'Jobs', icon: <Briefcase className="w-3.5 h-3.5" strokeWidth={2} /> },
      ]}
    />
  );

  useEffect(() => {
    if (!onMessagesChromeChange) return;

    const extension = !embedHeaderInShell ? header : null;
    let override: React.ReactNode | null = null;

    if (embedHeaderInShell) {
      if (activeView.kind === 'client-channel') {
        override = (
          <AppChatHeader
            title="Client chat"
            onBack={backToList}
            trailing={shellHeaderTrailing}
          />
        );
      } else if (activeView.kind === 'job') {
        const chatRequest = requestById.get(activeView.requestId);
        if (chatRequest) {
          override = (
            <AppChatHeader
              title={chatRequest.title}
              subtitle={chatRequest.location ?? undefined}
              onBack={backToList}
              trailing={shellHeaderTrailing}
            />
          );
        }
      } else if (activeView.kind === 'support') {
        const ticket = myTickets.find((t) => t.id === activeView.ticketId);
        if (ticket) {
          const isReport = ticket.kind === 'report';
          const threadSubtitle = isReport
            ? `${categoryLabel(ticket.category)} · ${supportStatusLabel(ticket)}`
            : `${categoryLabel(ticket.category)} · ${SUPPORT_STATUS_LABEL[ticket.status]}`;

          override = (
            <AppChatHeader
              title={ticket.subject}
              subtitle={threadSubtitle}
              onBack={backToList}
              trailing={shellHeaderTrailing}
            />
          );
        }
      }
    }

    onMessagesChromeChange({ extension, override });
    return () => onMessagesChromeChange(EMPTY_MESSAGES_CHROME);
  }, [
    onMessagesChromeChange,
    embedHeaderInShell,
    activeTab,
    jobRows.length,
    supportRowsAll.length,
    activeView,
    requestById,
    myTickets,
    shellHeaderTrailing,
  ]);

  const list = (
    <>
      {(isSupportScope || activeTab === 'support') && (
        <MessagesQuickActions
          onContactSupport={onOpenCompose}
          onFileReport={onOpenReport}
        />
      )}

      {tabRows.length === 0 ? (
        <AppEmptyState
          dashed
          icon={<MessageCircle className="w-5 h-5" />}
          title={
            isSupportScope
              ? activeTab === 'reports'
                ? 'No reports yet'
                : 'No support conversations'
              : activeTab === 'jobs'
                ? 'No job chats yet'
                : activeTab === 'support'
                  ? 'No support conversations'
                  : 'No conversations yet'
          }
        >
          {isSupportScope
            ? activeTab === 'reports'
              ? 'Use the button above to file a report.'
              : 'Use the buttons above to contact support or file a report.'
            : activeTab === 'jobs'
            ? 'Job chats appear here once a guard is assigned to your booking.'
            : activeTab === 'support'
              ? 'Use the buttons above to contact support or file a report.'
              : 'Community messages will appear here.'}
        </AppEmptyState>
      ) : (
        <AppInboxList>
          {tabRows.map((row) => (
            <AppInboxRow
              key={row.id}
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
          ))}
        </AppInboxList>
      )}
    </>
  );

  const clientRecord = { accountStatus, approved };
  const canPostClientChat = canPostToClientChat(currentUser, clientRecord);

  const detailView = (() => {
    if (activeView.kind === 'client-channel') {
      return (
        <div className="h-full flex flex-col min-h-0 app-full-page-screen">
          {!embedHeaderInShell && (
            <AppChatHeader
              title="Client chat"
              subtitle="All active clients and staff"
              onBack={backToList}
              hideBackOnDesktop
            />
          )}
          <div className="flex-1 min-h-0">
            <ChatThreadPanel
              messages={sortedClientMessages(clientMessages)}
              currentUserId={currentUser.id}
              viewerRole={currentUser.role}
              onSend={canPostClientChat ? onSendClientMessage : undefined}
              onDeleteMessage={onDeleteClientMessage}
              canDeleteMessage={(msg: ChatBubbleMessage) =>
                canDeleteChatMessage(currentUser, msg, 'client')
              }
              placeholder="Message the client community…"
              teamChat
              clientChatLabels
              readOnly={!canPostClientChat}
              readOnlyMessage="Client chat opens once your account is active on Guardr."
            />
          </div>
        </div>
      );
    }

    if (activeView.kind === 'job') {
      const chatRequest = requestById.get(activeView.requestId);
      if (chatRequest) {
        return (
          <div className="h-full flex flex-col min-h-0 app-full-page-screen">
            <JobChatPanel
              request={chatRequest}
              thread={threadForRequest(jobChatThreads, chatRequest.id) ?? null}
              messages={jobChatMessages}
              currentUser={currentUser}
              onSend={(body) => onSendJobChatMessage(chatRequest.id, body)}
              onDeleteMessage={onDeleteJobChatMessage}
              onBack={backToList}
              hideBackOnDesktop
              hideShellHeader={embedHeaderInShell}
            />
          </div>
        );
      }
    }

    if (activeView.kind === 'support') {
      const activeTicket = myTickets.find((t) => t.id === activeView.ticketId);
      if (activeTicket) {
        const isReport = activeTicket.kind === 'report';
        const threadSubtitle = isReport
          ? `${categoryLabel(activeTicket.category)} · ${supportStatusLabel(activeTicket)}`
          : `${categoryLabel(activeTicket.category)} · ${SUPPORT_STATUS_LABEL[activeTicket.status]}`;

        return (
          <div className="h-full flex flex-col bg-brand-bg min-h-0 app-full-page-screen">
            {!embedHeaderInShell && (
              <AppChatHeader
                title={activeTicket.subject}
                subtitle={threadSubtitle}
                onBack={backToList}
                hideBackOnDesktop
              />
            )}
            <div className="flex-1 min-h-0">
              <ChatThreadPanel
                messages={activeTicket.messages.map((msg) => ({
                  id: msg.id,
                  senderId: msg.senderId,
                  senderName: msg.senderName,
                  senderRole: msg.senderRole,
                  body: msg.body,
                  createdAt: msg.createdAt,
                }))}
                currentUserId={currentUser.id}
                viewerRole={currentUser.role}
                onSend={(body) => onSendSupportMessage(activeTicket.id, body)}
                onDeleteMessage={
                  onDeleteSupportMessage
                    ? (messageId) => onDeleteSupportMessage(activeTicket.id, messageId)
                    : undefined
                }
                canDeleteMessage={(msg: ChatBubbleMessage) =>
                  canDeleteChatMessage(currentUser, msg, 'support')
                }
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
    }

    return null;
  })();

  useEffect(() => {
    if (activeView.kind === 'client-channel') {
      void onRefreshClientMessages?.();
    }
  }, [activeView.kind, onRefreshClientMessages]);

  return (
    <div className="app-messages-hub h-full min-h-0">
      <MessagesHubLayout
        header={header}
        list={list}
        detail={detailView ?? <div />}
        hasSelection={hasSelection && !!detailView}
        shellInboxHeader
        emptyDetailTitle={isSupportScope ? 'Your support conversations' : 'Your conversations'}
        emptyDetailHint={
          isSupportScope
            ? 'Select a support chat or report from the inbox'
            : 'Select client chat, a job thread, or support from the inbox'
        }
      />
    </div>
  );
}
