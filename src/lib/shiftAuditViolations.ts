import type {
  SecurityRequest,
  ShiftAuditViolation,
  ShiftAuditViolationStatus,
  ShiftCheckpointKind,
} from '../types';

/** Client review window after shift end (or live start review has no expiry while in-progress). */
export const SHIFT_CHECKPOINT_REVIEW_WINDOW_MS = 48 * 60 * 60 * 1000;

/** Guard dispute window before auto-uphold. */
export const SHIFT_AUDIT_DISPUTE_WINDOW_MS = 48 * 60 * 60 * 1000;

export const START_CHECKPOINT_FLAG_REASONS = [
  { value: 'uniform', label: 'Uniform or appearance issue' },
  { value: 'location', label: 'Wrong location / not at post' },
  { value: 'equipment', label: 'Missing required equipment' },
  { value: 'photos-unclear', label: 'Self-audit photos unclear or misleading' },
  { value: 'skipped-items', label: 'Guard skipped required check-in items' },
  { value: 'other', label: 'Other start-of-shift issue' },
] as const;

export const END_CHECKPOINT_FLAG_REASONS = [
  { value: 'incomplete-report', label: 'Incomplete or inadequate end-of-shift report' },
  { value: 'location', label: 'Location photo does not match site' },
  { value: 'end-audit', label: 'End self-audit issue' },
  { value: 'left-early', label: 'Left post early / coverage gap' },
  { value: 'equipment', label: 'Equipment not returned / site condition issue' },
  { value: 'other', label: 'Other end-of-shift issue' },
] as const;

