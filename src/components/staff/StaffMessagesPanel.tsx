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
  TeamChatMessage,
  TeamChatThread,
} from '../../types';
import { sortedGuardMessages, canPostToGuardChat } from '../../lib/guardMessenger';
import { sortedClientMessages, canPostToClientChat } from '../../lib/clientMessenger';
import { threadForRequest } from '../../lib/jobChat';
import { threadForTeamRequest } from '../../lib/teamChat';
import { buildStaffInboxRows, InboxRow } from '../../lib/messagesInbox';
import {
  SUPPORT_STATUS_LABEL,
  isDeletableResolvedSupportChat,
  supportStatusLabel,
} from '../../lib/support';
import { ROLE_LABELS, canDeleteResolvedSupportChat } from '../../lib/permissions';
import { sortedStaffMessages } from '../../lib/staffMessenger';
import { JobChatPanel } from '../messaging/JobChatPanel';
import { TeamChatPanel } from '../messaging/TeamChatPanel';
import { ChatThreadPanel } from '../messaging/ChatThreadPanel';
import { MessagesHubLayout } from '../messaging/MessagesHubLayout';
import { AppChatHeader, AppInboxList, AppInboxRow } from '../ui/app/AppPrimitives';
import { WfBadge } from '../ui/wireframe';
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
  | { kind: 'team'; requestId: string }
  | { kind: 'support'; ticketId: string };

type InboxTab = 'team' | 'jobs' | 'support';

