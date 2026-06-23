import { useEffect, useRef } from 'react';
import { supabase } from './supabase';

const SYNC_TABLES = [
  'guards',
  'clients',
  'certifications',
  'experience',
  'education',
  'security_requests',
  'payments',
  'support_tickets',
  'support_messages',
  'job_chat_threads',
  'job_chat_messages',
  'staff_messages',
  'guard_messages',
] as const;

const DEBOUNCE_MS = 300;

/**
 * Subscribes to Postgres changes on all core app tables and calls onSync (debounced).
 * Keeps guards, clients, staff, and jobs in sync without a manual refresh.
 */
export function useSupabaseRealtimeSync(
  onSync: () => void | Promise<void>,
  enabled: boolean
): void {
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;

  useEffect(() => {
    if (!enabled) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const scheduleSync = () => {
      if (cancelled) return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        void onSyncRef.current();
      }, DEBOUNCE_MS);
    };

    const channel = supabase.channel('guardr-app-realtime');

    for (const table of SYNC_TABLES) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, scheduleSync);
    }

    channel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.debug('[Guardr] Realtime sync active');
      } else if (status === 'CHANNEL_ERROR') {
        console.warn('[Guardr] Realtime channel error', err);
      }
    });

    return () => {
      cancelled = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      void supabase.removeChannel(channel);
    };
  }, [enabled]);
}
