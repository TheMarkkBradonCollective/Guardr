import { supabase } from './supabase';
import type { StaffTimeEntry } from './staffTimeTracking';

const STORAGE_KEY = 'guardr_staff_time_entries';

export function loadStaffTimeEntriesFromStorage(): StaffTimeEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStaffTimeEntriesToStorage(entries: StaffTimeEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* ignore */
  }
}

function rowToEntry(row: Record<string, unknown>): StaffTimeEntry {
  return {
    id: String(row.id),
    staffId: String(row.staff_id),
    staffName: String(row.staff_name),
    clockInAt: String(row.clock_in_at),
    lastActivityAt: row.last_activity_at != null ? String(row.last_activity_at) : undefined,
    clockOutAt: row.clock_out_at != null ? String(row.clock_out_at) : undefined,
    createdAt: String(row.created_at),
    source: row.source === 'manual' ? 'manual' : 'automatic',
    adjustedById: row.adjusted_by_id != null ? String(row.adjusted_by_id) : undefined,
    adjustedByEmail: row.adjusted_by_email != null ? String(row.adjusted_by_email) : undefined,
    adjustedAt: row.adjusted_at != null ? String(row.adjusted_at) : undefined,
    adjustmentNote: row.adjustment_note != null ? String(row.adjustment_note) : undefined,
  };
}

function entryToRow(entry: StaffTimeEntry) {
  return {
    id: entry.id,
    staff_id: entry.staffId,
    staff_name: entry.staffName,
    clock_in_at: entry.clockInAt,
    last_activity_at: entry.lastActivityAt ?? entry.clockInAt,
    clock_out_at: entry.clockOutAt ?? null,
    created_at: entry.createdAt,
    source: entry.source ?? 'automatic',
    adjusted_by_id: entry.adjustedById ?? null,
    adjusted_by_email: entry.adjustedByEmail ?? null,
    adjusted_at: entry.adjustedAt ?? null,
    adjustment_note: entry.adjustmentNote ?? null,
  };
}

export async function loadStaffTimeEntries(): Promise<StaffTimeEntry[]> {
  const local = loadStaffTimeEntriesFromStorage();
  try {
    const { data, error } = await supabase
      .from('staff_time_entries')
      .select('*')
      .order('clock_in_at', { ascending: false });
    if (error || !data) return local;
    const remote = data.map((row) => rowToEntry(row as Record<string, unknown>));
    if (remote.length > 0) {
      saveStaffTimeEntriesToStorage(remote);
      return remote;
    }
  } catch {
    /* table may not exist yet */
  }
  return local;
}

export async function persistStaffTimeEntries(entries: StaffTimeEntry[]): Promise<StaffTimeEntry[]> {
  saveStaffTimeEntriesToStorage(entries);
  try {
    if (entries.length > 0) {
      await supabase.from('staff_time_entries').upsert(entries.map(entryToRow));
    }
  } catch {
    /* table may not exist yet */
  }
  return entries;
}

export async function deleteStaffTimeEntry(entryId: string): Promise<StaffTimeEntry[]> {
  const entries = loadStaffTimeEntriesFromStorage().filter((entry) => entry.id !== entryId);
  saveStaffTimeEntriesToStorage(entries);
  try {
    await supabase.from('staff_time_entries').delete().eq('id', entryId);
  } catch {
    /* table may not exist yet */
  }
  return entries;
}
