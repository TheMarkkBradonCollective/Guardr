import type { Certification, SecurityGuard } from '../types';
import { resolveCertCatalogId } from './certCatalog';

/** Rejected credential awaiting a guard resubmit for a catalog entry. */
export function findRejectedCertForCatalog(
  guard: SecurityGuard,
  catalogId: string
): Certification | undefined {
  return guard.certifications.find((cert) => {
    if (cert.status !== 'rejected') return false;
    return resolveCertCatalogId(cert) === catalogId;
  });
}

export function guardHasRejectedCertForCatalog(guard: SecurityGuard, catalogId: string): boolean {
  return Boolean(findRejectedCertForCatalog(guard, catalogId));
}

/** All credentials for a catalog id, including rejected rows awaiting resubmit. */
export function certsForCatalogId(guard: SecurityGuard, catalogId: string): Certification[] {
  return guard.certifications.filter((cert) => resolveCertCatalogId(cert) === catalogId);
}
