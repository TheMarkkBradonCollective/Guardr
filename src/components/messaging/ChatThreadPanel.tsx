import React, { useEffect, useRef, useState } from 'react';
import { CornerDownLeft, SmilePlus, MessageCircle, Lock, Trash2 } from 'lucide-react';
import { PlatformRole } from '../../types';
import { isStaffSender } from '../../lib/jobChat';
import { staffChatSenderLabel } from '../../lib/staffMessenger';
import {
  avatarInitialForSender,
  chatSenderLabelForViewer,
  communityChatSenderLabel,
  displaySenderNameForViewer,
  maskReplySenderName,
  staffRoleLabel,
} from '../../lib/chatDisplay';
import { isStaffRole, ROLE_LABELS } from '../../lib/permissions';
import { AppChatBubble, AppChatComposer } from '../ui/app/AppPrimitives';
import type { AppChatBubbleTone, AppChatSender, ChatReplyContext } from '../ui/app/AppPrimitives';

// ── Types ─────────────────────────────────────────────────────────

/** Re-export for consumers */
export type ReplyContext = ChatReplyContext;
/** emoji → array of userIds who reacted */
type Reactions = Map<string, Record<string, string[]>>;

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '👏', '🔥'];

// ── Message grouping helpers ──────────────────────────────────────

const GROUP_BREAK_MS = 5 * 60 * 1000;

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

// ── Reply body encoding/parsing ───────────────────────────────────
// Format stored in the message body (persists to backend automatically):
//   > [SenderName]: quoted text (up to 80 chars)\n\nActual message

const REPLY_RE = /^> \[(.+?)\]: ([^\n]{1,120})\n\n([\s\S]*)$/;

function parseBody(body: string): { text: string; replyTo?: ReplyContext } {
  const m = body.match(REPLY_RE);
  if (m) {
    return { replyTo: { senderName: m[1], body: m[2] }, text: m[3] };
  }
  return { text: body };
}

function encodeReply(replyTo: ReplyContext, message: string): string {
  const quotedBody = replyTo.body.replace(/\n/g, ' ').substring(0, 80);
  return `> [${replyTo.senderName}]: ${quotedBody}\n\n${message}`;
}

// ── Component interfaces ──────────────────────────────────────────

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
  onSend?: (body: string) => void | Promise<void>;
  placeholder?: string;
  readOnly?: boolean;
  readOnlyMessage?: string;
  headerNote?: string;
  /** Names of people currently typing (for typing indicator) */
  typingNames?: string[];
  /** Staff team channel — show sent/received instead of job-chat staff styling */
  teamChat?: boolean;
  /** Staff chat labels: Guardr · Role · Name (staff messenger only) */
  staffChatLabels?: boolean;
  /** Guard chat labels: Guardr · Guard · Name */
  guardChatLabels?: boolean;
  /** Client chat labels: Guardr · Role · Name */
  clientChatLabels?: boolean;
  /** Who is reading — staff names are hidden from clients and guards. */
  viewerRole?: PlatformRole;
  /** When provided, shows delete on messages the viewer may remove. */
  onDeleteMessage?: (messageId: string) => void | Promise<void>;
  canDeleteMessage?: (msg: ChatBubbleMessage) => boolean;
}

// ── Helpers ───────────────────────────────────────────────────────

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
  guardChatLabels: boolean,
  clientChatLabels: boolean,
  viewerRole: PlatformRole
): string {
  if (staffChatLabels) return staffChatSenderLabel(msg.senderRole, msg.senderName);
  if (guardChatLabels) {
    return communityChatSenderLabel(viewerRole, msg.senderRole, msg.senderName, 'Guard');
  }
  if (clientChatLabels) {
    return communityChatSenderLabel(viewerRole, msg.senderRole, msg.senderName, 'Client');
  }
  return chatSenderLabelForViewer(viewerRole, msg.senderRole, msg.senderName, msg.senderId);
}

