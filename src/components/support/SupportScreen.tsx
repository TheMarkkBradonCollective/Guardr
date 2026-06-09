import React, { useMemo, useState } from 'react';
import {
  CreateSupportTicketInput,
  SecurityRequest,
  SessionUser,
  SupportTicket,
  SupportTicketCategory,
  SupportTicketKind,
  SupportPriority,
} from '../../types';
import {
  categoryLabel,
  priorityLabel,
  SUPPORT_CATEGORY_OPTIONS,
  SUPPORT_PRIORITY_OPTIONS,
  SUPPORT_STATUS_LABEL,
  ticketsForUser,
} from '../../lib/support';
import { isStaffRole } from '../../lib/permissions';
import {
  ArrowLeft,
  ChevronRight,
  FileText,
  LifeBuoy,
  MessageCircle,
  Send,
} from 'lucide-react';

type SupportView = 'home' | 'chat' | 'report' | 'thread';

interface SupportScreenProps {
  currentUser: SessionUser;
  tickets: SupportTicket[];
  relatedRequests?: Pick<SecurityRequest, 'id' | 'title' | 'location'>[];
  onCreateTicket: (input: CreateSupportTicketInput) => void | Promise<string | void>;
  onSendMessage: (ticketId: string, body: string) => void | Promise<void>;
  onBack?: () => void;
}

