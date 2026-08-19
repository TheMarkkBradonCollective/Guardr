import type { Client, SecurityGuard, StaffRole } from '../types';
import { formatCityLabel, guardServesJobCity } from './californiaCities';
import { isExecutiveStaffRole, normalizeStaffManagedCitiesForRole } from './staffCityAccess';
import type { CityMarketStatus } from './platformCities';

export interface StaffMarketplaceCapConfig {
  /** Active marketplace guards + clients required for each additional staff slot. */
  marketplaceUsersPerStaffSlot: number;
  /** Minimum staff slots for an open city before user volume scales the cap. */
  minStaffSlotsPerOpenCity: number;
}

export const DEFAULT_STAFF_MARKETPLACE_CAP_CONFIG: StaffMarketplaceCapConfig = {
  marketplaceUsersPerStaffSlot: 100,
  minStaffSlotsPerOpenCity: 2,
};

export function normalizeStaffMarketplaceCapConfig(
  input?: Partial<StaffMarketplaceCapConfig> | null
): StaffMarketplaceCapConfig {
  const usersPerSlot = input?.marketplaceUsersPerStaffSlot;
  const minSlots = input?.minStaffSlotsPerOpenCity;
  return {
    marketplaceUsersPerStaffSlot:
      typeof usersPerSlot === 'number' && usersPerSlot > 0
        ? Math.round(usersPerSlot)
        : DEFAULT_STAFF_MARKETPLACE_CAP_CONFIG.marketplaceUsersPerStaffSlot,
    minStaffSlotsPerOpenCity:
      typeof minSlots === 'number' && minSlots >= 0
        ? Math.round(minSlots)
        : DEFAULT_STAFF_MARKETPLACE_CAP_CONFIG.minStaffSlotsPerOpenCity,
  };
}

function cityMatches(a: string, b: string): boolean {
  return formatCityLabel(a).toLowerCase() === formatCityLabel(b).toLowerCase();
}

/** Active guards and clients using a city market — staffing ratio is based on this count. */
export function countMarketplaceUsersInCity(
  cityName: string,
  guards: SecurityGuard[],
  clients: Client[]
): number {
  let count = 0;
  for (const guard of guards) {
    if (guard.isStaff) continue;
    if (guard.userStatus !== 'active' && guard.userStatus !== 'approved') continue;
    if (guardServesJobCity(guard.serviceAreas, cityName)) count += 1;
  }
  for (const client of clients) {
    if (client.accountStatus !== 'active') continue;
    if (client.serviceCity && cityMatches(client.serviceCity, cityName)) count += 1;
  }
  return count;
}

/** Whether this staff member counts toward a city's staffing cap. */
export function staffCountsTowardCityCap(
  member: Pick<SecurityGuard, 'isStaff' | 'staffRole' | 'userStatus'>
): boolean {
  if (!member.isStaff || !member.staffRole) return false;
  if (isExecutiveStaffRole(member.staffRole)) return false;
  if (member.userStatus === 'suspended' || member.userStatus === 'blocked') return false;
  return (
    member.userStatus === 'pending' ||
    member.userStatus === 'approved' ||
    member.userStatus === 'active'
  );
}

export function countStaffInCity(
  cityName: string,
  staffRoster: SecurityGuard[],
  excludeStaffId?: string
): number {
  return staffRoster.filter((member) => {
    if (excludeStaffId && member.id === excludeStaffId) return false;
    if (!staffCountsTowardCityCap(member)) return false;
    return (member.managedCities ?? []).some((city) => cityMatches(city, cityName));
  }).length;
}

export function maxStaffSlotsForCity(
  marketplaceUserCount: number,
  config: StaffMarketplaceCapConfig = DEFAULT_STAFF_MARKETPLACE_CAP_CONFIG,
  cityStatus: CityMarketStatus = 'open'
): number {
  if (cityStatus === 'closed') {
    return config.minStaffSlotsPerOpenCity;
  }
  const scaled = Math.floor(marketplaceUserCount / config.marketplaceUsersPerStaffSlot);
  return Math.max(config.minStaffSlotsPerOpenCity, scaled);
}

