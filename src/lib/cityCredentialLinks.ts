import { getCertCatalogEntry } from './certCatalog';
import {
  BSIS_PTA_UOF_COMBINED_ID,
  LEGACY_PTA_ID,
  LEGACY_UOF_ID,
  THIRTY_TWO_HOUR_COURSE_IDS,
} from './guardQualification';
import {
  findPlatformCity,
  getPlatformCities,
  GUARDR_LAUNCH_CITY,
  type PlatformCity,
} from './platformCities';
import type { SecurityGuard } from '../types';

/** Top-level activation checklist keys on marketplace eligibility. */
export type CredentialActivationLinkKey =
  | 'govId'
  | 'coi'
  | 'guardCard'
  | 'ptaUof'
  | 'continuedEducation';

/** Catalog IDs for individual or group training certificates. */
export type CredentialCatalogLinkKey =
  | typeof BSIS_PTA_UOF_COMBINED_ID
  | typeof LEGACY_PTA_ID
  | typeof LEGACY_UOF_ID
  | (typeof THIRTY_TWO_HOUR_COURSE_IDS)[number];

export type CredentialLinkKey = CredentialActivationLinkKey | CredentialCatalogLinkKey;

export interface CredentialResourceLink {
  url: string;
  label?: string;
  /** Optional price hint, e.g. "$49" or "$120 online". */
  price?: string;
}

export type CityCredentialResourceLinks = Partial<Record<CredentialLinkKey, CredentialResourceLink[]>>;

export interface ResolvedCredentialLink extends CredentialResourceLink {
  source: 'city' | 'platform';
}

export const CREDENTIAL_ACTIVATION_LINK_KEYS: CredentialActivationLinkKey[] = [
  'govId',
  'coi',
  'guardCard',
  'ptaUof',
  'continuedEducation',
];

export const CREDENTIAL_CATALOG_LINK_KEYS: CredentialCatalogLinkKey[] = [
  BSIS_PTA_UOF_COMBINED_ID,
  LEGACY_PTA_ID,
  LEGACY_UOF_ID,
  ...THIRTY_TWO_HOUR_COURSE_IDS,
];

export const CREDENTIAL_LINK_KEYS: CredentialLinkKey[] = [
  ...CREDENTIAL_ACTIVATION_LINK_KEYS,
  ...CREDENTIAL_CATALOG_LINK_KEYS,
];

export const CREDENTIAL_LINK_FIELD_LABELS: Record<CredentialActivationLinkKey, string> = {
  govId: 'Government ID',
  coi: 'Certificate of Insurance (COI)',
  guardCard: 'BSIS Guard Card',
  ptaUof: 'Mandatory training (PTA / UOF)',
  continuedEducation: 'Continued Education (32-hour CE package)',
};

const PTA_UOF_RESOLVE_KEYS: CredentialLinkKey[] = [
  'ptaUof',
  BSIS_PTA_UOF_COMBINED_ID,
  LEGACY_PTA_ID,
  LEGACY_UOF_ID,
];

const CONTINUED_EDUCATION_RESOLVE_KEYS: CredentialLinkKey[] = [
  'continuedEducation',
  ...THIRTY_TWO_HOUR_COURSE_IDS,
];

export const ACTIVATION_STEP_LINK_KEYS: Record<CredentialActivationLinkKey, CredentialLinkKey[]> = {
  govId: ['govId'],
  coi: ['coi'],
  guardCard: ['guardCard'],
  ptaUof: PTA_UOF_RESOLVE_KEYS,
  continuedEducation: CONTINUED_EDUCATION_RESOLVE_KEYS,
};

function catalogLinkLabel(catalogId: CredentialCatalogLinkKey): string {
  const entry = getCertCatalogEntry(catalogId);
  return entry?.name ?? catalogId;
}

export function credentialCatalogLinkLabel(key: CredentialCatalogLinkKey): string {
  return catalogLinkLabel(key);
}

