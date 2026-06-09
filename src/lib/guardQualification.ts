import { Certification, SecurityGuard } from '../types';
import { getCertCatalogEntry, resolveCertCatalogId } from './certCatalog';

export type GuardQualificationLevel = 'none' | 'pending' | 'active';

export const QUALIFICATION_LEVEL_LABELS: Record<Exclude<GuardQualificationLevel, 'none'>, string> = {
  pending: 'Level 1 – Pending',
  active: 'Level 2 – Active',
};

export const QUALIFICATION_LEVEL_DESCRIPTIONS: Record<Exclude<GuardQualificationLevel, 'none'>, string> = {
  pending: 'Valid BSIS Guard Card on file',
  active: 'Guard Card + 8-hr PTA/UOF (2-part) + 32-hour BSIS course block',
};

/**
 * As of 2024, BSIS requires one combined 8-hour, 2-part course covering
 * Power to Arrest and Appropriate Use of Force.
 */
export const BSIS_PTA_UOF_COMBINED_ID = 'bsis-pta-uof-8hr';

/** Mandatory 32-hour BSIS course block (9 courses). */
export const THIRTY_TWO_HOUR_COURSE_IDS = [
  'bsis-communication',
  'bsis-public-relations',
  'bsis-observation-documentation',
  'bsis-liability-legal',
  'bsis-officer-safety',
  'bsis-trespass',
  'bsis-evacuation-procedures',
  'bsis-monitoring-crowd-control',
  'bsis-arrest-search-seizure',
] as const;

export const THIRTY_TWO_HOUR_ROLLUP_IDS = ['bsis-32-hour-completed', 'bsis-40-hour-completed'] as const;

/** @deprecated Use THIRTY_TWO_HOUR_COURSE_IDS */
export const CORE_BIS_TRAINING_COURSE_IDS = THIRTY_TWO_HOUR_COURSE_IDS;

const LEGACY_PTA_ID = 'bsis-power-to-arrest';
const LEGACY_UOF_ID = 'bsis-appropriate-use-of-force';

/** Catalog IDs that count toward Level 1/2 only — not shown as supplemental badges. */
export function getRequiredPathwayCatalogIds(): readonly string[] {
  return [
    'bsis-guard-card',
    BSIS_PTA_UOF_COMBINED_ID,
    LEGACY_PTA_ID,
    LEGACY_UOF_ID,
    ...THIRTY_TWO_HOUR_ROLLUP_IDS,
    ...THIRTY_TWO_HOUR_COURSE_IDS,
  ];
}

export function getThirtyTwoHourCourseCatalogEntries() {
  return THIRTY_TWO_HOUR_COURSE_IDS.map((id) => getCertCatalogEntry(id)).filter(
    (entry): entry is NonNullable<typeof entry> => !!entry
  );
}

export function getThirtyTwoHourRollupCatalogEntries() {
  return THIRTY_TWO_HOUR_ROLLUP_IDS.map((id) => getCertCatalogEntry(id)).filter(
    (entry): entry is NonNullable<typeof entry> => !!entry
  );
}

export function isThirtyTwoHourCatalogId(catalogId: string | undefined): boolean {
  if (!catalogId) return false;
  return (
    (THIRTY_TWO_HOUR_COURSE_IDS as readonly string[]).includes(catalogId) ||
    (THIRTY_TWO_HOUR_ROLLUP_IDS as readonly string[]).includes(catalogId)
  );
}

export function isPtaUofCatalogId(catalogId: string | undefined): boolean {
  if (!catalogId) return false;
  return catalogId === BSIS_PTA_UOF_COMBINED_ID || catalogId === LEGACY_PTA_ID || catalogId === LEGACY_UOF_ID;
}

export function getPtaUofCatalogEntries() {
  return [BSIS_PTA_UOF_COMBINED_ID, LEGACY_PTA_ID, LEGACY_UOF_ID]
    .map((id) => getCertCatalogEntry(id))
    .filter((entry): entry is NonNullable<typeof entry> => !!entry);
}

export function isRequiredPathwayCredential(catalogId: string | undefined): boolean {
  if (!catalogId) return false;
  return getRequiredPathwayCatalogIds().includes(catalogId);
}

function isCertNotExpired(cert: Certification): boolean {
  if (!cert.expiryDate) return true;
  const expiry = new Date(cert.expiryDate);
  return !Number.isNaN(expiry.getTime()) && expiry >= new Date();
}

function certMatchesCatalogId(cert: Certification, catalogId: string): boolean {
  return resolveCertCatalogId(cert) === catalogId;
}

/** Uploaded and not rejected — pending or Guardr-verified. Expired credentials do not count. */
export function guardHasCredentialOnFile(
  guard: SecurityGuard,
  catalogId: string,
  jobState?: string
): boolean {
  return guard.certifications.some((cert) => {
    if (cert.status === 'rejected' || !isCertNotExpired(cert)) return false;
    if (!certMatchesCatalogId(cert, catalogId)) return false;
    if (catalogId === 'bsis-guard-card' && jobState) {
      return cert.state?.toUpperCase() === jobState.toUpperCase();
    }
    return true;
  });
}

