import { useEffect, useRef } from 'react';
import type { UserNotification } from '../types';
import { notificationRowFromDb, upsertNotification } from './notificationInbox';
import { supabase } from './supabase';

/**
 * Subscribes to inbox changes for the signed-in user so notifications appear
 * across tabs and devices without a manual refresh.
 */
export function useUserNotificationsRealtime(
  userId: string | undefined,
  onChange: (updater: (prev: UserNotification[]) => UserNotification[]) => void,
  enabled: boolean
): void {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!enabled || !userId) return;

    const channel = supabase.channel(`guardr-notifications-${userId}`);

    const applyRow = (row: Record<string, unknown>, event: 'INSERT' | 'UPDATE' | 'DELETE') => {
      if (event === 'DELETE') {
        const id = String(row.id);
        onChangeRef.current((prev) => prev.filter((n) => n.id !== id));
        return;
      }
      const notification = notificationRowFromDb(row);
      if (notification.userId !== userId) return;
      onChangeRef.current((prev) => upsertNotification(prev, notification));
    };

    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'user_notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => applyRow(payload.new as Record<string, unknown>, 'INSERT')
    );

    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => applyRow(payload.new as Record<string, unknown>, 'UPDATE')
    );

    channel.on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'user_notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => applyRow(payload.old as Record<string, unknown>, 'DELETE')
    );

    channel.subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR') {
        console.warn('[Guardr] Notification realtime channel error', err);
      }
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, userId]);
}
