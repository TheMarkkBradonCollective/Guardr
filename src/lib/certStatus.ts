import { Certification, SecurityGuard } from '../types';
import { resolveCertCatalogId } from './certCatalog';
import { guardHasCredentialUploaded, isCertExpired } from './guardQualification';

export { isCertExpired };

export function getCredentialUploadLabel(cert: Certification): string {
  return isCertExpired(cert) ? 'On file · Expired' : 'On file';
}

export function getCredentialUploadBadgeClass(cert: Certification): string {
  return isCertExpired(cert)
    ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
    : 'text-brand-primary border-brand-primary/30 bg-brand-primary/10';
}

export function getCredentialVerificationLabel(cert: Certification): string {
  if (cert.status === 'rejected') return 'Rejected';
  if (cert.status === 'verified') return 'Guardr verified';
  return 'Unverified';
}

export function getCredentialVerificationBadgeClass(cert: Certification): string {
  if (cert.status === 'rejected') return 'text-red-400 border-red-500/30 bg-red-500/10';
  if (cert.status === 'verified') return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  return 'text-brand-text-muted border-brand-border bg-brand-border/20';
}

/** @deprecated Use getCredentialUploadLabel + getCredentialVerificationLabel */
export function getCredentialStatusLabel(cert: Certification): string {
  return `${getCredentialUploadLabel(cert)} · ${getCredentialVerificationLabel(cert)}`;
}

/** @deprecated Use upload + verification badge classes separately */
export function getCredentialStatusBadgeClass(cert: Certification): string {
  return getCredentialUploadBadgeClass(cert);
}

export type CourseUploadStatus = 'missing' | 'on-file' | 'expired';

function matchingUploadedCerts(
  guard: SecurityGuard,
  catalogId: string,
  jobState?: string
): Certification[] {
  return guard.certifications.filter((cert) => {
    if (cert.status === 'rejected') return false;
    const storedId = cert.catalogId?.trim();
    const idMatches = storedId === catalogId || resolveCertCatalogId(cert) === catalogId;
    if (!idMatches) return false;
    if (catalogId === 'bsis-guard-card' && jobState) {
      return cert.state?.toUpperCase() === jobState.toUpperCase();
    }
    return true;
  });
}

/** Course-level upload state only — verification is shown on the cert row. */
export function getCourseUploadStatus(
  guard: SecurityGuard,
  catalogId: string,
  jobState?: string
): CourseUploadStatus {
  if (!guardHasCredentialUploaded(guard, catalogId, jobState)) return 'missing';

  const certs = matchingUploadedCerts(guard, catalogId, jobState);
  const allExpired = certs.length > 0 && certs.every(isCertExpired);

  if (allExpired) return 'expired';
  return 'on-file';
}

export function getCourseUploadStatusLabel(status: CourseUploadStatus): string {
  switch (status) {
    case 'on-file':
      return 'On file';
    case 'expired':
      return 'On file · Expired';
    default:
      return 'Missing';
  }
}

export function getCourseUploadStatusBadgeClass(status: CourseUploadStatus): string {
  switch (status) {
    case 'on-file':
      return 'text-brand-primary border-brand-primary/30 bg-brand-primary/10';
    case 'expired':
      return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    default:
      return 'text-brand-text-muted border-brand-border';
  }
}
