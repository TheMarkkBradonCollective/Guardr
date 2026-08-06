import { useEffect, useRef } from 'react';
import { notifyStaffTimeEntriesChanged } from '../lib/staffActivityTime';
import type { StaffTimeEntry } from '../lib/staffTimeTracking';
import {
  loadStaffTimeEntries,
  persistStaffTimeEntries,
  saveStaffTimeEntriesToStorage,
} from '../lib/staffTimeTrackingStorage';
import {
  closeActiveStaffSession,
  finalizeIdleStaffSessions,
  isStaffEngagementTarget,
  markStaffPresenceHidden,
  recordStaffTimeEvent,
  resumeStaffPresence,
  STAFF_ACTIVITY_IDLE_MS,
  STAFF_PRESENCE_RESUME_GRACE_MS,
  STAFF_TRAVEL_ACTION_EVENT,
  STAFF_WORK_ACTION_EVENT,
} from '../lib/staffWorkActivity';

const PERSIST_INTERVAL_MS = 30_000;
const IDLE_CHECK_INTERVAL_MS = 60_000;
const ENGAGEMENT_DEBOUNCE_MS = 8_000;

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
 * Smart staff time tracking:
 * - Presence (app/tab open) starts time — not login
 * - Staff navigation counts as travel toward work
 * - Audit-logged ops, messages, forms, and interactive staff UI count as work
 * - App/tab close ends the session; brief switches resume within a grace window
 */
