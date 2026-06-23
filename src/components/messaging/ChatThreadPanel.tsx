import React, { useEffect, useRef } from 'react';
import { PlatformRole } from '../../types';
import { isStaffSender, senderLabel } from '../../lib/jobChat';
import { staffChatSenderLabel } from '../../lib/staffMessenger';
import { guardChatSenderLabel } from '../../lib/guardMessenger';
import { ROLE_LABELS } from '../../lib/permissions';
import { AppChatBubble, AppChatComposer } from '../ui/app/AppPrimitives';
import type { AppChatBubbleTone, AppChatSender } from '../ui/app/AppPrimitives';

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
            {messages.map((msg) => {
              const tone = bubbleTone(msg, currentUserId, teamChat);
              const mine = msg.senderId === currentUserId;
              const structuredSender = messageSender(msg, staffChatLabels, guardChatLabels);
              const label =
                !structuredSender && !mine
                  ? messageSenderLabel(msg, staffChatLabels, guardChatLabels)
                  : undefined;
              return (
                <div
                  key={msg.id}
                  className={`app-chat-row ${mine ? 'app-chat-row-outgoing' : 'app-chat-row-incoming'}`}
                >
                  <AppChatBubble
                    tone={tone}
                    sender={structuredSender}
                    senderLabel={label}
                    body={msg.body}
                    timestamp={formatChatTime(msg.createdAt)}
                  />
                </div>
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
