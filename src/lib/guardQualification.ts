import { Certification, SecurityGuard } from '../types';
import { resolveCertCatalogId } from './certCatalog';

export type GuardQualificationLevel = 'none' | 'pending' | 'active';

export const QUALIFICATION_LEVEL_LABELS: Record<Exclude<GuardQualificationLevel, 'none'>, string> = {
  pending: 'Level 1 – Pending',
  active: 'Level 2 – Active',
};

export const QUALIFICATION_LEVEL_DESCRIPTIONS: Record<Exclude<GuardQualificationLevel, 'none'>, string> = {
  pending: 'Valid BSIS Guard Card on file',
  active: 'Guard Card + 8-hour Power to Arrest & Appropriate Use of Force (2-part) training',
};

/**
 * As of 2024, BSIS requires one combined 8-hour, 2-part course covering
 * Power to Arrest and Appropriate Use of Force — not separate certificates.
 */
export const BSIS_PTA_UOF_COMBINED_ID = 'bsis-pta-uof-8hr';

/** Legacy separate cert IDs — both on file still counts for guards who uploaded before 2024. */
const LEGACY_PTA_ID = 'bsis-power-to-arrest';
const LEGACY_UOF_ID = 'bsis-appropriate-use-of-force';

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

/** Level 2 training only — guard card is separate (Level 1). */
export function guardMeetsLevel2Training(guard: SecurityGuard): boolean {
  return guardMeetsPtaUofTraining(guard);
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

  return {
    level: getGuardQualificationLevel(guard, jobState),
    guardCard: guardHasCredentialOnFile(guard, 'bsis-guard-card', jobState),
    guardCardVerified: guardHasGuardrVerifiedCredential(guard, 'bsis-guard-card', jobState),
    ptaUofTraining: guardMeetsPtaUofTraining(guard),
    ptaUofCombined,
    ptaUofCombinedVerified: guardHasGuardrVerifiedCredential(guard, BSIS_PTA_UOF_COMBINED_ID),
    legacyPta,
    legacyUof,
    trainingPathwayComplete: guardMeetsLevel2Training(guard),
  };
}
