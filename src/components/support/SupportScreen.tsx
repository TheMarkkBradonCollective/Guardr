import React, { useMemo, useState, useEffect } from 'react';
import {
  SecurityRequest,
  SessionUser,
  SupportTicket,
} from '../../types';
import {
  categoryLabel,
  SUPPORT_STATUS_LABEL,
  supportStatusLabel,
  ticketsForUser,
} from '../../lib/support';
import {
  AppChatHeader,
  AppDashboardZone,
  AppInboxList,
  AppInboxRow,
  AppItemCard,
  AppItemCardStack,
  AppScreen,
} from '../ui/app/AppPrimitives';
import { MessagesInboxTabs } from '../messaging/MessagesInboxTabs';
import { ChatThreadPanel } from '../messaging/ChatThreadPanel';
import { AppPageTransition } from '../ui/motion/AppMotion';
import { ChevronRight, FileText, LifeBuoy } from 'lucide-react';

type SupportSection = 'support' | 'reports';

interface SupportScreenProps {
  currentUser: SessionUser;
  tickets: SupportTicket[];
  relatedRequests?: Pick<SecurityRequest, 'id' | 'title' | 'location'>[];
  onSendMessage: (ticketId: string, body: string) => void | Promise<void>;
  initialTicketId?: string | null;
  onActiveTicketIdChange?: (ticketId: string | null) => void;
  initialSection?: SupportSection;
  onOpenCompose?: () => void;
  onOpenReport?: () => void;
}

export function SupportScreen({
  currentUser,
  tickets,
  onSendMessage,
  initialTicketId = null,
  onActiveTicketIdChange,
  initialSection = 'support',
  onOpenCompose,
  onOpenReport,
}: SupportScreenProps) {
  const [section, setSection] = useState<SupportSection>(initialSection);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(initialTicketId);

  const myTickets = useMemo(() => ticketsForUser(tickets, currentUser), [tickets, currentUser]);
  const chatTickets = useMemo(() => myTickets.filter((t) => t.kind === 'chat'), [myTickets]);
  const reportTickets = useMemo(() => myTickets.filter((t) => t.kind === 'report'), [myTickets]);

  const activeChatTicket = useMemo(
    () => chatTickets.find((t) => t.status !== 'resolved') ?? null,
    [chatTickets]
  );
  const activeTicket = myTickets.find((t) => t.id === activeTicketId) ?? null;

  useEffect(() => {
    setSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    if (!initialTicketId) {
      setActiveTicketId(null);
      return;
    }
    const ticket = myTickets.find((t) => t.id === initialTicketId);
    if (!ticket) {
      setActiveTicketId(null);
      return;
    }
    setSection(ticket.kind === 'report' ? 'reports' : 'support');
    setActiveTicketId(initialTicketId);
  }, [initialTicketId, myTickets]);

  const openThread = (ticketId: string) => {
    const ticket = myTickets.find((t) => t.id === ticketId);
    if (ticket) {
      setSection(ticket.kind === 'report' ? 'reports' : 'support');
    }
    setActiveTicketId(ticketId);
    onActiveTicketIdChange?.(ticketId);
  };

  const startChat = () => {
    if (activeChatTicket) {
      openThread(activeChatTicket.id);
      return;
    }
    onOpenCompose?.();
  };

  const startReport = () => {
    onOpenReport?.();
  };

  if (activeTicket) {
    const isReport = activeTicket.kind === 'report';
    const threadMessages = activeTicket.messages.map((msg) => ({
      id: msg.id,
      senderId: msg.senderId,
      senderName: msg.senderName,
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
              setActiveTicketId(null);
              onActiveTicketIdChange?.(null);
            }}
            backLabel="Support"
          />
          <div className="flex-1 min-h-0">
            <ChatThreadPanel
              messages={threadMessages}
              currentUserId={currentUser.id}
              viewerRole={currentUser.role}
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

  return (
    <AppPageTransition motionKey={`home-${section}`} className="h-full min-h-0">
      <AppScreen className="pb-8">
        <div className="px-5 pt-2 pb-4">
          <MessagesInboxTabs
            className="staff-list-filter-tabs"
            activeTab={section}
            onTabChange={(tabId) => setSection(tabId as SupportSection)}
            tabs={[
              { id: 'support', label: 'Support', icon: <LifeBuoy className="w-3.5 h-3.5" strokeWidth={2} /> },
              { id: 'reports', label: 'Reports', icon: <FileText className="w-3.5 h-3.5" strokeWidth={2} /> },
            ]}
          />
        </div>

        {section === 'support' ? (
          <>
            <AppDashboardZone title="Contact support">
              <AppItemCardStack>
                <AppItemCard onClick={() => startChat()}>
                  <LifeBuoy className="w-5 h-5 shrink-0 text-brand-primary" strokeWidth={1.5} />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-semibold text-sm">
                      {activeChatTicket ? 'Continue support chat' : 'Contact support'}
                    </p>
                    {activeChatTicket && (
                      <p className="text-sm text-brand-text-muted mt-0.5">
                        Resume your conversation: {activeChatTicket.subject}
                      </p>
                    )}
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
                <AppItemCard onClick={() => startReport()}>
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
