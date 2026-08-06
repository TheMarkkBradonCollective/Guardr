import React, { useEffect, useMemo, useState } from 'react';
import {
  ClientMessage,
  GuardMessage,
  JobChatMessage,
  JobChatThread,
  SecurityGuard,
  SecurityRequest,
  SessionUser,
  StaffMessage,
  SupportTicket,
  SupportTicketStatus,
} from '../../types';
import { sortedGuardMessages, canPostToGuardChat } from '../../lib/guardMessenger';
import { sortedClientMessages, canPostToClientChat } from '../../lib/clientMessenger';
import { threadForRequest } from '../../lib/jobChat';
import { buildStaffInboxRows, InboxRow } from '../../lib/messagesInbox';
import {
  SUPPORT_STATUS_LABEL,
  isDeletableResolvedSupportChat,
  supportStatusLabel,
} from '../../lib/support';
import { ROLE_LABELS, canDeleteResolvedSupportChat } from '../../lib/permissions';
import { sortedStaffMessages } from '../../lib/staffMessenger';
import { JobChatPanel } from '../messaging/JobChatPanel';
import { ChatThreadPanel } from '../messaging/ChatThreadPanel';
import { MessagesHubLayout } from '../messaging/MessagesHubLayout';
import { MessagesInboxTabs } from '../messaging/MessagesInboxTabs';
import { AppChatHeader, AppEmptyState, AppInboxList, AppInboxRow } from '../ui/app/AppPrimitives';
import { WfBadge } from '../ui/wireframe';
import { useDevice } from '../../lib/platform';
import { EMPTY_MESSAGES_CHROME, type MessagesChrome } from '../../lib/messagesChrome';
import {
  Briefcase,
  FileText,
  LifeBuoy,
  MessageCircle,
  MessagesSquare,
  Trash2,
  Users,
} from 'lucide-react';

type StaffMessageSelection =
  | { kind: 'staff-channel' }
  | { kind: 'guard-channel' }
  | { kind: 'client-channel' }
  | { kind: 'job'; requestId: string }

type InboxTab = 'team' | 'jobs';

interface StaffMessagesPanelProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  threads: JobChatThread[];
  messages: JobChatMessage[];
  staffMessages: StaffMessage[];
  guardMessages?: GuardMessage[];
  clientMessages?: ClientMessage[];
  supportTickets: SupportTicket[];
  currentUser: SessionUser;
  onSendJobChat: (requestId: string, body: string) => void | Promise<void>;
  onSendStaffMessage: (body: string) => void | Promise<void>;
  onSendGuardMessage?: (body: string) => void | Promise<void>;
  onSendClientMessage?: (body: string) => void | Promise<void>;
  onSendSupportMessage: (ticketId: string, body: string) => void | Promise<void>;
  onUpdateSupportStatus: (ticketId: string, status: SupportTicketStatus) => void | Promise<void>;
  onDeleteSupportTicket?: (ticketId: string) => void | Promise<void>;
  selectedJobChatRequestId?: string | null;
  onSelectedJobChatRequestIdChange?: (requestId: string | null) => void;
  selectedSupportTicketId?: string | null;
  onSelectedSupportTicketIdChange?: (ticketId: string | null) => void;
  initialJobChatRequestId?: string | null;
  initialStaffMessagesTab?: 'team' | 'jobs' | null;
  initialSupportTicketId?: string | null;
  onDetailOpenChange?: (open: boolean) => void;
  onMessagesChromeChange?: (chrome: MessagesChrome) => void;
}

