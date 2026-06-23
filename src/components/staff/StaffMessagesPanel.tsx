import React, { useEffect, useMemo, useState } from 'react';
import {
  JobChatMessage,
  JobChatThread,
  SecurityGuard,
  SecurityRequest,
  SessionUser,
  StaffMessage,
  SupportTicket,
  SupportTicketStatus,
} from '../../types';
import { threadForRequest } from '../../lib/jobChat';
import { buildStaffInboxRows, InboxRow } from '../../lib/messagesInbox';
import {
  categoryLabel,
  SUPPORT_STATUS_LABEL,
  supportStatusLabel,
} from '../../lib/support';
import { ROLE_LABELS } from '../../lib/permissions';
import { sortedStaffMessages } from '../../lib/staffMessenger';
import { JobChatPanel } from '../messaging/JobChatPanel';
import { ChatThreadPanel } from '../messaging/ChatThreadPanel';
import { AppChatHeader, AppInboxList, AppInboxRow } from '../ui/app/AppPrimitives';
import { WfBadge } from '../ui/wireframe';
import { FileText, LifeBuoy, MessageCircle, MessagesSquare } from 'lucide-react';

type StaffMessageSelection =
  | { kind: 'staff-channel' }
  | { kind: 'job'; requestId: string }
  | { kind: 'support'; ticketId: string };

interface StaffMessagesPanelProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  threads: JobChatThread[];
  messages: JobChatMessage[];
  staffMessages: StaffMessage[];
  supportTickets: SupportTicket[];
  currentUser: SessionUser;
  onSendJobChat: (requestId: string, body: string) => void | Promise<void>;
  onSendStaffMessage: (body: string) => void | Promise<void>;
  onSendSupportMessage: (ticketId: string, body: string) => void | Promise<void>;
  onUpdateSupportStatus: (ticketId: string, status: SupportTicketStatus) => void | Promise<void>;
  selectedJobChatRequestId?: string | null;
  onSelectedJobChatRequestIdChange?: (requestId: string | null) => void;
  selectedSupportTicketId?: string | null;
  onSelectedSupportTicketIdChange?: (ticketId: string | null) => void;
  initialJobChatRequestId?: string | null;
  initialSupportTicketId?: string | null;
  onDetailOpenChange?: (open: boolean) => void;
}

export function StaffMessagesPanel({
  requests,
  guards,
  threads,
  messages,
  staffMessages,
  supportTickets,
  currentUser,
  onSendJobChat,
  onSendStaffMessage,
  onSendSupportMessage,
  onUpdateSupportStatus,
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
    if (initialSupportTicketId) return { kind: 'support', ticketId: initialSupportTicketId };
    return null;
  });

  const staffUpdatedAt = useMemo(() => {
    const sorted = sortedStaffMessages(staffMessages);
    return sorted[sorted.length - 1]?.createdAt;
  }, [staffMessages]);

  const inboxRows = useMemo(
    () =>
      buildStaffInboxRows({
        requests,
        guards,
        jobChatThreads: threads,
        jobChatMessages: messages,
        supportTickets,
        staffMessagesUpdatedAt: staffUpdatedAt,
      }),
    [requests, guards, threads, messages, supportTickets, staffUpdatedAt]
  );

  const selectRow = (row: InboxRow) => {
    if (row.channel === 'staff-community') {
      setSelection({ kind: 'staff-channel' });
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

  const controlledJobId = selectedJobChatRequestId ?? (selection?.kind === 'job' ? selection.requestId : null);
  const controlledSupportId =
    selectedSupportTicketId ?? (selection?.kind === 'support' ? selection.ticketId : null);
  const effectiveSelection: StaffMessageSelection | null =
    controlledSupportId
      ? { kind: 'support', ticketId: controlledSupportId }
      : controlledJobId
        ? { kind: 'job', requestId: controlledJobId }
        : selection;

  useEffect(() => {
    onDetailOpenChange?.(!!effectiveSelection);
  }, [effectiveSelection, onDetailOpenChange]);

  const listView = (
    <div className="staff-split-pane-list flex flex-col min-h-0 h-full">
      <div className="flex-1 min-h-0 overflow-y-auto">
        {inboxRows.length === 0 ? (
          <p className="staff-empty-state">No conversations yet.</p>
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
                selected={
                  (row.channel === 'staff-community' && effectiveSelection?.kind === 'staff-channel') ||
                  (row.requestId && effectiveSelection?.kind === 'job' && effectiveSelection.requestId === row.requestId) ||
                  (row.ticketId && effectiveSelection?.kind === 'support' && effectiveSelection.ticketId === row.ticketId)
                }
                leading={
                  row.channel === 'staff-community' ? (
                    <MessagesSquare className="w-5 h-5 text-brand-primary" />
                  ) : row.channel === 'report' ? (
                    <FileText className="w-5 h-5 text-brand-primary" />
                  ) : row.channel === 'support' ? (
                    <LifeBuoy className="w-5 h-5 text-brand-primary" />
                  ) : undefined
                }
                badges={row.badge ? <WfBadge tone={row.badgeTone ?? 'default'}>{row.badge}</WfBadge> : undefined}
                onClick={() => selectRow(row)}
              />
            ))}
          </AppInboxList>
        )}
      </div>
    </div>
  );

  const detailView = (() => {
    if (!effectiveSelection) {
      return (
        <div className="staff-empty-state flex-1 flex items-center justify-center h-full">
          <div className="text-center px-6">
            <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold">Select a conversation</p>
            <p className="text-xs text-brand-text-muted mt-1">Staff, job, and support chats sorted by activity</p>
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
        />
      );
    }

    const ticket = supportTickets.find((t) => t.id === effectiveSelection.ticketId);
    if (!ticket) return null;

    const handleSend = async (body: string) => {
      await onSendSupportMessage(ticket.id, body);
      if (ticket.status === 'open') {
        await onUpdateSupportStatus(ticket.id, 'in-progress');
      }
    };

    return (
      <div className="flex flex-col h-full min-h-0 bg-brand-bg app-full-page-screen">
        <AppChatHeader
          title={ticket.subject}
          subtitle={`${ticket.userName} · ${ROLE_LABELS[ticket.userRole]}`}
          onBack={clearSelection}
          trailing={
            <select
              value={ticket.status}
              onChange={(e) => void onUpdateSupportStatus(ticket.id, e.target.value as SupportTicketStatus)}
              className="uber-input text-xs py-1.5 max-w-[8.5rem]"
            >
              {(Object.keys(
                ticket.kind === 'report'
                  ? { open: 'Submitted', 'in-progress': 'Under review', resolved: 'Closed' }
                  : SUPPORT_STATUS_LABEL
              ) as SupportTicketStatus[]).map((s) => (
                <option key={s} value={s}>
                  {ticket.kind === 'report'
                    ? supportStatusLabel({ kind: 'report', status: s })
                    : SUPPORT_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
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
    <>
      <div className="h-full flex flex-col min-h-0">
        {effectiveSelection ? detailView : listView}
      </div>
    </>
  );
}
