/** Independent Contractor Number (ICN) — guard identity, not a "badge". */

export const GUARD_ICN_PREFIX = 'ICN';

/** Full label for forms and staff detail fields. */
export const GUARD_ICN_LABEL = 'Independent Contractor Number';

/** Compact label for metric tiles and table chrome. */
export const GUARD_ICN_SHORT_LABEL = 'ICN';

const LEGACY_GUARD_BADGE_PREFIX = 'GR';

/** Assign a new ICN for signup / staff-created guards (e.g. ICN-12161). */
export function generateGuardIndependentContractorNumber(): string {
  return `${GUARD_ICN_PREFIX}-${Math.floor(10000 + Math.random() * 90000)}`;
}

/**
 * Normalize stored/entered guard IDs to ICN-#####.
 * Maps legacy GR-##### values; leaves staff IDs and other formats alone.
 */
export function normalizeGuardIndependentContractorNumber(value: string | undefined | null): string {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return '';
  const upper = trimmed.toUpperCase();
  const legacy = upper.match(new RegExp(`^${LEGACY_GUARD_BADGE_PREFIX}-(\\d+)$`));
  if (legacy) return `${GUARD_ICN_PREFIX}-${legacy[1]}`;
  const icn = upper.match(new RegExp(`^${GUARD_ICN_PREFIX}-(\\d+)$`));
  if (icn) return `${GUARD_ICN_PREFIX}-${icn[1]}`;
  return trimmed;
}