function messageSender(
  msg: ChatBubbleMessage,
  staffChatLabels: boolean,
  guardChatLabels: boolean,
  clientChatLabels: boolean,
  viewerRole: PlatformRole
): AppChatSender | undefined {
  if (staffChatLabels) {
    const roleLabel = ROLE_LABELS[msg.senderRole] ?? msg.senderRole;
    const displayName = msg.senderName.trim() || 'Staff';
    return { name: displayName, roleLabel, showBrand: true };
  }
  if (guardChatLabels || clientChatLabels) {
    const roleLabel = ROLE_LABELS[msg.senderRole] ?? msg.senderRole;
    const peerFallback = guardChatLabels ? 'Guard' : 'Client';
    const displayName = displaySenderNameForViewer(
      viewerRole,
      msg.senderRole,
      msg.senderName,
      peerFallback
    );
    return { name: displayName, roleLabel, showBrand: true };
  }
  if (isStaffSender(msg.senderRole)) {
    const displayName = displaySenderNameForViewer(viewerRole, msg.senderRole, msg.senderName, 'Staff');
    return {
      name: displayName,
      roleLabel: isStaffRole(viewerRole) ? 'Staff' : staffRoleLabel(msg.senderRole),
      showBrand: true,
    };
  }
  return undefined;
}

// ── Main component ────────────────────────────────────────────────

