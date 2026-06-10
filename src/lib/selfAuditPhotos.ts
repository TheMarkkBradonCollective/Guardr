import { PlatformRole, SecurityRequest } from '../types';

export type SelfAuditPhotoKind = 'self' | 'uniform' | 'shoes';

export const SELF_AUDIT_PHOTO_LABELS: Record<SelfAuditPhotoKind, string> = {
  self: 'Self',
  uniform: 'Uniform / clothing',
  shoes: 'Shoes',
};

export const NO_SELF_AUDIT_LABEL = 'No Self Audit';

const ACTIVE_JOB_STATUSES: SecurityRequest['status'][] = ['accepted', 'in-progress', 'completed'];
const CLIENT_CONFIRM_STATUSES: SecurityRequest['status'][] = ['in-progress', 'completed'];

export function getSelfAuditPhoto(
  audit: SecurityRequest['checkInAudit'] | undefined,
  kind: SelfAuditPhotoKind
): string | undefined {
  if (!audit) return undefined;
  if (kind === 'self') return audit.selfieUpload || undefined;
  if (kind === 'uniform') return audit.uniformPhoto || undefined;
  return audit.shoesPhoto || undefined;
}

export function selfAuditPhotosComplete(audit: SecurityRequest['checkInAudit'] | undefined): boolean {
  return (['self', 'uniform', 'shoes'] as SelfAuditPhotoKind[]).every((kind) => !!getSelfAuditPhoto(audit, kind));
}

export function isNoSelfAuditFlagged(req: SecurityRequest): boolean {
  return !!req.checkInAudit?.selfAuditSkipped && !selfAuditPhotosComplete(req.checkInAudit);
}

export function missingSelfAuditPhotoKinds(
  audit: SecurityRequest['checkInAudit'] | undefined
): SelfAuditPhotoKind[] {
  return (['self', 'uniform', 'shoes'] as SelfAuditPhotoKind[]).filter((kind) => !getSelfAuditPhoto(audit, kind));
}

export function hasAnySelfAuditPhoto(audit: SecurityRequest['checkInAudit'] | undefined): boolean {
  return (['self', 'uniform', 'shoes'] as SelfAuditPhotoKind[]).some((kind) => !!getSelfAuditPhoto(audit, kind));
}

/** Job detail views show self-audit when clocked in, flagged, or photos exist */
export function shouldShowJobSelfAuditPhotos(req: Pick<SecurityRequest, 'checkInAudit'>): boolean {
  const audit = req.checkInAudit;
  if (!audit) return false;
  return hasAnySelfAuditPhoto(audit) || !!audit.selfAuditSkipped || !!audit.checkedAt;
}

/** Staff may upload during active jobs when photos are missing; after completion, only to clear No Self Audit */
export function canStaffUploadSelfAuditPhotos(req: SecurityRequest, role?: PlatformRole): boolean {
  if (!req.assignedGuardId || !ACTIVE_JOB_STATUSES.includes(req.status)) return false;
  if (role === 'director' && req.status === 'completed') {
    return isNoSelfAuditFlagged(req) || !selfAuditPhotosComplete(req.checkInAudit);
  }
  if (req.status === 'completed') return isNoSelfAuditFlagged(req);
  return isNoSelfAuditFlagged(req) || !selfAuditPhotosComplete(req.checkInAudit);
}

export function isSelfAuditClientConfirmed(audit: SecurityRequest['checkInAudit'] | undefined): boolean {
  return !!audit?.clientConfirmedAt;
}

export function hasSelfAuditPhotosToReview(req: SecurityRequest): boolean {
  return selfAuditPhotosComplete(req.checkInAudit) && CLIENT_CONFIRM_STATUSES.includes(req.status);
}

export function canClientConfirmSelfAudit(req: SecurityRequest): boolean {
  return hasSelfAuditPhotosToReview(req) && !isSelfAuditClientConfirmed(req.checkInAudit);
}
