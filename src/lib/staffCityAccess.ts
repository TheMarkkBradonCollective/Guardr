import type { StaffRole } from '../types';
import { formatCityLabel } from './californiaCities';
import { normalizeManagedCities, type PlatformCity } from './platformCities';

export function isExecutiveStaffRole(staffRole?: StaffRole | null): boolean {
  return staffRole === 'Founder' || staffRole === 'Director';
}

/** Directors and Founders run the full platform; all other staff are scoped to assigned cities. */
export function staffRequiresCityAssignment(staffRole?: StaffRole | null): boolean {
  if (!staffRole) return false;
  return !isExecutiveStaffRole(staffRole);
}

/** Managers are city managers — exactly one California market per Manager account. */
export const MANAGER_MAX_CITIES = 1;

export function normalizeStaffManagedCitiesForRole(
  staffRole: StaffRole | undefined,
  cities: string[] | undefined,
  available: Array<{ name: string }> = []
): string[] {
  if (!staffRole || isExecutiveStaffRole(staffRole)) return [];
  const normalized = normalizeManagedCities(cities, available);
  if (staffRole === 'Manager') {
    return normalized.slice(0, MANAGER_MAX_CITIES);
  }
  return normalized;
}

export function validateStaffCityAssignment(
  staffRole: StaffRole | undefined,
  managedCities: string[],
  options?: {
    staffId?: string;
    platformCities?: PlatformCity[];
  }
): void {
  if (!staffRole) return;

  if (isExecutiveStaffRole(staffRole)) {
    if (managedCities.length > 0) {
      throw new Error('Directors and Founders are not assigned to a city.');
    }
    return;
  }

  if (staffRole === 'Manager' && managedCities.length > MANAGER_MAX_CITIES) {
    throw new Error('Managers may only be assigned to one city.');
  }

  if (staffRole !== 'Manager' || managedCities.length === 0 || !options?.platformCities) {
    return;
  }

  for (const cityName of managedCities) {
    const label = formatCityLabel(cityName);
    const city = options.platformCities.find(
      (entry) => entry.name.toLowerCase() === label.toLowerCase()
    );
    if (city?.cityManagerId && city.cityManagerId !== options.staffId) {
      throw new Error(`${city.name} already has a city manager assigned.`);
    }
  }
}

export function findCityManagerStaffId(
  city: PlatformCity,
  staffRoster: Array<{ id: string; staffRole?: StaffRole; managedCities?: string[] }>
): string | null {
  if (city.cityManagerId) return city.cityManagerId;
  const manager = staffRoster.find(
    (member) =>
      member.staffRole === 'Manager' &&
      (member.managedCities ?? []).some(
        (name) => formatCityLabel(name).toLowerCase() === city.name.toLowerCase()
      )
  );
  return manager?.id ?? null;
}

export function findCityManagedByManager(
  platformCities: PlatformCity[],
  managerId: string
): PlatformCity | undefined {
  return platformCities.find((city) => city.cityManagerId === managerId);
}

export function managerStaffForCityAssignment(
  staffRoster: Array<{ id: string; staffRole?: StaffRole; badgeNumber?: string; name: string }>
): Array<{ id: string; badgeNumber?: string; name: string }> {
  return staffRoster
    .filter((member) => member.staffRole === 'Manager')
    .sort((a, b) => a.name.localeCompare(b.name));
}
