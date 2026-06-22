import React, { useEffect, useMemo, useState } from 'react';
import { SupportTicket, SupportTicketStatus, SessionUser } from '../../types';
import {
  categoryLabel,
  openTicketCount,
  priorityLabel,
  SUPPORT_STATUS_LABEL,
} from '../../lib/support';
import { ROLE_LABELS } from '../../lib/permissions';
import {
  AppChatHeader,
  AppInboxList,
  AppInboxRow,
  AppSegmentedControl,
} from '../ui/app/AppPrimitives';
import { ChatThreadPanel } from '../messaging/ChatThreadPanel';
import { WfBadge } from '../ui/wireframe';
import { MessageCircle } from 'lucide-react';

type SupportInboxSection = 'messages' | 'reports';

interface StaffSupportPanelProps {
  tickets: SupportTicket[];
  currentUser: SessionUser;
  onSendMessage: (ticketId: string, body: string) => void | Promise<void>;
  onUpdateStatus: (ticketId: string, status: SupportTicketStatus) => void | Promise<void>;
  selectedTicketId?: string | null;
  onSelectedTicketIdChange?: (ticketId: string | null) => void;
  initialSelectedTicketId?: string | null;
}

export function StaffSupportPanel({
  tickets,
  currentUser,
  onSendMessage,
  onUpdateStatus,
  selectedTicketId: controlledSelectedId,
  onSelectedTicketIdChange,
  initialSelectedTicketId = null,
}: StaffSupportPanelProps) {
  const [section, setSection] = useState<SupportInboxSection>('messages');
  const [statusFilter, setStatusFilter] = useState<'open' | 'all'>('open');
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(initialSelectedTicketId);

  const selectedId = controlledSelectedId ?? internalSelectedId;

  const setSelectedId = (ticketId: string | null) => {
    if (controlledSelectedId === undefined) setInternalSelectedId(ticketId);
    onSelectedTicketIdChange?.(ticketId);
  };

  useEffect(() => {
    if (initialSelectedTicketId) {
      const ticket = tickets.find((t) => t.id === initialSelectedTicketId);
      if (ticket) {
        setSection(ticket.kind === 'report' ? 'reports' : 'messages');
      }
      setSelectedId(initialSelectedTicketId);
    }
  }, [initialSelectedTicketId, tickets]);

  const sectionTickets = useMemo(
    () => tickets.filter((t) => (section === 'messages' ? t.kind === 'chat' : t.kind === 'report')),
    [tickets, section]
  );

  const sorted = useMemo(
    () => [...sectionTickets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [sectionTickets]
  );

  const filtered = useMemo(
    () => (statusFilter === 'open' ? sorted.filter((t) => t.status !== 'resolved') : sorted),
    [sorted, statusFilter]
  );

  const selected = selectedId
    ? filtered.find((t) => t.id === selectedId) ?? sectionTickets.find((t) => t.id === selectedId) ?? null
    : null;

  useEffect(() => {
    if (!selectedId) return;
    if (!sectionTickets.some((t) => t.id === selectedId)) {
      setSelectedId(null);
    }
  }, [sectionTickets, selectedId]);

  const handleSend = async (body: string) => {
    if (!selected) return;
    await onSendMessage(selected.id, body);
    if (selected.status === 'open') {
      await onUpdateStatus(selected.id, 'in-progress');
    }
  };

  const openCount = openTicketCount(sectionTickets);

  const listView = (
    <div className="flex flex-col min-h-0 h-full px-4 sm:px-5 py-4">
      <div className="app-messages-hub-lead mb-4">
        <h2 className="text-base font-bold tracking-tight">
          {section === 'messages' ? 'User messages' : 'Formal reports'}
        </h2>
        <p>
          {openCount} open · {sectionTickets.length} total
        </p>
      </div>

      <AppSegmentedControl
        options={[
          { id: 'messages', label: 'Messages' },
          { id: 'reports', label: 'Reports' },
        ]}
        value={section}
        onChange={(id) => {
          setSection(id as SupportInboxSection);
          setSelectedId(null);
        }}
      />

      <div className="mt-3">
        <AppSegmentedControl
          options={[
            { id: 'open', label: 'Open' },
            { id: 'all', label: 'All' },
          ]}
          value={statusFilter}
          onChange={(id) => setStatusFilter(id as 'open' | 'all')}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto mt-4">
        {filtered.length === 0 ? (
          <p className="staff-empty-state">
            {section === 'messages' ? 'No user messages in this view.' : 'No reports in this view.'}
          </p>
        ) : (
          <AppInboxList>
            {filtered.map((ticket) => {
              const lastMessage = ticket.messages[ticket.messages.length - 1];
              return (
                <AppInboxRow
                  key={ticket.id}
                  title={ticket.subject}
                  preview={lastMessage?.body}
                  meta={new Date(ticket.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  badges={
                    <>
                      <WfBadge tone={ticket.status === 'resolved' ? 'default' : 'primary'}>
                        {SUPPORT_STATUS_LABEL[ticket.status]}
                      </WfBadge>
                      <WfBadge tone="default">{categoryLabel(ticket.category)}</WfBadge>
                      {ticket.priority !== 'normal' && (
                        <WfBadge tone="warning">{priorityLabel(ticket.priority)}</WfBadge>
                      )}
                    </>
                  }
                  onClick={() => setSelectedId(ticket.id)}
                />
              );
            })}
          </AppInboxList>
        )}
      </div>
    </div>
  );

  const threadView = !selected ? (
    <div className="staff-empty-state flex-1 flex items-center justify-center h-full">
      <div className="text-center px-6">
        <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm font-semibold">Select a conversation</p>
        <p className="text-xs text-brand-text-muted mt-1">
          Choose a {section === 'messages' ? 'message' : 'report'} from the list to reply.
        </p>
      </div>
    </div>
  ) : (
    <div className="flex flex-col h-full min-h-0 bg-brand-bg">
      <AppChatHeader
        title={selected.subject}
        subtitle={`${selected.userName} · ${ROLE_LABELS[selected.userRole]}`}
        onBack={() => setSelectedId(null)}
        trailing={
          <select
            value={selected.status}
            onChange={(e) => void onUpdateStatus(selected.id, e.target.value as SupportTicketStatus)}
            className="uber-input text-xs py-1.5 max-w-[8.5rem]"
          >
            {(Object.keys(SUPPORT_STATUS_LABEL) as SupportTicketStatus[]).map((s) => (
              <option key={s} value={s}>
                {SUPPORT_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        }
      />
      <div className="flex-1 min-h-0">
        <ChatThreadPanel
          messages={selected.messages.map((msg) => ({
            id: msg.id,
            senderId: msg.senderId,
            senderName: msg.senderName,
            senderRole: msg.senderRole,
            body: msg.body,
            createdAt: msg.createdAt,
          }))}
          currentUserId={currentUser.id}
          onSend={handleSend}
          placeholder="Reply to user…"
          teamChat
        />
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col min-h-0">
      {selected ? threadView : listView}
    </div>
  );
}
