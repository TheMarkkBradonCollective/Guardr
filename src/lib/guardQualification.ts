import { Certification, SecurityGuard } from '../types';
import { canonicalCatalogId, getCertCatalogEntry, resolveCertCatalogId } from './certCatalog';

export type GuardQualificationLevel = 'none' | 'pending' | 'active';

/** Credential pathway + account state shown in the UI */
export type GuardDisplayStatus = 'inactive' | 'active' | 'suspended' | 'blocked';

export const GUARD_STATUS_LABELS: Record<GuardDisplayStatus, string> = {
  inactive: 'Inactive',
  active: 'Active',
  suspended: 'Suspended',
  blocked: 'Blocked',
};

/** Credential pathway tiers — guard card = Active and eligible to work. */
export const GUARD_PATHWAY_STATUS_LABELS: Record<Exclude<GuardQualificationLevel, 'none'>, string> = {
  pending: GUARD_STATUS_LABELS.active,
  active: `${GUARD_STATUS_LABELS.active} — full training`,
};

export const GUARD_PATHWAY_STATUS_DESCRIPTIONS: Record<Exclude<GuardQualificationLevel, 'none'>, string> = {
  pending: 'Valid BSIS Guard Card on file — Active and eligible to work jobs',
  active:
    'Guard Card plus 8-hr PTA/UOF and 32-hour BSIS training on file (highly recommended by Guardr)',
};

export const GUARD_INACTIVE_DESCRIPTION =
  'No valid BSIS Guard Card on file — upload a guard card to become Active and work jobs';

/** Shown on training credentials and job checklists — not a work blocker. */
export const GUARDR_RECOMMENDED_TRAINING_LABEL = 'Highly recommended by Guardr';

/** @deprecated Use GUARD_PATHWAY_STATUS_LABELS */
export const QUALIFICATION_LEVEL_LABELS = GUARD_PATHWAY_STATUS_LABELS;

/** @deprecated Use GUARD_PATHWAY_STATUS_DESCRIPTIONS */
export const QUALIFICATION_LEVEL_DESCRIPTIONS = GUARD_PATHWAY_STATUS_DESCRIPTIONS;

import { isGuardAccountActive, isGuardAccountPending } from './accountStatus';

export function getGuardDisplayStatus(guard: SecurityGuard, state = 'CA'): GuardDisplayStatus {
  const userStatus = guard.userStatus || 'active';
  if (userStatus === 'pending') return 'inactive';
  if (userStatus === 'suspended') return 'suspended';
  if (userStatus === 'blocked') return 'blocked';
  return guardMeetsLevel1(guard, state) ? 'active' : 'inactive';
}

/** Active account + valid BSIS guard card — required to accept, be hired, or work jobs */
export function guardCanWorkFieldJobs(guard: SecurityGuard, state = 'CA'): boolean {
  if (guard.isStaff) return false;
  if (!isGuardAccountActive(guard)) return false;
  return guardMeetsLevel1(guard, state);
}

export function guardWorkBlockedMessage(guard: SecurityGuard, state = 'CA'): string | null {
  if (guard.isStaff) {
    return 'Staff accounts cannot work field jobs.';
  }
  if (isGuardAccountPending(guard)) {
    return 'Your application is pending Guardr approval. Complete your profile and credentials while you wait.';
  }
  const userStatus = guard.userStatus || 'active';
  if (userStatus === 'suspended') {
    return 'Your account is suspended. Contact Guardr support to restore access.';
  }
  if (userStatus === 'blocked') {
    return 'Your account is blocked. Contact Guardr support.';
  }
  if (!guardMeetsLevel1(guard, state)) {
    const jobState = state || 'CA';
    return `Upload a valid BSIS Guard Card for ${jobState} to accept and work jobs.`;
  }
  return null;
}

export function guardPathwayStatusLabel(level: GuardQualificationLevel): string {
  if (level === 'none') return GUARD_STATUS_LABELS.inactive;
  if (level === 'active') return GUARD_PATHWAY_STATUS_LABELS.active;
  return GUARD_STATUS_LABELS.active;
}

/** Combined 8-hour, 2-part course — or upload Power to Arrest and UOF as separate certs. */
export const BSIS_PTA_UOF_COMBINED_ID = 'bsis-pta-uof-8hr';

