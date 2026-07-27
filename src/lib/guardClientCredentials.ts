import { Certification, SecurityGuard } from '../types';
import { resolveCertCatalogId } from './certCatalog';
import { guardHasVerifiedIdForWork } from './guardQualification';
import { guardHasValidInsurance } from './guardInsurance';
import {
  guardMeetsContinuingEducationVerified,
  guardMeetsMandatoryTrainingVerified,
  isRequiredPathwayCredential,
} from './guardQualification';
import {
  guardHasActiveTrainingGrandfather,
  guardHasVerifiedGuardCard,
} from './guardAccountActivation';

/** Client-facing credential rows — Guardr-verified only. */
export function guardHasClientVisibleActivationCredentials(
  guard: SecurityGuard,
  state = 'CA'
): boolean {
  const identityReady =
    guardHasVerifiedIdForWork(guard) &&
    guardHasValidInsurance(guard) &&
    guardHasVerifiedGuardCard(guard, state);
  if (!identityReady) return false;
  if (guardHasActiveTrainingGrandfather(guard)) return true;
  return (
    guardMeetsMandatoryTrainingVerified(guard) && guardMeetsContinuingEducationVerified(guard)
  );
}

export function filterCertificationsForClientView(
  guard: SecurityGuard,
  certs: Certification[]
): Certification[] {
  return certs.filter((cert) => {
    if (cert.status !== 'verified') return false;
    const catalogId = resolveCertCatalogId(cert);
    if (isRequiredPathwayCredential(catalogId)) return true;
    return true;
  });
}

export function getClientVisibleCertifications(guard: SecurityGuard): Certification[] {
  return filterCertificationsForClientView(guard, guard.certifications ?? []);
}
