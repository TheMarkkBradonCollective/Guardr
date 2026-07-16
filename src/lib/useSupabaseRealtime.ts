import { useEffect, useRef } from 'react';
import { supabase } from './supabase';

/** Core tables — any change triggers a debounced full app data reload. */
export const SYNC_TABLES = [
  'guards',
  'staff',
  'clients',
  'certifications',
  'experience',
  'education',
  'security_requests',
  'payments',
  'guard_payout_invoices',
  'support_tickets',
  'support_messages',
  'job_chat_threads',
  'job_chat_messages',
  'team_chat_threads',
  'team_chat_messages',
  'job_guard_slots',
  'staff_messages',
  'guard_messages',
  'client_messages',
  'user_legal_acceptances',
  'guard_insurance_policies',
  'guard_vehicle_insurance_policies',
  'guard_vehicle_profiles',
  'guard_standing_crew_members',
  'guard_crew_join_requests',
  'user_notifications',
  'platform_settings',
  'platform_cities',
  'client_locations',
  'company_public_documents',
  'client_invoices',
  'message_reactions',
  'guard_availability',
  'guard_availability_date_overrides',
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
