import { Certification, SecurityGuard } from '../types';
import {
  canonicalCatalogId,
  credentialRequiresExpiry,
  getCertCatalogEntry,
  resolveCertCatalogId,
} from './certCatalog';
import { guardInsuranceBlockedMessage } from './guardInsurance';

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
  pending: 'Verified government ID and valid BSIS Guard Card on file — Active and eligible to work jobs',
  active: 'Guard Card plus 8-hr PTA/UOF and 32-hour BSIS training on file',
};

export const GUARD_INACTIVE_DESCRIPTION =
  'Verified government ID and valid BSIS Guard Card required — complete both in Credentials to become Active and work jobs';

/** @deprecated Use GUARD_PATHWAY_STATUS_LABELS */
export const QUALIFICATION_LEVEL_LABELS = GUARD_PATHWAY_STATUS_LABELS;

/** @deprecated Use GUARD_PATHWAY_STATUS_DESCRIPTIONS */
export const QUALIFICATION_LEVEL_DESCRIPTIONS = GUARD_PATHWAY_STATUS_DESCRIPTIONS;

import { getGuardUserStatus, isGuardAccountApproved, isGuardAccountPreActive } from './accountStatus';
import { certHasDocumentProof } from './certImagePolicy';
import {
  guardGraceWaivesTrainingCredential,
  guardHasActiveCredentialGrace,
} from './guardCredentialGrace';
import { licenseStatesMatch, resolveGuardCardLicenseState } from './californiaCities';
import { getGuardActivationChecklist, guardMeetsAllActivationCredentialsOnFile, isGuardAccountActive } from './guardAccountActivation';
import {
  getGuardIdVerificationStatus,
  guardIdMatchesWorkLicenseState,
  guardIdVerificationPhotosComplete,
  isIdExpired,
} from './guardIdentityVerification';
import { guardHasValidInsurance } from './guardInsurance';

function normalizeWorkLicenseState(jobCityOrState?: string): string {
  return resolveGuardCardLicenseState(jobCityOrState);
}

export function getGuardDisplayStatus(guard: SecurityGuard, state = 'CA'): GuardDisplayStatus {
  const licenseState = normalizeWorkLicenseState(state);
  const userStatus = getGuardUserStatus(guard);
  if (userStatus === 'pending' || userStatus === 'approved') return 'inactive';
  if (userStatus === 'suspended') return 'suspended';
  if (userStatus === 'blocked') return 'blocked';
  return guardCanWorkFieldJobs(guard, licenseState) ? 'active' : 'inactive';
}

/** Active account with all five activation credentials verified (ID, COI, guard card, PTA/UOF, 32-hour). */
export function guardCanWorkFieldJobs(guard: SecurityGuard, state = 'CA'): boolean {
  const licenseState = normalizeWorkLicenseState(state);
  if (guard.isStaff) return false;
  if (!isGuardAccountActive(guard, licenseState)) return false;
  return guardIdMatchesWorkLicenseState(guard, licenseState);
}

export function guardHasIdOnFile(guard: SecurityGuard): boolean {
  const status = getGuardIdVerificationStatus(guard);
  return guardIdVerificationPhotosComplete(guard) || status === 'verified';
}

export function guardHasVerifiedIdForWork(guard: SecurityGuard): boolean {
  return getGuardIdVerificationStatus(guard) === 'verified' && !isIdExpired(guard);
}

export function guardHasExpiredIdOnFile(guard: SecurityGuard): boolean {
  return guardHasIdOnFile(guard) && isIdExpired(guard);
}

export function guardMeetsWorkRequirements(guard: SecurityGuard, state = 'CA'): boolean {
  return guardMeetsAllActivationCredentialsOnFile(guard, state);
}

