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
import { AppList, AppListRow, AppScreen, AppScreenTitle } from '../ui/app/AppPrimitives';
import { ArrowLeft, ChevronRight, FileText, MessageCircle, Send } from 'lucide-react';

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

  const backButton = (toHome = false) => (
    <button
      type="button"
      onClick={() => {
        if (toHome && onBack) onBack();
        else {
          setView('home');
          setActiveTicketId(null);
        }
      }}
      className="p-2 -ml-2 text-brand-text"
      aria-label="Back"
    >
      <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
    </button>
  );

  if (view === 'thread' && activeTicket) {
    return (
      <div className="h-full flex flex-col bg-brand-bg">
        <div className="shrink-0 flex items-center gap-2 px-3 pt-2 pb-3 border-b border-brand-border">
          {backButton()}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{activeTicket.subject}</p>
            <p className="text-xs text-brand-text-muted truncate">
              {categoryLabel(activeTicket.category)} · {SUPPORT_STATUS_LABEL[activeTicket.status]}
            </p>
          </div>
        </div>
        <div className="app-chat-pane space-y-3">
          {activeTicket.messages.map((msg) => {
            const mine = msg.senderId === currentUser.id;
            const staff = isStaffRole(msg.senderRole);
            return (
              <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    staff
                      ? 'bg-brand-bg-sec text-brand-text'
                      : mine
                        ? 'bg-brand-primary text-brand-accent-text'
                        : 'bg-brand-bg-sec text-brand-text'
                  }`}
                >
                  <p className="text-xs opacity-70 mb-1">{staff ? 'Guardr staff' : msg.senderName}</p>
                  <p className="whitespace-pre-wrap">{msg.body}</p>
                  <p className="text-xs opacity-60 mt-1">{new Date(msg.createdAt).toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>
        {activeTicket.status !== 'resolved' ? (
          <div className="shrink-0 flex gap-2 p-3 border-t border-brand-border">
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
              className="app-button-primary !w-auto !h-11 !px-4 shrink-0 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className="shrink-0 text-sm text-brand-text-muted text-center p-4 border-t border-brand-border">
            This conversation is resolved. Open a new message if you need more help.
          </p>
        )}
      </div>
    );
  }

  if (view === 'report') {
    return (
      <AppScreen className="pb-8">
        <div className="flex items-center gap-2 px-3 pt-2 mb-2">
          {backButton()}
          <h1 className="text-[1.75rem] font-bold tracking-tight">File a report</h1>
        </div>
        <p className="text-sm text-brand-text-muted px-5 mb-6">Describe the issue — staff will review and follow up.</p>
        <form onSubmit={(e) => void handleSubmitReport(e)} className="px-5 space-y-4">
          <div>
            <label className="uber-label block mb-1">Category</label>
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
            <label className="uber-label block mb-1">Priority</label>
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
              <label className="uber-label block mb-1">Related job (optional)</label>
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
            <label className="uber-label block mb-1">Subject</label>
            <input
              value={reportSubject}
              onChange={(e) => setReportSubject(e.target.value)}
              className="uber-input w-full"
              placeholder="Brief summary"
              required
            />
          </div>
          <div>
            <label className="uber-label block mb-1">Details</label>
            <textarea
              value={reportBody}
              onChange={(e) => setReportBody(e.target.value)}
              className="uber-input w-full min-h-[140px] resize-y"
              placeholder="What happened? Include dates, locations, and anyone involved."
              required
            />
          </div>
          <button type="submit" disabled={submitting} className="w-full app-button-primary disabled:opacity-50">
            Submit report to staff
          </button>
        </form>
      </AppScreen>
    );
  }

  return (
    <AppScreen className="pb-8">
      <AppScreenTitle>Support</AppScreenTitle>
      <p className="text-sm text-brand-text-muted px-5 -mt-3 mb-6">Message Guardr staff or submit a report.</p>

      <AppList>
        <AppListRow onClick={() => !submitting && void startKind('chat')} className="!py-4">
          <MessageCircle className="w-5 h-5 shrink-0" strokeWidth={1.5} />
          <div className="flex-1 min-w-0 text-left">
            <p className="font-semibold text-sm">Message staff</p>
            <p className="text-sm text-brand-text-muted mt-0.5">Chat with the Guardr operations team.</p>
          </div>
          <ChevronRight className="w-5 h-5 text-brand-text-muted shrink-0" />
        </AppListRow>
        <AppListRow onClick={() => void startKind('report')} className="!py-4">
          <FileText className="w-5 h-5 shrink-0" strokeWidth={1.5} />
          <div className="flex-1 min-w-0 text-left">
            <p className="font-semibold text-sm">File a report</p>
            <p className="text-sm text-brand-text-muted mt-0.5">Submit an issue, safety concern, or complaint.</p>
          </div>
          <ChevronRight className="w-5 h-5 text-brand-text-muted shrink-0" />
        </AppListRow>
      </AppList>

      <div className="app-section-head mt-8">
        <h2>Your conversations</h2>
      </div>

      {myTickets.length === 0 ? (
        <p className="text-sm text-brand-text-muted text-center py-10 px-5">
          No support threads yet. Message staff or file a report to get started.
        </p>
      ) : (
        <AppList>
          {myTickets.map((ticket) => (
            <AppListRow key={ticket.id} onClick={() => openThread(ticket.id)} className="app-list-row-align-top !items-start !py-4">
              <div className="flex-1 min-w-0 text-left">
                <p className="font-semibold text-sm">{ticket.subject}</p>
                <p className="text-xs text-brand-text-muted mt-1">
                  {categoryLabel(ticket.category)}
                  {ticket.priority !== 'normal' ? ` · ${priorityLabel(ticket.priority)}` : ''}
                  {' · '}
                  {new Date(ticket.updatedAt).toLocaleString()}
                </p>
                <p className="text-xs text-brand-text-muted mt-1">
                  {ticket.kind === 'report' ? 'Report' : 'Chat'} · {SUPPORT_STATUS_LABEL[ticket.status]}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-brand-text-muted shrink-0 mt-0.5" />
            </AppListRow>
          ))}
        </AppList>
      )}
    </AppScreen>
  );
}
