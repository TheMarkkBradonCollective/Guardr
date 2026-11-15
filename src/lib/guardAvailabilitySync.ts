/**
 * Keeps guard availability on the server (guard_availability / guard_availability_date_overrides)
 * so it follows the guard across devices and staff and push matching see the same schedule.
 * The local copy stays as the fast synchronous read used by the job board.
 */
import {
  isLegacyDefaultAvailability,
  loadAvailabilityDateOverrides,
  loadAvailabilitySlots,
  saveAvailabilityDateOverrides,
  saveAvailabilitySlots,
  type GuardAvailabilityDateOverride,
  type GuardAvailabilitySchedule,
  type GuardAvailabilitySlot,
} from './guardAvailability';

type Row = Record<string, unknown>;

interface DbLike {
  from(table: string): {
    select(cols?: string): { eq(col: string, val: unknown): PromiseLike<{ data: unknown; error: { message: string } | null }> };
    insert(rows: Row | Row[]): PromiseLike<{ data: unknown; error: { message: string } | null }>;
    delete(): { eq(col: string, val: unknown): PromiseLike<{ data: unknown; error: { message: string } | null }> };
  };
}

function hhmm(value: unknown, fallback: string): string {
  const s = typeof value === 'string' ? value.trim() : '';
  return /^\d{2}:\d{2}/.test(s) ? s.slice(0, 5) : fallback;
}

export function weeklySlotFromRow(row: Row): GuardAvailabilitySlot {
  return {
    id: String(row.id),
    guardId: String(row.guard_id),
    dayOfWeek: Number(row.day_of_week),
    startTime: hhmm(row.start_time, '00:00'),
    endTime: hhmm(row.end_time, '23:59'),
    isAvailable: row.is_available !== false,
    notes: typeof row.notes === 'string' && row.notes ? row.notes : undefined,
  };
}

export function dateOverrideFromRow(row: Row): GuardAvailabilityDateOverride {
  return {
    id: String(row.id),
    guardId: String(row.guard_id),
    date: String(row.date).slice(0, 10),
    startTime: hhmm(row.start_time, '00:00'),
    endTime: hhmm(row.end_time, '23:59'),
    isAvailable: row.is_available === true,
    notes: typeof row.notes === 'string' && row.notes ? row.notes : undefined,
  };
}

export function weeklySlotToRow(guardId: string, slot: GuardAvailabilitySlot): Row {
  return {
    id: `avail-${guardId}-${slot.dayOfWeek}-${slot.startTime.replace(':', '')}`,
    guard_id: guardId,
    day_of_week: slot.dayOfWeek,
    start_time: slot.startTime,
    end_time: slot.endTime,
    is_available: slot.isAvailable !== false,
    notes: slot.notes ?? null,
  };
}

export function dateOverrideToRow(guardId: string, o: GuardAvailabilityDateOverride): Row {
  return {
    id: `availdate-${guardId}-${o.date}-${o.startTime.replace(':', '')}`,
    guard_id: guardId,
    date: o.date,
    start_time: o.startTime,
    end_time: o.endTime,
    is_available: o.isAvailable === true,
    notes: o.notes ?? null,
  };
}

function dedupeById(rows: Row[]): Row[] {
  const byId = new Map<string, Row>();
  for (const row of rows) byId.set(String(row.id), row);
  return [...byId.values()];
}

/** Replace a guard's server schedule with `schedule`. Throws with the server message on failure. */
export async function persistGuardAvailability(db: DbLike, guardId: string, schedule: GuardAvailabilitySchedule): Promise<void> {
  const weekly = dedupeById(schedule.weeklySlots.map((slot) => weeklySlotToRow(guardId, slot)));
  const overrides = dedupeById(schedule.dateOverrides.map((o) => dateOverrideToRow(guardId, o)));
  for (const [table, rows] of [
    ['guard_availability', weekly],
    ['guard_availability_date_overrides', overrides],
  ] as const) {
    const removed = await db.from(table).delete().eq('guard_id', guardId);
    if (removed.error) throw new Error(removed.error.message);
    if (rows.length) {
      const inserted = await db.from(table).insert(rows);
      if (inserted.error) throw new Error(inserted.error.message);
    }
  }
}

/**
 * Bring server schedules onto this device. Server rows win. For the signed-in guard, a custom
 * schedule that only exists on this device (saved before server sync) is uploaded once.
 */
export async function hydrateGuardAvailability(
  db: DbLike,
  weeklyRows: Row[],
  overrideRows: Row[],
  selfGuardId: string | null,
): Promise<void> {
  const weeklyBy = new Map<string, GuardAvailabilitySlot[]>();
  for (const row of weeklyRows) {
    const slot = weeklySlotFromRow(row);
    weeklyBy.set(slot.guardId, [...(weeklyBy.get(slot.guardId) ?? []), slot]);
  }
  const overridesBy = new Map<string, GuardAvailabilityDateOverride[]>();
  for (const row of overrideRows) {
    const o = dateOverrideFromRow(row);
    overridesBy.set(o.guardId, [...(overridesBy.get(o.guardId) ?? []), o]);
  }
  for (const [guardId, slots] of weeklyBy) {
    if (!isLegacyDefaultAvailability(slots)) saveAvailabilitySlots(guardId, slots);
  }
  for (const [guardId, overrides] of overridesBy) saveAvailabilityDateOverrides(guardId, overrides);

  if (selfGuardId && !weeklyBy.has(selfGuardId)) {
    const local = loadAvailabilitySlots(selfGuardId);
    const localOverrides = loadAvailabilityDateOverrides(selfGuardId);
    if (local && local.length) {
      await persistGuardAvailability(db, selfGuardId, { weeklySlots: local, dateOverrides: localOverrides });
    }
  }
}
