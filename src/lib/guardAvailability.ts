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
