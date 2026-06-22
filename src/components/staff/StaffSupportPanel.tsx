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
  const [filter, setFilter] = useState<'open' | 'all'>('open');
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(initialSelectedTicketId);

  const selectedId = controlledSelectedId ?? internalSelectedId;

  const setSelectedId = (ticketId: string | null) => {
    if (controlledSelectedId === undefined) setInternalSelectedId(ticketId);
    onSelectedTicketIdChange?.(ticketId);
  };

  useEffect(() => {
    if (initialSelectedTicketId) {
      setSelectedId(initialSelectedTicketId);
    }
  }, [initialSelectedTicketId]);

  const sorted = useMemo(
    () => [...tickets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [tickets]
  );

  const filtered = useMemo(
    () => (filter === 'open' ? sorted.filter((t) => t.status !== 'resolved') : sorted),
    [sorted, filter]
  );

  const selected = selectedId
    ? filtered.find((t) => t.id === selectedId) ?? tickets.find((t) => t.id === selectedId) ?? null
    : null;

  const handleSend = async (body: string) => {
    if (!selected) return;
    await onSendMessage(selected.id, body);
    if (selected.status === 'open') {
      await onUpdateStatus(selected.id, 'in-progress');
    }
  };

  const listView = (
    <div className="staff-split-pane-list flex flex-col min-h-0">
      <div className="app-messages-hub-lead">
        <h2 className="text-base font-bold tracking-tight">Support inbox</h2>
        <p>
          {openTicketCount(tickets)} open · {tickets.length} total
        </p>
      </div>
      <AppSegmentedControl
        options={[
          { id: 'open', label: 'Open' },
          { id: 'all', label: 'All' },
        ]}
        value={filter}
        onChange={(id) => setFilter(id)}
      />
      <div className="flex-1 min-h-0 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="staff-empty-state">No tickets in this view.</p>
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
                  selected={selectedId === ticket.id}
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
    <div className="staff-empty-state flex-1 flex items-center justify-center">
      <div className="text-center px-6">
        <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm font-semibold">Select a conversation</p>
        <p className="text-xs text-brand-text-muted mt-1">Reply to clients and guards from one confident inbox.</p>
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
    <>
      <div className="lg:hidden h-full flex flex-col min-h-0">
        {selected ? threadView : listView}
      </div>

      <div className="hidden lg:flex staff-split-pane h-full">
        {listView}
        <div className="staff-split-pane-detail flex flex-col min-h-0">{threadView}</div>
      </div>
    </>
  );
}
