import React, { useMemo, useState } from 'react';
import { SupportTicket, SupportTicketStatus } from '../../types';
import {
  categoryLabel,
  openTicketCount,
  priorityLabel,
  SUPPORT_STATUS_LABEL,
} from '../../lib/support';
import { ROLE_LABELS } from '../../lib/permissions';
import { MessageCircle, Send } from 'lucide-react';

interface StaffSupportPanelProps {
  tickets: SupportTicket[];
  onSendMessage: (ticketId: string, body: string) => void | Promise<void>;
  onUpdateStatus: (ticketId: string, status: SupportTicketStatus) => void | Promise<void>;
}

export function StaffSupportPanel({ tickets, onSendMessage, onUpdateStatus }: StaffSupportPanelProps) {
  const [filter, setFilter] = useState<'open' | 'all'>('open');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sorted = useMemo(
    () => [...tickets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [tickets]
  );

  const filtered = useMemo(
    () => (filter === 'open' ? sorted.filter((t) => t.status !== 'resolved') : sorted),
    [sorted, filter]
  );

  const selected = filtered.find((t) => t.id === selectedId) ?? filtered[0] ?? null;

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

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 min-h-0">
      <div className="lg:w-80 shrink-0 flex flex-col min-h-0 border border-brand-border rounded-2xl bg-brand-surface overflow-hidden">
        <div className="p-4 border-b border-brand-border">
          <h2 className="font-bold text-sm">Support inbox</h2>
          <p className="text-xs text-brand-text-muted mt-1">
            {openTicketCount(tickets)} open · {tickets.length} total
          </p>
          <div className="flex gap-1 mt-3">
            {(['open', 'all'] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`flex-1 py-1.5 text-[10px] font-mono font-bold uppercase rounded-lg border transition-colors ${
                  filter === id
                    ? 'bg-brand-primary text-brand-accent-text border-brand-primary'
                    : 'border-brand-border text-brand-text-muted'
                }`}
              >
                {id}
              </button>
            ))}
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto divide-y divide-brand-border">
          {filtered.length === 0 ? (
            <li className="p-6 text-sm text-brand-text-muted text-center">No tickets in this view.</li>
          ) : (
            filtered.map((ticket) => (
              <li key={ticket.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(ticket.id);
                    setDraft('');
                  }}
                  className={`w-full p-4 text-left transition-colors ${
                    selected?.id === ticket.id ? 'bg-brand-primary/10' : 'hover:bg-brand-bg-sec'
                  }`}
                >
                  <p className="font-semibold text-sm truncate">{ticket.subject}</p>
                  <p className="text-xs text-brand-text-muted mt-1 truncate">
                    {ticket.userName} · {ROLE_LABELS[ticket.userRole]}
                  </p>
                  <p className="text-[10px] text-brand-text-muted mt-1">
                    {SUPPORT_STATUS_LABEL[ticket.status]} · {categoryLabel(ticket.category)}
                  </p>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="flex-1 min-w-0 flex flex-col min-h-[320px] border border-brand-border rounded-2xl bg-brand-surface overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-brand-text-muted text-sm p-8 text-center">
            <div>
              <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
              Select a support ticket to view messages and reply.
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-brand-border shrink-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{selected.subject}</h3>
                  <p className="text-sm text-brand-text-muted mt-1">
                    {selected.userName} · {selected.userEmail} · {ROLE_LABELS[selected.userRole]}
                  </p>
                  <p className="text-xs text-brand-text-muted mt-1">
                    {categoryLabel(selected.category)}
                    {selected.priority !== 'normal' ? ` · ${priorityLabel(selected.priority)} priority` : ''}
                    {selected.kind === 'report' ? ' · Report' : ' · Chat'}
                  </p>
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

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selected.messages.map((msg) => {
                const staff = msg.senderRole === 'moderator' || msg.senderRole === 'administrator' || msg.senderRole === 'director';
                return (
                  <div key={msg.id} className={`flex ${staff ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                        staff
                          ? 'bg-brand-primary text-brand-accent-text'
                          : 'bg-brand-bg-sec border border-brand-border'
                      }`}
                    >
                      <p className="text-[10px] font-mono uppercase opacity-70 mb-1">{msg.senderName}</p>
                      <p className="whitespace-pre-wrap">{msg.body}</p>
                      <p className="text-[10px] opacity-60 mt-1">{new Date(msg.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-brand-border shrink-0 flex gap-2">
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
                className="uber-button-sage h-11 px-4 shrink-0 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
