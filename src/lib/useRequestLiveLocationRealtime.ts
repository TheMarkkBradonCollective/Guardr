import { useEffect, useRef } from 'react';
import { shouldSkipRealtimeSync } from './dbMutationGuard';
import { supabase } from './supabase';

export interface GuardLiveLocation {
  lat: number;
  lng: number;
  updatedAt: string;
}

function parseGuardLiveLocation(raw: unknown): GuardLiveLocation | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const row = raw as Record<string, unknown>;
  const lat = Number(row.lat);
  const lng = Number(row.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  return {
    lat,
    lng,
    updatedAt: String(row.updatedAt ?? row.updated_at ?? new Date().toISOString()),
  };
}

/**
 * Patches guard GPS pins on the map in real time without a full data reload.
 */
export function useRequestLiveLocationRealtime(
  onUpdate: (requestId: string, location: GuardLiveLocation | undefined) => void,
  enabled: boolean
): void {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase.channel('guardr-live-location-realtime');

    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'security_requests' },
      (payload) => {
        if (shouldSkipRealtimeSync()) return;
        const row = payload.new as Record<string, unknown>;
        const requestId = String(row.id);
        onUpdateRef.current(requestId, parseGuardLiveLocation(row.guard_live_location));
      }
    );

    channel.subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR') {
        console.warn('[Guardr] Live location realtime channel error', err);
      }
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled]);
}
