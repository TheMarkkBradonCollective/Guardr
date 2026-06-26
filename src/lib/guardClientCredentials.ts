import { Certification, SecurityGuard } from '../types';
import { resolveCertCatalogId } from './certCatalog';
import { guardHasVerifiedIdForWork } from './guardQualification';
import { guardHasValidInsurance } from './guardInsurance';
import {
  guardMeets32HourBlockVerified,
  guardMeetsPtaUofTrainingVerified,
  isRequiredPathwayCredential,
} from './guardQualification';
import { guardHasVerifiedGuardCard } from './guardAccountActivation';

/** Client-facing credential rows — Guardr-verified only. */
export function guardHasClientVisibleActivationCredentials(
  guard: SecurityGuard,
  state = 'CA'
): boolean {
  return (
    guardHasVerifiedIdForWork(guard) &&
    guardHasValidInsurance(guard) &&
    guardHasVerifiedGuardCard(guard, state) &&
    guardMeetsPtaUofTrainingVerified(guard) &&
    guardMeets32HourBlockVerified(guard)
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