export function useStaffActivityTimeTracker(target: StaffActivityTrackerTarget | null): void {
  const entriesRef = useRef<StaffTimeEntry[]>([]);
  const loadedRef = useRef(false);
  const persistTimerRef = useRef<number | null>(null);
  const lastEngagementAtRef = useRef(0);
  const targetRef = useRef(target);
  const hiddenAtRef = useRef<number | null>(null);
  const graceTimerRef = useRef<number | null>(null);
  const appVisibleRef = useRef(typeof document !== 'undefined' && document.visibilityState === 'visible');

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
      if (document.visibilityState === 'visible') {
        applyEvent('presence', true);
      }
    });

    const schedulePersist = () => {
      if (persistTimerRef.current != null) return;
      persistTimerRef.current = window.setTimeout(() => {
        persistTimerRef.current = null;
        void flushStaffTimeEntries(entriesRef.current);
      }, PERSIST_INTERVAL_MS);
    };

    const applyEvent = (kind: 'presence' | 'travel' | 'work', forcePersist = false) => {
      const current = targetRef.current;
      if (!current || !loadedRef.current) return;

      const recorded = recordStaffTimeEvent(entriesRef.current, {
        staffId: current.staffId,
        staffName: current.staffName,
        kind,
      });
      if (!recorded.changed && !forcePersist) return;
      entriesRef.current = recorded.entries;
      syncLocalStaffTimeEntries(entriesRef.current);
      schedulePersist();
    };

    const clearGraceTimer = () => {
      if (graceTimerRef.current != null) {
        window.clearTimeout(graceTimerRef.current);
        graceTimerRef.current = null;
      }
    };

    const finalizeHiddenSession = () => {
      const current = targetRef.current;
      if (!current || !loadedRef.current) return;
      const hiddenAt = hiddenAtRef.current;
      const closed = closeActiveStaffSession(
        entriesRef.current,
        current.staffId,
        hiddenAt != null ? new Date(hiddenAt).toISOString() : undefined,
      );
      if (!closed.changed) return;
      entriesRef.current = closed.entries;
      void flushStaffTimeEntries(entriesRef.current);
      hiddenAtRef.current = null;
    };

    const onPresenceHidden = () => {
      const current = targetRef.current;
      if (!current || !loadedRef.current) return;
      appVisibleRef.current = false;
      hiddenAtRef.current = Date.now();
      const marked = markStaffPresenceHidden(entriesRef.current, current.staffId);
      if (marked.changed) {
        entriesRef.current = marked.entries;
        syncLocalStaffTimeEntries(entriesRef.current);
        schedulePersist();
      }
      clearGraceTimer();
      graceTimerRef.current = window.setTimeout(() => {
        graceTimerRef.current = null;
        finalizeHiddenSession();
      }, STAFF_PRESENCE_RESUME_GRACE_MS);
    };

    const onPresenceVisible = () => {
      appVisibleRef.current = true;
      const current = targetRef.current;
      if (!current || !loadedRef.current) return;

      const hiddenAt = hiddenAtRef.current;
      const withinGrace =
        hiddenAt != null && Date.now() - hiddenAt <= STAFF_PRESENCE_RESUME_GRACE_MS;

      clearGraceTimer();

      if (withinGrace) {
        const resumed = resumeStaffPresence(entriesRef.current, current.staffId);
        if (resumed.changed) {
          entriesRef.current = resumed.entries;
          syncLocalStaffTimeEntries(entriesRef.current);
          schedulePersist();
        }
        hiddenAtRef.current = null;
        return;
      }

      hiddenAtRef.current = null;
      applyEvent('presence');
    };

    const onWorkAction = () => applyEvent('work');
    const onTravelAction = () => {
      if (!appVisibleRef.current) return;
      applyEvent('travel');
    };

    const onStaffEngagement = (force = false) => {
      if (!appVisibleRef.current) return;
      const nowMs = Date.now();
      if (!force && nowMs - lastEngagementAtRef.current < ENGAGEMENT_DEBOUNCE_MS) return;
      lastEngagementAtRef.current = nowMs;
      applyEvent('work');
    };

    const onEngagementClick = (event: MouseEvent) => {
      if (!isStaffEngagementTarget(event.target)) return;
      onStaffEngagement(false);
    };

    const onEngagementInput = (event: Event) => {
      if (!(event.target instanceof Element)) return;
      if (!event.target.matches('input, select, textarea, [contenteditable="true"]')) return;
      onStaffEngagement(false);
    };

    const onEngagementSubmit = () => onStaffEngagement(true);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') onPresenceVisible();
      else onPresenceHidden();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener(STAFF_WORK_ACTION_EVENT, onWorkAction);
    window.addEventListener(STAFF_TRAVEL_ACTION_EVENT, onTravelAction);
    document.addEventListener('click', onEngagementClick, true);
    document.addEventListener('input', onEngagementInput, true);
    document.addEventListener('change', onEngagementInput, true);
    document.addEventListener('submit', onEngagementSubmit, true);

    let removeCapListener: (() => void) | undefined;
    void import('@capacitor/core').then(({ Capacitor }) => {
      if (!Capacitor.isNativePlatform()) return;
      void import('@capacitor/app').then(({ App }) => {
        void App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) onPresenceVisible();
          else onPresenceHidden();
        }).then((handle) => {
          removeCapListener = () => void handle.remove();
        });
      });
    });

    const idleTimer = window.setInterval(() => {
      if (!appVisibleRef.current) return;
      const finalized = finalizeIdleStaffSessions(entriesRef.current);
      if (!finalized.changed) return;
      entriesRef.current = finalized.entries;
      syncLocalStaffTimeEntries(entriesRef.current);
      void flushStaffTimeEntries(entriesRef.current);
    }, IDLE_CHECK_INTERVAL_MS);

    const closeOpenSession = () => {
      clearGraceTimer();
      finalizeHiddenSession();
    };

    window.addEventListener('pagehide', closeOpenSession);
    window.addEventListener('beforeunload', closeOpenSession);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener(STAFF_WORK_ACTION_EVENT, onWorkAction);
      window.removeEventListener(STAFF_TRAVEL_ACTION_EVENT, onTravelAction);
      document.removeEventListener('click', onEngagementClick, true);
      document.removeEventListener('input', onEngagementInput, true);
      document.removeEventListener('change', onEngagementInput, true);
      document.removeEventListener('submit', onEngagementSubmit, true);
      removeCapListener?.();
      window.removeEventListener('pagehide', closeOpenSession);
      window.removeEventListener('beforeunload', closeOpenSession);
      window.clearInterval(idleTimer);
      clearGraceTimer();
      if (persistTimerRef.current != null) {
        window.clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
      closeOpenSession();
    };
  }, [target?.staffId, target?.staffName]);
}

export { STAFF_ACTIVITY_IDLE_MS, STAFF_PRESENCE_RESUME_GRACE_MS };