/** Platform-wide fallback links when a city has no override. */
export const PLATFORM_DEFAULT_CREDENTIAL_LINKS: CityCredentialResourceLinks = {
  govId: [
    {
      url: 'https://www.dmv.ca.gov/portal/driver-licenses-identification-cards/',
      label: 'California driver license or ID card — DMV',
    },
  ],
  coi: [
    {
      url: 'https://www.bsis.ca.gov/industries/security_guards.shtml',
      label: 'BSIS security guard requirements — insurance info',
    },
  ],
  guardCard: [
    {
      url: 'https://www.bsis.ca.gov/industries/guard_card.shtml',
      label: 'Apply for a BSIS guard card',
    },
  ],
  ptaUof: [
    {
      url: 'https://www.guardcardcourses.com/sc101.asp',
      label: 'Guard Card Courses — 8-hour PTA/UOF (group cert)',
      price: '$49',
    },
  ],
  [BSIS_PTA_UOF_COMBINED_ID]: [
    {
      url: 'https://www.guardcardcourses.com/sc101.asp',
      label: 'Guard Card Courses — combined 8-hour PTA/UOF certificate',
      price: '$49',
    },
  ],
  continuedEducation: [
    {
      url: 'https://www.guardcardcourses.com/pk102.asp',
      label: 'Guard Card Courses — 32-hour CE package (group)',
      price: '$65',
    },
  ],
};

const URL_PATTERN = /^https?:\/\/.+/i;

export function isKnownCredentialLinkKey(key: string): key is CredentialLinkKey {
  return (CREDENTIAL_LINK_KEYS as string[]).includes(key);
}

export function isValidCredentialResourceUrl(url: string): boolean {
  const trimmed = url.trim();
  return trimmed.length > 0 && URL_PATTERN.test(trimmed);
}

export function normalizeCredentialResourceUrl(url: string): string {
  return url.trim();
}

function parseLinkEntry(entry: unknown): CredentialResourceLink | null {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
  const url =
    typeof (entry as { url?: unknown }).url === 'string'
      ? normalizeCredentialResourceUrl((entry as { url: string }).url)
      : '';
  if (!isValidCredentialResourceUrl(url)) return null;
  const label =
    typeof (entry as { label?: unknown }).label === 'string'
      ? (entry as { label: string }).label.trim()
      : undefined;
  const price =
    typeof (entry as { price?: unknown }).price === 'string'
      ? (entry as { price: string }).price.trim()
      : undefined;
  return {
    url,
    ...(label ? { label } : {}),
    ...(price ? { price } : {}),
  };
}

function parseLinkList(value: unknown): CredentialResourceLink[] {
  if (Array.isArray(value)) {
    return value.map(parseLinkEntry).filter((entry): entry is CredentialResourceLink => entry !== null);
  }
  const single = parseLinkEntry(value);
  return single ? [single] : [];
}

export function parseCredentialResourceLinks(
  value: unknown
): CityCredentialResourceLinks | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const parsed: CityCredentialResourceLinks = {};
  const raw = value as Record<string, unknown>;
  for (const key of Object.keys(raw)) {
    if (!isKnownCredentialLinkKey(key)) continue;
    const entries = parseLinkList(raw[key]);
    if (entries.length > 0) parsed[key] = entries;
  }
  return Object.keys(parsed).length > 0 ? parsed : undefined;
}

export function serializeCredentialResourceLinks(
  links: CityCredentialResourceLinks | undefined
): Record<string, unknown> {
  if (!links) return {};
  const out: Record<string, unknown> = {};
  for (const key of CREDENTIAL_LINK_KEYS) {
    const entries = links[key];
    if (!entries?.length) continue;
    const serialized = entries
      .filter((entry) => entry.url && isValidCredentialResourceUrl(entry.url))
      .map((entry) => ({
        url: normalizeCredentialResourceUrl(entry.url),
        ...(entry.label?.trim() ? { label: entry.label.trim() } : {}),
        ...(entry.price?.trim() ? { price: entry.price.trim() } : {}),
      }));
    if (serialized.length > 0) out[key] = serialized;
  }
  return out;
}

export function credentialLinksAreEqual(
  a: CityCredentialResourceLinks | undefined,
  b: CityCredentialResourceLinks | undefined
): boolean {
  return JSON.stringify(serializeCredentialResourceLinks(a)) ===
    JSON.stringify(serializeCredentialResourceLinks(b));
}

export function formatCredentialLinkDisplay(link: CredentialResourceLink): string {
  const label = link.label?.trim() || 'Resource';
  if (link.price?.trim()) return `${label} — ${link.price.trim()}`;
  return label;
}

