import { SecurityRequest } from '../types';

export type SelfAuditPhotoKind = 'self' | 'uniform' | 'shoes';

export const SELF_AUDIT_PHOTO_LABELS: Record<SelfAuditPhotoKind, string> = {
  self: 'Self',
  uniform: 'Uniform / clothing',
  shoes: 'Shoes',
};

const ACTIVE_JOB_STATUSES: SecurityRequest['status'][] = ['accepted', 'in-progress', 'completed'];

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

export function canStaffUploadSelfAuditPhotos(req: SecurityRequest): boolean {
  return !!req.assignedGuardId && ACTIVE_JOB_STATUSES.includes(req.status);
}

export function missingSelfAuditPhotoKinds(
  audit: SecurityRequest['checkInAudit'] | undefined
): SelfAuditPhotoKind[] {
  return (['self', 'uniform', 'shoes'] as SelfAuditPhotoKind[]).filter((kind) => !getSelfAuditPhoto(audit, kind));
}