export interface StaffCityCapSnapshot {
  cityName: string;
  marketplaceUsers: number;
  staffCount: number;
  maxStaffSlots: number;
  remainingSlots: number;
  atCapacity: boolean;
}

export function staffCityCapSnapshot(
  cityName: string,
  input: {
    guards: SecurityGuard[];
    clients: Client[];
    staffRoster: SecurityGuard[];
    config?: StaffMarketplaceCapConfig;
    cityStatus?: CityMarketStatus;
    excludeStaffId?: string;
  }
): StaffCityCapSnapshot {
  const config = normalizeStaffMarketplaceCapConfig(input.config);
  const marketplaceUsers = countMarketplaceUsersInCity(cityName, input.guards, input.clients);
  const staffCount = countStaffInCity(cityName, input.staffRoster, input.excludeStaffId);
  const maxStaffSlots = maxStaffSlotsForCity(
    marketplaceUsers,
    config,
    input.cityStatus ?? 'open'
  );
  const remainingSlots = Math.max(0, maxStaffSlots - staffCount);
  return {
    cityName: formatCityLabel(cityName),
    marketplaceUsers,
    staffCount,
    maxStaffSlots,
    remainingSlots,
    atCapacity: remainingSlots <= 0,
  };
}

export function newlyAssignedStaffCities(previous: string[], next: string[]): string[] {
  const previousSet = new Set(previous.map((city) => formatCityLabel(city).toLowerCase()));
  return next.filter((city) => !previousSet.has(formatCityLabel(city).toLowerCase()));
}

export function formatStaffCityCapSummary(snapshot: StaffCityCapSnapshot): string {
  return `${snapshot.staffCount}/${snapshot.maxStaffSlots} staff for ${snapshot.marketplaceUsers} marketplace users`;
}

export function assertStaffCityCapacity(
  cityNames: string[],
  input: {
    guards: SecurityGuard[];
    clients: Client[];
    staffRoster: SecurityGuard[];
    config?: StaffMarketplaceCapConfig;
    platformCities?: Array<{ name: string; status: CityMarketStatus }>;
    excludeStaffId?: string;
    slotsNeeded?: number;
  }
): void {
  const slotsNeeded = input.slotsNeeded ?? 1;
  for (const cityName of cityNames) {
    const cityStatus = input.platformCities?.find((city) => cityMatches(city.name, cityName))?.status;
    const snapshot = staffCityCapSnapshot(cityName, {
      guards: input.guards,
      clients: input.clients,
      staffRoster: input.staffRoster,
      config: input.config,
      cityStatus,
      excludeStaffId: input.excludeStaffId,
    });
    if (snapshot.remainingSlots < slotsNeeded) {
      throw new Error(
        `${snapshot.cityName} is at the staff cap (${formatStaffCityCapSummary(snapshot)}). ` +
          `Each open city allows 1 staff member per ${normalizeStaffMarketplaceCapConfig(input.config).marketplaceUsersPerStaffSlot} active guards and clients ` +
          `(minimum ${normalizeStaffMarketplaceCapConfig(input.config).minStaffSlotsPerOpenCity} slots).`
      );
    }
  }
}

/** Enforce staffing caps when assigning or approving city-scoped staff. */
export function enforceStaffCityCapacityForMember(input: {
  staffRole?: StaffRole | null;
  staffId?: string;
  previousManagedCities?: string[];
  nextManagedCities: string[];
  guards: SecurityGuard[];
  clients: Client[];
  platformCities: Array<{ name: string; status: CityMarketStatus }>;
  config?: StaffMarketplaceCapConfig;
}): void {
  if (!input.staffRole || isExecutiveStaffRole(input.staffRole)) return;
  const previous = normalizeStaffManagedCitiesForRole(
    input.staffRole,
    input.previousManagedCities,
    input.platformCities
  );
  const next = normalizeStaffManagedCitiesForRole(
    input.staffRole,
    input.nextManagedCities,
    input.platformCities
  );
  const added = newlyAssignedStaffCities(previous, next);
  if (added.length === 0) return;
  assertStaffCityCapacity(added, {
    guards: input.guards,
    clients: input.clients,
    staffRoster: input.guards.filter((member) => member.isStaff),
    config: input.config,
    platformCities: input.platformCities,
    excludeStaffId: input.staffId,
  });
}
