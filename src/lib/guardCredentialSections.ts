import { Certification, CertCategory, SecurityGuard } from '../types';
import {
  BSIS_REFRESHER_CATALOG_ID,
  CERT_CATEGORY_LABELS,
  getCertCatalogEntry,
  resolveCertCatalogId,
} from './certCatalog';
import { groupGuardCertsByCategory } from './certMatching';
import { getGuardLicenses } from './guardResume';
import { isPtaUofCatalogId, isThirtyTwoHourCatalogId } from './guardQualification';

export type CredentialViewSectionId =
  | 'guard-card'
  | 'bsis-pta-uof'
  | 'bsis-32-hour'
  | 'bsis-refresher'
  | 'bsis-other-training'
  | 'bsis-permit'
  | 'medical'
  | 'fema'
  | 'security-advanced'
  | 'industry';

export interface CredentialViewSection {
  id: CredentialViewSectionId;
  title: string;
  subtitle?: string;
  category: CertCategory;
  certs: Certification[];
}

const SECTION_ORDER: CredentialViewSectionId[] = [
  'guard-card',
  'bsis-pta-uof',
  'bsis-32-hour',
  'bsis-refresher',
  'bsis-other-training',
  'bsis-permit',
  'medical',
  'fema',
  'security-advanced',
  'industry',
];

/** Credential sections shown even when the guard has no uploads yet. */
export const ALWAYS_VISIBLE_CREDENTIAL_SECTIONS: CredentialViewSectionId[] = [
  'guard-card',
  'bsis-pta-uof',
  'bsis-32-hour',
];

const SECTION_META: Record<
  CredentialViewSectionId,
  Pick<CredentialViewSection, 'title' | 'subtitle' | 'category'>
> = {
  'guard-card': {
    title: CERT_CATEGORY_LABELS['guard-card'],
    subtitle: 'California BSIS guard registration — required to work field jobs.',
    category: 'guard-card',
  },
  'bsis-pta-uof': {
    title: 'Power to Arrest & Appropriate Use of Force',
    subtitle: 'Required to work — combined 8-hr cert or separate PTA & UOF uploads.',
    category: 'bsis-training',
  },
  'bsis-32-hour': {
    title: '32-Hour BSIS Training Block',
    subtitle: 'Mandatory course block or completion certificate.',
    category: 'bsis-training',
  },
  'bsis-refresher': {
    title: getCertCatalogEntry(BSIS_REFRESHER_CATALOG_ID)?.name ?? '8-Hour BSIS Refresher Course',
    subtitle: 'Upload when applicable for guard card renewals.',
    category: 'bsis-training',
  },
  'bsis-other-training': {
    title: 'Other BSIS Training',
    subtitle: 'Supplemental BSIS courses outside the core pathway.',
    category: 'bsis-training',
  },
  'bsis-permit': {
    title: 'BSIS Permits (Weapons)',
    subtitle: 'Firearm, baton, pepper spray — when applicable.',
    category: 'bsis-permit',
  },
  medical: {
    title: CERT_CATEGORY_LABELS.medical,
    subtitle: 'CPR, AED, First Aid, and emergency response.',
    category: 'medical',
  },
  fema: {
    title: CERT_CATEGORY_LABELS.fema,
    subtitle: 'ICS and homeland security awareness.',
    category: 'fema',
  },
  'security-advanced': {
    title: CERT_CATEGORY_LABELS['security-advanced'],
    subtitle: 'Executive protection, active shooter, de-escalation, and specialty training.',
    category: 'security-advanced',
  },
  industry: {
    title: CERT_CATEGORY_LABELS.industry,
    subtitle: 'OSHA, professional licenses, and other credentials.',
    category: 'industry',
  },
};

function filterCerts(certs: Certification[], excludeRejected: boolean): Certification[] {
  if (!excludeRejected) return certs;
  return certs.filter((cert) => cert.status !== 'rejected');
}

function resolveViewSectionId(cert: Certification): CredentialViewSectionId {
  const catalogId = resolveCertCatalogId(cert);
  if (!catalogId) return 'industry';

  const entry = getCertCatalogEntry(catalogId);
  const category = entry?.category ?? cert.category ?? 'industry';

  if (category === 'guard-card') return 'guard-card';
  if (isPtaUofCatalogId(catalogId)) return 'bsis-pta-uof';
  if (isThirtyTwoHourCatalogId(catalogId)) return 'bsis-32-hour';
  if (catalogId === BSIS_REFRESHER_CATALOG_ID) return 'bsis-refresher';
  if (category === 'bsis-training') return 'bsis-other-training';
  if (category === 'bsis-permit') return 'bsis-permit';
  if (category === 'medical') return 'medical';
  if (category === 'fema') return 'fema';
  if (category === 'security-advanced') return 'security-advanced';
  return 'industry';
}

