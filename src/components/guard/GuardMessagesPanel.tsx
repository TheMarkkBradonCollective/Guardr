import React, { useEffect, useMemo, useState } from 'react';
import {
  GuardMessage,
  JobChatMessage,
  JobChatThread,
  SecurityGuard,
  SessionUser,
  SupportTicket,
} from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { threadForRequest } from '../../lib/jobChat';
import {
  buildGuardJobInboxRows,
  buildGuardSupportInboxRows,
  InboxRow,
} from '../../lib/messagesInbox';
import {
  categoryLabel,
  SUPPORT_STATUS_LABEL,
  supportStatusLabel,
  ticketsForUser,
} from '../../lib/support';
import { sortedGuardMessages, canPostToGuardChat } from '../../lib/guardMessenger';
import { JobChatPanel } from '../messaging/JobChatPanel';
import { ChatThreadPanel } from '../messaging/ChatThreadPanel';
import { MessagesHubLayout } from '../messaging/MessagesHubLayout';
import { MessagesInboxTabs } from '../messaging/MessagesInboxTabs';
import { MessagesQuickActions } from '../messaging/MessagesQuickActions';
import { useDevice } from '../../lib/platform';
import {
  AppChatHeader,
  AppEmptyState,
  AppInboxList,
  AppInboxRow,
} from '../ui/app/AppPrimitives';
import { WfBadge } from '../ui/wireframe';
import { Briefcase, FileText, LifeBuoy, MessageCircle, MessagesSquare } from 'lucide-react';
import { EMPTY_MESSAGES_CHROME, type MessagesChrome } from '../../lib/messagesChrome';

type ActiveView =
  | { kind: 'list' }
  | { kind: 'guard-channel' }
  | { kind: 'job'; requestId: string }
  | { kind: 'support'; ticketId: string };

type InboxTab = 'chats' | 'jobs' | 'support' | 'reports';

