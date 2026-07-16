import { CALIFORNIA_CITIES, DEFAULT_CALIFORNIA_CITY, formatCityLabel, isCaliforniaCity } from './californiaCities';
import type { PlatformRole } from '../types';

export type CityMarketStatus = 'open' | 'closed' | 'waitlist';
export type CityWaitlistAudience = 'guard' | 'client' | 'both';

export interface PlatformCity {
  id: string;
  name: string;
  stateCode: string;
  status: CityMarketStatus;
  waitlistAudience: CityWaitlistAudience;
  recommendOpen: boolean;
  sortOrder: number;
  updatedAt?: string;
  updatedBy?: string;
}

export type CityAccessAudience = 'guard' | 'client';

export type CityAccessResult =
  | { allowed: true }
  | { allowed: false; reason: 'closed'; message: string }
  | { allowed: false; reason: 'waitlist'; message: string };

const CLOSED_MESSAGE =
  'Guardr is not accepting new applications in this city right now. Please choose another city or check back later.';
const WAITLIST_MESSAGE =
  "You're on the wait list for this city. We'll notify you when Guardr is fully active in your area.";

let cachedPlatformCities: PlatformCity[] | null = null;

/** Preferred default city label when no markets are open yet. */
export const GUARDR_LAUNCH_CITY = 'Sacramento';

export function defaultCityMarketStatus(_name: string): CityMarketStatus {
  return 'closed';
}

export function buildDefaultPlatformCities(): PlatformCity[] {
  return CALIFORNIA_CITIES.map((name, index) => ({
    id: cityIdFromName(name),
    name,
    stateCode: 'CA',
    status: defaultCityMarketStatus(name),
    waitlistAudience: 'both' as const,
    recommendOpen: false,
    sortOrder: index,
  }));
}

