import { useEffect, useRef } from 'react';
import type { SecurityRequest } from '../types';
import { requestDevicePosition } from './deviceLocation';

const UPDATE_INTERVAL_MS = 30_000;

interface UseGuardLiveLocationOptions {
  activeJob: SecurityRequest | null;
  enabled: boolean;
  onUpdate: (requestId: string, location: { lat: number; lng: number; updatedAt: string }) => void;
}

/** Periodically share guard GPS while en route or on duty. */
export function useGuardLiveLocation({
  activeJob,
  enabled,
  onUpdate,
}: UseGuardLiveLocationOptions): void {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!enabled || !activeJob?.id || !activeJob.assignedGuardId) return;
    const enRouteOrOnSite =
      activeJob.status === 'accepted' && (!!activeJob.enRouteAt || !!activeJob.arrivedAt);
    const onDuty = activeJob.status === 'in-progress';
    if (!enRouteOrOnSite && !onDuty) return;

    let cancelled = false;

    const publish = async () => {
      try {
        const pos = await requestDevicePosition();
        if (cancelled) return;
        onUpdateRef.current(activeJob.id, {
          lat: pos.lat,
          lng: pos.lng,
          updatedAt: new Date().toISOString(),
        });
      } catch {
        /* GPS unavailable — skip this tick */
      }
    };

    void publish();
    const id = window.setInterval(() => void publish(), UPDATE_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [
    enabled,
    activeJob?.id,
    activeJob?.status,
    activeJob?.assignedGuardId,
    activeJob?.enRouteAt,
    activeJob?.arrivedAt,
  ]);
}
