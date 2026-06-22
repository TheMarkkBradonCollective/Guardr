import React, { useMemo, useState, useEffect } from 'react';
import {
  CreateSupportTicketInput,
  SecurityRequest,
  SessionUser,
  SupportTicket,
  SupportTicketCategory,
  SupportPriority,
} from '../../types';
import {
  categoryLabel,
  priorityLabel,
  SUPPORT_CATEGORY_OPTIONS,
  SUPPORT_PRIORITY_OPTIONS,
  SUPPORT_STATUS_LABEL,
  supportStatusLabel,
  ticketsForUser,
} from '../../lib/support';
import { isStaffRole } from '../../lib/permissions';
import {
  AppChatHeader,
  AppDashboardHero,
  AppDashboardZone,
  AppInboxList,
  AppInboxRow,
  AppItemCard,
  AppItemCardStack,
  AppScreen,
  AppSegmentedControl,
} from '../ui/app/AppPrimitives';
import { ChatThreadPanel } from '../messaging/ChatThreadPanel';
import { AppPageTransition } from '../ui/motion/AppMotion';
import { ArrowLeft, ChevronRight, FileText, LifeBuoy } from 'lucide-react';

type SupportView = 'home' | 'report' | 'thread';
type SupportSection = 'support' | 'reports';

interface SupportScreenProps {
  currentUser: SessionUser;
  tickets: SupportTicket[];
  relatedRequests?: Pick<SecurityRequest, 'id' | 'title' | 'location'>[];
  onCreateTicket: (input: CreateSupportTicketInput) => void | Promise<string | void>;
  onSendMessage: (ticketId: string, body: string) => void | Promise<void>;
  onBack?: () => void;
  initialTicketId?: string | null;
  onActiveTicketIdChange?: (ticketId: string | null) => void;
}