/** Top-level category label derived from catalog (not stored field). */
export function resolveCertCategory(cert: Certification): CertCategory {
  const catalogId = resolveCertCatalogId(cert);
  if (catalogId) {
    return getCertCatalogEntry(catalogId)?.category ?? cert.category ?? 'industry';
  }
  return cert.category ?? 'industry';
}

/** Subsection label for cards, modals, and approval queues. */
export function certViewSectionLabel(cert: Certification): string {
  return SECTION_META[resolveViewSectionId(cert)].title;
}

export function certCategoryLabel(cert: Certification): string {
  return CERT_CATEGORY_LABELS[resolveCertCategory(cert)];
}

export function getGuardCredentialViewSections(
  guard: SecurityGuard,
  options?: { hideEmpty?: boolean; excludeRejected?: boolean }
): CredentialViewSection[] {
  const { hideEmpty = false, excludeRejected = true } = options ?? {};
  const grouped = groupGuardCertsByCategory(guard);
  const guardCards = filterCerts(getGuardLicenses(guard), excludeRejected);

  const bsisTraining = filterCerts(grouped['bsis-training'] ?? [], excludeRejected);
  const ptaUof = bsisTraining.filter((cert) => isPtaUofCatalogId(resolveCertCatalogId(cert)));
  const thirtyTwoHour = bsisTraining.filter((cert) => isThirtyTwoHourCatalogId(resolveCertCatalogId(cert)));
  const refresher = bsisTraining.filter((cert) => resolveCertCatalogId(cert) === BSIS_REFRESHER_CATALOG_ID);
  const otherBsis = bsisTraining.filter((cert) => {
    const id = resolveCertCatalogId(cert);
    return !isThirtyTwoHourCatalogId(id) && !isPtaUofCatalogId(id) && id !== BSIS_REFRESHER_CATALOG_ID;
  });

  const certsBySection: Record<CredentialViewSectionId, Certification[]> = {
    'guard-card': guardCards,
    'bsis-pta-uof': ptaUof,
    'bsis-32-hour': thirtyTwoHour,
    'bsis-refresher': refresher,
    'bsis-other-training': otherBsis,
    'bsis-permit': filterCerts(grouped['bsis-permit'] ?? [], excludeRejected),
    medical: filterCerts(grouped.medical ?? [], excludeRejected),
    fema: filterCerts(grouped.fema ?? [], excludeRejected),
    'security-advanced': filterCerts(grouped['security-advanced'] ?? [], excludeRejected),
    industry: filterCerts(grouped.industry ?? [], excludeRejected),
  };

  return SECTION_ORDER.map((id) => ({
    id,
    ...SECTION_META[id],
    certs: certsBySection[id],
  })).filter(
    (section) =>
      ALWAYS_VISIBLE_CREDENTIAL_SECTIONS.includes(section.id) ||
      !hideEmpty ||
      section.certs.length > 0
  );
}

/** Group pending approval rows by view section while keeping guard context. */
export function groupPendingCertsByViewSection(
  items: Array<{ guard: SecurityGuard; cert: Certification }>,
  options?: { hideEmpty?: boolean }
): Array<CredentialViewSection & { entries: Array<{ guard: SecurityGuard; cert: Certification }> }> {
  const buckets: Record<CredentialViewSectionId, Array<{ guard: SecurityGuard; cert: Certification }>> = {
    'guard-card': [],
    'bsis-pta-uof': [],
    'bsis-32-hour': [],
    'bsis-refresher': [],
    'bsis-other-training': [],
    'bsis-permit': [],
    medical: [],
    fema: [],
    'security-advanced': [],
    industry: [],
  };

  for (const entry of items) {
    buckets[resolveViewSectionId(entry.cert)].push(entry);
  }

  return SECTION_ORDER.map((id) => ({
    id,
    ...SECTION_META[id],
    certs: buckets[id].map((entry) => entry.cert),
    entries: buckets[id],
  })).filter((section) => !options?.hideEmpty || section.entries.length > 0);
}

/** Group a flat cert list by view section (e.g. staff approval queue). */
export function groupCertsByViewSection(
  certs: Certification[],
  options?: { hideEmpty?: boolean }
): CredentialViewSection[] {
  const buckets: Record<CredentialViewSectionId, Certification[]> = {
    'guard-card': [],
    'bsis-pta-uof': [],
    'bsis-32-hour': [],
    'bsis-refresher': [],
    'bsis-other-training': [],
    'bsis-permit': [],
    medical: [],
    fema: [],
    'security-advanced': [],
    industry: [],
  };

  for (const cert of certs) {
    buckets[resolveViewSectionId(cert)].push(cert);
  }

  return SECTION_ORDER.map((id) => ({
    id,
    ...SECTION_META[id],
    certs: buckets[id],
  })).filter((section) => !options?.hideEmpty || section.certs.length > 0);
}
