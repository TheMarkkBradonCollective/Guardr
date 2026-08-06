import React, { useEffect, useMemo, useState } from 'react';
import { SupportTicket, SupportTicketStatus, SessionUser } from '../../types';
import {
  categoryLabel,
  isDeletableResolvedSupportChat,
  priorityLabel,
  SUPPORT_STATUS_LABEL,
  supportStatusLabel,
} from '../../lib/support';
import { ROLE_LABELS, canDeleteResolvedSupportChat } from '../../lib/permissions';
import {
  AppChatHeader,
  AppEmptyState,
  AppInboxList,
  AppInboxRow,
} from '../ui/app/AppPrimitives';
import { ChatThreadPanel } from '../messaging/ChatThreadPanel';
import { MessagesHubLayout } from '../messaging/MessagesHubLayout';
import { MessagesInboxTabs } from '../messaging/MessagesInboxTabs';
import { WfBadge } from '../ui/wireframe';
import { FileText, LifeBuoy, Trash2 } from 'lucide-react';
import { useDevice } from '../../lib/platform';
import { EMPTY_MESSAGES_CHROME, type MessagesChrome } from '../../lib/messagesChrome';

type SupportInboxSection = 'support' | 'reports';
type StatusFilter = 'open' | 'all';

interface StaffSupportPanelProps {
  tickets: SupportTicket[];
  currentUser: SessionUser;
  onSendMessage: (ticketId: string, body: string) => void | Promise<void>;
  onUpdateStatus: (ticketId: string, status: SupportTicketStatus) => void | Promise<void>;
  onDeleteSupportTicket?: (ticketId: string) => void | Promise<void>;
  selectedTicketId?: string | null;
  onSelectedTicketIdChange?: (ticketId: string | null) => void;
  initialSelectedTicketId?: string | null;
  onDetailOpenChange?: (open: boolean) => void;
  onMessagesChromeChange?: (chrome: MessagesChrome) => void;
}

