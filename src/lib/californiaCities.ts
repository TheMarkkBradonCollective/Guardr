import { CALIFORNIA_INCORPORATED_CITIES } from './californiaIncorporatedCities';

/** All incorporated California municipalities — Guardr operates statewide in CA. */
export const GUARDR_HOME_LICENSE_STATE = 'CA';

/** @deprecated Alias — full list of incorporated CA cities and towns */
export const CALIFORNIA_CITIES = CALIFORNIA_INCORPORATED_CITIES;

export type CaliforniaCity = (typeof CALIFORNIA_CITIES)[number];

export const DEFAULT_CALIFORNIA_CITY: CaliforniaCity = 'Los Angeles';

const CALIFORNIA_CITY_LOOKUP = new Map(
  CALIFORNIA_CITIES.map((city) => [city.toLowerCase(), city] as const)
);

/** Longest names first so geocode matching prefers "South San Francisco" over "San Francisco". */
const CALIFORNIA_CITIES_BY_LENGTH_DESC = [...CALIFORNIA_CITIES].sort(
  (a, b) => b.length - a.length
);

export function isCaliforniaCity(value: string): boolean {
  return CALIFORNIA_CITY_LOOKUP.has(value.trim().toLowerCase());
}

export function formatCityLabel(city: string | undefined): string {
  if (!city?.trim()) return '';
  return CALIFORNIA_CITY_LOOKUP.get(city.trim().toLowerCase()) ?? city.trim();
}

/**
 * Job `state` stores the work city (e.g. Los Angeles).
 * BSIS guard cards and government IDs are state-issued — map job location to CA.
 */
export function resolveGuardCardLicenseState(jobCityOrState?: string): string {
  const raw = jobCityOrState?.trim();
  if (!raw) return GUARDR_HOME_LICENSE_STATE;
  const upper = raw.toUpperCase();
  if (upper === 'CA' || upper === 'CALIFORNIA') return GUARDR_HOME_LICENSE_STATE;
  if (isCaliforniaCity(raw)) return GUARDR_HOME_LICENSE_STATE;
  return GUARDR_HOME_LICENSE_STATE;
}

/** @alias resolveGuardCardLicenseState — license jurisdiction for a job site */
export const resolveJobLicenseState = resolveGuardCardLicenseState;

/**
 * Compare stored credential / ID state against required license jurisdiction.
 * Handles legacy rows where a California city was stored instead of `CA`.
 */
export function licenseStatesMatch(
  storedState: string | undefined,
  requiredLicenseState: string
): boolean {
  const stored = storedState?.trim();
  if (!stored) return false;
  const required = requiredLicenseState.trim().toUpperCase();
  if (stored.toUpperCase() === required) return true;
  if (required === GUARDR_HOME_LICENSE_STATE && isCaliforniaCity(stored)) return true;
  return false;
}

/** Normalize stored job location — legacy 2-letter state codes map to default city. */
export function resolveJobCity(value: string | undefined): CaliforniaCity {
  if (value && isCaliforniaCity(value)) {
    return formatCityLabel(value) as CaliforniaCity;
  }
  return DEFAULT_CALIFORNIA_CITY;
}

/** Pick a California city from geocode results (address line preferred). */
export function cityFromGeocode(addressLine?: string, stateCode?: string): CaliforniaCity {
  if (addressLine) {
    const lower = addressLine.toLowerCase();
    const found = CALIFORNIA_CITIES_BY_LENGTH_DESC.find((city) =>
      lower.includes(city.toLowerCase())
    );
    if (found) return found;
  }
  if (stateCode && isCaliforniaCity(stateCode)) {
    return formatCityLabel(stateCode) as CaliforniaCity;
  }
  return DEFAULT_CALIFORNIA_CITY;
}

/** Legacy guard service area before city-based selection (statewide California). */
export function isStatewideServiceAreaMarker(value: string): boolean {
  const upper = value.trim().toUpperCase();
  return upper === 'CA' || upper === 'CALIFORNIA';
}

/** Canonical California cities for guard service areas — drops legacy state codes. */
export function normalizeGuardServiceAreas(areas: string[] | undefined): string[] {
  if (!areas?.length) return [];
  const cities = new Set<string>();
  for (const area of areas) {
    if (isStatewideServiceAreaMarker(area)) continue;
    if (isCaliforniaCity(area)) {
      cities.add(formatCityLabel(area));
    }
  }
  return [...cities].sort((a, b) => a.localeCompare(b));
}

export function formatServiceAreaLabel(area: string): string {
  if (isStatewideServiceAreaMarker(area)) return 'California';
  if (isCaliforniaCity(area)) return formatCityLabel(area);
  return area.trim();
}

/** Whether a guard advertises availability for a job's work city. */
export function guardServesJobCity(
  serviceAreas: string[] | undefined,
  jobCity: string | undefined
): boolean {
  if (!serviceAreas?.length) return true;
  if (serviceAreas.some(isStatewideServiceAreaMarker)) return true;
  const city = jobCity?.trim();
  if (!city) return true;
  const normalized = formatCityLabel(city).toLowerCase();
  return serviceAreas.some((area) => formatCityLabel(area).toLowerCase() === normalized);
}
