import type { CredentialViewSectionId } from './guardCredentialSections';
import { catalogOptionsForCredentialSection } from './guardCredentialCatalog';

export function catalogOptionsForStaffAddSection(section: CredentialViewSectionId) {
  return catalogOptionsForCredentialSection(section);
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