export function ChatThreadPanel({
  messages,
  currentUserId,
  onSend,
  placeholder = 'Type a message…',
  readOnly = false,
  readOnlyMessage = 'This conversation is closed.',
  headerNote,
  typingNames = [],
  teamChat = false,
  staffChatLabels = false,
  guardChatLabels = false,
  clientChatLabels = false,
  viewerRole = 'owner',
  onDeleteMessage,
  canDeleteMessage,
}: ChatThreadPanelProps) {
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reactions, setReactions] = useState<Reactions>(new Map());
  const [replyTo, setReplyTo] = useState<ReplyContext | null>(null);
  const [pickerMsgId, setPickerMsgId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Close emoji picker on outside click
  useEffect(() => {
    if (!pickerMsgId) return;
    const handler = (e: MouseEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) {
        setPickerMsgId(null);
      }
    };
    document.addEventListener('mousedown', handler, true);
    return () => document.removeEventListener('mousedown', handler, true);
  }, [pickerMsgId]);

  const handleReact = (msgId: string, emoji: string) => {
    setReactions((prev) => {
      const next = new Map(prev);
      const existing = { ...(next.get(msgId) ?? {}) };
      const users = existing[emoji] ?? [];
      if (users.includes(currentUserId)) {
        const filtered = users.filter((id) => id !== currentUserId);
        if (filtered.length === 0) {
          delete existing[emoji];
        } else {
          existing[emoji] = filtered;
        }
      } else {
        existing[emoji] = [...users, currentUserId];
      }
      next.set(msgId, existing);
      return next;
    });
    setPickerMsgId(null);
  };

  const handleSend = async () => {
    if (!draft.trim() || readOnly || !onSend) return;
    setSubmitting(true);
    try {
      const body = replyTo ? encodeReply(replyTo, draft.trim()) : draft.trim();
      await onSend(body);
      setDraft('');
      setReplyTo(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-chat-thread-shell flex flex-col h-full min-h-0">
      {headerNote && (
        <div className="shrink-0 px-4 py-2 border-b border-brand-border bg-brand-surface flex items-center justify-center">
          <p className="text-xs font-medium text-brand-text-muted text-center">{headerNote}</p>
        </div>
      )}

      <div className="app-chat-pane">
        {messages.length === 0 ? (
          <div className="app-chat-thread-empty">
            <div className="app-chat-thread-empty-icon">
              <MessageCircle className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <p className="app-chat-thread-empty-title">No messages yet</p>
            <p className="app-chat-thread-empty-hint">
              {readOnly ? 'This conversation is closed.' : 'Say hello to get started.'}
            </p>
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
                ? messageSender(msg, staffChatLabels, guardChatLabels, clientChatLabels, viewerRole)
                : undefined;
              const label =
                firstInGrp && !structuredSender && !mine
                  ? messageSenderLabel(msg, staffChatLabels, guardChatLabels, clientChatLabels, viewerRole)
                  : undefined;

              const groupClass =
                !firstInGrp && !lastInGrp
                  ? 'app-chat-bubble-gmid'
                  : !firstInGrp
                  ? 'app-chat-bubble-glast'
                  : !lastInGrp
                  ? 'app-chat-bubble-gfirst'
                  : '';

              const rowClass = [
                'app-chat-row',
                mine ? 'app-chat-row-outgoing' : 'app-chat-row-incoming',
                firstInGrp && !showDateSep ? 'app-chat-row-group-first' : '',
                !firstInGrp ? 'app-chat-row-chained' : '',
              ]
                .filter(Boolean)
                .join(' ');

              const avatarInitial = avatarInitialForSender(
                viewerRole,
                msg.senderRole,
                msg.senderName
              );

              const { text: bodyText, replyTo: parsedReply } = parseBody(msg.body);
              const maskedReply = parsedReply
                ? {
                    ...parsedReply,
                    senderName: maskReplySenderName(viewerRole, parsedReply.senderName, messages),
                  }
                : undefined;
              const msgReactions = reactions.get(msg.id) ?? {};
              const reactionEntries = Object.entries(msgReactions).filter(
                ([, users]) => users.length > 0
              );
              const hasReactions = reactionEntries.length > 0;

              const replyCtx: ReplyContext = {
                senderName: mine
                  ? 'You'
                  : displaySenderNameForViewer(
                      viewerRole,
                      msg.senderRole,
                      msg.senderName,
                      isStaff ? 'Staff' : 'User'
                    ),
                body: bodyText,
              };
              const deletable =
                !!onDeleteMessage && (canDeleteMessage?.(msg) ?? mine);

              const renderDeleteButton = () =>
                deletable ? (
                  <button
                    type="button"
                    className="app-chat-action-btn"
                    title="Delete message"
                    onClick={() => void onDeleteMessage!(msg.id)}
                    aria-label="Delete message"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                ) : null;

              return (
                <React.Fragment key={msg.id}>
                  {showDateSep && (
                    <div className="app-chat-date-sep">
                      <span>{dateSeparatorLabel(msg.createdAt)}</span>
                    </div>
                  )}

                  <div className={rowClass}>
                    {/* Avatar — incoming only */}
                    {!mine && (
                      <div className="app-chat-row-avatar">
                        {firstInGrp ? (
                          <div
                            className={`app-chat-avatar${isStaff ? ' app-chat-avatar-staff' : ''}`}
                          >
                            {avatarInitial}
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Action buttons LEFT of bubble (outgoing) */}
                    {mine && !readOnly && (
                      <div className="app-chat-msg-actions">
                        <button
                          type="button"
                          className="app-chat-action-btn"
                          title="Reply"
                          onClick={() => setReplyTo(replyCtx)}
                          aria-label="Reply"
                        >
                          <CornerDownLeft className="w-3.5 h-3.5" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          className="app-chat-action-btn"
                          title="React"
                          onClick={() =>
                            setPickerMsgId((prev) => (prev === msg.id ? null : msg.id))
                          }
                          aria-label="React with emoji"
                        >
                          <SmilePlus className="w-3.5 h-3.5" strokeWidth={2} />
                        </button>
                        {renderDeleteButton()}
                      </div>
                    )}
                    {mine && readOnly && deletable && (
                      <div className="app-chat-msg-actions">{renderDeleteButton()}</div>
                    )}

                    {/* Bubble + reactions + picker container */}
                    <div className="app-chat-msg-wrap">
                      {/* Emoji picker */}
                      {pickerMsgId === msg.id && (
                        <div
                          ref={pickerRef}
                          className={`app-chat-emoji-picker ${mine ? 'app-chat-emoji-picker-right' : 'app-chat-emoji-picker-left'}`}
                          role="dialog"
                          aria-label="Choose a reaction"
                        >
                          {QUICK_REACTIONS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              className="app-chat-emoji-picker-btn"
                              onClick={() => handleReact(msg.id, emoji)}
                              aria-label={`React with ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      <AppChatBubble
                        tone={tone}
                        sender={structuredSender}
                        senderLabel={label}
                        body={bodyText}
                        timestamp={lastInGrp ? formatChatTime(msg.createdAt) : undefined}
                        groupClass={groupClass}
                        replyTo={maskedReply}
                        readReceipt={mine && lastInGrp}
                      />

                      {/* Reactions */}
                      {hasReactions && (
                        <div
                          className={`app-chat-reactions${mine ? ' app-chat-reactions-right' : ''}`}
                        >
                          {reactionEntries.map(([emoji, users]) => (
                            <button
                              key={emoji}
                              type="button"
                              className={`app-chat-reaction-btn${users.includes(currentUserId) ? ' app-chat-reaction-btn-mine' : ''}`}
                              onClick={() => handleReact(msg.id, emoji)}
                              title={`${users.length} ${users.length === 1 ? 'reaction' : 'reactions'}`}
                            >
                              <span>{emoji}</span>
                              {users.length > 1 && (
                                <span className="app-chat-reaction-count">{users.length}</span>
                              )}
                            </button>
                          ))}
                          {!readOnly && (
                            <button
                              type="button"
                              className="app-chat-reaction-btn"
                              style={{ fontSize: '0.8125rem', padding: '0.1875rem 0.4375rem' }}
                              onClick={() =>
                                setPickerMsgId((prev) => (prev === msg.id ? null : msg.id))
                              }
                              aria-label="Add reaction"
                            >
                              +
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons RIGHT of bubble (incoming) */}
                    {!mine && !readOnly && (
                      <div className="app-chat-msg-actions">
                        <button
                          type="button"
                          className="app-chat-action-btn"
                          title="Reply"
                          onClick={() => setReplyTo(replyCtx)}
                          aria-label="Reply"
                        >
                          <CornerDownLeft className="w-3.5 h-3.5" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          className="app-chat-action-btn"
                          title="React"
                          onClick={() =>
                            setPickerMsgId((prev) => (prev === msg.id ? null : msg.id))
                          }
                          aria-label="React with emoji"
                        >
                          <SmilePlus className="w-3.5 h-3.5" strokeWidth={2} />
                        </button>
                        {renderDeleteButton()}
                      </div>
                    )}
                    {!mine && readOnly && deletable && (
                      <div className="app-chat-msg-actions">{renderDeleteButton()}</div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Typing indicator */}
        {typingNames.length > 0 && (
          <div className="app-chat-typing">
            <div className="app-chat-typing-bubble">
              <div className="app-chat-typing-dot" />
              <div className="app-chat-typing-dot" />
              <div className="app-chat-typing-dot" />
            </div>
            <span className="text-xs text-brand-text-muted">
              {typingNames.length === 1
                ? `${typingNames[0]} is typing…`
                : `${typingNames.slice(0, 2).join(', ')} are typing…`}
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {readOnly ? (
        <div className="app-chat-readonly-footer">
          <Lock className="w-3.5 h-3.5 shrink-0 opacity-60" strokeWidth={2} />
          <span>{readOnlyMessage}</span>
        </div>
      ) : (
        <AppChatComposer
          value={draft}
          onChange={setDraft}
          onSend={() => void handleSend()}
          placeholder={placeholder}
          disabled={submitting}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      )}
    </div>
  );
}
