import type { SecurityGuard } from '../types';

export interface GuardAvailabilitySlot {
  id: string;
  guardId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  notes?: string;
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
const DAY_TAB_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/** Monday-first order for the availability week tabs (Mon–Sun). */
export const WEEK_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export const WEEK_DAY_TAB_OPTIONS = WEEK_DAY_ORDER.map((day) => ({
  id: String(day),
  label: DAY_TAB_LABELS[day] ?? '?',
}));

export function dayLabel(day: number): string {
  return DAY_LABELS[day] ?? '?';
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

/** True when a slot's end time is not strictly after its start time (same-day window). */
export function isInvalidAvailabilityWindow(slot: Pick<GuardAvailabilitySlot, 'startTime' | 'endTime'>): boolean {
  return Boolean(slot.startTime && slot.endTime && slot.endTime <= slot.startTime);
}

const AVAILABILITY_STORAGE_PREFIX = 'guardr_guard_availability_';

/**
 * There is no `guard_availability` table in the schema yet, so this feature
 * had no persistence at all — edits lived only in component state and were
 * lost on refresh/navigation, with no "Save" button even appearing since it
 * only rendered when a parent passed `onSave` (no caller ever did). Persist
 * to localStorage per guard as a real, working fix until a server-backed
 * version exists; this mirrors how theme preference is already persisted
 * (see lib/platform/theme.ts) rather than inventing a new pattern.
 */
export function loadAvailabilitySlots(guardId: string): GuardAvailabilitySlot[] | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${AVAILABILITY_STORAGE_PREFIX}${guardId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveAvailabilitySlots(guardId: string, slots: GuardAvailabilitySlot[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(`${AVAILABILITY_STORAGE_PREFIX}${guardId}`, JSON.stringify(slots));
  } catch {
    // Storage unavailable/full — availability simply won't persist this session.
  }
}