export function guardWorkBlockedMessage(guard: SecurityGuard, state = 'CA'): string | null {
  const licenseState = normalizeWorkLicenseState(state);
  if (guard.isStaff) {
    return 'Staff accounts cannot work field jobs.';
  }
  if (isGuardAccountPreActive(guard)) {
    const checklist = getGuardActivationChecklist(guard, licenseState);
    if (!checklist.canActivate) {
      const blocker = checklist.staffApprovalBlockers[0];
      if (blocker) {
        return `Upload all five activation credentials before staff can approve your profile — ${blocker}`;
      }
      return 'Upload government ID, COI, guard card, PTA/UOF, and 32-hour training before staff can approve your profile.';
    }
    if (isGuardAccountApproved(guard)) {
      if (guard.credentialExpiryRestricted) {
        return 'Account restricted — a required credential expired. Upload and verify the updated document to work jobs again.';
      }
      return 'Your profile is approved — Guardr staff will grant marketplace eligibility so you can work jobs.';
    }
    return 'All five credentials are on file — awaiting profile approval by Guardr staff.';
  }
  const userStatus = getGuardUserStatus(guard);
  if (userStatus === 'suspended') {
    return 'Your account is suspended. Contact Guardr support to restore access.';
  }
  if (userStatus === 'blocked') {
    return 'Your account is blocked. Contact Guardr support.';
  }
  if (!isGuardAccountActive(guard, licenseState)) {
    const checklist = getGuardActivationChecklist(guard, licenseState);
    if (checklist.staffApprovalBlockers.length > 0) {
      return checklist.staffApprovalBlockers[0];
    }
    return 'Complete all five activation credentials in your profile before working jobs.';
  }
  if (!guardIdMatchesWorkLicenseState(guard, licenseState)) {
    const stateName = licenseState === 'CA' ? 'California' : licenseState;
    return `Your government ID must be issued by ${stateName} to work Guardr jobs in that state.`;
  }
  const insuranceBlocked = guardInsuranceBlockedMessage(guard);
  if (insuranceBlocked) return insuranceBlocked;
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

export { LEGACY_PTA_ID, LEGACY_UOF_ID };

export const PTA_UOF_SEPARATE_PART_COUNT = 2;

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

export function guardPtaUofUsingCombinedPath(guard: SecurityGuard): boolean {
  return guardHasCredentialListed(guard, BSIS_PTA_UOF_COMBINED_ID);
}

export function guardPtaUofSecondPartOnFile(guard: SecurityGuard): boolean {
  return (
    guardHasCredentialOnFile(guard, LEGACY_UOF_ID) ||
    guardHasCredentialOnFile(guard, BSIS_WMD_AWARENESS_ID)
  );
}

export function guardPtaUofSecondPartListed(guard: SecurityGuard): boolean {
  return (
    guardHasCredentialListed(guard, LEGACY_UOF_ID) ||
    guardHasCredentialListed(guard, BSIS_WMD_AWARENESS_ID)
  );
}

export function computePtaUofProgress(guard: SecurityGuard) {
  const combinedOnFile = guardHasCredentialOnFile(guard, BSIS_PTA_UOF_COMBINED_ID);
  const combinedListed =
    guardHasCredentialListed(guard, BSIS_PTA_UOF_COMBINED_ID) && !combinedOnFile;
  const ptaOnFile = guardHasCredentialOnFile(guard, LEGACY_PTA_ID);
  const ptaListed = guardHasCredentialListed(guard, LEGACY_PTA_ID) && !ptaOnFile;
  const secondOnFile = guardPtaUofSecondPartOnFile(guard);
  const secondListed = guardPtaUofSecondPartListed(guard) && !secondOnFile;
  const complete = guardMeetsPtaUofTraining(guard);
  const usingCombinedPath = guardPtaUofUsingCombinedPath(guard);

  let progressPercent = 0;
  if (complete) {
    progressPercent = 100;
  } else if (combinedListed) {
    progressPercent = 50;
  } else {
    const ptaWeight = ptaOnFile ? 1 : ptaListed ? 0.5 : 0;
    const secondWeight = secondOnFile ? 1 : secondListed ? 0.5 : 0;
    progressPercent = Math.round(((ptaWeight + secondWeight) / PTA_UOF_SEPARATE_PART_COUNT) * 100);
  }

  return {
    complete,
    progressPercent,
    combinedOnFile,
    combinedListed,
    ptaOnFile,
    ptaListed,
    secondOnFile,
    secondListed,
    usingCombinedPath,
  };
}

export function formatPtaUofProgressSummary(guard: SecurityGuard): string {
  const progress = computePtaUofProgress(guard);
  if (progress.combinedOnFile) {
    return 'Combined 8-hour certificate on file';
  }
  if (progress.complete) {
    return progress.ptaOnFile && progress.secondOnFile
      ? 'Power to Arrest and second part on file'
      : '8-hour training on file';
  }
  if (progress.usingCombinedPath && progress.combinedListed) {
    return 'Combined certificate listed — document photo required';
  }
  const partsOnFile =
    (progress.ptaOnFile ? 1 : 0) + (progress.secondOnFile ? 1 : 0);
  const partsListed =
    (progress.ptaListed ? 1 : 0) + (progress.secondListed ? 1 : 0);
  const base = `${partsOnFile} of ${PTA_UOF_SEPARATE_PART_COUNT} parts on file`;
  if (partsListed > 0) {
    return `${base} · ${partsListed} listed`;
  }
  return partsOnFile === 0 && partsListed === 0 ? 'Not on file' : base;
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

/** Permits must have a future expiry date to count toward qualification. */
function expiryBlocksQualification(catalogId: string): boolean {
  return credentialRequiresExpiry(catalogId);
}

function credentialExpiryIsValid(cert: Certification, catalogId: string): boolean {
  if (!expiryBlocksQualification(catalogId)) return true;
  if (!cert.expiryDate?.trim()) return false;
  return isCertNotExpired(cert);
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
  const guardCardState =
    catalogId === 'bsis-guard-card' && jobState
      ? resolveGuardCardLicenseState(jobState)
      : jobState;
  return guard.certifications.filter((cert) => {
    if (cert.status === 'rejected') return false;
    if (!certMatchesCatalogId(cert, catalogId)) return false;
    if (catalogId === 'bsis-guard-card' && guardCardState) {
      return licenseStatesMatch(cert.state, guardCardState);
    }
    return true;
  });
}

/** Credential record exists (non-rejected) — may be listed without a document photo. */
export function guardHasCredentialListed(
  guard: SecurityGuard,
  catalogId: string,
  jobState?: string
): boolean {
  return matchingCredentials(guard, catalogId, jobState).length > 0;
}

/** Uploaded with document proof and not rejected — includes expired (for display). */
export function guardHasCredentialUploaded(
  guard: SecurityGuard,
  catalogId: string,
  jobState?: string
): boolean {
  return matchingCredentials(guard, catalogId, jobState).some((cert) => certHasDocumentProof(cert));
}

/**
 * Uploaded and not rejected — counts toward qualification.
 * Required pathway credentials must be unexpired; optional supplemental creds may be expired.
 */
export function guardHasCredentialOnFile(
  guard: SecurityGuard,
  catalogId: string,
  jobState?: string
): boolean {
  return matchingCredentials(guard, catalogId, jobState).some((cert) => {
    if (!certHasDocumentProof(cert)) return false;
    if (!credentialExpiryIsValid(cert, catalogId)) return false;
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
    if (!certHasDocumentProof(cert)) return false;
    if (!credentialExpiryIsValid(cert, catalogId)) return false;
    return true;
  });
}

/** Guard card uploaded but past expiry — legacy rows only; new certs do not use expiry. */
export function guardHasExpiredGuardCard(guard: SecurityGuard, jobState = 'CA'): boolean {
  const licenseState = normalizeWorkLicenseState(jobState);
  return (
    guardHasCredentialUploaded(guard, 'bsis-guard-card', licenseState) &&
    !guardHasCredentialOnFile(guard, 'bsis-guard-card', licenseState)
  );
}

/** Combined 8-hr cert listed, or both parts listed (separate PTA + UOF, or PTA + WMD). */
export function guardMeetsPtaUofTrainingListed(guard: SecurityGuard): boolean {
  if (guardHasCredentialListed(guard, BSIS_PTA_UOF_COMBINED_ID)) return true;
  const hasPta = guardHasCredentialListed(guard, LEGACY_PTA_ID);
  if (!hasPta) return false;
  return (
    guardHasCredentialListed(guard, LEGACY_UOF_ID) ||
    guardHasCredentialListed(guard, BSIS_WMD_AWARENESS_ID)
  );
}

export function guardMeets32HourBlockListed(guard: SecurityGuard): boolean {
  if (THIRTY_TWO_HOUR_ROLLUP_IDS.some((id) => guardHasCredentialListed(guard, id))) {
    return true;
  }
  return THIRTY_TWO_HOUR_COURSE_IDS.every((id) => guardHasCredentialListed(guard, id));
}

/** Individual 32-hour courses listed without a document photo. */
export function countThirtyTwoHourCoursesListedOnly(guard: SecurityGuard): number {
  return THIRTY_TWO_HOUR_COURSE_IDS.filter(
    (id) => guardHasCredentialListed(guard, id) && !guardHasCredentialOnFile(guard, id)
  ).length;
}

export function formatThirtyTwoHourCourseProgressCounts(
  progress: {
    uploaded32HourCount: number;
    listed32HourCount: number;
    total32HourCourses: number;
  },
  options?: { scopeLabel?: string; staffMode?: boolean }
): string {
  const { uploaded32HourCount, listed32HourCount, total32HourCourses } = progress;
  const scope = options?.scopeLabel ?? 'courses';
  const onFileCount = uploaded32HourCount;
  const base = `${onFileCount} of ${total32HourCourses} ${scope} on file`;
  if (options?.staffMode && listed32HourCount > 0) {
    return `${base} · ${listed32HourCount} listed`;
  }
  return base;
}

/** On file = full credit; listed-only = half credit toward the 9-course block (staff view only). */
export function thirtyTwoHourCourseProgressPercent(
  progress: {
    thirtyTwoHourBlockComplete: boolean;
    uploaded32HourCount: number;
    listed32HourCount: number;
    total32HourCourses: number;
  },
  options?: { staffMode?: boolean }
): number {
  if (progress.thirtyTwoHourBlockComplete) return 100;
  const { uploaded32HourCount, listed32HourCount, total32HourCourses } = progress;
  if (total32HourCourses <= 0) return 0;
  const weight = options?.staffMode
    ? uploaded32HourCount + listed32HourCount * 0.5
    : uploaded32HourCount;
  return Math.round((weight / total32HourCourses) * 100);
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

/** Combined 8-hr cert verified, or both parts verified (PTA + UOF, or PTA + WMD). */
export function guardMeetsPtaUofTrainingVerified(guard: SecurityGuard): boolean {
  if (guardHasGuardrVerifiedCredential(guard, BSIS_PTA_UOF_COMBINED_ID)) return true;
  if (!guardHasGuardrVerifiedCredential(guard, LEGACY_PTA_ID)) return false;
  return (
    guardHasGuardrVerifiedCredential(guard, LEGACY_UOF_ID) ||
    guardHasGuardrVerifiedCredential(guard, BSIS_WMD_AWARENESS_ID)
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
  const licenseState = normalizeWorkLicenseState(state);
  return guardHasCredentialOnFile(guard, 'bsis-guard-card', licenseState);
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

/** Client job preference — verified government ID and valid guard card required to work. */
export function guardMeetsQualificationLevel(
  guard: SecurityGuard,
  _minLevel: 'pending' | 'active',
  state = 'CA'
): boolean {
  return guardMeetsWorkRequirements(guard, state);
}

export function getQualificationProgress(guard: SecurityGuard, state = 'CA') {
  const licenseState = normalizeWorkLicenseState(state);
  const ptaUofCombined = guardHasCredentialOnFile(guard, BSIS_PTA_UOF_COMBINED_ID);
  const legacyPta = guardHasCredentialOnFile(guard, LEGACY_PTA_ID);
  const legacyUof = guardHasCredentialOnFile(guard, LEGACY_UOF_ID);
  const legacyWmd = guardHasCredentialOnFile(guard, BSIS_WMD_AWARENESS_ID);
  const uploaded32HourCount = THIRTY_TWO_HOUR_COURSE_IDS.filter((id) =>
    guardHasCredentialOnFile(guard, id)
  ).length;
  const listed32HourCount = countThirtyTwoHourCoursesListedOnly(guard);
  const thirtyTwoHourRollup = THIRTY_TWO_HOUR_ROLLUP_IDS.some((id) =>
    guardHasCredentialOnFile(guard, id)
  );
  const thirtyTwoHourBlockComplete = guardMeets32HourBlock(guard);
  const ptaUofProgress = computePtaUofProgress(guard);

  return {
    level: getGuardQualificationLevel(guard, licenseState),
    governmentId: guardHasIdOnFile(guard),
    governmentIdExpired: guardHasExpiredIdOnFile(guard),
    governmentIdVerified: guardHasVerifiedIdForWork(guard),
    governmentIdMatchesWorkState: guardIdMatchesWorkLicenseState(guard, licenseState),
    guardCard: guardHasCredentialOnFile(guard, 'bsis-guard-card', licenseState),
    guardCardExpired: false,
    guardCardVerified: guardHasGuardrVerifiedCredential(guard, 'bsis-guard-card', licenseState),
    ptaUofTraining: guardMeetsPtaUofTraining(guard),
    ptaUofCombined,
    ptaUofCombinedVerified: guardHasGuardrVerifiedCredential(guard, BSIS_PTA_UOF_COMBINED_ID),
    legacyPta,
    legacyUof,
    legacyWmd,
    thirtyTwoHourRollup,
    thirtyTwoHourBlockComplete,
    thirtyTwoHourExpired: false,
    thirtyTwoHourBlockVerified: guardMeets32HourBlockVerified(guard),
    uploaded32HourCount,
    listed32HourCount,
    thirtyTwoHourProgressPercent: thirtyTwoHourCourseProgressPercent({
      thirtyTwoHourBlockComplete,
      uploaded32HourCount,
      listed32HourCount,
      total32HourCourses: THIRTY_TWO_HOUR_COURSE_IDS.length,
    }),
    ...ptaUofProgress,
    ptaUofProgressPercent: ptaUofProgress.progressPercent,
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