function formatInboxMeta(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function StaffSupportPanel({
  tickets,
  currentUser,
  onSendMessage,
  onUpdateStatus,
  onDeleteSupportTicket,
  selectedTicketId: controlledSelectedId,
  onSelectedTicketIdChange,
  initialSelectedTicketId = null,
  onDetailOpenChange,
  onMessagesChromeChange,
}: StaffSupportPanelProps) {
  const { formFactor } = useDevice();
  const splitView = formFactor === 'tablet' || formFactor === 'desktop';

  const [section, setSection] = useState<SupportInboxSection>('support');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(initialSelectedTicketId);

  const selectedId = controlledSelectedId ?? internalSelectedId;

  const setSelectedId = (ticketId: string | null) => {
    if (controlledSelectedId === undefined) setInternalSelectedId(ticketId);
    onSelectedTicketIdChange?.(ticketId);
  };

  useEffect(() => {
    if (!initialSelectedTicketId) return;
    const ticket = tickets.find((t) => t.id === initialSelectedTicketId);
    if (ticket) {
      setSection(ticket.kind === 'report' ? 'reports' : 'support');
    }
    setSelectedId(initialSelectedTicketId);
  }, [initialSelectedTicketId, tickets]);

  const sectionTickets = useMemo(
    () => tickets.filter((t) => (section === 'support' ? t.kind === 'chat' : t.kind === 'report')),
    [tickets, section]
  );

  const sorted = useMemo(
    () => [...sectionTickets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [sectionTickets]
  );

  const filtered = useMemo(() => {
    if (section === 'reports') return sorted;
    return statusFilter === 'open' ? sorted.filter((t) => t.status !== 'resolved') : sorted;
  }, [sorted, section, statusFilter]);

  const selected = selectedId
    ? filtered.find((t) => t.id === selectedId) ?? sectionTickets.find((t) => t.id === selectedId) ?? null
    : null;

  useEffect(() => {
    if (!selectedId) return;
    if (!sectionTickets.some((t) => t.id === selectedId)) {
      setSelectedId(null);
    }
  }, [sectionTickets, selectedId]);

  const hasSelection = !!selected;
  const embedHeaderInShell = !splitView && hasSelection;

  useEffect(() => {
    onDetailOpenChange?.(formFactor === 'mobile' && hasSelection);
  }, [formFactor, hasSelection, onDetailOpenChange]);

  const handleSend = async (body: string) => {
    if (!selected) return;
    await onSendMessage(selected.id, body);
    if (selected.status === 'open') {
      await onUpdateStatus(selected.id, 'in-progress');
    }
  };

  const clearSelection = () => setSelectedId(null);

  const supportTicketActions = (ticket: SupportTicket) => {
    const canDelete =
      Boolean(onDeleteSupportTicket) &&
      canDeleteResolvedSupportChat(currentUser) &&
      isDeletableResolvedSupportChat(ticket);

    return (
      <div className="flex items-center gap-1 shrink-0">
        {canDelete ? (
          <button
            type="button"
            onClick={() => void onDeleteSupportTicket?.(ticket.id)}
            className="p-2 rounded-lg text-content-secondary hover:text-destructive hover:bg-surface-secondary transition-colors"
            aria-label="Delete resolved conversation"
            title="Delete resolved conversation"
          >
            <Trash2 className="w-4 h-4" strokeWidth={2} />
          </button>
        ) : null}
        <select
          value={ticket.status}
          onChange={(e) => void onUpdateStatus(ticket.id, e.target.value as SupportTicketStatus)}
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
      </div>
    );
  };

  const sectionTabs = (
    <MessagesInboxTabs
      activeTab={section}
      onTabChange={(tabId) => {
        setSection(tabId as SupportInboxSection);
        setSelectedId(null);
      }}
      tabs={[
        { id: 'support', label: 'Support', icon: <LifeBuoy className="w-3.5 h-3.5" strokeWidth={2} /> },
        { id: 'reports', label: 'Reports', icon: <FileText className="w-3.5 h-3.5" strokeWidth={2} /> },
      ]}
    />
  );

  const header = (
    <>
      {sectionTabs}
      {section === 'support' ? (
        <MessagesInboxTabs
          activeTab={statusFilter}
          onTabChange={(tabId) => setStatusFilter(tabId as StatusFilter)}
          tabs={[
            { id: 'open', label: 'Open' },
            { id: 'all', label: 'All' },
          ]}
        />
      ) : null}
    </>
  );

  useEffect(() => {
    if (!onMessagesChromeChange) return;

    const extension = !embedHeaderInShell ? header : null;
    let override: React.ReactNode | null = null;

    if (embedHeaderInShell && selected) {
      override = (
        <AppChatHeader
          title={selected.subject}
          subtitle={`${selected.userName} · ${ROLE_LABELS[selected.userRole]}`}
          onBack={clearSelection}
          backLabel="Support"
          trailing={supportTicketActions(selected)}
        />
      );
    }

    onMessagesChromeChange({ extension, override });
    return () => onMessagesChromeChange(EMPTY_MESSAGES_CHROME);
  }, [
    onMessagesChromeChange,
    embedHeaderInShell,
    section,
    statusFilter,
    selected,
    onUpdateStatus,
  ]);

  const list = (
    <>
      {filtered.length === 0 ? (
        <AppEmptyState
          dashed
          icon={section === 'support' ? <LifeBuoy className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          title={section === 'support' ? 'No support chats in this view' : 'No reports yet'}
        >
          {section === 'support'
            ? statusFilter === 'open'
              ? 'Open support conversations appear here.'
              : 'Support chats will appear here when users contact Guardr.'
            : 'Submitted reports will appear here for review.'}
        </AppEmptyState>
      ) : (
        <AppInboxList>
          {filtered.map((ticket) => {
            const preview =
              ticket.kind === 'report'
                ? ticket.messages[0]?.body
                : ticket.messages[ticket.messages.length - 1]?.body;
            const statusLabel = supportStatusLabel(ticket);
            return (
              <AppInboxRow
                key={ticket.id}
                title={ticket.subject}
                preview={preview}
                meta={formatInboxMeta(ticket.updatedAt)}
                selected={selectedId === ticket.id}
                leading={
                  ticket.kind === 'report' ? (
                    <FileText className="w-5 h-5 text-brand-primary" strokeWidth={1.5} />
                  ) : (
                    <LifeBuoy className="w-5 h-5 text-brand-primary" strokeWidth={1.5} />
                  )
                }
                badges={
                  <>
                    <WfBadge tone={ticket.status === 'resolved' ? 'default' : 'primary'}>
                      {statusLabel}
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
    </>
  );

  const detailView = selected ? (
    <div className="flex flex-col h-full min-h-0 app-full-page-screen">
      {!embedHeaderInShell && (
        <AppChatHeader
          title={selected.subject}
          subtitle={`${selected.userName} · ${ROLE_LABELS[selected.userRole]}`}
          onBack={clearSelection}
          backLabel="Support"
          hideBackOnDesktop
          trailing={supportTicketActions(selected)}
        />
      )}
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
          placeholder={selected.kind === 'report' ? 'Staff note or follow-up…' : 'Reply to user…'}
          teamChat
        />
      </div>
    </div>
  ) : null;

  return (
    <MessagesHubLayout
      header={header}
      list={list}
      detail={detailView ?? <div />}
      hasSelection={hasSelection && !!detailView}
      shellInboxHeader
      emptyDetailTitle={section === 'support' ? 'Select a support chat' : 'Select a report'}
      emptyDetailHint={
        section === 'support'
          ? 'Choose a conversation from the list to reply.'
          : 'Choose a submitted report to review.'
      }
    />
  );
}
