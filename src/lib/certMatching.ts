import { Certification, SecurityGuard } from '../types';
import {
  CA_REQUIRED_LISTING_IDS,
  getCertCatalogEntry,
  resolveCertCatalogId,
} from './certCatalog';
import { guardCanWorkInState } from './guardLicenses';
import {
  guardHasCredentialOnFile,
  guardMeetsLevel2Training,
  isRequiredPathwayCredential,
} from './guardQualification';

export function guardHasVerifiedCert(
  guard: SecurityGuard,
  catalogId: string,
  jobState?: string
): boolean {
  return guardHasCredentialOnFile(guard, catalogId, jobState);
}

/** Guardr staff confirmed this credential document is authentic */
export function guardHasStaffVerifiedCert(
  guard: SecurityGuard,
  catalogId: string,
  jobState?: string
): boolean {
  if (catalogId === 'bsis-guard-card') {
    return guard.certifications.some((c) => {
      if (c.status !== 'verified' || !isGuardCardOnFile(c)) return false;
      if (jobState) return c.state?.toUpperCase() === jobState.toUpperCase();
      return true;
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

function isGuardCardOnFile(cert: Certification): boolean {
  const id = resolveCertCatalogId(cert);
  return id === 'bsis-guard-card' || /guard card|bsis guard/i.test(cert.name);
}

export function guardMeetsCaListingBaseline(guard: SecurityGuard, state = 'CA'): boolean {
  if (!guardCanWorkInState(guard, state, false)) return false;
  return guardMeetsLevel2Training(guard);
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

export interface SupplementalCredentialBadge {
  id: string;
  catalogId?: string;
  label: string;
  verified: boolean;
}

/** Optional credentials beyond the Inactive→Active pathway — permits, medical, extra training, custom uploads. */
export function getSupplementalCredentialsOnFile(guard: SecurityGuard): SupplementalCredentialBadge[] {
  const seenCatalog = new Set<string>();
  const badges: SupplementalCredentialBadge[] = [];

  for (const cert of guard.certifications) {
    if (cert.status === 'rejected') continue;
    const catalogId = resolveCertCatalogId(cert);
    if (isRequiredPathwayCredential(catalogId)) continue;

    if (!catalogId || catalogId === 'other-credential') {
      badges.push({
        id: cert.id,
        catalogId,
        label: cert.name,
        verified: cert.status === 'verified',
      });
      continue;
    }

    if (seenCatalog.has(catalogId)) continue;
    seenCatalog.add(catalogId);
    const entry = getCertCatalogEntry(catalogId);
    badges.push({
      id: cert.id,
      catalogId,
      label: entry?.shortLabel ?? cert.name,
      verified: cert.status === 'verified',
    });
  }

  return badges;
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
