import React, { useEffect, useRef } from 'react';
import { PlatformRole } from '../../types';
import { isStaffSender, senderLabel } from '../../lib/jobChat';
import { staffChatSenderLabel } from '../../lib/staffMessenger';
import { guardChatSenderLabel } from '../../lib/guardMessenger';
import { ROLE_LABELS } from '../../lib/permissions';
import { AppChatBubble, AppChatComposer } from '../ui/app/AppPrimitives';
import type { AppChatBubbleTone, AppChatSender } from '../ui/app/AppPrimitives';

// ── Message grouping helpers ──────────────────────────────────────

const GROUP_BREAK_MS = 5 * 60 * 1000; // 5 minutes = new group

function isFirstInGroup(messages: ChatBubbleMessage[], index: number): boolean {
  if (index === 0) return true;
  const prev = messages[index - 1];
  const curr = messages[index];
  if (prev.senderId !== curr.senderId) return true;
  const gap = new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime();
  return gap > GROUP_BREAK_MS;
}

function isLastInGroup(messages: ChatBubbleMessage[], index: number): boolean {
  if (index === messages.length - 1) return true;
  const curr = messages[index];
  const next = messages[index + 1];
  if (curr.senderId !== next.senderId) return true;
  const gap = new Date(next.createdAt).getTime() - new Date(curr.createdAt).getTime();
  return gap > GROUP_BREAK_MS;
}

function isSameDayAsPrev(messages: ChatBubbleMessage[], index: number): boolean {
  if (index === 0) return false;
  const prev = new Date(messages[index - 1].createdAt);
  const curr = new Date(messages[index].createdAt);
  return prev.toDateString() === curr.toDateString();
}

function dateSeparatorLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export interface ChatBubbleMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: PlatformRole;
  body: string;
  createdAt: string;
}

interface ChatThreadPanelProps {
  messages: ChatBubbleMessage[];
  currentUserId: string;
  onSend: (body: string) => void | Promise<void>;
  placeholder?: string;
  readOnly?: boolean;
  readOnlyMessage?: string;
  headerNote?: string;
  /** Staff team channel — show sent/received instead of job-chat staff styling */
  teamChat?: boolean;
  /** Staff chat labels: Guardr · Role · Name (staff messenger only) */
  staffChatLabels?: boolean;
  /** Guard chat labels: Guardr · Guard · Name */
  guardChatLabels?: boolean;
}

function formatChatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function bubbleTone(
  msg: ChatBubbleMessage,
  currentUserId: string,
  teamChat: boolean
): AppChatBubbleTone {
  const mine = msg.senderId === currentUserId;
  const staff = !teamChat && isStaffSender(msg.senderRole);
  if (staff) return 'staff';
  if (mine) return 'outgoing';
  return 'incoming';
}

function messageSenderLabel(
  msg: ChatBubbleMessage,
  staffChatLabels: boolean,
  guardChatLabels: boolean
): string {
  if (staffChatLabels) return staffChatSenderLabel(msg.senderRole, msg.senderName);
  if (guardChatLabels) return guardChatSenderLabel(msg.senderRole, msg.senderName);
  return senderLabel(msg.senderRole, msg.senderName);
}

function messageSender(
  msg: ChatBubbleMessage,
  staffChatLabels: boolean,
  guardChatLabels: boolean
): AppChatSender | undefined {
  if (staffChatLabels || guardChatLabels) {
    const roleLabel = ROLE_LABELS[msg.senderRole] ?? msg.senderRole;
    const displayName = msg.senderName.trim() || (guardChatLabels ? 'Guard' : 'Staff');
    return {
      name: displayName,
      roleLabel,
      showBrand: true,
    };
  }
  if (isStaffSender(msg.senderRole)) {
    return {
      name: msg.senderName.trim() || 'Guardr staff',
      roleLabel: 'Staff',
      showBrand: true,
    };
  }
  return undefined;
}

export function ChatThreadPanel({
  messages,
  currentUserId,
  onSend,
  placeholder = 'Type a message…',
  readOnly = false,
  readOnlyMessage = 'This conversation is closed.',
  headerNote,
  teamChat = false,
  staffChatLabels = false,
  guardChatLabels = false,
}: ChatThreadPanelProps) {
  const [draft, setDraft] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!draft.trim() || readOnly) return;
    setSubmitting(true);
    try {
      await onSend(draft.trim());
      setDraft('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-brand-bg">
      {headerNote && (
        <p className="shrink-0 text-xs font-medium text-brand-text-muted px-4 py-2.5 border-b border-brand-border bg-brand-surface">
          {headerNote}
        </p>
      )}
      <div className="app-chat-pane">
        {messages.length === 0 ? (
          <div className="app-chat-bubble app-chat-bubble-system mx-auto">
            <p>No messages yet. Say hello to get started.</p>
          </div>
        ) : (
          <div className="app-chat-thread">
            {messages.map((msg, index) => {
              const tone = bubbleTone(msg, currentUserId, teamChat);
              const mine = msg.senderId === currentUserId;
              const firstInGrp = isFirstInGroup(messages, index);
              const lastInGrp = isLastInGroup(messages, index);
              const showDateSep = !isSameDayAsPrev(messages, index);
              const isStaff = tone === 'staff';

              const structuredSender = firstInGrp
                ? messageSender(msg, staffChatLabels, guardChatLabels)
                : undefined;
              const label =
                firstInGrp && !structuredSender && !mine
                  ? messageSenderLabel(msg, staffChatLabels, guardChatLabels)
                  : undefined;

              const groupClass = !firstInGrp && !lastInGrp
                ? 'app-chat-bubble-gmid'
                : !firstInGrp
                ? 'app-chat-bubble-glast'
                : !lastInGrp
                ? 'app-chat-bubble-gfirst'
                : '';

              const rowClass = [
                'app-chat-row',
                mine ? 'app-chat-row-outgoing' : 'app-chat-row-incoming',
                // date separator already provides spacing; only add extra margin when no sep precedes this group
                firstInGrp && !showDateSep ? 'app-chat-row-group-first' : '',
                !firstInGrp ? 'app-chat-row-chained' : '',
              ].filter(Boolean).join(' ');

              const avatarInitial = msg.senderName
                ? msg.senderName.trim().charAt(0).toUpperCase()
                : '?';

              return (
                <React.Fragment key={msg.id}>
                  {showDateSep && (
                    <div className="app-chat-date-sep">
                      <span>{dateSeparatorLabel(msg.createdAt)}</span>
                    </div>
                  )}
                  <div className={rowClass}>
                    {!mine && (
                      <div className="app-chat-row-avatar">
                        {firstInGrp ? (
                          <div className={`app-chat-avatar${isStaff ? ' app-chat-avatar-staff' : ''}`}>
                            {avatarInitial}
                          </div>
                        ) : null}
                      </div>
                    )}
                    <AppChatBubble
                      tone={tone}
                      sender={structuredSender}
                      senderLabel={label}
                      body={msg.body}
                      timestamp={lastInGrp ? formatChatTime(msg.createdAt) : undefined}
                      groupClass={groupClass}
                    />
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {readOnly ? (
        <p className="shrink-0 text-xs text-center text-brand-text-muted px-4 py-3 border-t border-brand-border">
          {readOnlyMessage}
        </p>
      ) : (
        <AppChatComposer
          value={draft}
          onChange={setDraft}
          onSend={() => void handleSend()}
          placeholder={placeholder}
          disabled={submitting}
        />
      )}
    </div>
  );
}
