import { useEffect, useRef } from 'react';
import type { JobChatMessage, StaffMessage, GuardMessage, ClientMessage, SupportMessage } from '../types';
import { supabase } from './supabase';

function mapDbJobChatMessage(row: Record<string, unknown>): JobChatMessage {
  return {
    id: String(row.id),
    threadId: String(row.thread_id),
    senderId: String(row.sender_id),
    senderName: String(row.sender_name),
    senderRole: row.sender_role as JobChatMessage['senderRole'],
    body: String(row.body),
    createdAt: String(row.created_at),
  };
}

function mapDbStaffMessage(row: Record<string, unknown>): StaffMessage {
  return {
    id: String(row.id),
    senderId: String(row.sender_id),
    senderName: String(row.sender_name),
    senderRole: row.sender_role as StaffMessage['senderRole'],
    body: String(row.body),
    createdAt: String(row.created_at),
  };
}

function mapDbGuardMessage(row: Record<string, unknown>): GuardMessage {
  return {
    id: String(row.id),
    senderId: String(row.sender_id),
    senderName: String(row.sender_name),
    senderRole: row.sender_role as GuardMessage['senderRole'],
    body: String(row.body),
    createdAt: String(row.created_at),
  };
}

function mapDbClientMessage(row: Record<string, unknown>): ClientMessage {
  return {
    id: String(row.id),
    senderId: String(row.sender_id),
    senderName: String(row.sender_name),
    senderRole: row.sender_role as ClientMessage['senderRole'],
    body: String(row.body),
    createdAt: String(row.created_at),
  };
}

function mapDbSupportMessage(row: Record<string, unknown>): SupportMessage {
  return {
    id: String(row.id),
    ticketId: String(row.ticket_id),
    senderId: String(row.sender_id),
    senderName: String(row.sender_name),
    senderRole: row.sender_role as SupportMessage['senderRole'],
    body: String(row.body),
    createdAt: String(row.created_at),
  };
}

export interface MessageRealtimeHandlers {
  onJobChatMessage: (message: JobChatMessage) => void;
  onStaffMessage: (message: StaffMessage) => void;
  onGuardMessage: (message: GuardMessage) => void;
  onClientMessage: (message: ClientMessage) => void;
  onSupportMessage: (message: SupportMessage) => void;
  /** Fired when rows are deleted from any subscribed message table (e.g. staff DB clear). */
  onMessageDeleted?: (table: string, id: string) => void;
}

/**
 * Subscribes to INSERT events on message tables so receivers see new messages
 * immediately without waiting for a full-table reload.
 */
export function useMessageRealtimeSync(handlers: MessageRealtimeHandlers, enabled: boolean): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase.channel('guardr-message-realtime');

    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'job_chat_messages' },
      (payload) => {
        handlersRef.current.onJobChatMessage(mapDbJobChatMessage(payload.new as Record<string, unknown>));
      }
    );

    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'staff_messages' },
      (payload) => {
        handlersRef.current.onStaffMessage(mapDbStaffMessage(payload.new as Record<string, unknown>));
      }
    );

    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'guard_messages' },
      (payload) => {
        handlersRef.current.onGuardMessage(mapDbGuardMessage(payload.new as Record<string, unknown>));
      }
    );

    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'client_messages' },
      (payload) => {
        handlersRef.current.onClientMessage(mapDbClientMessage(payload.new as Record<string, unknown>));
      }
    );

    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'support_messages' },
      (payload) => {
        handlersRef.current.onSupportMessage(mapDbSupportMessage(payload.new as Record<string, unknown>));
      }
    );

    const messageTables = [
      'job_chat_messages',
      'staff_messages',
      'guard_messages',
      'client_messages',
      'support_messages',
    ] as const;

    for (const table of messageTables) {
      channel.on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table },
        (payload) => {
          const id = String((payload.old as Record<string, unknown>)?.id ?? '');
          if (id) handlersRef.current.onMessageDeleted?.(table, id);
        }
      );
    }

    channel.subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR') {
        console.warn('[Guardr] Message realtime channel error', err);
      }
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled]);
}
