import { CertCategory } from '../types';
import {
  BSIS_REFRESHER_CATALOG_ID,
  getCertCatalogEntry,
  getCertsByCategory,
} from './certCatalog';
import type { CredentialViewSectionId } from './guardCredentialSections';
import {
  getMandatoryCourseCatalogEntries,
  getPtaUofCatalogEntries,
  isMandatoryCourseCatalogId,
  isPtaUofCatalogId,
} from './guardQualification';

export function catalogOptionsForStaffAddSection(section: CredentialViewSectionId) {
  if (section === 'guard-card') {
    return getCertsByCategory('guard-card');
  }
  if (section === 'bsis-pta-uof') {
    return getPtaUofCatalogEntries();
  }
  if (section === 'bsis-32-hour') {
    return getMandatoryCourseCatalogEntries();
  }
  if (section === 'bsis-refresher') {
    const entry = getCertCatalogEntry(BSIS_REFRESHER_CATALOG_ID);
    return entry ? [entry] : [];
  }
  if (section === 'bsis-other-training') {
    return getCertsByCategory('bsis-training').filter(
      (opt) =>
        !isMandatoryCourseCatalogId(opt.id) &&
        !isPtaUofCatalogId(opt.id) &&
        opt.id !== BSIS_REFRESHER_CATALOG_ID &&
        opt.id !== 'bsis-32-hour-completed' &&
        opt.id !== 'bsis-40-hour-completed'
    );
  }
  return getCertsByCategory(section as CertCategory);
}

export function staffAddSectionShowsCatalogPicker(section: CredentialViewSectionId | null): boolean {
  if (!section) return false;
  if (section === 'bsis-other-training') return true;
  if (section === 'bsis-refresher') return false;
  if (section === 'guard-card') return false;
  if (section === 'bsis-pta-uof' || section === 'bsis-32-hour') return true;
  const options = catalogOptionsForStaffAddSection(section);
  return options.length > 1;
}
