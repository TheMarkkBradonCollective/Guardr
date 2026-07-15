import type { SecurityGuard, SecurityRequest } from '../types';

export interface GuardAvailabilitySlot {
  id: string;
  guardId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  notes?: string;
}

export interface GuardAvailabilityDateOverride {
  id: string;
  guardId: string;
  /** Calendar date in YYYY-MM-DD (local). */
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  notes?: string;
}

export interface GuardAvailabilitySchedule {
  weeklySlots: GuardAvailabilitySlot[];
  dateOverrides: GuardAvailabilityDateOverride[];
}

export interface GuardSearchFilters {
  query?: string;
  specialties?: string[];
  minRating?: number;
  armedOnly?: boolean;
  maxDistanceMiles?: number;
  availableOnDay?: number;
  trustedOnly?: boolean;
  verifiedOnly?: boolean;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_LABELS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Monday-first order for the availability week row (Mon–Sun). */
export const WEEK_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export const WEEK_DAY_TAB_OPTIONS = WEEK_DAY_ORDER.map((day) => ({
  id: String(day),
  label: DAY_LABELS[day] ?? '?',
}));

export function dayLabel(day: number): string {
  return DAY_LABELS[day] ?? '?';
}

export function dayLabelFull(day: number): string {
  return DAY_LABELS_FULL[day] ?? '?';
}

export function filterGuardsForMarketplace(
  guards: SecurityGuard[],
  filters: GuardSearchFilters
): SecurityGuard[] {
  let result = guards.filter((g) => !g.isStaff && g.userStatus === 'active');

  if (filters.query) {
    const q = filters.query.toLowerCase();
    result = result.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q) ||
        g.badgeNumber?.toLowerCase().includes(q) ||
        g.specialties?.some((s) => s.toLowerCase().includes(q))
    );
  }

  if (filters.specialties?.length) {
    result = result.filter((g) =>
      filters.specialties!.some((s) => g.specialties?.includes(s as never))
    );
  }

  if (filters.minRating != null) {
    result = result.filter((g) => (g.rating ?? 0) >= filters.minRating!);
  }

  if (filters.armedOnly) {
    result = result.filter((g) => g.isArmed || (g.listedWeaponGear?.length ?? 0) > 0);
  }

  if (filters.trustedOnly) {
    result = result.filter((g) => g.trusted === true);
  }

  if (filters.verifiedOnly) {
    result = result.filter((g) => g.backgroundChecked === true);
  }

  if (filters.availableOnDay != null) {
    result = result.filter((g) => {
      const schedule = loadGuardAvailabilitySchedule(g.id);
      return isWeekDayEnabled(schedule.weeklySlots, filters.availableOnDay!);
    });
  }

  return result;
}

export function defaultAvailabilitySlots(guardId: string): GuardAvailabilitySlot[] {
  return [1, 2, 3, 4, 5].map((day) => ({
    id: `avail-${guardId}-${day}`,
    guardId,
    dayOfWeek: day,
    startTime: '08:00',
    endTime: '18:00',
    isAvailable: true,
  }));
}

export function defaultAvailabilitySchedule(guardId: string): GuardAvailabilitySchedule {
  return {
    weeklySlots: defaultAvailabilitySlots(guardId),
    dateOverrides: [],
  };
}

/** True when a slot's end time is not strictly after its start time (same-day window). */
export function isInvalidAvailabilityWindow(
  slot: Pick<GuardAvailabilitySlot, 'startTime' | 'endTime'>
): boolean {
  return Boolean(slot.startTime && slot.endTime && slot.endTime <= slot.startTime);
}

const WEEKLY_STORAGE_PREFIX = 'guardr_guard_availability_';
const DATE_STORAGE_PREFIX = 'guardr_guard_availability_dates_';

function readJson<T>(key: string): T | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable/full.
  }
}

export function loadAvailabilitySlots(guardId: string): GuardAvailabilitySlot[] | null {
  const parsed = readJson<GuardAvailabilitySlot[]>(`${WEEKLY_STORAGE_PREFIX}${guardId}`);
  return Array.isArray(parsed) ? parsed : null;
}

export function saveAvailabilitySlots(guardId: string, slots: GuardAvailabilitySlot[]): void {
  writeJson(`${WEEKLY_STORAGE_PREFIX}${guardId}`, slots);
}

export function loadAvailabilityDateOverrides(guardId: string): GuardAvailabilityDateOverride[] {
  const parsed = readJson<GuardAvailabilityDateOverride[]>(`${DATE_STORAGE_PREFIX}${guardId}`);
  if (!Array.isArray(parsed)) return [];
  return prunePastDateOverrides(parsed);
}

export function saveAvailabilityDateOverrides(
  guardId: string,
  overrides: GuardAvailabilityDateOverride[]
): GuardAvailabilityDateOverride[] {
  const pruned = prunePastDateOverrides(overrides);
  writeJson(`${DATE_STORAGE_PREFIX}${guardId}`, pruned);
  return pruned;
}

export function loadGuardAvailabilitySchedule(guardId: string): GuardAvailabilitySchedule {
  const weeklySlots = loadAvailabilitySlots(guardId) ?? defaultAvailabilitySlots(guardId);
  const dateOverrides = loadAvailabilityDateOverrides(guardId);
  return { weeklySlots, dateOverrides };
}

