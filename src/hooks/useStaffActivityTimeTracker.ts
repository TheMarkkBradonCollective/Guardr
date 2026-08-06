import { useEffect, useRef } from 'react';
import {
  closeActiveStaffSession,
  finalizeIdleStaffSessions,
  notifyStaffTimeEntriesChanged,
  recordStaffActivity,
  STAFF_ACTIVITY_IDLE_MS,
} from '../lib/staffActivityTime';
import type { StaffTimeEntry } from '../lib/staffTimeTracking';
import {
  loadStaffTimeEntries,
  persistStaffTimeEntries,
  saveStaffTimeEntriesToStorage,
} from '../lib/staffTimeTrackingStorage';

const ACTIVITY_DEBOUNCE_MS = 5_000;
const PERSIST_INTERVAL_MS = 30_000;
const IDLE_CHECK_INTERVAL_MS = 60_000;

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  'pointerdown',
  'keydown',
  'click',
  'scroll',
  'touchstart',
];

export interface StaffActivityTrackerTarget {
  staffId: string;
  staffName: string;
}

async function flushStaffTimeEntries(entries: StaffTimeEntry[]): Promise<StaffTimeEntry[]> {
  const saved = await persistStaffTimeEntries(entries);
  notifyStaffTimeEntriesChanged();
  return saved;
}

function syncLocalStaffTimeEntries(entries: StaffTimeEntry[]): void {
  saveStaffTimeEntriesToStorage(entries);
  notifyStaffTimeEntriesChanged();
}

/**
 * Automatically tracks staff time from first website action to last action in a session.
 * Mounted once for signed-in staff in App root.
 */
export function useStaffActivityTimeTracker(target: StaffActivityTrackerTarget | null): void {
  const entriesRef = useRef<StaffTimeEntry[]>([]);
  const loadedRef = useRef(false);
  const persistTimerRef = useRef<number | null>(null);
  const lastRecordedAtRef = useRef(0);
  const targetRef = useRef(target);
  targetRef.current = target;

  useEffect(() => {
    if (!target) {
      loadedRef.current = false;
      entriesRef.current = [];
      return;
    }

    let cancelled = false;

    void loadStaffTimeEntries().then((rows) => {
      if (cancelled) return;
      entriesRef.current = rows;
      loadedRef.current = true;
    });

    const schedulePersist = () => {
      if (persistTimerRef.current != null) return;
      persistTimerRef.current = window.setTimeout(() => {
        persistTimerRef.current = null;
        void flushStaffTimeEntries(entriesRef.current);
      }, PERSIST_INTERVAL_MS);
    };

    const applyActivity = (force = false) => {
      const current = targetRef.current;
      if (!current || !loadedRef.current) return;

      const nowMs = Date.now();
      if (!force && nowMs - lastRecordedAtRef.current < ACTIVITY_DEBOUNCE_MS) return;
      lastRecordedAtRef.current = nowMs;

      const recorded = recordStaffActivity(entriesRef.current, {
        staffId: current.staffId,
        staffName: current.staffName,
      });
      if (!recorded.changed) return;
      entriesRef.current = recorded.entries;
      syncLocalStaffTimeEntries(entriesRef.current);
      schedulePersist();
    };

    const onActivity = () => applyActivity(false);

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, onActivity, { capture: true, passive: true });
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') applyActivity(true);
    };
    document.addEventListener('visibilitychange', onVisibility);

    const idleTimer = window.setInterval(() => {
      const finalized = finalizeIdleStaffSessions(entriesRef.current);
      if (!finalized.changed) return;
      entriesRef.current = finalized.entries;
      syncLocalStaffTimeEntries(entriesRef.current);
      void flushStaffTimeEntries(entriesRef.current);
    }, IDLE_CHECK_INTERVAL_MS);

    const closeOpenSession = () => {
      const current = targetRef.current;
      if (!current || !loadedRef.current) return;
      const closed = closeActiveStaffSession(entriesRef.current, current.staffId);
      if (!closed.changed) return;
      entriesRef.current = closed.entries;
      void flushStaffTimeEntries(entriesRef.current);
    };

    window.addEventListener('pagehide', closeOpenSession);
    window.addEventListener('beforeunload', closeOpenSession);

    return () => {
      cancelled = true;
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, onActivity, true);
      }
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', closeOpenSession);
      window.removeEventListener('beforeunload', closeOpenSession);
      window.clearInterval(idleTimer);
      if (persistTimerRef.current != null) {
        window.clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
      closeOpenSession();
    };
  }, [target?.staffId, target?.staffName]);
}

export { STAFF_ACTIVITY_IDLE_MS };