export function guardHasGuardrVerifiedCredential(
  guard: SecurityGuard,
  catalogId: string,
  jobState?: string
): boolean {
  return guard.certifications.some((cert) => {
    if (cert.status !== 'verified' || !isCertNotExpired(cert)) return false;
    if (!certMatchesCatalogId(cert, catalogId)) return false;
    if (catalogId === 'bsis-guard-card' && jobState) {
      return cert.state?.toUpperCase() === jobState.toUpperCase();
    }
    return true;
  });
}

/** Combined 8-hr PTA/UOF cert, or legacy pair of separate uploads. */
export function guardMeetsPtaUofTraining(guard: SecurityGuard): boolean {
  if (guardHasCredentialOnFile(guard, BSIS_PTA_UOF_COMBINED_ID)) return true;
  return (
    guardHasCredentialOnFile(guard, LEGACY_PTA_ID) &&
    guardHasCredentialOnFile(guard, LEGACY_UOF_ID)
  );
}

export function guardMeets32HourBlock(guard: SecurityGuard): boolean {
  if (THIRTY_TWO_HOUR_ROLLUP_IDS.some((id) => guardHasCredentialOnFile(guard, id))) {
    return true;
  }
  return THIRTY_TWO_HOUR_COURSE_IDS.every((id) => guardHasCredentialOnFile(guard, id));
}

/** @deprecated Use guardMeets32HourBlock */
export function guardMeets40HourTraining(guard: SecurityGuard): boolean {
  return guardMeets32HourBlock(guard);
}

/** Full Level 2 training — guard card is separate (Level 1). */
export function guardMeetsLevel2Training(guard: SecurityGuard): boolean {
  return guardMeetsPtaUofTraining(guard) && guardMeets32HourBlock(guard);
}

export function guardMeetsLevel1(guard: SecurityGuard, state = 'CA'): boolean {
  const jobState = state || 'CA';
  return guardHasCredentialOnFile(guard, 'bsis-guard-card', jobState);
}

export function guardMeetsLevel2(guard: SecurityGuard, state = 'CA'): boolean {
  if (!guardMeetsLevel1(guard, state)) return false;
  return guardMeetsLevel2Training(guard);
}

export function getGuardQualificationLevel(guard: SecurityGuard, state = 'CA'): GuardQualificationLevel {
  if (!guardMeetsLevel1(guard, state)) return 'none';
  if (!guardMeetsLevel2Training(guard)) return 'pending';
  return 'active';
}

export function guardMeetsQualificationLevel(
  guard: SecurityGuard,
  minLevel: 'pending' | 'active',
  state = 'CA'
): boolean {
  const level = getGuardQualificationLevel(guard, state);
  if (level === 'none') return false;
  if (minLevel === 'pending') return true;
  return level === 'active';
}

export function getQualificationProgress(guard: SecurityGuard, state = 'CA') {
  const jobState = state || 'CA';
  const ptaUofCombined = guardHasCredentialOnFile(guard, BSIS_PTA_UOF_COMBINED_ID);
  const legacyPta = guardHasCredentialOnFile(guard, LEGACY_PTA_ID);
  const legacyUof = guardHasCredentialOnFile(guard, LEGACY_UOF_ID);
  const uploaded32HourCount = THIRTY_TWO_HOUR_COURSE_IDS.filter((id) =>
    guardHasCredentialOnFile(guard, id)
  ).length;
  const thirtyTwoHourRollup = THIRTY_TWO_HOUR_ROLLUP_IDS.some((id) =>
    guardHasCredentialOnFile(guard, id)
  );

  return {
    level: getGuardQualificationLevel(guard, jobState),
    guardCard: guardHasCredentialOnFile(guard, 'bsis-guard-card', jobState),
    guardCardVerified: guardHasGuardrVerifiedCredential(guard, 'bsis-guard-card', jobState),
    ptaUofTraining: guardMeetsPtaUofTraining(guard),
    ptaUofCombined,
    ptaUofCombinedVerified: guardHasGuardrVerifiedCredential(guard, BSIS_PTA_UOF_COMBINED_ID),
    legacyPta,
    legacyUof,
    thirtyTwoHourRollup,
    thirtyTwoHourBlockComplete: guardMeets32HourBlock(guard),
    uploaded32HourCount,
    total32HourCourses: THIRTY_TWO_HOUR_COURSE_IDS.length,
    trainingPathwayComplete: guardMeetsLevel2Training(guard),
    /** @deprecated */
    fortyHourRollup: thirtyTwoHourRollup,
    /** @deprecated */
    coreTrainingComplete: guardMeets32HourBlock(guard),
    /** @deprecated */
    uploadedTrainingCount: uploaded32HourCount,
    /** @deprecated */
    totalTrainingCourses: THIRTY_TWO_HOUR_COURSE_IDS.length,
  };
}