function defaultLinkLabel(key: CredentialLinkKey, source: 'city' | 'platform'): string {
  if (isKnownCredentialLinkKey(key) && (CREDENTIAL_ACTIVATION_LINK_KEYS as string[]).includes(key)) {
    const base = CREDENTIAL_LINK_FIELD_LABELS[key as CredentialActivationLinkKey];
    return source === 'city' ? `${base} — local resource` : `${base} — Guardr resource`;
  }
  const catalogLabel = catalogLinkLabel(key as CredentialCatalogLinkKey);
  return source === 'city' ? `${catalogLabel} — local resource` : `${catalogLabel} — Guardr resource`;
}

export function resolveCredentialLinksForKey(
  key: CredentialLinkKey,
  city?: PlatformCity
): ResolvedCredentialLink[] {
  const resolved: ResolvedCredentialLink[] = [];
  const seen = new Set<string>();

  const cityLinks = city?.credentialResourceLinks?.[key] ?? [];
  for (const cityLink of cityLinks) {
    if (!cityLink?.url || !isValidCredentialResourceUrl(cityLink.url)) continue;
    const url = normalizeCredentialResourceUrl(cityLink.url);
    if (seen.has(url)) continue;
    seen.add(url);
    resolved.push({
      url,
      label: cityLink.label?.trim() || defaultLinkLabel(key, 'city'),
      price: cityLink.price?.trim() || undefined,
      source: 'city',
    });
  }

  const platformLinks = PLATFORM_DEFAULT_CREDENTIAL_LINKS[key] ?? [];
  for (const platformLink of platformLinks) {
    if (!platformLink?.url || !isValidCredentialResourceUrl(platformLink.url)) continue;
    const url = normalizeCredentialResourceUrl(platformLink.url);
    if (seen.has(url)) continue;
    seen.add(url);
    resolved.push({
      url,
      label: platformLink.label?.trim() || defaultLinkLabel(key, 'platform'),
      price: platformLink.price?.trim() || undefined,
      source: 'platform',
    });
  }

  return resolved;
}

/** Merge city + platform links for an activation step (includes group + individual catalog keys). */
export function resolveCredentialLinksForActivationStep(
  step: CredentialActivationLinkKey,
  city?: PlatformCity
): ResolvedCredentialLink[] {
  const keys = ACTIVATION_STEP_LINK_KEYS[step];
  const resolved: ResolvedCredentialLink[] = [];
  const seen = new Set<string>();
  for (const key of keys) {
    for (const link of resolveCredentialLinksForKey(key, city)) {
      const dedupeKey = `${link.url}::${link.label ?? ''}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      resolved.push(link);
    }
  }
  return resolved;
}

export function resolveCredentialLinksForCity(
  cityName: string | undefined,
  cities = getPlatformCities()
): Record<CredentialActivationLinkKey, ResolvedCredentialLink[]> {
  const city = findPlatformCity(cityName, cities);
  const result = {} as Record<CredentialActivationLinkKey, ResolvedCredentialLink[]>;
  for (const step of CREDENTIAL_ACTIVATION_LINK_KEYS) {
    result[step] = resolveCredentialLinksForActivationStep(step, city);
  }
  return result;
}

/** Primary service area, then launch city, then first open market. */
export function resolveGuardCredentialCityName(
  guard: Pick<SecurityGuard, 'serviceAreas'>,
  cities = getPlatformCities()
): string | undefined {
  const primary = guard.serviceAreas?.[0]?.trim();
  if (primary && findPlatformCity(primary, cities)) return findPlatformCity(primary, cities)!.name;

  const launch = findPlatformCity(GUARDR_LAUNCH_CITY, cities);
  if (launch) return launch.name;

  const open = cities.find((city) => city.status === 'open');
  return open?.name;
}

export function resolveCredentialLinksForGuard(
  guard: Pick<SecurityGuard, 'serviceAreas'>,
  cities = getPlatformCities()
): Record<CredentialActivationLinkKey, ResolvedCredentialLink[]> {
  const cityName = resolveGuardCredentialCityName(guard, cities);
  return resolveCredentialLinksForCity(cityName, cities);
}

export function credentialLinksForCityLabel(cityName: string | undefined): string | null {
  if (!cityName?.trim()) return null;
  return cityName.trim();
}
