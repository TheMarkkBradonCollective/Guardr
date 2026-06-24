/** Major California cities and metros — Guardr operates statewide in CA. */
export const CALIFORNIA_CITIES = [
  'Anaheim',
  'Bakersfield',
  'Berkeley',
  'Burbank',
  'Carlsbad',
  'Chula Vista',
  'Concord',
  'Corona',
  'Costa Mesa',
  'Daly City',
  'Elk Grove',
  'Escondido',
  'Fontana',
  'Fremont',
  'Fresno',
  'Fullerton',
  'Garden Grove',
  'Glendale',
  'Hayward',
  'Huntington Beach',
  'Inglewood',
  'Irvine',
  'Lancaster',
  'Long Beach',
  'Los Angeles',
  'Modesto',
  'Moreno Valley',
  'Oakland',
  'Oceanside',
  'Ontario',
  'Orange',
  'Oxnard',
  'Palmdale',
  'Pasadena',
  'Pomona',
  'Rancho Cucamonga',
  'Rialto',
  'Richmond',
  'Riverside',
  'Roseville',
  'Sacramento',
  'Salinas',
  'San Bernardino',
  'San Diego',
  'San Francisco',
  'San Jose',
  'San Mateo',
  'Santa Ana',
  'Santa Clara',
  'Santa Clarita',
  'Santa Maria',
  'Santa Monica',
  'Santa Rosa',
  'Simi Valley',
  'Stockton',
  'Sunnyvale',
  'Thousand Oaks',
  'Torrance',
  'Vallejo',
  'Ventura',
  'Victorville',
  'Visalia',
] as const;

export type CaliforniaCity = (typeof CALIFORNIA_CITIES)[number];

export const DEFAULT_CALIFORNIA_CITY: CaliforniaCity = 'Los Angeles';

export function isCaliforniaCity(value: string): boolean {
  return CALIFORNIA_CITIES.some((c) => c.toLowerCase() === value.trim().toLowerCase());
}

export function formatCityLabel(city: string | undefined): string {
  if (!city?.trim()) return '';
  const match = CALIFORNIA_CITIES.find((c) => c.toLowerCase() === city.trim().toLowerCase());
  return match ?? city.trim();
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
    const found = CALIFORNIA_CITIES.find((c) => lower.includes(c.toLowerCase()));
    if (found) return found;
  }
  if (stateCode && isCaliforniaCity(stateCode)) {
    return formatCityLabel(stateCode) as CaliforniaCity;
  }
  return DEFAULT_CALIFORNIA_CITY;
}