function violationId(): string {
  return `sav-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function disputeDeadline(from = new Date()): string {
  return new Date(from.getTime() + SHIFT_AUDIT_DISPUTE_WINDOW_MS).toISOString();
}

function reviewExpiry(from = new Date()): string {
  return new Date(from.getTime() + SHIFT_CHECKPOINT_REVIEW_WINDOW_MS).toISOString();
}

export function listShiftAuditViolations(request: SecurityRequest): ShiftAuditViolation[] {
  return request.shiftAuditViolations ?? [];
}

export function listGuardShiftAuditViolations(
  guardId: string,
  requests: SecurityRequest[]
): ShiftAuditViolation[] {
  return requests.flatMap((req) =>
    (req.shiftAuditViolations ?? []).filter((v) => v.guardId === guardId)
  );
}

export function countActiveShiftAuditViolations(
  guardId: string,
  requests: SecurityRequest[]
): number {
  return listGuardShiftAuditViolations(guardId, requests).filter((v) =>
    ['auto-flagged', 'flagged', 'dispute-open', 'upheld'].includes(v.status)
  ).length;
}

export function hasViolationForCheckpoint(
  violations: ShiftAuditViolation[] | undefined,
  checkpoint: ShiftCheckpointKind,
  category?: string
): boolean {
  return (violations ?? []).some(
    (v) =>
      v.checkpoint === checkpoint &&
      (!category || v.category === category) &&
      !['dismissed', 'expired', 'verified'].includes(v.status)
  );
}

export function appendShiftAuditViolation(
  existing: ShiftAuditViolation[] | undefined,
  violation: ShiftAuditViolation
): ShiftAuditViolation[] {
  const list = existing ?? [];
  if (list.some((v) => v.id === violation.id)) return list;
  if (
    list.some(
      (v) =>
        v.checkpoint === violation.checkpoint &&
        v.category === violation.category &&
        v.source === violation.source &&
        !['dismissed', 'expired'].includes(v.status)
    )
  ) {
    return list;
  }
  return [...list, violation];
}

export function createSystemCheckpointViolation(input: {
  checkpoint: ShiftCheckpointKind;
  category: string;
  label: string;
  description: string;
  guardId: string;
  reviewExpiresAt?: string;
}): ShiftAuditViolation {
  const now = new Date();
  return {
    id: violationId(),
    checkpoint: input.checkpoint,
    source: 'system',
    category: input.category,
    label: input.label,
    description: input.description,
    createdAt: now.toISOString(),
    guardId: input.guardId,
    status: 'auto-flagged',
    reviewExpiresAt: input.reviewExpiresAt,
    dispute: {
      status: 'open',
      disputeDeadlineAt: disputeDeadline(now),
    },
  };
}

export function createClientCheckpointFlag(input: {
  checkpoint: ShiftCheckpointKind;
  category: string;
  label: string;
  description: string;
  guardId: string;
  reportedByClientId: string;
  reportedByClientName?: string;
  reviewExpiresAt?: string;
}): ShiftAuditViolation {
  const now = new Date();
  return {
    id: violationId(),
    checkpoint: input.checkpoint,
    source: 'client',
    category: input.category,
    label: input.label,
    description: input.description,
    createdAt: now.toISOString(),
    guardId: input.guardId,
    reportedByClientId: input.reportedByClientId,
    reportedByClientName: input.reportedByClientName,
    status: 'flagged',
    reviewExpiresAt: input.reviewExpiresAt ?? reviewExpiry(now),
    dispute: {
      status: 'open',
      disputeDeadlineAt: disputeDeadline(now),
    },
  };
}

export function createStartSkipViolations(
  guardId: string,
  options: { selfAuditSkipped?: boolean; locationPhotoSkipped?: boolean }
): ShiftAuditViolation[] {
  const violations: ShiftAuditViolation[] = [];
  if (options.selfAuditSkipped) {
    violations.push(
      createSystemCheckpointViolation({
        checkpoint: 'start',
        category: 'skipped-self-audit',
        label: 'Skipped start self-audit',
        description: 'Guard clocked in without completing start-of-shift self-audit photos.',
        guardId,
      })
    );
  }
  if (options.locationPhotoSkipped) {
    violations.push(
      createSystemCheckpointViolation({
        checkpoint: 'start',
        category: 'skipped-location-photo',
        label: 'No start location photo',
        description: 'Guard clocked in without a photo of the post or site location.',
        guardId,
      })
    );
  }
  return violations;
}

export function createEndSkipViolations(
  guardId: string,
  options: {
    endSelfAuditSkipped?: boolean;
    locationPhotoSkipped?: boolean;
    endReportSkipped?: boolean;
  },
  shiftEndedAt?: string
): ShiftAuditViolation[] {
  const reviewExpiresAt = shiftEndedAt
    ? new Date(new Date(shiftEndedAt).getTime() + SHIFT_CHECKPOINT_REVIEW_WINDOW_MS).toISOString()
    : reviewExpiry();
  const violations: ShiftAuditViolation[] = [];
  if (options.endSelfAuditSkipped) {
    violations.push(
      createSystemCheckpointViolation({
        checkpoint: 'end',
        category: 'skipped-end-self-audit',
        label: 'Skipped end self-audit',
        description: 'Guard ended shift without completing end-of-shift self-audit photos.',
        guardId,
        reviewExpiresAt,
      })
    );
  }
  if (options.locationPhotoSkipped) {
    violations.push(
      createSystemCheckpointViolation({
        checkpoint: 'end',
        category: 'skipped-location-photo',
        label: 'No end location photo',
        description: 'Guard ended shift without a photo of the post or site location.',
        guardId,
        reviewExpiresAt,
      })
    );
  }
  if (options.endReportSkipped) {
    violations.push(
      createSystemCheckpointViolation({
        checkpoint: 'end',
        category: 'skipped-end-report',
        label: 'Skipped end-of-shift report',
        description: 'Guard ended shift without submitting an end-of-shift activity report.',
        guardId,
        reviewExpiresAt,
      })
    );
  }
  return violations;
}

export function createNotReadyBriefingViolation(guardId: string): ShiftAuditViolation {
  return createSystemCheckpointViolation({
    checkpoint: 'briefing',
    category: 'not-ready',
    label: "You weren't ready",
    description:
      'Guard arrived on site without reviewing the pre-shift briefing. The client had no advance notice to prepare, and briefing must be completed on site before clock-in.',
    guardId,
  });
}

export function mergeShiftAuditViolations(
  existing: ShiftAuditViolation[] | undefined,
  additions: ShiftAuditViolation[]
): ShiftAuditViolation[] {
  return additions.reduce((acc, v) => appendShiftAuditViolation(acc, v), existing ?? []);
}

export function markCheckpointVerified(
  violations: ShiftAuditViolation[] | undefined,
  checkpoint: ShiftCheckpointKind
): ShiftAuditViolation[] {
  return (violations ?? []).map((v) =>
    v.checkpoint === checkpoint && ['auto-flagged', 'flagged', 'dispute-open'].includes(v.status)
      ? { ...v, status: 'dismissed' as ShiftAuditViolationStatus, dispute: v.dispute ? { ...v.dispute, status: 'dismissed', resolvedAt: new Date().toISOString(), resolutionNote: 'Client verified checkpoint.' } : undefined }
      : v
  );
}

export function guardCanDisputeViolation(violation: ShiftAuditViolation, nowMs = Date.now()): boolean {
  if (!violation.dispute || violation.dispute.status !== 'open') return false;
  if (['dismissed', 'verified', 'expired'].includes(violation.status)) return false;
  return nowMs <= new Date(violation.dispute.disputeDeadlineAt).getTime();
}

export function submitGuardDispute(
  violations: ShiftAuditViolation[],
  violationId: string,
  guardNote: string
): ShiftAuditViolation[] {
  const trimmed = guardNote.trim();
  if (!trimmed) return violations;
  return violations.map((v) => {
    if (v.id !== violationId || !guardCanDisputeViolation(v)) return v;
    return {
      ...v,
      status: 'dispute-open',
      dispute: {
        ...v.dispute!,
        status: 'open',
        guardNote: trimmed,
        guardSubmittedAt: new Date().toISOString(),
      },
    };
  });
}

export function resolveAuditViolation(
  violations: ShiftAuditViolation[],
  violationId: string,
  action: 'uphold' | 'dismiss',
  resolvedBy: string,
  resolutionNote?: string
): ShiftAuditViolation[] {
  const now = new Date().toISOString();
  return violations.map((v) => {
    if (v.id !== violationId) return v;
    const status: ShiftAuditViolationStatus = action === 'uphold' ? 'upheld' : 'dismissed';
    return {
      ...v,
      status,
      dispute: {
        ...v.dispute!,
        status: action === 'uphold' ? 'upheld' : 'dismissed',
        resolvedAt: now,
        resolvedBy,
        resolutionNote,
      },
    };
  });
}

export function processAutoUpholdDisputes(
  violations: ShiftAuditViolation[] | undefined,
  nowMs = Date.now()
): ShiftAuditViolation[] {
  return (violations ?? []).map((v) => {
    if (!v.dispute || v.dispute.status !== 'open') return v;
    if (v.dispute.guardSubmittedAt) return v;
    if (nowMs <= new Date(v.dispute.disputeDeadlineAt).getTime()) return v;
    return {
      ...v,
      status: 'upheld',
      dispute: {
        ...v.dispute,
        status: 'upheld',
        resolvedAt: new Date(nowMs).toISOString(),
        resolvedBy: 'system',
        resolutionNote: 'Auto-upheld after dispute window expired with no guard response.',
      },
    };
  });
}

export function processExpiredEndReviews(
  request: SecurityRequest,
  nowMs = Date.now()
): ShiftAuditViolation[] {
  const violations = [...(request.shiftAuditViolations ?? [])];
  const endAt = request.checkOutAudit?.checkedAt;
  if (!endAt) return violations;

  const expired =
    nowMs >
    new Date(endAt).getTime() + SHIFT_CHECKPOINT_REVIEW_WINDOW_MS;

  if (!expired) return violations;

  const endConfirmed = !!request.checkOutAudit?.clientConfirmedAt;
  const hasOpenEndFlags = violations.some(
    (v) =>
      v.checkpoint === 'end' &&
      ['auto-flagged', 'flagged', 'dispute-open'].includes(v.status)
  );

  if (endConfirmed || hasOpenEndFlags) return violations;

  return violations;
}

export function flagReasonLabel(
  checkpoint: ShiftCheckpointKind,
  category: string
): string {
  const options =
    checkpoint === 'end' ? END_CHECKPOINT_FLAG_REASONS : START_CHECKPOINT_FLAG_REASONS;
  return options.find((o) => o.value === category)?.label ?? category;
}
