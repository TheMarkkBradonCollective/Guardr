import React, { useEffect, useRef } from 'react';
import { PlatformRole } from '../../types';
import { isStaffSender, senderLabel } from '../../lib/jobChat';
import { Send } from 'lucide-react';

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
    <div className="flex flex-col h-full min-h-0">
      {headerNote && (
        <p className="shrink-0 text-xs text-brand-text-muted px-4 py-2 border-b border-brand-border bg-brand-bg-sec">
          {headerNote}
        </p>
      )}
      <div className="app-chat-pane flex-1 min-h-0 space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-brand-text-muted text-center py-8">No messages yet. Say hello to get started.</p>
        ) : (
          messages.map((msg) => {
            const mine = msg.senderId === currentUserId;
            const staff = !teamChat && isStaffSender(msg.senderRole);
            return (
              <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`chat-bubble max-w-[85%] px-4 py-2.5 text-sm border ${
                    staff
                      ? 'chat-bubble-staff bg-amber-500/15 border-amber-500/30 text-brand-text'
                      : mine
                        ? 'chat-bubble-outgoing bg-brand-primary text-brand-accent-text border-brand-primary'
                        : 'chat-bubble-incoming bg-brand-surface text-brand-text border-brand-border'
                  }`}
                >
                  <p className="text-xs opacity-70 mb-1">{senderLabel(msg.senderRole, msg.senderName)}</p>
                  <p className="whitespace-pre-wrap">{msg.body}</p>
                  <p className="text-xs opacity-60 mt-1">{new Date(msg.createdAt).toLocaleString()}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      {!readOnly ? (
        <div className="shrink-0 flex gap-2 p-3 border-t border-brand-border">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && void handleSend()}
            placeholder={placeholder}
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
          {readOnlyMessage}
        </p>
      )}
    </div>
  );
}
