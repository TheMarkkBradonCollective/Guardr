import React, { useEffect, useRef } from 'react';
import { PlatformRole } from '../../types';
import { isStaffSender, senderLabel } from '../../lib/jobChat';
import { AppChatBubble, AppChatComposer } from '../ui/app/AppPrimitives';
import type { AppChatBubbleTone } from '../ui/app/AppPrimitives';

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

export function ChatThreadPanel({
  messages,
  currentUserId,
  onSend,
  placeholder = 'Type a message…',
  readOnly = false,
  readOnlyMessage = 'This conversation is closed.',
  headerNote,
  teamChat = false,
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
              return (
                <div
                  key={msg.id}
                  className={`app-chat-row ${mine ? 'app-chat-row-outgoing' : 'app-chat-row-incoming'}`}
                >
                  <AppChatBubble
                    tone={tone}
                    senderLabel={senderLabel(msg.senderRole, msg.senderName)}
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
      {!readOnly ? (
        <AppChatComposer
          value={draft}
          onChange={setDraft}
          onSend={handleSend}
          placeholder={placeholder}
          submitting={submitting}
        />
      ) : (
        <p className="shrink-0 text-sm text-brand-text-muted text-center p-4 border-t border-brand-border bg-brand-surface">
          {readOnlyMessage}
        </p>
      )}
    </div>
  );
}
