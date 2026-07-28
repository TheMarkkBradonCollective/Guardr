import type { Certification, CertCategory, SecurityGuard } from '../types';
import {
  BSIS_REFRESHER_CATALOG_ID,
  type CertCatalogEntry,
  getCertCatalogEntry,
  getCertsByCategory,
} from './certCatalog';
import { certsForCatalogId } from './certResubmit';
import { getCourseUploadStatus, type CourseUploadStatus } from './certStatus';
import type { CredentialViewSectionId } from './guardCredentialSections';
import {
  getPtaUofCatalogEntries,
  getThirtyTwoHourCourseCatalogEntries,
  isCombinedPtaUofCatalogId,
  isContinuingEducationCatalogId,
  isPtaUofCatalogId,
} from './guardQualification';

export interface CredentialCatalogSlot {
  catalogId: string;
  entry: CertCatalogEntry;
  certs: Certification[];
  uploadStatus: CourseUploadStatus;
}

/** Catalog entries for every credential section — full self-service listing. */
export function catalogOptionsForCredentialSection(section: CredentialViewSectionId): CertCatalogEntry[] {
  if (section === 'guard-card') {
    return getCertsByCategory('guard-card');
  }
  if (section === 'bsis-pta-uof') {
    return getPtaUofCatalogEntries();
  }
  if (section === 'bsis-32-hour') {
    return getThirtyTwoHourCourseCatalogEntries();
  }
  if (section === 'bsis-refresher') {
    const entry = getCertCatalogEntry(BSIS_REFRESHER_CATALOG_ID);
    return entry ? [entry] : [];
  }
  if (section === 'bsis-other-training') {
    return getCertsByCategory('bsis-training').filter(
      (opt) =>
        !isContinuingEducationCatalogId(opt.id) &&
        !isPtaUofCatalogId(opt.id) &&
        !isCombinedPtaUofCatalogId(opt.id) &&
        opt.id !== BSIS_REFRESHER_CATALOG_ID &&
        opt.id !== 'bsis-32-hour-completed' &&
        opt.id !== 'bsis-40-hour-completed'
    );
  }
  if (section === 'coi') {
    return [];
  }
  return getCertsByCategory(section as CertCategory);
}

export function catalogIdsForCredentialSection(section: CredentialViewSectionId): string[] {
  return catalogOptionsForCredentialSection(section).map((entry) => entry.id);
}

/** Whether a credentials panel section should render (search filters empty sections). */
export function shouldShowCredentialSectionInPanel(
  _sectionId: CredentialViewSectionId,
  options: {
    searchActive: boolean;
    matchingSlotCount: number;
    showFullCatalog?: boolean;
    hasEmbeddedGear?: boolean;
  }
): boolean {
  const { searchActive, matchingSlotCount, showFullCatalog = true, hasEmbeddedGear = false } = options;
  if (searchActive) return matchingSlotCount > 0 || hasEmbeddedGear;
  if (showFullCatalog) return true;
  return matchingSlotCount > 0 || hasEmbeddedGear;
}

export function catalogEntryMatchesSearch(entry: CertCatalogEntry, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return (
    entry.name.toLowerCase().includes(normalized) ||
    (entry.description ?? '').toLowerCase().includes(normalized)
  );
}

export function buildCredentialCatalogSlots(
  guard: SecurityGuard,
  catalogIds: string[],
  options?: {
    search?: string;
    verifiedOnly?: boolean;
    excludeRejected?: boolean;
  }
): CredentialCatalogSlot[] {
  const { search = '', verifiedOnly = false, excludeRejected = true } = options ?? {};

  return catalogIds
    .map((catalogId) => {
      const entry = getCertCatalogEntry(catalogId);
      if (!entry) return null;

      let certs = certsForCatalogId(guard, catalogId);
      if (excludeRejected) {
        certs = certs.filter((cert) => cert.status !== 'rejected');
      }
      if (verifiedOnly) {
        certs = certs.filter((cert) => cert.status === 'verified');
      }

      const matchesSearch =
        catalogEntryMatchesSearch(entry, search) ||
        certs.some((cert) => {
          const normalized = search.trim().toLowerCase();
          if (!normalized) return true;
          return (
            cert.name.toLowerCase().includes(normalized) ||
            (cert.issuer ?? '').toLowerCase().includes(normalized) ||
            (cert.number ?? '').toLowerCase().includes(normalized)
          );
        });

      if (!matchesSearch) return null;

      return {
        catalogId,
        entry,
        certs,
        uploadStatus: getCourseUploadStatus(guard, catalogId),
      };
    })
    .filter((slot): slot is CredentialCatalogSlot => slot !== null);
}
