import { Certification, SecurityGuard } from '../types';
import {
  guardHasCredentialOnFile,
  guardHasCredentialUploaded,
  guardHasGuardrVerifiedCredential,
  isCertExpired,
} from './guardQualification';

export { isCertExpired };

export function getCredentialStatusLabel(cert: Certification): string {
  if (cert.status === 'rejected') return 'Rejected';
  const expired = isCertExpired(cert);
  if (cert.status === 'verified') return expired ? 'Guardr verified · Expired' : 'Guardr verified';
  return expired ? 'On file · Expired' : 'On file';
}

export function getCredentialStatusBadgeClass(cert: Certification): string {
  if (cert.status === 'rejected') return 'text-red-400 border-red-500/30 bg-red-500/10';
  if (isCertExpired(cert)) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
  if (cert.status === 'verified') return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  return 'text-brand-primary border-brand-primary/30 bg-brand-primary/10';
}

export type CourseUploadStatus = 'missing' | 'on-file' | 'verified' | 'expired';

export function getCourseUploadStatus(
  guard: SecurityGuard,
  catalogId: string,
  jobState?: string
): CourseUploadStatus {
  if (!guardHasCredentialUploaded(guard, catalogId, jobState)) return 'missing';
  if (guardHasGuardrVerifiedCredential(guard, catalogId, jobState)) return 'verified';
  if (guardHasCredentialOnFile(guard, catalogId, jobState)) return 'on-file';
  return 'expired';
}

export function getCourseUploadStatusLabel(status: CourseUploadStatus): string {
  switch (status) {
    case 'verified':
      return 'Verified';
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
    case 'verified':
      return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    case 'on-file':
      return 'text-brand-primary border-brand-primary/30 bg-brand-primary/10';
    case 'expired':
      return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    default:
      return 'text-brand-text-muted border-brand-border';
  }
}