export function saveGuardAvailabilitySchedule(
  guardId: string,
  schedule: GuardAvailabilitySchedule
): GuardAvailabilitySchedule {
  const dateOverrides = saveAvailabilityDateOverrides(guardId, schedule.dateOverrides);
  saveAvailabilitySlots(guardId, schedule.weeklySlots);
  return { weeklySlots: schedule.weeklySlots, dateOverrides };
}

export function formatLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayLocalDateKey(): string {
  return formatLocalDateKey(new Date());
}

/** Drop date overrides strictly before today (local). */
export function prunePastDateOverrides(
  overrides: GuardAvailabilityDateOverride[]
): GuardAvailabilityDateOverride[] {
  const today = todayLocalDateKey();
  return overrides.filter((o) => o.date >= today);
}

export function getEnabledWeekDays(slots: GuardAvailabilitySlot[]): number[] {
  return WEEK_DAY_ORDER.filter((day) => isWeekDayEnabled(slots, day));
}

export function isWeekDayEnabled(slots: GuardAvailabilitySlot[], dayOfWeek: number): boolean {
  return slots.some((slot) => slot.dayOfWeek === dayOfWeek && slot.isAvailable);
}

export function slotsForWeekDay(slots: GuardAvailabilitySlot[], dayOfWeek: number): GuardAvailabilitySlot[] {
  return slots.filter((slot) => slot.dayOfWeek === dayOfWeek);
}

export function toggleWeekDay(
  slots: GuardAvailabilitySlot[],
  guardId: string,
  dayOfWeek: number,
  enabled: boolean
): GuardAvailabilitySlot[] {
  const withoutDay = slots.filter((slot) => slot.dayOfWeek !== dayOfWeek);
  if (!enabled) return withoutDay;
  if (slots.some((slot) => slot.dayOfWeek === dayOfWeek)) {
    return slots.map((slot) =>
      slot.dayOfWeek === dayOfWeek ? { ...slot, isAvailable: true } : slot
    );
  }
  return [
    ...withoutDay,
    {
      id: `avail-${guardId}-${dayOfWeek}-${Date.now()}`,
      guardId,
      dayOfWeek,
      startTime: '08:00',
      endTime: '18:00',
      isAvailable: true,
    },
  ];
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

function rangesOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && endA > startB;
}

export interface AvailabilityWindow {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

/** Windows for a calendar day — date overrides take precedence over weekly slots. */
export function windowsForDate(
  schedule: GuardAvailabilitySchedule,
  date: Date
): AvailabilityWindow[] {
  const dateKey = formatLocalDateKey(date);
  const overrides = schedule.dateOverrides.filter((o) => o.date === dateKey);
  if (overrides.length > 0) {
    return overrides
      .filter((o) => o.isAvailable)
      .map((o) => ({ startTime: o.startTime, endTime: o.endTime, isAvailable: true }));
  }

  const blocked = overrides.some((o) => !o.isAvailable);
  if (blocked) return [];

  const dayOfWeek = date.getDay();
  return schedule.weeklySlots
    .filter((slot) => slot.dayOfWeek === dayOfWeek && slot.isAvailable)
    .map((slot) => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: true,
    }));
}

function jobRangeMinutes(job: Pick<SecurityRequest, 'startDate' | 'endDate'>): {
  start: number;
  end: number;
} {
  const start = new Date(job.startDate);
  const end = new Date(job.endDate);
  return {
    start: start.getHours() * 60 + start.getMinutes(),
    end: end.getHours() * 60 + end.getMinutes(),
  };
}

/** Whether a job fits inside at least one availability window on its start day. */
export function guardIsAvailableForJob(
  guardId: string,
  job: Pick<SecurityRequest, 'startDate' | 'endDate'>,
  schedule?: GuardAvailabilitySchedule
): boolean {
  const resolved = schedule ?? loadGuardAvailabilitySchedule(guardId);
  const jobStart = new Date(job.startDate);
  const windows = windowsForDate(resolved, jobStart);
  if (!windows.length) return false;

  const { start: jobStartMin, end: jobEndMin } = jobRangeMinutes(job);
  return windows.some((window) => {
    const winStart = parseTimeToMinutes(window.startTime);
    const winEnd = parseTimeToMinutes(window.endTime);
    return rangesOverlap(jobStartMin, jobEndMin, winStart, winEnd);
  });
}

export function guardAvailabilityBlockReason(
  guardId: string,
  job: Pick<SecurityRequest, 'startDate' | 'endDate'>,
  schedule?: GuardAvailabilitySchedule
): string | null {
  if (guardIsAvailableForJob(guardId, job, schedule)) return null;
  const resolved = schedule ?? loadGuardAvailabilitySchedule(guardId);
  const jobStart = new Date(job.startDate);
  const day = jobStart.getDay();
  const windows = windowsForDate(resolved, jobStart);
  if (!windows.length) {
    return `Outside your availability on ${dayLabelFull(day)}`;
  }
  return 'Outside your set availability hours for this shift';
}

export function createDateOverride(input: {
  guardId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  isAvailable?: boolean;
  notes?: string;
}): GuardAvailabilityDateOverride {
  return {
    id: `avail-date-${input.guardId}-${Date.now()}`,
    guardId: input.guardId,
    date: input.date,
    startTime: input.startTime ?? '08:00',
    endTime: input.endTime ?? '18:00',
    isAvailable: input.isAvailable ?? true,
    notes: input.notes,
  };
}
