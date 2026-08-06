import {
  closeStaffTimeEntry,
  createStaffActivitySession,
  getActiveStaffTimeEntry,
  type StaffTimeEntry,
} from './staffTimeTracking';

/** Close an open session after this much idle time since the last staff action. */
export const STAFF_ACTIVITY_IDLE_MS = 15 * 60 * 1000;

export const STAFF_TIME_ENTRIES_CHANGED_EVENT = 'guardr-staff-time-entries-changed';

export function notifyStaffTimeEntriesChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(STAFF_TIME_ENTRIES_CHANGED_EVENT));
}

export function recordStaffActivity(
  entries: StaffTimeEntry[],
  params: { staffId: string; staffName: string; at?: string },
): { entries: StaffTimeEntry[]; changed: boolean } {
  const at = params.at ?? new Date().toISOString();
  const atMs = new Date(at).getTime();
  const active = getActiveStaffTimeEntry(entries, params.staffId);

  if (active) {
    const lastAt = active.lastActivityAt ?? active.clockInAt;
    const idleMs = atMs - new Date(lastAt).getTime();
    if (idleMs > STAFF_ACTIVITY_IDLE_MS) {
      const closed = closeStaffTimeEntry(active);
      const fresh = createStaffActivitySession({
        staffId: params.staffId,
        staffName: params.staffName,
        at,
      });
      return {
        entries: [fresh, ...entries.map((entry) => (entry.id === closed.id ? closed : entry))],
        changed: true,
      };
    }

    const updated: StaffTimeEntry = { ...active, lastActivityAt: at };
    return {
      entries: entries.map((entry) => (entry.id === updated.id ? updated : entry)),
      changed: true,
    };
  }

  const entry = createStaffActivitySession({
    staffId: params.staffId,
    staffName: params.staffName,
    at,
  });
  return { entries: [entry, ...entries], changed: true };
}

export function finalizeIdleStaffSessions(
  entries: StaffTimeEntry[],
  now: Date = new Date(),
): { entries: StaffTimeEntry[]; changed: boolean } {
  let changed = false;
  const next = entries.map((entry) => {
    if (entry.clockOutAt) return entry;
    const lastAt = entry.lastActivityAt ?? entry.clockInAt;
    if (now.getTime() - new Date(lastAt).getTime() >= STAFF_ACTIVITY_IDLE_MS) {
      changed = true;
      return closeStaffTimeEntry(entry);
    }
    return entry;
  });
  return { entries: next, changed };
}

export function closeActiveStaffSession(
  entries: StaffTimeEntry[],
  staffId: string,
): { entries: StaffTimeEntry[]; changed: boolean } {
  const active = getActiveStaffTimeEntry(entries, staffId);
  if (!active) return { entries, changed: false };
  const closed = closeStaffTimeEntry(active);
  return {
    entries: entries.map((entry) => (entry.id === closed.id ? closed : entry)),
    changed: true,
  };
}
