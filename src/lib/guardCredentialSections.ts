import { Certification, CertCategory, SecurityGuard } from '../types';
import {
  BSIS_REFRESHER_CATALOG_ID,
  CERT_CATEGORY_LABELS,
  getCertCatalogEntry,
  resolveCertCatalogId,
} from './certCatalog';
import { groupGuardCertsByCategory } from './certMatching';
import { getGuardLicenses } from './guardResume';
import { isContinuingEducationCatalogId, isPtaUofCatalogId } from './guardQualification';

export type CredentialViewSectionId =
  | 'guard-card'
  | 'coi'
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
  'coi',
  'bsis-pta-uof',
  'bsis-32-hour',
  'bsis-refresher',
  'bsis-permit',
  'bsis-other-training',
  'medical',
  'fema',
  'security-advanced',
  'industry',
];

/** Credential sections shown even when the guard has no uploads yet. */
export const ALWAYS_VISIBLE_CREDENTIAL_SECTIONS: CredentialViewSectionId[] = [
  'guard-card',
  'coi',
  'bsis-pta-uof',
  'bsis-32-hour',
  'bsis-refresher',
  'bsis-permit',
  'bsis-other-training',
  'medical',
  'fema',
  'security-advanced',
  'industry',
];

/** Canonical credentials tab section order. */
export const CREDENTIAL_SECTION_ORDER: CredentialViewSectionId[] = SECTION_ORDER;

/** Catalog-driven sections rendered via CredentialCatalogSlotList. */
export const CATALOG_CREDENTIAL_SECTION_IDS: CredentialViewSectionId[] = [
  'bsis-refresher',
  'bsis-other-training',
  'medical',
  'fema',
  'security-advanced',
  'industry',
];

export const CATALOG_SECTIONS_BEFORE_WEAPONS: CredentialViewSectionId[] = [
  'bsis-refresher',
];

export const CATALOG_SECTIONS_AFTER_WEAPONS: CredentialViewSectionId[] = [
  'bsis-other-training',
  'medical',
  'fema',
  'security-advanced',
  'industry',
];

export function getCredentialSectionMeta(
  sectionId: CredentialViewSectionId
): Pick<CredentialViewSection, 'title' | 'subtitle' | 'category'> {
  return SECTION_META[sectionId];
}

/** Optional credentials guards may add during activation or from profile. */
export const OPTIONAL_CREDENTIAL_SECTION_IDS: CredentialViewSectionId[] = [
  'bsis-refresher',
  'bsis-other-training',
  'bsis-permit',
  'medical',
  'fema',
  'security-advanced',
  'industry',
];

/** Credential sections staff can add from the Credentials queue wizard. */
export const STAFF_ADD_CREDENTIAL_SECTION_IDS: CredentialViewSectionId[] = [
  'guard-card',
  'bsis-pta-uof',
  'bsis-32-hour',
  ...OPTIONAL_CREDENTIAL_SECTION_IDS,
];

export function getStaffAddableCredentialSections(): CredentialViewSection[] {
  return STAFF_ADD_CREDENTIAL_SECTION_IDS.map((id) => ({
    id,
    ...SECTION_META[id],
    certs: [],
  }));
}

export function getOptionalCredentialSections(): CredentialViewSection[] {
  return OPTIONAL_CREDENTIAL_SECTION_IDS.map((id) => ({
    id,
    ...SECTION_META[id],
    certs: [],
  }));
}

const SECTION_META: Record<
  CredentialViewSectionId,
  Pick<CredentialViewSection, 'title' | 'subtitle' | 'category'>