/** Shown in upload flows — combined cert or two separate PTA + UOF certificates. */
export const PTA_UOF_UPLOAD_GUIDANCE =
  'Upload the combined 8-hour certificate, or Power to Arrest and Appropriate Use of Force as two separate certs.';

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
/** Second half of modern 2-part 8-hr course when issued as a separate WMD cert. */
export const BSIS_WMD_AWARENESS_ID = 'bsis-wmd-awareness';

/** Catalog IDs on the Inactive→Active pathway — not shown as supplemental badges. */
export function getRequiredPathwayCatalogIds(): readonly string[] {
  return [
    'bsis-guard-card',
    BSIS_PTA_UOF_COMBINED_ID,
    LEGACY_PTA_ID,
    LEGACY_UOF_ID,
    BSIS_WMD_AWARENESS_ID,
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
  const canonical = canonicalCatalogId(catalogId) ?? catalogId;
  return (
    canonical === BSIS_PTA_UOF_COMBINED_ID ||
    canonical === LEGACY_PTA_ID ||
    canonical === LEGACY_UOF_ID ||
    canonical === BSIS_WMD_AWARENESS_ID
  );
}

export function getPtaUofCatalogEntries() {
  return [BSIS_PTA_UOF_COMBINED_ID, LEGACY_PTA_ID, LEGACY_UOF_ID, BSIS_WMD_AWARENESS_ID]
    .map((id) => getCertCatalogEntry(id))
    .filter((entry): entry is NonNullable<typeof entry> => !!entry);
}

export function isRequiredPathwayCredential(catalogId: string | undefined): boolean {
  if (!catalogId) return false;
  return getRequiredPathwayCatalogIds().includes(catalogId);
}

export function isCertExpired(cert: Pick<Certification, 'expiryDate'>): boolean {
  if (!cert.expiryDate) return false;
  const expiry = new Date(cert.expiryDate);
  return !Number.isNaN(expiry.getTime()) && expiry < new Date();
}

function isCertNotExpired(cert: Certification): boolean {
  return !isCertExpired(cert);
}

/** Only the BSIS guard card must be unexpired to count toward qualification. */
function expiryBlocksQualification(catalogId: string): boolean {
  return catalogId === 'bsis-guard-card';
}

function certMatchesCatalogId(cert: Certification, catalogId: string): boolean {
  const storedCanonical = canonicalCatalogId(cert.catalogId);
  if (storedCanonical && storedCanonical === catalogId) return true;
  return resolveCertCatalogId(cert) === catalogId;
}

function matchingCredentials(
  guard: SecurityGuard,
  catalogId: string,
  jobState?: string
): Certification[] {
  return guard.certifications.filter((cert) => {
    if (cert.status === 'rejected') return false;
    if (!certMatchesCatalogId(cert, catalogId)) return false;
    if (catalogId === 'bsis-guard-card' && jobState) {
      return cert.state?.toUpperCase() === jobState.toUpperCase();
    }
    return true;
  });
}

/** Uploaded and not rejected — includes expired (for display). */
export function guardHasCredentialUploaded(
  guard: SecurityGuard,
  catalogId: string,
  jobState?: string
): boolean {
  return guard.certifications.some((cert) => {
    if (cert.status === 'rejected') return false;
    if (!certMatchesCatalogId(cert, catalogId)) return false;
    if (catalogId === 'bsis-guard-card' && jobState) {
      return cert.state?.toUpperCase() === jobState.toUpperCase();
    }
    return true;
  });
}

/**
 * Uploaded and not rejected — counts toward qualification.
 * Training and permits may be expired; only the guard card must be current.
 */
export function guardHasCredentialOnFile(
  guard: SecurityGuard,
  catalogId: string,
  jobState?: string
): boolean {
  return matchingCredentials(guard, catalogId, jobState).some((cert) => {
    if (expiryBlocksQualification(catalogId) && !isCertNotExpired(cert)) return false;
    return true;
  });
}

export function guardHasGuardrVerifiedCredential(
  guard: SecurityGuard,
  catalogId: string,
  jobState?: string
): boolean {
  return matchingCredentials(guard, catalogId, jobState).some((cert) => {
    if (cert.status !== 'verified') return false;
    if (expiryBlocksQualification(catalogId) && !isCertNotExpired(cert)) return false;
    return true;
  });
}

/** Guard card uploaded but past expiry — keeps guard Inactive. */
export function guardHasExpiredGuardCard(guard: SecurityGuard, jobState = 'CA'): boolean {
  const state = jobState || 'CA';
  return (
    guardHasCredentialUploaded(guard, 'bsis-guard-card', state) &&
    !guardHasCredentialOnFile(guard, 'bsis-guard-card', state)
  );
}

/** Combined 8-hr cert, or both parts on file (separate PTA + UOF, or PTA + WMD). */
export function guardMeetsPtaUofTraining(guard: SecurityGuard): boolean {
  if (guardHasCredentialOnFile(guard, BSIS_PTA_UOF_COMBINED_ID)) return true;
  const hasPta = guardHasCredentialOnFile(guard, LEGACY_PTA_ID);
  if (!hasPta) return false;
  return (
    guardHasCredentialOnFile(guard, LEGACY_UOF_ID) ||
    guardHasCredentialOnFile(guard, BSIS_WMD_AWARENESS_ID)
  );
}

export function guardMeets32HourBlock(guard: SecurityGuard): boolean {
  if (THIRTY_TWO_HOUR_ROLLUP_IDS.some((id) => guardHasCredentialOnFile(guard, id))) {
    return true;
  }
  return THIRTY_TWO_HOUR_COURSE_IDS.every((id) => guardHasCredentialOnFile(guard, id));
}

/** All 32-hour courses verified, or a verified rollup completion cert. */
export function guardMeets32HourBlockVerified(guard: SecurityGuard): boolean {
  if (THIRTY_TWO_HOUR_ROLLUP_IDS.some((id) => guardHasGuardrVerifiedCredential(guard, id))) {
    return true;
  }
  return THIRTY_TWO_HOUR_COURSE_IDS.every((id) => guardHasGuardrVerifiedCredential(guard, id));
}

/** @deprecated Use guardMeets32HourBlock */
export function guardMeets40HourTraining(guard: SecurityGuard): boolean {
  return guardMeets32HourBlock(guard);
}

/** Full BSIS training on file — recommended beyond guard-card Active status. */
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

/** Client job preference — only a valid guard card is required to work. */
export function guardMeetsQualificationLevel(
  guard: SecurityGuard,
  _minLevel: 'pending' | 'active',
  state = 'CA'
): boolean {
  return guardMeetsLevel1(guard, state);
}

export function getQualificationProgress(guard: SecurityGuard, state = 'CA') {
  const jobState = state || 'CA';
  const ptaUofCombined = guardHasCredentialOnFile(guard, BSIS_PTA_UOF_COMBINED_ID);
  const legacyPta = guardHasCredentialOnFile(guard, LEGACY_PTA_ID);
  const legacyUof = guardHasCredentialOnFile(guard, LEGACY_UOF_ID);
  const legacyWmd = guardHasCredentialOnFile(guard, BSIS_WMD_AWARENESS_ID);
  const uploaded32HourCount = THIRTY_TWO_HOUR_COURSE_IDS.filter((id) =>
    guardHasCredentialOnFile(guard, id)
  ).length;
  const thirtyTwoHourRollup = THIRTY_TWO_HOUR_ROLLUP_IDS.some((id) =>
    guardHasCredentialOnFile(guard, id)
  );

  return {
    level: getGuardQualificationLevel(guard, jobState),
    guardCard: guardHasCredentialOnFile(guard, 'bsis-guard-card', jobState),
    guardCardExpired: guardHasExpiredGuardCard(guard, jobState),
    guardCardVerified: guardHasGuardrVerifiedCredential(guard, 'bsis-guard-card', jobState),
    ptaUofTraining: guardMeetsPtaUofTraining(guard),
    ptaUofCombined,
    ptaUofCombinedVerified: guardHasGuardrVerifiedCredential(guard, BSIS_PTA_UOF_COMBINED_ID),
    legacyPta,
    legacyUof,
    legacyWmd,
    thirtyTwoHourRollup,
    thirtyTwoHourBlockComplete: guardMeets32HourBlock(guard),
    thirtyTwoHourBlockVerified: guardMeets32HourBlockVerified(guard),
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
