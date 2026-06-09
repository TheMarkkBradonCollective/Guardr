import { Certification, SecurityGuard } from '../types';
import { getCertsByCategory, resolveCertCatalogId } from './certCatalog';

export type GuardQualificationLevel = 'none' | 'pending' | 'active';

export const QUALIFICATION_LEVEL_LABELS: Record<Exclude<GuardQualificationLevel, 'none'>, string> = {
  pending: 'Level 1 – Pending',
  active: 'Level 2 – Active',
};

export const QUALIFICATION_LEVEL_DESCRIPTIONS: Record<Exclude<GuardQualificationLevel, 'none'>, string> = {
  pending: 'Valid BSIS Guard Card on file',
  active: 'Guard Card + Power to Arrest + Use of Force + 40-hour BSIS training',
};

/** Core 40-hour pathway courses (excluding PTA / UOF, which are separate required items). */
export const CORE_BIS_TRAINING_COURSE_IDS = [
  'bsis-public-relations',
  'bsis-observation-documentation',
  'bsis-communication',
  'bsis-liability-legal',
  'bsis-officer-safety',
  'bsis-patrol-techniques',
  'bsis-arrest-search-seizure',
  'bsis-access-control',
] as const;

export const LEVEL_2_REQUIRED_IDS = [
  'bsis-power-to-arrest',
  'bsis-appropriate-use-of-force',
] as const;

export const OPTIONAL_WEAPON_PERMIT_IDS = [
  'bsis-exposed-firearm',
  'bsis-baton',
  'bsis-chemical-agent',
] as const;

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

export function guardMeets40HourTraining(guard: SecurityGuard): boolean {
  if (guardHasCredentialOnFile(guard, 'bsis-40-hour-completed')) return true;
  return CORE_BIS_TRAINING_COURSE_IDS.every((id) => guardHasCredentialOnFile(guard, id));
}

export function guardMeetsLevel1(guard: SecurityGuard, state = 'CA'): boolean {
  const jobState = state || 'CA';
  return guardHasCredentialOnFile(guard, 'bsis-guard-card', jobState);
}

export function guardMeetsLevel2(guard: SecurityGuard, state = 'CA'): boolean {
  if (!guardMeetsLevel1(guard, state)) return false;
  if (!LEVEL_2_REQUIRED_IDS.every((id) => guardHasCredentialOnFile(guard, id))) return false;
  return guardMeets40HourTraining(guard);
}

export function getGuardQualificationLevel(guard: SecurityGuard, state = 'CA'): GuardQualificationLevel {
  if (!guardMeetsLevel1(guard, state)) return 'none';
  if (!guardMeetsLevel2(guard, state)) return 'pending';
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
  const trainingCourses = getCertsByCategory('bsis-training');
  const uploadedTrainingCount = trainingCourses.filter((entry) =>
    guardHasCredentialOnFile(guard, entry.id)
  ).length;

  return {
    level: getGuardQualificationLevel(guard, jobState),
    guardCard: guardHasCredentialOnFile(guard, 'bsis-guard-card', jobState),
    guardCardVerified: guardHasGuardrVerifiedCredential(guard, 'bsis-guard-card', jobState),
    powerToArrest: guardHasCredentialOnFile(guard, 'bsis-power-to-arrest'),
    useOfForce: guardHasCredentialOnFile(guard, 'bsis-appropriate-use-of-force'),
    fortyHourRollup: guardHasCredentialOnFile(guard, 'bsis-40-hour-completed'),
    coreTrainingComplete: CORE_BIS_TRAINING_COURSE_IDS.every((id) => guardHasCredentialOnFile(guard, id)),
    uploadedTrainingCount,
    totalTrainingCourses: trainingCourses.length,
  };
}