> = {
  'guard-card': {
    title: CERT_CATEGORY_LABELS['guard-card'],
    subtitle: 'California BSIS guard registration — required to work field jobs.',
    category: 'guard-card',
  },
  coi: {
    title: 'Certificate of Insurance (COI)',
    subtitle: 'General liability insurance — required for profile approval and marketplace work.',
    category: 'industry',
  },
  'bsis-pta-uof': {
    title: 'BSIS Mandatory',
    subtitle: 'Power to Arrest & Appropriate Use of Force — required for activation.',
    category: 'bsis-training',
  },
  'bsis-32-hour': {
    title: 'Continued Education',
    subtitle:
      '32-hour BSIS CE package for first-year guards — all 9 course certificates required after PTA/UOF.',
    category: 'bsis-training',
  },
  'bsis-refresher': {
    title: getCertCatalogEntry(BSIS_REFRESHER_CATALOG_ID)?.name ?? '8-Hour BSIS Refresher Course',
    subtitle:
      'Annual 8-hour renewal — BSIS calls this Continuing Education for guard card renewals. Staff may request later; not required for initial activation.',
    category: 'bsis-training',
  },
  'bsis-other-training': {
    title: 'Other BSIS Training',
    subtitle: 'Supplemental BSIS courses beyond the 32-hour CE package — not required for activation.',
    category: 'bsis-training',
  },
  'bsis-permit': {
    title: 'BSIS Permits (Weapons)',
    subtitle:
      'Permits, training, and what you carry — firearm, baton, and OC spray permits expire and require staff verification.',
    category: 'bsis-permit',
  },
  medical: {
    title: 'Medical & Emergency',
    subtitle: 'CPR, AED, First Aid, Narcan, Stop the Bleed — highly recommended and often required by clients.',
    category: 'medical',
  },
  fema: {
    title: 'FEMA / Homeland Security',
    subtitle: 'ICS and awareness courses for incident command and emergency coordination.',
    category: 'fema',
  },
  'security-advanced': {
    title: 'Advanced Security',
    subtitle: 'Executive protection, active shooter, de-escalation, defensive driving, and specialty training.',
    category: 'security-advanced',
  },
  industry: {
    title: 'Industry & Professional',
    subtitle: 'OSHA, CIT, mental health first aid, other licenses — or use Other to add anything not listed.',
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
  if (isContinuingEducationCatalogId(catalogId)) return 'bsis-32-hour';
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

export function coiViewSectionLabel(): string {
  return SECTION_META.coi.title;
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
  const ceCourses = bsisTraining.filter((cert) =>
    isContinuingEducationCatalogId(resolveCertCatalogId(cert))
  );
  const refresher = bsisTraining.filter((cert) => resolveCertCatalogId(cert) === BSIS_REFRESHER_CATALOG_ID);
  const otherBsis = bsisTraining.filter((cert) => {
    const id = resolveCertCatalogId(cert);
    return (
      !isContinuingEducationCatalogId(id) &&
      !isPtaUofCatalogId(id) &&
      id !== BSIS_REFRESHER_CATALOG_ID
    );
  });

  const certsBySection: Record<CredentialViewSectionId, Certification[]> = {
    'guard-card': guardCards,
    coi: [],
    'bsis-pta-uof': ptaUof,
    'bsis-32-hour': ceCourses,
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
    coi: [],
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

export type PendingCredentialApprovalEntry =
  | { kind: 'cert'; guard: SecurityGuard; cert: Certification }
  | { kind: 'coi'; guard: SecurityGuard };

/** Group pending staff credential approvals (certs + COI) by view section. */
export function groupPendingCredentialApprovals(
  certItems: Array<{ guard: SecurityGuard; cert: Certification }>,
  coiGuards: SecurityGuard[],
  options?: { hideEmpty?: boolean }
): Array<CredentialViewSection & { entries: PendingCredentialApprovalEntry[] }> {
  const certSections = groupPendingCertsByViewSection(certItems, { hideEmpty: false });
  const coiEntries: PendingCredentialApprovalEntry[] = coiGuards.map((guard) => ({
    kind: 'coi',
    guard,
  }));

  return SECTION_ORDER.map((id) => {
    const certSection = certSections.find((section) => section.id === id);
    const entries: PendingCredentialApprovalEntry[] =
      id === 'coi' ? coiEntries : (certSection?.entries.map((entry) => ({ kind: 'cert' as const, ...entry })) ?? []);

    return {
      id,
      ...SECTION_META[id],
      certs: entries.filter((entry): entry is { kind: 'cert'; guard: SecurityGuard; cert: Certification } => entry.kind === 'cert').map((entry) => entry.cert),
      entries,
    };
  }).filter((section) => !options?.hideEmpty || section.entries.length > 0);
}

export function coiApprovalItemId(guardId: string): string {
  return `coi-${guardId}`;
}

export function isCoiApprovalItemId(itemId: string): boolean {
  return itemId.startsWith('coi-');
}

export function guardIdFromCoiApprovalItemId(itemId: string): string {
  return itemId.slice(4);
}

export function govIdApprovalItemId(guardId: string): string {
  return `gov-id-${guardId}`;
}

export type ActivationCredentialKey = 'guard-card' | 'mandatory-training' | 'ce' | 'pta-uof' | '32-hour';

export function activationCredentialItemId(guardId: string, key: ActivationCredentialKey): string {
  return `activation-${key}-${guardId}`;
}

export function isActivationCredentialItemId(itemId: string): boolean {
  return itemId.startsWith('activation-');
}

const ACTIVATION_CREDENTIAL_PREFIXES: { key: ActivationCredentialKey; prefix: string }[] = [
  { key: 'guard-card', prefix: 'activation-guard-card-' },
  { key: 'mandatory-training', prefix: 'activation-mandatory-training-' },
  { key: 'ce', prefix: 'activation-ce-' },
  /** Legacy activation item prefixes */
  { key: 'pta-uof', prefix: 'activation-pta-uof-' },
  { key: '32-hour', prefix: 'activation-32-hour-' },
];

export function parseActivationCredentialItemId(
  itemId: string
): { guardId: string; key: ActivationCredentialKey } | null {
  for (const entry of ACTIVATION_CREDENTIAL_PREFIXES) {
    if (itemId.startsWith(entry.prefix)) {
      return { guardId: itemId.slice(entry.prefix.length), key: entry.key };
    }
  }
  return null;
}

export function isGovIdApprovalItemId(itemId: string): boolean {
  return itemId.startsWith('gov-id-');
}

export function guardIdFromGovIdApprovalItemId(itemId: string): string {
  return itemId.slice('gov-id-'.length);
}

/** Group a flat cert list by view section (e.g. staff approval queue). */
export function groupCertsByViewSection(
  certs: Certification[],
  options?: { hideEmpty?: boolean }
): CredentialViewSection[] {
  const buckets: Record<CredentialViewSectionId, Certification[]> = {
    'guard-card': [],
    coi: [],
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
