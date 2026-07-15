import type {
  Certification,
  CertificationPendingUpdate,
  CertificationRevision,
  CertificationRevisionEvent,
} from '../types';

export interface CertificationRevisionDisplayItem {
  id: string;
  recordedAt: string;
  label: string;
  status: 'verified' | 'pending' | 'rejected';
  issuer?: string;
  number?: string;
  state?: string;
  expiryDate?: string;
  imageUrl?: string;
  note?: string;
  isCurrentOnFile?: boolean;
  isPendingReview?: boolean;
}

const REVISION_EVENT_LABELS: Record<CertificationRevisionEvent, string> = {
  submitted: 'Submitted',
  verified: 'Verified',
  rejected: 'Rejected',
  update_requested: 'Update requested',
  update_submitted: 'Update submitted',
  superseded: 'Previous version',
};

export function certUpdateSubmissionAllowed(
  cert: Pick<Certification, 'status' | 'updateRequestedAt' | 'pendingUpdate'>
): boolean {
  return (
    cert.status === 'verified' &&
    Boolean(cert.updateRequestedAt) &&
    !cert.pendingUpdate
  );
}

export function certHasPendingUpdate(
  cert: Pick<Certification, 'pendingUpdate'>
): boolean {
  return cert.pendingUpdate?.status === 'pending';
}

export function createCertRevisionId(): string {
  return crypto.randomUUID();
}

export function snapshotCertRevision(
  cert: Pick<
    Certification,
    'issuer' | 'number' | 'state' | 'expiryDate' | 'imageUrl' | 'status' | 'rejectionReason'
  >,
  event: CertificationRevisionEvent,
  options?: { note?: string; recordedAt?: string }
): CertificationRevision {
  return {
    id: createCertRevisionId(),
    recordedAt: options?.recordedAt ?? new Date().toISOString(),
    event,
    status: cert.status,
    issuer: cert.issuer,
    number: cert.number,
    state: cert.state,
    expiryDate: cert.expiryDate,
    imageUrl: cert.imageUrl,
    note: options?.note ?? cert.rejectionReason,
  };
}

export function prependCertRevision(
  history: CertificationRevision[] | undefined,
  revision: CertificationRevision
): CertificationRevision[] {
  return [revision, ...(history ?? [])];
}

export function pendingUpdateFromPayload(payload: {
  issuer: string;
  number: string;
  state?: string;
  expiryDate?: string;
  imageUrl?: string;
}): CertificationPendingUpdate {
  return {
    submittedAt: new Date().toISOString(),
    issuer: payload.issuer,
    number: payload.number,
    state: payload.state,
    expiryDate: payload.expiryDate,
    imageUrl: payload.imageUrl,
    status: 'pending',
  };
}

function revisionToDisplayItem(revision: CertificationRevision): CertificationRevisionDisplayItem {
  return {
    id: revision.id,
    recordedAt: revision.recordedAt,
    label: REVISION_EVENT_LABELS[revision.event],
    status: revision.status,
    issuer: revision.issuer,
    number: revision.number,
    state: revision.state,
    expiryDate: revision.expiryDate,
    imageUrl: revision.imageUrl,
    note: revision.note,
  };
}

/** Newest-first timeline for credential detail views. */
export function getCertificationRevisionTimeline(
  cert: Certification
): CertificationRevisionDisplayItem[] {
  const items: CertificationRevisionDisplayItem[] = [];

  if (cert.pendingUpdate) {
    items.push({
      id: `pending-${cert.id}`,
      recordedAt: cert.pendingUpdate.submittedAt,
      label: 'Update submitted',
      status: cert.pendingUpdate.status,
      issuer: cert.pendingUpdate.issuer,
      number: cert.pendingUpdate.number,
      state: cert.pendingUpdate.state,
      expiryDate: cert.pendingUpdate.expiryDate,
      imageUrl: cert.pendingUpdate.imageUrl,
      note: cert.pendingUpdate.rejectionReason,
      isPendingReview: cert.pendingUpdate.status === 'pending',
    });
  }

  if (cert.updateRequestedAt && !cert.pendingUpdate) {
    items.push({
      id: `request-${cert.id}`,
      recordedAt: cert.updateRequestedAt,
      label: 'Update requested',
      status: 'pending',
      note: cert.updateRequestNote,
    });
  }

  if (cert.status === 'verified' || cert.imageUrl || cert.issuer || cert.number) {
    items.push({
      id: `current-${cert.id}`,
      recordedAt: cert.updateRequestedAt ?? cert.issueDate,
      label: cert.status === 'verified' ? 'Current on file' : 'Current submission',
      status: cert.status,
      issuer: cert.issuer,
      number: cert.number,
      state: cert.state,
      expiryDate: cert.expiryDate,
      imageUrl: cert.imageUrl,
      note: cert.rejectionReason,
      isCurrentOnFile: cert.status === 'verified',
    });
  }

  const historyItems = [...(cert.revisionHistory ?? [])]
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
    .map(revisionToDisplayItem);

  return [...items, ...historyItems];
}

export function parseCertificationRevisionHistory(value: unknown): CertificationRevision[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is CertificationRevision => {
      return (
        entry != null &&
        typeof entry === 'object' &&
        typeof (entry as CertificationRevision).id === 'string' &&
        typeof (entry as CertificationRevision).recordedAt === 'string'
      );
    })
    .map((entry) => ({ ...entry }));
}

export function parseCertificationPendingUpdate(value: unknown): CertificationPendingUpdate | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const row = value as CertificationPendingUpdate;
  if (typeof row.submittedAt !== 'string' || typeof row.issuer !== 'string' || typeof row.number !== 'string') {
    return undefined;
  }
  return { ...row };
}

export function certRevisionDbPatch(cert: Certification): Record<string, unknown> {
  return {
    revision_history: cert.revisionHistory ?? [],
    pending_update: cert.pendingUpdate ?? null,
    update_requested_at: cert.updateRequestedAt ?? null,
    update_request_note: cert.updateRequestNote ?? null,
  };
}