export function SupportScreen({
  currentUser,
  tickets,
  relatedRequests = [],
  onCreateTicket,
  onSendMessage,
  onBack,
  initialTicketId = null,
  onActiveTicketIdChange,
}: SupportScreenProps) {
  const [view, setView] = useState<SupportView>('home');
  const [section, setSection] = useState<SupportSection>('support');
  const [activeTicketId, setActiveTicketId] = useState<string | null>(initialTicketId);
  const [submitting, setSubmitting] = useState(false);

  const [reportSubject, setReportSubject] = useState('');
  const [reportBody, setReportBody] = useState('');
  const [reportCategory, setReportCategory] = useState<SupportTicketCategory>('general');
  const [reportPriority, setReportPriority] = useState<SupportPriority>('normal');
  const [relatedRequestId, setRelatedRequestId] = useState('');

  const myTickets = useMemo(() => ticketsForUser(tickets, currentUser), [tickets, currentUser]);
  const chatTickets = useMemo(() => myTickets.filter((t) => t.kind === 'chat'), [myTickets]);
  const reportTickets = useMemo(() => myTickets.filter((t) => t.kind === 'report'), [myTickets]);

  const activeChatTicket = useMemo(
    () => chatTickets.find((t) => t.status !== 'resolved') ?? null,
    [chatTickets]
  );
  const activeTicket = myTickets.find((t) => t.id === activeTicketId) ?? null;

  useEffect(() => {
    if (!initialTicketId) return;
    const ticket = myTickets.find((t) => t.id === initialTicketId);
    if (!ticket) {
      setActiveTicketId(null);
      setView('home');
      return;
    }
    setSection(ticket.kind === 'report' ? 'reports' : 'support');
    setActiveTicketId(initialTicketId);
    setView('thread');
  }, [initialTicketId, myTickets]);

  const openThread = (ticketId: string) => {
    const ticket = myTickets.find((t) => t.id === ticketId);
    if (ticket) {
      setSection(ticket.kind === 'report' ? 'reports' : 'support');
    }
    setActiveTicketId(ticketId);
    onActiveTicketIdChange?.(ticketId);
    setView('thread');
  };

  const startChat = async (defaults?: Partial<CreateSupportTicketInput>) => {
    setSubmitting(true);
    try {
      if (activeChatTicket) {
        openThread(activeChatTicket.id);
        return;
      }
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

  const startReport = () => {
    setReportSubject('');
    setReportBody('');
    setReportCategory('general');
    setReportPriority('normal');
    setRelatedRequestId('');
    setSection('reports');
    setView('report');
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
      setSection('reports');
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
          onActiveTicketIdChange?.(null);
        }
      }}
      className="p-2 -ml-2 text-brand-text"
      aria-label="Back"
    >
      <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
    </button>
  );

  if (view === 'thread' && activeTicket) {
    const isReport = activeTicket.kind === 'report';
    const threadMessages = activeTicket.messages.map((msg) => ({
      id: msg.id,
      senderId: msg.senderId,
      senderName: isStaffRole(msg.senderRole) ? 'Guardr staff' : msg.senderName,
      senderRole: msg.senderRole,
      body: msg.body,
      createdAt: msg.createdAt,
    }));

    const threadSubtitle = isReport
      ? `${categoryLabel(activeTicket.category)} · ${supportStatusLabel(activeTicket)}`
      : `${categoryLabel(activeTicket.category)} · ${SUPPORT_STATUS_LABEL[activeTicket.status]}`;

    return (
      <AppPageTransition motionKey={`thread-${activeTicket.id}`} className="h-full min-h-0">
        <div className="h-full flex flex-col bg-brand-bg min-h-0">
          <AppChatHeader
            title={activeTicket.subject}
            subtitle={threadSubtitle}
            onBack={() => {
              setView('home');
              setActiveTicketId(null);
              onActiveTicketIdChange?.(null);
            }}
          />
          <div className="flex-1 min-h-0">
            <ChatThreadPanel
              messages={threadMessages}
              currentUserId={currentUser.id}
              onSend={(body) => onSendMessage(activeTicket.id, body)}
              placeholder={isReport ? 'Add a follow-up note…' : 'Type a message to staff…'}
              readOnly={isReport ? activeTicket.status === 'resolved' : activeTicket.status === 'resolved'}
              readOnlyMessage={
                isReport
                  ? 'This report is closed. File a new report if you need further help.'
                  : 'This conversation is resolved. Contact support again if you need more help.'
              }
            />
          </div>
        </div>
      </AppPageTransition>
    );
  }

  if (view === 'report') {
    return (
      <AppPageTransition motionKey="report" className="h-full min-h-0">
        <AppScreen className="pb-8">
          <div className="flex items-center gap-2 px-3 pt-2 mb-2">
            {backButton()}
            <h1 className="text-[1.75rem] font-bold tracking-tight">File a report</h1>
          </div>
          <p className="text-sm text-brand-text-muted px-5 mb-6">
            Describe the issue — staff will review and follow up.
          </p>
          <form onSubmit={(e) => void handleSubmitReport(e)} className="px-5 space-y-4">
            <div>
              <label className="uber-label block mb-1">Category</label>
              <select
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value as SupportTicketCategory)}
                className="uber-input w-full"
              >
                {SUPPORT_CATEGORY_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
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
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
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
                    <option key={r.id} value={r.id}>
                      {r.title} — {r.location}
                    </option>
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
      </AppPageTransition>
    );
  }

  return (
    <AppPageTransition motionKey={`home-${section}`} className="h-full min-h-0">
      <AppScreen className="pb-8">
        <AppDashboardHero kicker="Help center" title="Support" />

        <div className="px-5 mb-5">
          <AppSegmentedControl
            options={[
              { id: 'support', label: 'Support' },
              { id: 'reports', label: 'Reports' },
            ]}
            value={section}
            onChange={(id) => setSection(id as SupportSection)}
          />
        </div>

        {section === 'support' ? (
          <>
            <AppDashboardZone title="Contact support">
              <AppItemCardStack>
                <AppItemCard onClick={() => !submitting && void startChat()}>
                  <LifeBuoy className="w-5 h-5 shrink-0 text-brand-primary" strokeWidth={1.5} />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-semibold text-sm">
                      {activeChatTicket ? 'Continue support chat' : 'Contact support'}
                    </p>
                    <p className="text-sm text-brand-text-muted mt-0.5">
                      {activeChatTicket
                        ? `Resume your conversation: ${activeChatTicket.subject}`
                        : 'Direct line to the Guardr operations team.'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-brand-text-muted shrink-0" />
                </AppItemCard>
              </AppItemCardStack>
            </AppDashboardZone>

            <AppDashboardZone title="Your support chats">
              {chatTickets.length === 0 ? (
                <p className="text-sm text-brand-text-muted text-center py-10">
                  No support chats yet. Tap above to contact the team.
                </p>
              ) : (
                <AppInboxList>
                  {chatTickets.map((ticket) => (
                    <AppInboxRow
                      key={ticket.id}
                      title={ticket.subject}
                      preview={ticket.messages[ticket.messages.length - 1]?.body}
                      meta={new Date(ticket.updatedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                      badges={
                        <span className="text-[10px] font-bold uppercase tracking-wide text-brand-primary">
                          {SUPPORT_STATUS_LABEL[ticket.status]}
                        </span>
                      }
                      onClick={() => openThread(ticket.id)}
                    />
                  ))}
                </AppInboxList>
              )}
            </AppDashboardZone>
          </>
        ) : (
          <>
            <AppDashboardZone title="File a report">
              <AppItemCardStack>
                <AppItemCard onClick={() => void startReport()}>
                  <FileText className="w-5 h-5 shrink-0 text-brand-primary" strokeWidth={1.5} />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-semibold text-sm">File a report</p>
                    <p className="text-sm text-brand-text-muted mt-0.5">
                      Safety concern, dispute, or formal complaint.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-brand-text-muted shrink-0" />
                </AppItemCard>
              </AppItemCardStack>
            </AppDashboardZone>

            <AppDashboardZone title="Your reports">
              {reportTickets.length === 0 ? (
                <p className="text-sm text-brand-text-muted text-center py-10">
                  No reports filed yet. Use the button above to submit one.
                </p>
              ) : (
                <AppInboxList>
                  {reportTickets.map((ticket) => (
                    <AppInboxRow
                      key={ticket.id}
                      title={ticket.subject}
                      preview={ticket.messages[0]?.body}
                      meta={new Date(ticket.updatedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                      badges={
                        <>
                          <span className="text-[10px] font-bold uppercase tracking-wide text-brand-primary">
                            {supportStatusLabel(ticket)}
                          </span>
                          <span className="text-[10px] text-brand-text-muted">
                            {categoryLabel(ticket.category)}
                          </span>
                        </>
                      }
                      onClick={() => openThread(ticket.id)}
                    />
                  ))}
                </AppInboxList>
              )}
            </AppDashboardZone>
          </>
        )}
      </AppScreen>
    </AppPageTransition>
  );
}
