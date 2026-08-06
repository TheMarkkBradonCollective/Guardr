export interface StaffTimeEntry {
  id: string;
  staffId: string;
  staffName: string;
  clockInAt: string;
  /** Last staff action on the site — tracked hours end here (not at idle "now"). */
  lastActivityAt?: string;
  clockOutAt?: string;
  createdAt: string;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function isStaffTimeEntryActive(entry: StaffTimeEntry): boolean {
  return !entry.clockOutAt;
}

export function entryHoursInPeriod(
  entry: StaffTimeEntry,
  periodStart: string,
  periodEnd: string,
  now: Date = new Date(),
): number {
  const start = new Date(entry.clockInAt).getTime();
  const end = entry.clockOutAt
    ? new Date(entry.clockOutAt).getTime()
    : entry.lastActivityAt
      ? new Date(entry.lastActivityAt).getTime()
      : now.getTime();
  const periodS = new Date(periodStart).getTime();
  const periodE = new Date(periodEnd).getTime();
  const overlapStart = Math.max(start, periodS);
  const overlapEnd = Math.min(end, periodE);
  if (overlapEnd <= overlapStart) return 0;
  return round2((overlapEnd - overlapStart) / (1000 * 60 * 60));
}

export function sumStaffHoursInPeriod(
  entries: StaffTimeEntry[],
  staffId: string,
  periodStart: string,
  periodEnd: string,
  now: Date = new Date(),
): number {
  let total = 0;
  for (const entry of entries) {
    if (entry.staffId !== staffId) continue;
    total += entryHoursInPeriod(entry, periodStart, periodEnd, now);
  }
  return round2(total);
}

export function getActiveStaffTimeEntry(
  entries: StaffTimeEntry[],
  staffId: string,
): StaffTimeEntry | undefined {
  return entries.find((entry) => entry.staffId === staffId && isStaffTimeEntryActive(entry));
}

export function listActiveStaffTimeEntries(entries: StaffTimeEntry[]): StaffTimeEntry[] {
  return entries.filter(isStaffTimeEntryActive);
}

export function formatTrackedHours(hours: number): string {
  if (hours <= 0) return '0h';
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  if (minutes === 0) return `${wholeHours}h`;
  return `${wholeHours}h ${minutes}m`;
}

function sessionEndMs(entry: StaffTimeEntry, now: Date): number {
  if (entry.clockOutAt) return new Date(entry.clockOutAt).getTime();
  if (entry.lastActivityAt) return new Date(entry.lastActivityAt).getTime();
  return now.getTime();
}

export function elapsedActiveSessionSeconds(entry: StaffTimeEntry, now: Date = new Date()): number {
  const start = new Date(entry.clockInAt).getTime();
  return Math.max(0, Math.floor((sessionEndMs(entry, now) - start) / 1000));
}

export function formatElapsedDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** @deprecated Manual clock-in — use createStaffActivitySession for automatic tracking. */
export function createStaffClockInEntry(params: {
  staffId: string;
  staffName: string;
}): StaffTimeEntry {
  return createStaffActivitySession(params);
}

export function createStaffActivitySession(params: {
  staffId: string;
  staffName: string;
  at?: string;
}): StaffTimeEntry {
  const at = params.at ?? new Date().toISOString();
  return {
    id: `sttime-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    staffId: params.staffId,
    staffName: params.staffName,
    clockInAt: at,
    lastActivityAt: at,
    createdAt: at,
  };
}

export function closeStaffTimeEntry(entry: StaffTimeEntry, clockOutAt?: string): StaffTimeEntry {
  return {
    ...entry,
    clockOutAt: clockOutAt ?? entry.lastActivityAt ?? new Date().toISOString(),
  };
}
