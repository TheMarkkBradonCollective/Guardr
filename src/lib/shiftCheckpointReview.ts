import type { SecurityRequest } from '../types';
import {
  SHIFT_CHECKPOINT_REVIEW_WINDOW_MS,
  hasViolationForCheckpoint,
  listShiftAuditViolations,
} from './shiftAuditViolations';
import { selfAuditPhotosComplete, hasStartLocationPhoto } from './selfAuditPhotos';
import { hasEndLocationPhoto, endSelfAuditComplete } from './selfAuditPhotos';

export function canClientReviewStartCheckpoint(req: SecurityRequest): boolean {
  if (!req.checkInAudit?.checkedAt) return false;
  return ['in-progress', 'completed', 'closed'].includes(req.status);
}

export function canClientReviewEndCheckpoint(req: SecurityRequest): boolean {
  if (!req.checkOutAudit?.checkedAt) return false;
  if (!['completed', 'closed'].includes(req.status)) return false;
  const endedAt = new Date(req.checkOutAudit.checkedAt).getTime();
  return Date.now() <= endedAt + SHIFT_CHECKPOINT_REVIEW_WINDOW_MS;
}

export function isEndCheckpointReviewExpired(req: SecurityRequest, nowMs = Date.now()): boolean {
  const endAt = req.checkOutAudit?.checkedAt;
  if (!endAt) return false;
  return nowMs > new Date(endAt).getTime() + SHIFT_CHECKPOINT_REVIEW_WINDOW_MS;
}

export function canClientVerifyStartCheckpoint(req: SecurityRequest): boolean {
  return canClientReviewStartCheckpoint(req) && !req.checkInAudit?.clientConfirmedAt;
}

export function canClientVerifyEndCheckpoint(req: SecurityRequest): boolean {
  return canClientReviewEndCheckpoint(req) && !req.checkOutAudit?.clientConfirmedAt;
}

export function canClientFlagStartCheckpoint(req: SecurityRequest): boolean {
  if (!canClientReviewStartCheckpoint(req)) return false;
  if (req.checkInAudit?.clientConfirmedAt) return false;
  return true;
}

export function canClientFlagEndCheckpoint(req: SecurityRequest): boolean {
  if (!canClientReviewEndCheckpoint(req)) return false;
  if (req.checkOutAudit?.clientConfirmedAt) return false;
  return true;
}

export interface CheckpointSkipSummary {
  selfAuditSkipped: boolean;
  locationPhotoSkipped: boolean;
  endReportSkipped?: boolean;
  labels: string[];
}

export function summarizeStartCheckpointSkips(req: SecurityRequest): CheckpointSkipSummary {
  const audit = req.checkInAudit;
  const selfAuditSkipped = !!audit?.selfAuditSkipped || !selfAuditPhotosComplete(audit);
  const locationPhotoSkipped = !!audit?.locationPhotoSkipped || !hasStartLocationPhoto(audit);
  const labels: string[] = [];
  if (audit?.selfAuditSkipped) labels.push('Guard skipped self-audit');
  else if (!selfAuditPhotosComplete(audit) && audit?.checkedAt) labels.push('Self-audit photos incomplete');
  if (audit?.locationPhotoSkipped) labels.push('Guard skipped location photo');
  else if (!hasStartLocationPhoto(audit) && audit?.checkedAt) labels.push('No location photo');
  return { selfAuditSkipped, locationPhotoSkipped, labels };
}

export function summarizeEndCheckpointSkips(req: SecurityRequest): CheckpointSkipSummary {
  const audit = req.checkOutAudit;
  const selfAuditSkipped = !!audit?.endSelfAuditSkipped || !endSelfAuditComplete(audit);
  const locationPhotoSkipped = !!audit?.locationPhotoSkipped || !hasEndLocationPhoto(audit);
  const endReportSkipped =
    !audit?.dailyActivityReport?.trim() ||
    audit.dailyActivityReport === 'Job completed. No incidents to report.';
  const labels: string[] = [];
  if (audit?.endSelfAuditSkipped) labels.push('Guard skipped end self-audit');
  else if (!endSelfAuditComplete(audit) && audit?.checkedAt) labels.push('End self-audit incomplete');
  if (audit?.locationPhotoSkipped) labels.push('Guard skipped location photo');
  else if (!hasEndLocationPhoto(audit) && audit?.checkedAt) labels.push('No end location photo');
  if (endReportSkipped && audit?.checkedAt) labels.push('End-of-shift report not submitted');
  return { selfAuditSkipped, locationPhotoSkipped, endReportSkipped, labels };
}

export function startCheckpointHasOpenIssues(req: SecurityRequest): boolean {
  const skips = summarizeStartCheckpointSkips(req);
  const violations = listShiftAuditViolations(req);
  return (
    skips.labels.length > 0 ||
    hasViolationForCheckpoint(violations, 'start') ||
    hasViolationForCheckpoint(violations, 'briefing')
  );
}

export function endCheckpointHasOpenIssues(req: SecurityRequest): boolean {
  const skips = summarizeEndCheckpointSkips(req);
  const violations = listShiftAuditViolations(req);
  return skips.labels.length > 0 || hasViolationForCheckpoint(violations, 'end');
}

export function guardOpenDisputableViolations(
  guardId: string,
  requests: SecurityRequest[]
): Array<{ request: SecurityRequest; violation: import('../types').ShiftAuditViolation }> {
  const rows: Array<{ request: SecurityRequest; violation: import('../types').ShiftAuditViolation }> = [];
  for (const req of requests) {
    for (const v of req.shiftAuditViolations ?? []) {
      if (v.guardId !== guardId) continue;
      if (!['auto-flagged', 'flagged', 'dispute-open', 'upheld'].includes(v.status)) continue;
      rows.push({ request: req, violation: v });
    }
  }
  return rows;
}
