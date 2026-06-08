import { Certification, SecurityGuard } from '../types';
import {
  CA_REQUIRED_LISTING_IDS,
  getCertCatalogEntry,
  resolveCertCatalogId,
} from './certCatalog';
import { guardCanWorkInState } from './guardLicenses';

export function guardHasVerifiedCert(
  guard: SecurityGuard,
  catalogId: string,
  jobState?: string
): boolean {
  if (catalogId === 'bsis-guard-card') {
    return guardCanWorkInState(guard, jobState ?? 'CA', false);
  }
  if (catalogId === 'bsis-exposed-firearm') {
    return guard.certifications.some((c) => {
      if (c.status !== 'verified') return false;
      const id = resolveCertCatalogId(c);
      return id === 'bsis-exposed-firearm' || (/firearm|armed/i.test(c.name) && /permit|bsis/i.test(c.name));
    });
  }

  return guard.certifications.some((c) => {
    if (c.status !== 'verified') return false;
    const id = resolveCertCatalogId(c);
    if (id === catalogId) return true;
    const entry = getCertCatalogEntry(catalogId);
    if (!entry) return false;
    return c.name.toLowerCase().includes(entry.name.toLowerCase().slice(0, 12));
  });
}

export function guardMeetsCaListingBaseline(guard: SecurityGuard, state = 'CA'): boolean {
  if (!guardCanWorkInState(guard, state, false)) return false;
  return CA_REQUIRED_LISTING_IDS.filter((id) => id !== 'bsis-guard-card').every((id) =>
    guardHasVerifiedCert(guard, id, state)
  );
}

export function guardMeetsJobCertRequirements(
  guard: SecurityGuard,
  requiredCatalogIds: string[],
  jobState?: string,
  armedRequired = false
): { met: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!guardCanWorkInState(guard, jobState ?? '', armedRequired)) {
    missing.push('bsis-guard-card');
  }

  if (armedRequired && !guardHasVerifiedCert(guard, 'bsis-exposed-firearm', jobState)) {
    missing.push('bsis-exposed-firearm');
  }

  for (const id of requiredCatalogIds) {
    if (id === 'bsis-guard-card') continue;
    if (armedRequired && id === 'bsis-exposed-firearm') continue;
    if (!guardHasVerifiedCert(guard, id, jobState)) {
      missing.push(id);
    }
  }

  return { met: missing.length === 0, missing };
}

export function groupGuardCertsByCategory(guard: SecurityGuard): Record<string, Certification[]> {
  const groups: Record<string, Certification[]> = {};
  for (const cert of guard.certifications) {
    const catalogId = resolveCertCatalogId(cert);
    const category = catalogId
      ? (getCertCatalogEntry(catalogId)?.category ?? 'industry')
      : 'industry';
    if (!groups[category]) groups[category] = [];
    groups[category].push(cert);
  }
  return groups;
}

export function getVerifiedProfileBadges(guard: SecurityGuard): { catalogId: string; shortLabel: string }[] {
  const seen = new Set<string>();
  const badges: { catalogId: string; shortLabel: string }[] = [];

  for (const cert of guard.certifications) {
    if (cert.status !== 'verified') continue;
    const catalogId = resolveCertCatalogId(cert);
    if (!catalogId || catalogId === 'bsis-guard-card' || seen.has(catalogId)) continue;
    const entry = getCertCatalogEntry(catalogId);
    if (!entry) continue;
    seen.add(catalogId);
    badges.push({ catalogId, shortLabel: entry.shortLabel });
  }

  return badges;
}
