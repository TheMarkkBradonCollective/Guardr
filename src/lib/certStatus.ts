import { Certification, SecurityGuard } from '../types';
import { credentialRequiresExpiry, resolveCertCatalogId } from './certCatalog';
import { resolveGuardCardLicenseState, licenseStatesMatch } from './californiaCities';
import { certHasDocumentProof } from './certImagePolicy';
import {
  BSIS_PTA_UOF_COMBINED_ID,
  BSIS_WMD_AWARENESS_ID,
  LEGACY_PTA_ID,
  LEGACY_UOF_ID,
  THIRTY_TWO_HOUR_COURSE_IDS,
  computePtaUofProgress,
  guardHasCredentialListed,
  guardHasCredentialUploaded,
  guardPtaUofSecondPartListed,
  guardPtaUofSecondPartOnFile,
  isCertExpired,
} from './guardQualification';

export { isCertExpired };

export const CREDENTIAL_NOT_LISTED_OR_ON_FILE_LABEL = 'Not listed or on file';
export const CREDENTIAL_NOT_LISTED_OR_ON_FILE_COUNT_LABEL = 'not listed or on file';

function permitExpiryIsMissing(cert: Certification): boolean {
  const catalogId = resolveCertCatalogId(cert);
  return Boolean(catalogId && credentialRequiresExpiry(catalogId) && !cert.expiryDate?.trim());
}

export function getCredentialUploadLabel(cert: Certification, options?: { staffMode?: boolean }): string {
  if (!certHasDocumentProof(cert)) {
    return options?.staffMode ? 'Listed' : CREDENTIAL_NOT_LISTED_OR_ON_FILE_LABEL;
  }
  if (permitExpiryIsMissing(cert)) return 'On file · Expiry required';
  return isCertExpired(cert) ? 'On file · Expired' : 'On file';
}

export function getCredentialUploadBadgeClass(cert: Certification): string {
  if (!certHasDocumentProof(cert)) {
    return 'text-brand-text-muted border-brand-border bg-brand-border/20';
  }
  if (permitExpiryIsMissing(cert) || isCertExpired(cert)) {
    return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
  }
  return 'text-brand-primary border-brand-primary/30 bg-brand-primary/10';
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

export type CourseUploadStatus = 'missing' | 'listed' | 'on-file' | 'expired';

function matchingListedCerts(
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
    const storedId = cert.catalogId?.trim();
    const idMatches = storedId === catalogId || resolveCertCatalogId(cert) === catalogId;
    if (!idMatches) return false;
    if (catalogId === 'bsis-guard-card' && guardCardState) {
      return licenseStatesMatch(cert.state, guardCardState);
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
  if (!guardHasCredentialListed(guard, catalogId, jobState)) return 'missing';
  if (!guardHasCredentialUploaded(guard, catalogId, jobState)) return 'listed';

  const certs = matchingListedCerts(guard, catalogId, jobState).filter((cert) =>
    certHasDocumentProof(cert)
  );
  const allInvalid = certs.length > 0 && certs.every((cert) => {
    if (credentialRequiresExpiry(catalogId) && !cert.expiryDate?.trim()) return true;
    return isCertExpired(cert);
  });

  if (allInvalid) return 'expired';
  return 'on-file';
}

export function getCourseUploadStatusLabel(status: CourseUploadStatus, options?: { staffMode?: boolean }): string {
  switch (status) {
    case 'on-file':
      return 'On file';
    case 'listed':
      return options?.staffMode ? 'Listed' : CREDENTIAL_NOT_LISTED_OR_ON_FILE_LABEL;
    case 'expired':
      return 'On file · Expired';
    default:
      return CREDENTIAL_NOT_LISTED_OR_ON_FILE_LABEL;
  }
}

export function getCourseUploadStatusBadgeClass(status: CourseUploadStatus): string {
  switch (status) {
    case 'on-file':
      return 'text-brand-primary border-brand-primary/30 bg-brand-primary/10';
    case 'listed':
      return 'text-brand-text-muted border-brand-border bg-brand-border/20';
    case 'expired':
      return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    default:
      return 'text-brand-text-muted border-brand-border';
  }
}

export interface CredentialSlotStatusCounts {
  missing: number;
  listed: number;
  onFile: number;
  expired: number;
}

export function summarizeCredentialSlotStatuses(
  statuses: CourseUploadStatus[]
): CredentialSlotStatusCounts {
  return {
    missing: statuses.filter((status) => status === 'missing').length,
    listed: statuses.filter((status) => status === 'listed').length,
    onFile: statuses.filter((status) => status === 'on-file').length,
    expired: statuses.filter((status) => status === 'expired').length,
  };
}

/** e.g. "2 missing · 1 expired · 3 on file" */
export function formatCredentialSlotStatusSummary(counts: CredentialSlotStatusCounts): string {
  const segments: string[] = [];
  if (counts.missing > 0) {
    segments.push(`${counts.missing} missing`);
  }
  if (counts.listed > 0) {
    segments.push(`${counts.listed} listed`);
  }
  if (counts.expired > 0) {
    segments.push(`${counts.expired} expired`);
  }
  if (counts.onFile > 0) {
    segments.push(`${counts.onFile} on file`);
  }
  if (segments.length === 0) return 'On file';
  return segments.join(' · ');
}

export function countThirtyTwoHourCourseSlotStatuses(guard: SecurityGuard): CredentialSlotStatusCounts {
  const statuses = THIRTY_TWO_HOUR_COURSE_IDS.map((catalogId) =>
    getCourseUploadStatus(guard, catalogId)
  );
  return summarizeCredentialSlotStatuses(statuses);
}

export function getPtaUofSecondPartUploadStatus(guard: SecurityGuard): CourseUploadStatus {
  if (guardPtaUofSecondPartOnFile(guard)) {
    const uofStatus = getCourseUploadStatus(guard, LEGACY_UOF_ID);
    const wmdStatus = getCourseUploadStatus(guard, BSIS_WMD_AWARENESS_ID);
    if (uofStatus === 'expired' || wmdStatus === 'expired') return 'expired';
    return 'on-file';
  }
  if (guardPtaUofSecondPartListed(guard)) return 'listed';
  return 'missing';
}

export function countPtaUofSlotStatuses(guard: SecurityGuard): CredentialSlotStatusCounts {
  const progress = computePtaUofProgress(guard);
  if (progress.combinedOnFile || progress.usingCombinedPath) {
    return summarizeCredentialSlotStatuses([
      getCourseUploadStatus(guard, BSIS_PTA_UOF_COMBINED_ID),
    ]);
  }
  return summarizeCredentialSlotStatuses([
    getCourseUploadStatus(guard, LEGACY_PTA_ID),
    getPtaUofSecondPartUploadStatus(guard),
  ]);
}
