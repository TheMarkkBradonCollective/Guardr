import React, { useEffect, useMemo, useState } from 'react';
import {
  GuardMessage,
  JobChatMessage,
  JobChatThread,
  SecurityGuard,
  SecurityRequest,
  SessionUser,
  SupportTicket,
  TeamChatMessage,
  TeamChatThread,
} from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { threadForRequest } from '../../lib/jobChat';
import { threadForTeamRequest } from '../../lib/teamChat';
import {
  buildGuardJobInboxRows,
  buildGuardSupportInboxRows,
  buildGuardTeamInboxRows,
  InboxRow,
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
import { TeamChatPanel } from '../messaging/TeamChatPanel';
import { ChatThreadPanel } from '../messaging/ChatThreadPanel';
import { MessagesHubLayout } from '../messaging/MessagesHubLayout';
import { MessagesQuickActions } from '../messaging/MessagesQuickActions';
import {
  AppChatHeader,
  AppInboxList,
  AppInboxRow,
} from '../ui/app/AppPrimitives';
import { WfBadge } from '../ui/wireframe';
import { Briefcase, FileText, LifeBuoy, MessageCircle, MessagesSquare, Users } from 'lucide-react';

type ActiveView =
  | { kind: 'list' }
  | { kind: 'guard-channel' }
  | { kind: 'job'; requestId: string }
  | { kind: 'team'; requestId: string }
  | { kind: 'support'; ticketId: string };

type InboxTab = 'chats' | 'teams' | 'jobs' | 'support';

interface GuardMessagesPanelProps {
  upcomingJobs: GuardJobView[];
  pastJobs: GuardJobView[];
  guard: SecurityGuard;
  coworkerGuards?: SecurityGuard[];
  currentUser: SessionUser;
  jobChatThreads: JobChatThread[];
  jobChatMessages: JobChatMessage[];
  teamChatThreads?: TeamChatThread[];
  teamChatMessages?: TeamChatMessage[];
  guardMessages: GuardMessage[];
  supportTickets: SupportTicket[];
  onSendJobChatMessage?: (requestId: string, body: string) => void | Promise<void>;
  onSendTeamChatMessage?: (requestId: string, body: string) => void | Promise<void>;
  onSendGuardMessage?: (body: string) => void | Promise<void>;
  onSendSupportMessage?: (ticketId: string, body: string) => void | Promise<void>;
  onRefreshGuardMessages?: () => void | Promise<void>;
  initialJobChatRequestId?: string | null;
  initialJobChatOpen?: boolean;
  initialTeamChatRequestId?: string | null;
  onJobChatRequestIdChange?: (requestId: string | null) => void;
  onJobChatOpenChange?: (open: boolean) => void;
  initialSupportTicketId?: string | null;
  onSupportTicketIdChange?: (ticketId: string | null) => void;
  onOpenSupportCompose?: () => void;
  onOpenSupportReport?: () => void;
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
  coworkerGuards = [],
  currentUser,
  jobChatThreads,
  jobChatMessages,
  teamChatThreads = [],
  teamChatMessages = [],
  guardMessages,
  supportTickets,
  onSendJobChatMessage,
  onSendTeamChatMessage,
  onSendGuardMessage,
  onSendSupportMessage,
  onRefreshGuardMessages,
  initialJobChatRequestId = null,
  initialJobChatOpen = false,
  initialTeamChatRequestId = null,
  onJobChatRequestIdChange,
  onJobChatOpenChange,
  initialSupportTicketId = null,
  onSupportTicketIdChange,
  onOpenSupportCompose,
  onOpenSupportReport,
}: GuardMessagesPanelProps) {
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    if (initialTeamChatRequestId) {
      return { kind: 'team', requestId: initialTeamChatRequestId };
    }
    if (initialJobChatOpen && initialJobChatRequestId) {
      return { kind: 'job', requestId: initialJobChatRequestId };
    }
    if (initialSupportTicketId) {
      return { kind: 'support', ticketId: initialSupportTicketId };
    }
    return { kind: 'list' };
  });

  const [activeTab, setActiveTab] = useState<InboxTab>(() => {
    if (initialTeamChatRequestId) return 'teams';
    if (initialJobChatOpen || initialJobChatRequestId) return 'jobs';
    if (initialSupportTicketId) return 'support';
    return 'chats';
  });

  useEffect(() => {
    if (!initialTeamChatRequestId) return;
    setActiveTab('teams');
    setActiveView({ kind: 'team', requestId: initialTeamChatRequestId });
  }, [initialTeamChatRequestId]);

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

  const teamRows = useMemo(
    () =>
      buildGuardTeamInboxRows({
        jobs: allJobs,
        guardId: guard.id,
        guards: coworkerGuards,
        teamChatThreads,
        teamChatMessages,
      }),
    [allJobs, guard.id, coworkerGuards, teamChatThreads, teamChatMessages]
  );

  const supportRows = useMemo(
    () => buildGuardSupportInboxRows({ currentUser, supportTickets }),
    [currentUser, supportTickets]
  );

  const tabRows = useMemo((): InboxRow[] => {
    switch (activeTab) {
      case 'chats':   return [communityRow];
      case 'teams':   return teamRows;
      case 'jobs':    return jobRows;
      case 'support': return supportRows;
    }
  }, [activeTab, communityRow, teamRows, jobRows, supportRows]);

  const openRow = (row: InboxRow) => {
    if (row.channel === 'guard-community') {
      setActiveView({ kind: 'guard-channel' });
      return;
    }
    if (row.requestId && row.channel === 'team-crew') {
      setActiveView({ kind: 'team', requestId: row.requestId });
      onJobChatOpenChange?.(false);
      onJobChatRequestIdChange?.(null);
      onSupportTicketIdChange?.(null);
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
    if (row.requestId && activeView.kind === 'team' && activeView.requestId === row.requestId) return true;
    if (row.ticketId && activeView.kind === 'support' && activeView.ticketId === row.ticketId) return true;
    return false;
  };

  const hasSelection = activeView.kind !== 'list';

  // ── Header: title + tab bar ──────────────────────────────
  const header = (
    <div>
      <div className="app-messages-hub-lead">
        <h2 className="text-base font-bold tracking-tight">Messages</h2>
        <p>Guard chat, crew teams, job threads, and support</p>
      </div>
      <div className="app-inbox-tabs" role="tablist">
        {(
          [
            { id: 'chats'   as InboxTab, label: 'Chats',   count: 1,                  icon: <MessagesSquare className="w-3.5 h-3.5" strokeWidth={2} /> },
            { id: 'teams'   as InboxTab, label: 'Teams',   count: teamRows.length,    icon: <Users          className="w-3.5 h-3.5" strokeWidth={2} /> },
            { id: 'jobs'    as InboxTab, label: 'Jobs',    count: jobRows.length,     icon: <Briefcase      className="w-3.5 h-3.5" strokeWidth={2} /> },
            { id: 'support' as InboxTab, label: 'Support', count: supportRows.length, icon: <LifeBuoy   className="w-3.5 h-3.5" strokeWidth={2} /> },
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

  // ── List: filtered by active tab ─────────────────────────
  const list = (
    <>
      {/* Quick actions shown on Support tab */}
      {activeTab === 'support' && (
        <MessagesQuickActions
          onContactSupport={onOpenSupportCompose}
          onFileReport={onOpenSupportReport}
        />
      )}

      {tabRows.length === 0 ? (
        <div className="app-inbox-tab-empty">
          <MessageCircle className="app-inbox-tab-empty-icon w-10 h-10" strokeWidth={1.5} />
          <p className="app-inbox-tab-empty-title">
            {activeTab === 'teams'
              ? 'No team chats yet'
              : activeTab === 'jobs'
              ? 'No job chats yet'
              : 'No conversations yet'}
          </p>
          <p className="app-inbox-tab-empty-hint">
            {activeTab === 'teams'
              ? 'Join a multi-guard crew to coordinate in team chat.'
              : activeTab === 'jobs'
              ? 'Job chats open once you are assigned to an active job.'
              : activeTab === 'support'
              ? 'Contact support or file a report using the buttons above.'
              : 'Community messages will appear here.'}
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
                row.channel === 'guard-community' ? (
                  <MessagesSquare className="w-5 h-5 text-brand-primary" />
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
              onClick={() => openRow(row)}
            />
          ))}
        </AppInboxList>
      )}
    </>
  );

  // ── Detail view ──────────────────────────────────────────
  const detailView = (() => {
    if (activeView.kind === 'guard-channel' && onSendGuardMessage) {
      return (
        <div className="h-full flex flex-col min-h-0 app-full-page-screen">
          <AppChatHeader
            title="Guard chat"
            onBack={backToList}
            hideBackOnDesktop
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

    if (activeView.kind === 'team' && onSendTeamChatMessage) {
      const job = jobById.get(activeView.requestId);
      if (job) {
        return (
          <div className="h-full flex flex-col min-h-0 app-full-page-screen">
            <TeamChatPanel
              request={job}
              thread={threadForTeamRequest(teamChatThreads, job.id) ?? null}
              messages={teamChatMessages}
              currentUser={currentUser}
              onSend={(body) => onSendTeamChatMessage(job.id, body)}
              onBack={backToList}
              hideBackOnDesktop
            />
          </div>
        );
      }
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
            <AppChatHeader
              title={ticket.subject}
              subtitle={threadSubtitle}
              onBack={backToList}
              hideBackOnDesktop
            />
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

    return null;
  })();

  return (
    <div className="app-messages-hub h-full min-h-0">
      <MessagesHubLayout
        header={header}
        list={list}
        detail={detailView ?? <div />}
        hasSelection={hasSelection && !!detailView}
        emptyDetailTitle="Your conversations"
        emptyDetailHint="Select guard chat, a team crew, a job thread, or support from the inbox"
      />
    </div>
  );
}
