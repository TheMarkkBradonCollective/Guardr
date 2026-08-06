import {
  closeActiveStaffSession,
  finalizeIdleStaffSessions,
  recordStaffTimeEvent,
  STAFF_ACTIVITY_IDLE_MS,
} from './staffWorkActivity';

export { STAFF_ACTIVITY_IDLE_MS, closeActiveStaffSession, finalizeIdleStaffSessions };

export const STAFF_TIME_ENTRIES_CHANGED_EVENT = 'guardr-staff-time-entries-changed';

export function notifyStaffTimeEntriesChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(STAFF_TIME_ENTRIES_CHANGED_EVENT));
}

/** @deprecated Use recordStaffTimeEvent with an explicit kind. */
export function recordStaffActivity(
  entries: Parameters<typeof recordStaffTimeEvent>[0],
  params: { staffId: string; staffName: string; at?: string },
) {
  return recordStaffTimeEvent(entries, { ...params, kind: 'work' });
}