export function SupportScreen({
  currentUser,
  tickets,
  relatedRequests = [],
  onCreateTicket,
  onSendMessage,
  onBack,
}: SupportScreenProps) {
  const [view, setView] = useState<SupportView>('home');
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [reportSubject, setReportSubject] = useState('');
  const [reportBody, setReportBody] = useState('');
  const [reportCategory, setReportCategory] = useState<SupportTicketCategory>('general');
  const [reportPriority, setReportPriority] = useState<SupportPriority>('normal');
  const [relatedRequestId, setRelatedRequestId] = useState('');

  const myTickets = useMemo(() => ticketsForUser(tickets, currentUser), [tickets, currentUser]);
  const activeTicket = myTickets.find((t) => t.id === activeTicketId) ?? null;

  const openThread = (ticketId: string) => {
    setActiveTicketId(ticketId);
    setDraft('');
    setView('thread');
  };

  const startKind = async (kind: SupportTicketKind, defaults?: Partial<CreateSupportTicketInput>) => {
    if (kind === 'report') {
      setReportSubject('');
      setReportBody('');
      setReportCategory('general');
      setReportPriority('normal');
      setRelatedRequestId('');
      setView('report');
      return;
    }
    setSubmitting(true);
    try {
      const ticketId = await onCreateTicket({
        kind: 'chat',
        subject: defaults?.subject ?? 'Message to Guardr staff',
        category: defaults?.category ?? 'general',
        body: defaults?.body ?? 'Hi — I need help from the Guardr team.',
        priority: 'normal',
      });
      if (ticketId) openThread(ticketId);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSend = async () => {
    if (!draft.trim() || !activeTicket) return;
    setSubmitting(true);
    try {
      await onSendMessage(activeTicket.id, draft.trim());
      setDraft('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportSubject.trim() || !reportBody.trim()) return;
    setSubmitting(true);
    try {
      await onCreateTicket({
        kind: 'report',
        subject: reportSubject.trim(),
        category: reportCategory,
        priority: reportPriority,
        body: reportBody.trim(),
        relatedRequestId: relatedRequestId || undefined,
      });
      setView('home');
    } finally {
      setSubmitting(false);
    }
  };

  const header = (title: string, subtitle?: string) => (
    <div className="shrink-0 flex items-center gap-3 mb-6">
      {onBack && view === 'home' && (
        <button type="button" onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-brand-surface" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      {view !== 'home' && (
        <button
          type="button"
          onClick={() => {
            setView('home');
            setActiveTicketId(null);
          }}
          className="p-2 -ml-2 rounded-full hover:bg-brand-surface"
          aria-label="Back to support home"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted">Support</p>
        <h1 className="text-lg font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-brand-text-muted mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );

  if (view === 'thread' && activeTicket) {
    return (
      <div className="h-full flex flex-col max-w-2xl mx-auto p-4 sm:p-6">
        {header(activeTicket.subject, `${categoryLabel(activeTicket.category)} · ${SUPPORT_STATUS_LABEL[activeTicket.status]}`)}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 mb-4 rounded-2xl border border-brand-border bg-brand-surface p-4">
          {activeTicket.messages.map((msg) => {
            const mine = msg.senderId === currentUser.id;
            const staff = isStaffRole(msg.senderRole);
            return (
              <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    staff
                      ? 'bg-brand-primary/15 border border-brand-primary/30 text-brand-text'
                      : mine
                        ? 'bg-brand-primary text-brand-accent-text'
                        : 'bg-brand-bg-sec border border-brand-border'
                  }`}
                >
                  <p className="text-[10px] font-mono uppercase opacity-70 mb-1">
                    {staff ? 'Guardr staff' : msg.senderName}
                  </p>
                  <p className="whitespace-pre-wrap">{msg.body}</p>
                  <p className="text-[10px] opacity-60 mt-1">
                    {new Date(msg.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        {activeTicket.status !== 'resolved' ? (
          <div className="flex gap-2 shrink-0">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && void handleSend()}
              placeholder="Type a message to staff…"
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
        ) : (
          <p className="text-sm text-brand-text-muted text-center">This conversation is resolved. Open a new message if you need more help.</p>
        )}
      </div>
    );
  }

  if (view === 'report') {
    return (
      <div className="h-full overflow-y-auto max-w-2xl mx-auto p-4 sm:p-6">
        {header('File a report', 'Describe the issue — staff will review and follow up.')}
        <form onSubmit={(e) => void handleSubmitReport(e)} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-brand-text-muted block mb-1">Category</label>
            <select
              value={reportCategory}
              onChange={(e) => setReportCategory(e.target.value as SupportTicketCategory)}
              className="uber-input w-full"
            >
              {SUPPORT_CATEGORY_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-brand-text-muted block mb-1">Priority</label>
            <select
              value={reportPriority}
              onChange={(e) => setReportPriority(e.target.value as SupportPriority)}
              className="uber-input w-full"
            >
              {SUPPORT_PRIORITY_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
          {relatedRequests.length > 0 && (
            <div>
              <label className="text-xs font-medium text-brand-text-muted block mb-1">Related job (optional)</label>
              <select
                value={relatedRequestId}
                onChange={(e) => setRelatedRequestId(e.target.value)}
                className="uber-input w-full"
              >
                <option value="">None</option>
                {relatedRequests.map((r) => (
                  <option key={r.id} value={r.id}>{r.title} — {r.location}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-brand-text-muted block mb-1">Subject</label>
            <input
              value={reportSubject}
              onChange={(e) => setReportSubject(e.target.value)}
              className="uber-input w-full"
              placeholder="Brief summary"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-brand-text-muted block mb-1">Details</label>
            <textarea
              value={reportBody}
              onChange={(e) => setReportBody(e.target.value)}
              className="uber-input w-full min-h-[140px] resize-y"
              placeholder="What happened? Include dates, locations, and anyone involved."
              required
            />
          </div>
          <button type="submit" disabled={submitting} className="w-full uber-button-sage h-11 text-sm disabled:opacity-50">
            Submit report to staff
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto max-w-2xl mx-auto p-4 sm:p-6">
      {header('Help & support', 'Message Guardr staff or submit a report.')}

      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        <button
          type="button"
          onClick={() => void startKind('chat')}
          disabled={submitting}
          className="uber-card p-5 text-left hover:border-brand-primary/40 transition-colors disabled:opacity-50"
        >
          <MessageCircle className="w-8 h-8 text-brand-primary mb-3" />
          <p className="font-semibold">Message staff</p>
          <p className="text-sm text-brand-text-muted mt-1">Chat with the Guardr operations team.</p>
        </button>
        <button
          type="button"
          onClick={() => void startKind('report')}
          className="uber-card p-5 text-left hover:border-brand-primary/40 transition-colors"
        >
          <FileText className="w-8 h-8 text-brand-primary mb-3" />
          <p className="font-semibold">File a report</p>
          <p className="text-sm text-brand-text-muted mt-1">Submit an issue, safety concern, or complaint.</p>
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <LifeBuoy className="w-4 h-4 text-brand-primary" />
        <h2 className="font-semibold text-sm">Your conversations</h2>
      </div>

      {myTickets.length === 0 ? (
        <p className="text-sm text-brand-text-muted text-center py-8 rounded-2xl border border-dashed border-brand-border">
          No support threads yet. Message staff or file a report to get started.
        </p>
      ) : (
        <ul className="space-y-2">
          {myTickets.map((ticket) => (
            <li key={ticket.id}>
              <button
                type="button"
                onClick={() => openThread(ticket.id)}
                className="w-full uber-card p-4 flex items-center gap-3 text-left hover:border-brand-primary/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm truncate">{ticket.subject}</p>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-brand-bg-sec border border-brand-border">
                      {ticket.kind === 'report' ? 'Report' : 'Chat'}
                    </span>
                    <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                      ticket.status === 'resolved'
                        ? 'bg-slate-500/10 text-slate-400'
                        : 'bg-brand-primary/10 text-brand-primary'
                    }`}>
                      {SUPPORT_STATUS_LABEL[ticket.status]}
                    </span>
                  </div>
                  <p className="text-xs text-brand-text-muted mt-1 truncate">
                    {categoryLabel(ticket.category)}
                    {ticket.priority !== 'normal' ? ` · ${priorityLabel(ticket.priority)}` : ''}
                    {' · '}
                    {new Date(ticket.updatedAt).toLocaleString()}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-brand-text-muted shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