interface GuardMessagesPanelProps {
  scope?: 'messages' | 'support';
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
  initialJobChatRequestId = null,
  initialJobChatOpen = false,
  onJobChatRequestIdChange,
  onJobChatOpenChange,
  initialSupportTicketId = null,
  onSupportTicketIdChange,
  onOpenSupportCompose,
  onOpenSupportReport,
  onDetailOpenChange,
  onMessagesChromeChange,
  shellHeaderTrailing,
  scope = 'messages',
}: GuardMessagesPanelProps) {
  const { formFactor } = useDevice();
  const splitView = formFactor === 'tablet' || formFactor === 'desktop';
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    if (initialJobChatOpen && initialJobChatRequestId) {
      return { kind: 'job', requestId: initialJobChatRequestId };
    }
    if (initialSupportTicketId) {
      return { kind: 'support', ticketId: initialSupportTicketId };
    }
    return { kind: 'list' };
  });

  const isSupportScope = scope === 'support';

  const [activeTab, setActiveTab] = useState<InboxTab>(() => {
    if (isSupportScope || initialSupportTicketId) return 'support';
    if (initialJobChatOpen || initialJobChatRequestId) return 'jobs';
    return 'chats';
  });

  useEffect(() => {
    if (!initialJobChatRequestId) return;
    setActiveTab('jobs');
    setActiveView({ kind: 'job', requestId: initialJobChatRequestId });
  }, [initialJobChatRequestId]);

  const allJobs = useMemo(() => [...upcomingJobs, ...pastJobs], [upcomingJobs, pastJobs]);
  const jobById = useMemo(() => new Map(allJobs.map((j) => [j.id, j])), [allJobs]);
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

  const guardChannelUpdatedAt = useMemo(() => {
    const sorted = sortedGuardMessages(guardMessages);
    return sorted[sorted.length - 1]?.createdAt ?? new Date(0).toISOString();
  }, [guardMessages]);

  const communityRow: InboxRow = {
    id: 'guard-community',
    channel: 'guard-community',
    title: 'Guard chat',
    subtitle: '',
    preview: '',
    updatedAt: guardChannelUpdatedAt,
    badge: 'Community',
    badgeTone: 'primary',
  };

  const jobRows = useMemo(
    () =>
      buildGuardJobInboxRows({ jobs: allJobs, jobChatThreads, jobChatMessages }),
    [allJobs, jobChatThreads, jobChatMessages]
  );

  const supportRows = useMemo(
    () => buildGuardSupportInboxRows({ currentUser, supportTickets }),
    [currentUser, supportTickets]
  );

  const tabRows = useMemo((): InboxRow[] => {
    if (isSupportScope) {
      return supportRows.filter((r) =>
        activeTab === 'reports' ? r.channel === 'report' : r.channel === 'support'
      );
    }
    switch (activeTab) {
      case 'chats':   return [communityRow];
      case 'jobs':    return jobRows;
      case 'support': return supportRows;
      default:        return [];
    }
  }, [activeTab, communityRow, isSupportScope, jobRows, supportRows]);

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

  const isRowSelected = (row: InboxRow): boolean => {
    if (row.channel === 'guard-community' && activeView.kind === 'guard-channel') return true;
    if (row.requestId && activeView.kind === 'job' && activeView.requestId === row.requestId) return true;
    if (row.ticketId && activeView.kind === 'support' && activeView.ticketId === row.ticketId) return true;
    return false;
  };

  const hasSelection = activeView.kind !== 'list';
  const embedHeaderInShell = !splitView && hasSelection;

  useEffect(() => {
    onDetailOpenChange?.(formFactor === 'mobile' && hasSelection);
  }, [formFactor, hasSelection, onDetailOpenChange]);

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
      if (activeView.kind === 'guard-channel') {
        override = (
          <AppChatHeader
            title="Guard chat"
            onBack={backToList}
            trailing={shellHeaderTrailing}
          />
        );
      } else if (activeView.kind === 'job') {
        const job = jobById.get(activeView.requestId);
        if (job) {
          override = (
            <AppChatHeader
              title={job.title}
              subtitle={job.location ?? undefined}
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
    supportRows.length,
    activeView,
    jobById,
    myTickets,
    shellHeaderTrailing,
    header,
  ]);

  const list = (
    <>
      {(isSupportScope || activeTab === 'support') && (
        <MessagesQuickActions
          onContactSupport={onOpenSupportCompose}
          onFileReport={onOpenSupportReport}
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
              ? 'Job chats open once you are assigned to an active job.'
              : activeTab === 'support'
                ? 'Contact support or file a report using the buttons above.'
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
              selected={isRowSelected(row)}
              leading={
                row.channel === 'guard-community' ? (
                  <MessagesSquare className="w-5 h-5 text-brand-primary" />
                ) : row.channel === 'report' ? (
                  <FileText className="w-5 h-5 text-brand-primary" />
                ) : row.channel === 'support' ? (
                  <LifeBuoy className="w-5 h-5 text-brand-primary" />
                ) : row.channel === 'job' ? (
                  <Briefcase className="w-5 h-5 text-brand-primary" />
                ) : undefined
              }
              badges={row.badge ? <WfBadge tone={row.badgeTone ?? 'default'}>{row.badge}</WfBadge> : undefined}
              onClick={() => openRow(row)}
            />
          ))}
        </AppInboxList>
      )}
    </>
  );

  const canPostGuardChat = canPostToGuardChat(currentUser, guard);

  const detailView = (() => {
    if (activeView.kind === 'guard-channel') {
      return (
        <div className="h-full flex flex-col min-h-0 app-full-page-screen">
          {!embedHeaderInShell && (
            <AppChatHeader
              title="Guard chat"
              subtitle="All active guards and staff"
              onBack={backToList}
              hideBackOnDesktop
            />
          )}
          <div className="flex-1 min-h-0">
            <ChatThreadPanel
              messages={sortedGuardMessages(guardMessages)}
              currentUserId={currentUser.id}
              viewerRole={currentUser.role}
              onSend={canPostGuardChat ? onSendGuardMessage : undefined}
              placeholder="Message the guard community…"
              teamChat
              guardChatLabels
              readOnly={!canPostGuardChat}
              readOnlyMessage="Guard chat opens once your account is active on the marketplace."
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
              hideBackOnDesktop
              hideShellHeader={embedHeaderInShell}
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
            {!embedHeaderInShell && (
              <AppChatHeader
                title={ticket.subject}
                subtitle={threadSubtitle}
                onBack={backToList}
                hideBackOnDesktop
              />
            )}
            <div className="flex-1 min-h-0">
              <ChatThreadPanel
                messages={ticket.messages.map((msg) => ({
                  id: msg.id,
                  senderId: msg.senderId,
                  senderName: msg.senderName,
                  senderRole: msg.senderRole,
                  body: msg.body,
                  createdAt: msg.createdAt,
                }))}
                currentUserId={currentUser.id}
                viewerRole={currentUser.role}
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

    return null;
  })();

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
            : 'Select guard chat or a job thread from the inbox'
        }
      />
    </div>
  );
}