interface StaffMessagesPanelProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  threads: JobChatThread[];
  messages: JobChatMessage[];
  teamChatThreads?: TeamChatThread[];
  teamChatMessages?: TeamChatMessage[];
  staffMessages: StaffMessage[];
  guardMessages?: GuardMessage[];
  clientMessages?: ClientMessage[];
  supportTickets: SupportTicket[];
  currentUser: SessionUser;
  onSendJobChat: (requestId: string, body: string) => void | Promise<void>;
  onSendTeamChatMessage?: (requestId: string, body: string) => void | Promise<void>;
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
  initialSupportTicketId?: string | null;
  onDetailOpenChange?: (open: boolean) => void;
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
  teamChatThreads = [],
  teamChatMessages = [],
  staffMessages,
  guardMessages = [],
  clientMessages = [],
  supportTickets,
  currentUser,
  onSendJobChat,
  onSendTeamChatMessage,
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
  initialSupportTicketId = null,
  onDetailOpenChange,
}: StaffMessagesPanelProps) {
  const [selection, setSelection] = useState<StaffMessageSelection | null>(() => {
    if (initialJobChatRequestId) return { kind: 'job', requestId: initialJobChatRequestId };
    if (initialSupportTicketId)  return { kind: 'support', ticketId: initialSupportTicketId };
    return null;
  });

  const [activeTab, setActiveTab] = useState<InboxTab>(() => {
    if (initialJobChatRequestId) return 'jobs';
    if (initialSupportTicketId)  return 'support';
    return 'team';
  });

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
        teamChatThreads,
        teamChatMessages,
        supportTickets,
        staffMessagesUpdatedAt: staffUpdatedAt,
        guardMessagesUpdatedAt: guardUpdatedAt,
        clientMessagesUpdatedAt: clientUpdatedAt,
      }),
    [requests, guards, threads, messages, teamChatThreads, teamChatMessages, supportTickets, staffUpdatedAt, guardUpdatedAt, clientUpdatedAt]
  );

  const teamRows = useMemo(
    () =>
      allRows.filter(
        (r) =>
          r.channel === 'staff-community' ||
          r.channel === 'team-crew' ||
          r.channel === 'guard-community' ||
          r.channel === 'client-community'
      ),
    [allRows]
  );
  const jobRows     = useMemo(() => allRows.filter((r) => r.channel === 'job'), [allRows]);
  const supportRowsAll = useMemo(
    () => allRows.filter((r) => r.channel === 'support' || r.channel === 'report'),
    [allRows]
  );

  const tabRows = useMemo((): InboxRow[] => {
    switch (activeTab) {
      case 'team':    return teamRows;
      case 'jobs':    return jobRows;
      case 'support': return supportRowsAll;
    }
  }, [activeTab, teamRows, jobRows, supportRowsAll]);

  const selectRow = (row: InboxRow) => {
    if (row.channel === 'staff-community') {
      setSelection({ kind: 'staff-channel' });
      onSelectedJobChatRequestIdChange?.(null);
      onSelectedSupportTicketIdChange?.(null);
      return;
    }
    if (row.channel === 'guard-community') {
      setSelection({ kind: 'guard-channel' });
      onSelectedJobChatRequestIdChange?.(null);
      onSelectedSupportTicketIdChange?.(null);
      return;
    }
    if (row.channel === 'client-community') {
      setSelection({ kind: 'client-channel' });
      onSelectedJobChatRequestIdChange?.(null);
      onSelectedSupportTicketIdChange?.(null);
      return;
    }
    if (row.requestId && row.channel === 'team-crew') {
      setSelection({ kind: 'team', requestId: row.requestId });
      onSelectedJobChatRequestIdChange?.(null);
      onSelectedSupportTicketIdChange?.(null);
      return;
    }
    if (row.requestId) {
      setSelection({ kind: 'job', requestId: row.requestId });
      onSelectedJobChatRequestIdChange?.(row.requestId);
      onSelectedSupportTicketIdChange?.(null);
      return;
    }
    if (row.ticketId) {
      setSelection({ kind: 'support', ticketId: row.ticketId });
      onSelectedSupportTicketIdChange?.(row.ticketId);
      onSelectedJobChatRequestIdChange?.(null);
    }
  };

  const clearSelection = () => {
    setSelection(null);
    onSelectedJobChatRequestIdChange?.(null);
    onSelectedSupportTicketIdChange?.(null);
  };

  const controlledJobId =
    selectedJobChatRequestId ?? (selection?.kind === 'job' ? selection.requestId : null);
  const controlledSupportId =
    selectedSupportTicketId ?? (selection?.kind === 'support' ? selection.ticketId : null);
  const effectiveSelection: StaffMessageSelection | null = controlledSupportId
    ? { kind: 'support', ticketId: controlledSupportId }
    : controlledJobId
    ? { kind: 'job', requestId: controlledJobId }
    : selection;

  useEffect(() => {
    onDetailOpenChange?.(!!effectiveSelection);
  }, [effectiveSelection, onDetailOpenChange]);

  const hasSelection = !!effectiveSelection;

  const isRowSelected = (row: InboxRow) => {
    if (row.channel === 'staff-community' && effectiveSelection?.kind === 'staff-channel') return true;
    if (row.channel === 'guard-community' && effectiveSelection?.kind === 'guard-channel') return true;
    if (row.channel === 'client-community' && effectiveSelection?.kind === 'client-channel') return true;
    if (row.requestId && row.channel === 'team-crew' && effectiveSelection?.kind === 'team' && effectiveSelection.requestId === row.requestId) return true;
    if (row.requestId && effectiveSelection?.kind === 'job' && effectiveSelection.requestId === row.requestId) return true;
    if (row.ticketId && effectiveSelection?.kind === 'support' && effectiveSelection.ticketId === row.ticketId) return true;
    return false;
  };

  // ── Header: title + tabs ───────────────────────────────
  const header = (
    <div>
      <div className="app-messages-hub-lead">
        <h2 className="text-base font-bold tracking-tight">Messages</h2>
        <p>Staff channel, crew team chats, job threads, and support</p>
      </div>
      <div className="app-inbox-tabs" role="tablist">
        {(
          [
            { id: 'team'    as InboxTab, label: 'Team',    count: teamRows.length,     icon: <Users      className="w-3.5 h-3.5" strokeWidth={2} /> },
            { id: 'jobs'    as InboxTab, label: 'Jobs',    count: jobRows.length,        icon: <Briefcase  className="w-3.5 h-3.5" strokeWidth={2} /> },
            { id: 'support' as InboxTab, label: 'Support', count: supportRowsAll.length, icon: <LifeBuoy   className="w-3.5 h-3.5" strokeWidth={2} /> },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`app-inbox-tab${activeTab === tab.id ? ' app-inbox-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
            {tab.count > 0 && (
              <span className="app-inbox-tab-badge">{tab.count}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  // ── List ───────────────────────────────────────────────
  const list = (
    <>
      {tabRows.length === 0 ? (
        <div className="app-inbox-tab-empty">
          <MessageCircle className="app-inbox-tab-empty-icon w-10 h-10" strokeWidth={1.5} />
          <p className="app-inbox-tab-empty-title">
            {activeTab === 'jobs' ? 'No job chats' : activeTab === 'support' ? 'No support tickets' : 'No team conversations'}
          </p>
          <p className="app-inbox-tab-empty-hint">
            {activeTab === 'jobs'
              ? 'Job chats appear here when a guard is assigned to a booking.'
              : activeTab === 'support'
              ? 'Support and report tickets from users will appear here.'
              : 'Staff chat and multi-guard crew chats appear here.'}
          </p>
        </div>
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
                ) : row.channel === 'team-crew' ? (
                  <Users className="w-5 h-5 text-brand-primary" />
                ) : row.channel === 'report' ? (
                  <FileText className="w-5 h-5 text-brand-primary" />
                ) : row.channel === 'support' ? (
                  <LifeBuoy className="w-5 h-5 text-brand-primary" />
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
          <AppChatHeader
            title="Guard chat"
            subtitle="All-guards community channel"
            onBack={clearSelection}
            hideBackOnDesktop
          />
          <div className="flex-1 min-h-0">
            <ChatThreadPanel
              messages={sortedGuardMessages(guardMessages)}
              currentUserId={currentUser.id}
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
          <AppChatHeader
            title="Client chat"
            subtitle="All-clients community channel"
            onBack={clearSelection}
            hideBackOnDesktop
          />
          <div className="flex-1 min-h-0">
            <ChatThreadPanel
              messages={sortedClientMessages(clientMessages)}
              currentUserId={currentUser.id}
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
          <AppChatHeader
            title="Staff chat"
            subtitle="Internal team channel"
            onBack={clearSelection}
            hideBackOnDesktop
          />
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
        />
      );
    }

    if (effectiveSelection.kind === 'team' && onSendTeamChatMessage) {
      const request = requests.find((r) => r.id === effectiveSelection.requestId);
      if (!request) return null;
      return (
        <TeamChatPanel
          request={request}
          thread={threadForTeamRequest(teamChatThreads, request.id) ?? null}
          messages={teamChatMessages}
          currentUser={currentUser}
          onSend={(body) => onSendTeamChatMessage(request.id, body)}
          onBack={clearSelection}
          hideBackOnDesktop
        />
      );
    }

    if (effectiveSelection.kind !== 'support') return null;

    const ticket = supportTickets.find((t) => t.id === effectiveSelection.ticketId);
    if (!ticket) return null;

    const handleSend = async (body: string) => {
      await onSendSupportMessage(ticket.id, body);
      if (ticket.status === 'open') {
        await onUpdateSupportStatus(ticket.id, 'in-progress');
      }
    };

    const canDelete =
      !!onDeleteSupportTicket &&
      canDeleteResolvedSupportChat(currentUser) &&
      isDeletableResolvedSupportChat(ticket);

    const handleDelete = async () => {
      if (!onDeleteSupportTicket) return;
      await onDeleteSupportTicket(ticket.id);
      clearSelection();
    };

    return (
      <div className="flex flex-col h-full min-h-0 bg-brand-bg app-full-page-screen">
        <AppChatHeader
          title={ticket.subject}
          subtitle={`${ticket.userName} · ${ROLE_LABELS[ticket.userRole]}`}
          onBack={clearSelection}
          hideBackOnDesktop
          trailing={
            <div className="flex items-center gap-2 shrink-0">
              {canDelete && (
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  className="app-chat-header-action app-chat-header-action-danger"
                  aria-label="Delete resolved conversation"
                  title="Delete conversation"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                </button>
              )}
              <select
                value={ticket.status}
                onChange={(e) =>
                  void onUpdateSupportStatus(ticket.id, e.target.value as SupportTicketStatus)
                }
                className="uber-input text-xs py-1.5 max-w-[8.5rem]"
              >
                {(
                  Object.keys(
                    ticket.kind === 'report'
                      ? { open: 'Submitted', 'in-progress': 'Under review', resolved: 'Closed' }
                      : SUPPORT_STATUS_LABEL
                  ) as SupportTicketStatus[]
                ).map((s) => (
                  <option key={s} value={s}>
                    {ticket.kind === 'report'
                      ? supportStatusLabel({ kind: 'report', status: s })
                      : SUPPORT_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
          }
        />
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
            onSend={handleSend}
            placeholder={ticket.kind === 'report' ? 'Staff note or follow-up…' : 'Reply to user…'}
            teamChat
          />
        </div>
      </div>
    );
  })();

  return (
    <MessagesHubLayout
      header={header}
      list={list}
      detail={detailView ?? <div />}
      hasSelection={hasSelection && !!detailView}
      emptyDetailTitle="Select a conversation"
      emptyDetailHint="Staff channel, crew chats, job threads, and support"
    />
  );
}
