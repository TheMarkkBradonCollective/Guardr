export interface StaffTimeEntry {
  id: string;
  staffId: string;
  staffName: string;
  clockInAt: string;
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
  const end = entry.clockOutAt ? new Date(entry.clockOutAt).getTime() : now.getTime();
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

export function elapsedActiveSessionSeconds(entry: StaffTimeEntry, now: Date = new Date()): number {
  const start = new Date(entry.clockInAt).getTime();
  return Math.max(0, Math.floor((now.getTime() - start) / 1000));
}

export function formatElapsedDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function createStaffClockInEntry(params: {
  staffId: string;
  staffName: string;
}): StaffTimeEntry {
  const now = new Date().toISOString();
  return {
    id: `sttime-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    staffId: params.staffId,
    staffName: params.staffName,
    clockInAt: now,
    createdAt: now,
  };
}

export function closeStaffTimeEntry(entry: StaffTimeEntry, clockOutAt?: string): StaffTimeEntry {
  return {
    ...entry,
    clockOutAt: clockOutAt ?? new Date().toISOString(),
  };
}
