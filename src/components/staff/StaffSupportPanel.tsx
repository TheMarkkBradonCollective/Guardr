import React, { useEffect, useMemo, useState } from 'react';
import { SupportTicket, SupportTicketStatus } from '../../types';
import {
  categoryLabel,
  openTicketCount,
  priorityLabel,
  SUPPORT_STATUS_LABEL,
} from '../../lib/support';
import { ROLE_LABELS } from '../../lib/permissions';
import { AppItemCard, AppItemCardStack } from '../ui/app/AppPrimitives';
import { WfBadge } from '../ui/wireframe';
import { ArrowLeft, MessageCircle, Send } from 'lucide-react';

interface StaffSupportPanelProps {
  tickets: SupportTicket[];
  onSendMessage: (ticketId: string, body: string) => void | Promise<void>;
  onUpdateStatus: (ticketId: string, status: SupportTicketStatus) => void | Promise<void>;
  selectedTicketId?: string | null;
  onSelectedTicketIdChange?: (ticketId: string | null) => void;
  initialSelectedTicketId?: string | null;
}

export function StaffSupportPanel({
  tickets,
  onSendMessage,
  onUpdateStatus,
  selectedTicketId: controlledSelectedId,
  onSelectedTicketIdChange,
  initialSelectedTicketId = null,
}: StaffSupportPanelProps) {
  const [filter, setFilter] = useState<'open' | 'all'>('open');
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(initialSelectedTicketId);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedId = controlledSelectedId ?? internalSelectedId;

  const setSelectedId = (ticketId: string | null) => {
    if (controlledSelectedId === undefined) setInternalSelectedId(ticketId);
    onSelectedTicketIdChange?.(ticketId);
    setDraft('');
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

  const selected = selectedId ? filtered.find((t) => t.id === selectedId) ?? tickets.find((t) => t.id === selectedId) ?? null : null;

  const handleSend = async () => {
    if (!selected || !draft.trim()) return;
    setSubmitting(true);
    try {
      await onSendMessage(selected.id, draft.trim());
      setDraft('');
      if (selected.status === 'open') {
        await onUpdateStatus(selected.id, 'in-progress');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const listView = (
    <div className="staff-split-pane-list">
      <div className="staff-pane-header">
        <h2 className="font-bold text-sm">Support inbox</h2>
        <p className="text-xs text-brand-text-muted mt-1">
          {openTicketCount(tickets)} open · {tickets.length} total
        </p>
        <div className="flex uber-tab-bar border-b border-brand-border">
          {(['open', 'all'] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
                filter === id
                  ? 'border-brand-primary text-brand-text'
                  : 'border-transparent text-brand-text-muted hover:text-brand-text'
              }`}
            >
              {id === 'open' ? 'Open' : 'All'}
            </button>
          ))}
        </div>
      </div>
      <div className="staff-pane-body p-3">
        {filtered.length === 0 ? (
          <p className="staff-empty-state">No tickets in this view.</p>
        ) : (
          <AppItemCardStack>
            {filtered.map((ticket) => (
              <AppItemCard
                key={ticket.id}
                selected={selectedId === ticket.id}
                onClick={() => setSelectedId(ticket.id)}
                className="flex-col !items-stretch gap-1"
              >
                <p className="font-semibold text-sm truncate">{ticket.subject}</p>
                <p className="text-xs text-brand-text-muted mt-1 truncate">
                  {ticket.userName} · {ROLE_LABELS[ticket.userRole]}
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <WfBadge tone={ticket.status === 'resolved' ? 'default' : 'primary'}>
                    {SUPPORT_STATUS_LABEL[ticket.status]}
                  </WfBadge>
                  <WfBadge tone="default">{categoryLabel(ticket.category)}</WfBadge>
                </div>
              </AppItemCard>
            ))}
          </AppItemCardStack>
        )}
      </div>
    </div>
  );

  const threadView = !selected ? (
    <div className="staff-empty-state flex-1 flex items-center justify-center">
      <div>
        <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
        Select a support ticket to view messages and reply.
      </div>
    </div>
  ) : (
    <div className="flex flex-col h-full min-h-0 bg-brand-bg">
      <div className="staff-pane-header shrink-0">
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="p-2 -ml-2 text-brand-text lg:hidden"
            aria-label="Back to inbox"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <div className="flex flex-wrap items-start justify-between gap-3 flex-1 min-w-0">
            <div className="min-w-0">
              <h3 className="font-bold truncate">{selected.subject}</h3>
              <p className="text-sm text-brand-text-muted mt-1">
                {selected.userName} · {selected.userEmail} · {ROLE_LABELS[selected.userRole]}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <WfBadge tone="default">{categoryLabel(selected.category)}</WfBadge>
                {selected.priority !== 'normal' && (
                  <WfBadge tone="warning">{priorityLabel(selected.priority)} priority</WfBadge>
                )}
                <WfBadge tone={selected.kind === 'report' ? 'warning' : 'primary'}>
                  {selected.kind === 'report' ? 'Report' : 'Chat'}
                </WfBadge>
              </div>
            </div>
            <select
              value={selected.status}
              onChange={(e) => void onUpdateStatus(selected.id, e.target.value as SupportTicketStatus)}
              className="uber-input text-xs py-1.5"
            >
              {(Object.keys(SUPPORT_STATUS_LABEL) as SupportTicketStatus[]).map((s) => (
                <option key={s} value={s}>{SUPPORT_STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="staff-pane-body p-4 space-y-3 flex-1 min-h-0 overflow-y-auto">
        {selected.messages.map((msg) => {
          const staff =
            msg.senderRole === 'moderator' ||
            msg.senderRole === 'administrator' ||
            msg.senderRole === 'director' ||
            msg.senderRole === 'owner';
          return (
            <div key={msg.id} className={`flex ${staff ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] px-4 py-2.5 text-sm border ${
                  staff
                    ? 'bg-brand-primary text-brand-accent-text'
                    : 'bg-brand-bg-sec border border-brand-border'
                }`}
              >
                <p className="text-xs opacity-70 mb-1">{msg.senderName}</p>
                <p className="whitespace-pre-wrap">{msg.body}</p>
                <p className="text-xs opacity-60 mt-1">{new Date(msg.createdAt).toLocaleString()}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="staff-pane-footer flex gap-2 shrink-0">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && void handleSend()}
          placeholder="Reply to user…"
          className="uber-input flex-1"
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={submitting || !draft.trim()}
          className="app-button-primary !w-auto !h-11 !px-4 shrink-0 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
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