function formatInboxMeta(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function StaffMessagesPanel({
  requests,
  guards,
  threads,
  messages,
  staffMessages,
  guardMessages = [],
  clientMessages = [],
  supportTickets,
  currentUser,
  onSendJobChat,
  onSendStaffMessage,
  onSendGuardMessage,
  onSendClientMessage,
  onSendSupportMessage,
  onUpdateSupportStatus,
  onDeleteSupportTicket,
  selectedJobChatRequestId,
  onSelectedJobChatRequestIdChange,
  selectedSupportTicketId,
  onSelectedSupportTicketIdChange,
  initialJobChatRequestId = null,
  initialStaffMessagesTab = null,
  initialSupportTicketId = null,
  onDetailOpenChange,
  onMessagesChromeChange,
}: StaffMessagesPanelProps) {
  const { formFactor } = useDevice();
  const splitView = formFactor === 'tablet' || formFactor === 'desktop';
  const [selection, setSelection] = useState<StaffMessageSelection | null>(() => {
    if (initialJobChatRequestId) return { kind: 'job', requestId: initialJobChatRequestId };
    return null;
  });

  const [activeTab, setActiveTab] = useState<InboxTab>(() => {
    if (initialStaffMessagesTab === 'jobs' || initialJobChatRequestId) return 'jobs';
    return 'team';
  });

  useEffect(() => {
    if (!initialJobChatRequestId) return;
    setActiveTab('jobs');
    setSelection({ kind: 'job', requestId: initialJobChatRequestId });
    onSelectedJobChatRequestIdChange?.(initialJobChatRequestId);
  }, [initialJobChatRequestId, onSelectedJobChatRequestIdChange]);

  const staffUpdatedAt = useMemo(() => {
    const sorted = sortedStaffMessages(staffMessages);
    return sorted[sorted.length - 1]?.createdAt;
  }, [staffMessages]);

  const guardUpdatedAt = useMemo(() => {
    const sorted = sortedGuardMessages(guardMessages);
    return sorted[sorted.length - 1]?.createdAt;
  }, [guardMessages]);

  const clientUpdatedAt = useMemo(() => {
    const sorted = sortedClientMessages(clientMessages);
    return sorted[sorted.length - 1]?.createdAt;
  }, [clientMessages]);

  const allRows = useMemo(
    () =>
      buildStaffInboxRows({
        requests,
        guards,
        jobChatThreads: threads,
        jobChatMessages: messages,
        supportTickets,
        staffMessagesUpdatedAt: staffUpdatedAt,
        guardMessagesUpdatedAt: guardUpdatedAt,
        clientMessagesUpdatedAt: clientUpdatedAt,
      }),
    [requests, guards, threads, messages, supportTickets, staffUpdatedAt, guardUpdatedAt, clientUpdatedAt]
  );

  const teamRows = useMemo(
    () =>
      allRows.filter(
        (r) =>
          r.channel === 'staff-community' ||
r.channel === 'guard-community' ||
          r.channel === 'client-community'
      ),
    [allRows]
  );
  const jobRows     = useMemo(() => allRows.filter((r) => r.channel === 'job'), [allRows]);

  const tabRows = useMemo((): InboxRow[] => {
    switch (activeTab) {
      case 'team':    return teamRows;
      case 'jobs':    return jobRows;
    }
  }, [activeTab, teamRows, jobRows]);

  const selectRow = (row: InboxRow) => {
    if (row.channel === 'staff-community') {
      setSelection({ kind: 'staff-channel' });
      onSelectedJobChatRequestIdChange?.(null);
      return;
    }
    if (row.channel === 'guard-community') {
      setSelection({ kind: 'guard-channel' });
      onSelectedJobChatRequestIdChange?.(null);
      return;
    }
    if (row.channel === 'client-community') {
      setSelection({ kind: 'client-channel' });
      onSelectedJobChatRequestIdChange?.(null);
      return;
    }
    if (row.requestId) {
      setSelection({ kind: 'job', requestId: row.requestId });
      onSelectedJobChatRequestIdChange?.(row.requestId);
    }
  };

  const clearSelection = () => {
    setSelection(null);
    onSelectedJobChatRequestIdChange?.(null);
  };

  const effectiveSelection: StaffMessageSelection | null = selection;

  const hasSelection = !!effectiveSelection;
  const embedHeaderInShell = !splitView && hasSelection;

  useEffect(() => {
    onDetailOpenChange?.(formFactor === 'mobile' && hasSelection);
  }, [formFactor, hasSelection, onDetailOpenChange]);

  const isRowSelected = (row: InboxRow) => {
    if (row.channel === 'staff-community' && effectiveSelection?.kind === 'staff-channel') return true;
    if (row.channel === 'guard-community' && effectiveSelection?.kind === 'guard-channel') return true;
    if (row.channel === 'client-community' && effectiveSelection?.kind === 'client-channel') return true;
    if (row.requestId && effectiveSelection?.kind === 'job' && effectiveSelection.requestId === row.requestId) return true;
    return false;
  };

  const inboxTabs = (
    <MessagesInboxTabs
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as InboxTab)}
      tabs={[
        { id: 'team', label: 'Team', icon: <Users className="w-3.5 h-3.5" strokeWidth={2} /> },
        { id: 'jobs', label: 'Jobs', icon: <Briefcase className="w-3.5 h-3.5" strokeWidth={2} /> },
      ]}
    />
  );

  useEffect(() => {
    if (!onMessagesChromeChange) return;

    const extension = !embedHeaderInShell ? inboxTabs : null;
    let override: React.ReactNode | null = null;

    if (embedHeaderInShell && effectiveSelection) {
      if (effectiveSelection.kind === 'staff-channel') {
        override = (
          <AppChatHeader title="Staff chat" subtitle="Internal team channel" onBack={clearSelection} />
        );
      } else if (effectiveSelection.kind === 'guard-channel') {
        override = (
          <AppChatHeader title="Guard chat" subtitle="All-guards community channel" onBack={clearSelection} />
        );
      } else if (effectiveSelection.kind === 'client-channel') {
        override = (
          <AppChatHeader title="Client chat" subtitle="All-clients community channel" onBack={clearSelection} />
        );
      } else if (effectiveSelection.kind === 'job') {
        const request = requests.find((r) => r.id === effectiveSelection.requestId);
        if (request) {
          override = (
            <AppChatHeader
              title={request.title}
              subtitle={request.location ?? undefined}
              onBack={clearSelection}
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
    teamRows.length,
    jobRows.length,
    effectiveSelection,
    requests,
  ]);

  const header = inboxTabs;

  // ── List ───────────────────────────────────────────────
  const list = (
    <>
      {tabRows.length === 0 ? (
        <AppEmptyState
          dashed
          icon={<MessageCircle className="w-5 h-5" />}
          title={activeTab === 'jobs' ? 'No job chats' : 'No team conversations'}
        >
          {activeTab === 'jobs'
            ? 'Job chats appear here when a guard is assigned to a booking.'
            : 'Staff chat and job threads appear here.'}
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
                row.channel === 'staff-community' ? (
                  <MessagesSquare className="w-5 h-5 text-brand-primary" />
                ) : row.channel === 'guard-community' ? (
                  <MessageCircle className="w-5 h-5 text-brand-primary" />
                ) : row.channel === 'client-community' ? (
                  <MessageCircle className="w-5 h-5 text-brand-primary" />
                ) : row.channel === 'job' ? (
                  <Briefcase className="w-5 h-5 text-brand-primary" />
                ) : undefined
              }
              badges={row.badge ? <WfBadge tone={row.badgeTone ?? 'default'}>{row.badge}</WfBadge> : undefined}
              onClick={() => selectRow(row)}
            />
          ))}
        </AppInboxList>
      )}
    </>
  );

  // ── Detail view ────────────────────────────────────────
  const detailView = (() => {
    if (!effectiveSelection) return null;

    if (effectiveSelection.kind === 'guard-channel') {
      const canPostGuardChat = Boolean(onSendGuardMessage) && canPostToGuardChat(currentUser);
      return (
        <div className="flex flex-col h-full min-h-0 app-full-page-screen">
          {!embedHeaderInShell && (
            <AppChatHeader
              title="Guard chat"
              subtitle="All-guards community channel"
              onBack={clearSelection}
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
              guardChatLabels
              readOnly={!canPostGuardChat}
              readOnlyMessage="Guard chat is open to active guards and staff moderators."
            />
          </div>
        </div>
      );
    }

    if (effectiveSelection.kind === 'client-channel') {
      const canPostClientChat = Boolean(onSendClientMessage) && canPostToClientChat(currentUser);
      return (
        <div className="flex flex-col h-full min-h-0 app-full-page-screen">
          {!embedHeaderInShell && (
            <AppChatHeader
              title="Client chat"
              subtitle="All-clients community channel"
              onBack={clearSelection}
              hideBackOnDesktop
            />
          )}
          <div className="flex-1 min-h-0">
            <ChatThreadPanel
              messages={sortedClientMessages(clientMessages)}
              currentUserId={currentUser.id}
              viewerRole={currentUser.role}
              onSend={canPostClientChat ? onSendClientMessage : undefined}
              placeholder="Message the client community…"
              clientChatLabels
              readOnly={!canPostClientChat}
              readOnlyMessage="Client chat is open to active clients and staff moderators."
            />
          </div>
        </div>
      );
    }

    if (effectiveSelection.kind === 'staff-channel') {
      return (
        <div className="flex flex-col h-full min-h-0 app-full-page-screen">
          {!embedHeaderInShell && (
            <AppChatHeader
              title="Staff chat"
              subtitle="Internal team channel"
              onBack={clearSelection}
              hideBackOnDesktop
            />
          )}
          <div className="flex-1 min-h-0">
            <ChatThreadPanel
              messages={sortedStaffMessages(staffMessages)}
              currentUserId={currentUser.id}
              onSend={onSendStaffMessage}
              placeholder="Message the Guardr team…"
              staffChatLabels
            />
          </div>
        </div>
      );
    }

    if (effectiveSelection.kind === 'job') {
      const request = requests.find((r) => r.id === effectiveSelection.requestId);
      if (!request) return null;
      return (
        <JobChatPanel
          request={request}
          thread={threadForRequest(threads, request.id) ?? null}
          messages={messages}
          currentUser={currentUser}
          onSend={(body) => onSendJobChat(request.id, body)}
          onBack={clearSelection}
          hideBackOnDesktop
          hideShellHeader={embedHeaderInShell}
        />
      );
    }

    return null;
  })();

  return (
    <MessagesHubLayout
      header={header}
      list={list}
      detail={detailView ?? <div />}
      hasSelection={hasSelection && !!detailView}
      shellInboxHeader
      emptyDetailTitle="Select a conversation"
      emptyDetailHint="Staff channel and job threads"
    />
  );
}