/** Add canonical cities missing from a loaded platform_cities snapshot. */
export function mergeMissingPlatformCities(loaded: PlatformCity[]): PlatformCity[] {
  const merged = new Map(loaded.map((city) => [city.id, city]));
  for (const city of buildDefaultPlatformCities()) {
    if (!merged.has(city.id)) {
      merged.set(city.id, city);
    }
  }
  return [...merged.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function cityIdFromName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

export function setPlatformCitiesCache(cities: PlatformCity[]): void {
  cachedPlatformCities = cities.length > 0 ? [...cities].sort((a, b) => a.sortOrder - b.sortOrder) : null;
}

export function getPlatformCities(): PlatformCity[] {
  return cachedPlatformCities ?? buildDefaultPlatformCities();
}

export function findPlatformCity(name: string | undefined, cities = getPlatformCities()): PlatformCity | undefined {
  if (!name?.trim()) return undefined;
  const normalized = formatCityLabel(name).toLowerCase();
  return cities.find((city) => city.name.toLowerCase() === normalized);
}

export function waitlistAppliesToAudience(
  audience: CityWaitlistAudience,
  role: CityAccessAudience
): boolean {
  return audience === 'both' || audience === role;
}

export function checkCityAccessForRole(
  cityName: string | undefined,
  role: CityAccessAudience,
  cities = getPlatformCities()
): CityAccessResult {
  const city = findPlatformCity(cityName, cities);
  if (!city || city.status === 'open') {
    return { allowed: true };
  }
  if (city.status === 'closed') {
    return { allowed: false, reason: 'closed', message: CLOSED_MESSAGE };
  }
  if (waitlistAppliesToAudience(city.waitlistAudience, role)) {
    return { allowed: false, reason: 'waitlist', message: WAITLIST_MESSAGE };
  }
  return { allowed: true };
}

/** Cities guards may select for service areas (open, or waitlist only affecting clients). */
export function getSelectableCitiesForGuards(cities = getPlatformCities()): PlatformCity[] {
  return cities.filter((city) => {
    if (city.status === 'open') return true;
    if (city.status === 'waitlist' && !waitlistAppliesToAudience(city.waitlistAudience, 'guard')) {
      return true;
    }
    return false;
  });
}

/** Cities clients may pick when posting jobs (open, or waitlist only affecting guards). */
export function getSelectableCitiesForClients(cities = getPlatformCities()): PlatformCity[] {
  return cities.filter((city) => {
    if (city.status === 'open') return true;
    if (city.status === 'waitlist' && !waitlistAppliesToAudience(city.waitlistAudience, 'client')) {
      return true;
    }
    return false;
  });
}

export function getSelectableCityNamesForGuards(cities = getPlatformCities()): string[] {
  return getSelectableCitiesForGuards(cities).map((city) => city.name);
}

export function getSelectableCityNamesForClients(cities = getPlatformCities()): string[] {
  return getSelectableCitiesForClients(cities).map((city) => city.name);
}

/** Signup dropdowns show every configured city; selection triggers access messaging. */
export function getSignupCityNames(cities = getPlatformCities()): string[] {
  return cities.map((city) => city.name);
}

export function defaultSelectableCity(
  role: CityAccessAudience,
  cities = getPlatformCities()
): string {
  const selectable =
    role === 'guard' ? getSelectableCitiesForGuards(cities) : getSelectableCitiesForClients(cities);
  const preferred =
    selectable.find((city) => city.name === GUARDR_LAUNCH_CITY) ??
    selectable.find((city) => city.name === DEFAULT_CALIFORNIA_CITY);
  return preferred?.name ?? selectable[0]?.name ?? GUARDR_LAUNCH_CITY;
}

export function normalizeManagedCities(
  cities: string[] | undefined,
  available = getPlatformCities()
): string[] {
  if (!cities?.length) return [];
  const allowed = new Set(available.map((city) => city.name.toLowerCase()));
  const normalized = new Set<string>();
  for (const city of cities) {
    if (!isCaliforniaCity(city)) continue;
    const label = formatCityLabel(city);
    if (allowed.has(label.toLowerCase())) {
      normalized.add(label);
    }
  }
  return [...normalized].sort((a, b) => a.localeCompare(b));
}

export function staffCanManageCity(
  actorRole: PlatformRole,
  actorManagedCities: string[] | undefined,
  cityName: string
): boolean {
  if (actorRole === 'owner' || actorRole === 'director') return true;
  if (actorRole !== 'manager') return false;
  const managed = normalizeManagedCities(actorManagedCities);
  return managed.some((city) => city.toLowerCase() === formatCityLabel(cityName).toLowerCase());
}

export function filterCitiesForStaffActor(
  cities: PlatformCity[],
  actorRole: PlatformRole,
  actorManagedCities: string[] | undefined
): PlatformCity[] {
  if (actorRole === 'owner' || actorRole === 'director') return cities;
  if (actorRole !== 'manager') return [];
  const managed = new Set(normalizeManagedCities(actorManagedCities).map((city) => city.toLowerCase()));
  return cities.filter((city) => managed.has(city.name.toLowerCase()));
}

export function platformCityFromRow(row: Record<string, unknown>): PlatformCity {
  const status = row.status;
  const waitlistAudience = row.waitlist_audience;
  return {
    id: String(row.id),
    name: String(row.name),
    stateCode: String(row.state_code ?? 'CA'),
    status:
      status === 'closed' || status === 'waitlist' || status === 'open' ? status : 'open',
    waitlistAudience:
      waitlistAudience === 'guard' || waitlistAudience === 'client' || waitlistAudience === 'both'
        ? waitlistAudience
        : 'both',
    recommendOpen: row.recommend_open === true,
    sortOrder: typeof row.sort_order === 'number' ? row.sort_order : 0,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
    updatedBy: row.updated_by ? String(row.updated_by) : undefined,
  };
}

export function platformCityToDbRow(city: PlatformCity): Record<string, unknown> {
  return {
    id: city.id,
    name: city.name,
    state_code: city.stateCode,
    status: city.status,
    waitlist_audience: city.waitlistAudience,
    recommend_open: city.recommendOpen,
    sort_order: city.sortOrder,
    updated_at: city.updatedAt ?? new Date().toISOString(),
    updated_by: city.updatedBy ?? null,
  };
}

export const CITY_STATUS_LABELS: Record<CityMarketStatus, string> = {
  open: 'Open',
  closed: 'Closed',
  waitlist: 'Wait list',
};

export const CITY_STATUS_DESCRIPTIONS: Record<CityMarketStatus, string> = {
  open: 'Accepting applications and releasing accounts to staff.',
  closed: 'Not accepting new guard or client applications.',
  waitlist:
    'Accepting applications in the background but not releasing to staff until the market is fully active.',
};
