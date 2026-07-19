import type {
  Certification,
  CertificationPendingUpdate,
  CertificationRevision,
  CertificationRevisionEvent,
} from '../types';
import type { CredentialRecordDisplayItem } from './credentialRecords';
import { formatStateName } from './states';

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

function certRecordDetails(item: {
  issuer?: string;
  number?: string;
  state?: string;
  expiryDate?: string;
}): CredentialRecordDisplayItem['details'] {
  const details = [
    item.issuer ? { label: 'Issuing organization', value: item.issuer } : null,
    item.number ? { label: 'License / cert number', value: item.number } : null,
    item.state ? { label: 'State', value: formatStateName(item.state) } : null,
    item.expiryDate
      ? {
          label: 'Expiration date',
          value: new Date(`${item.expiryDate}T12:00:00`).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        }
      : null,
  ].filter((row): row is { label: string; value: string } => Boolean(row));

  return details.length ? details : undefined;
}

function certRecordFromParts(parts: {
  id: string;
  recordedAt: string;
  label: string;
  status: CredentialRecordDisplayItem['status'];
  issuer?: string;
  number?: string;
  state?: string;
  expiryDate?: string;
  imageUrl?: string;
  note?: string;
  isCurrentOnFile?: boolean;
  isPendingReview?: boolean;
  isArchiveHistory?: boolean;
}): CredentialRecordDisplayItem {
  const imageUrl = parts.imageUrl?.trim();
  const { issuer, state, expiryDate, imageUrl: _imageUrl, ...rest } = parts;
  return {
    ...rest,
    thumbnailUrl: imageUrl,
    details: certRecordDetails({ issuer, number: parts.number, state, expiryDate }),
    images: imageUrl ? [{ id: `${parts.id}-image`, label: parts.label, url: imageUrl }] : undefined,
  };
}

function formatArchiveLabel(recordedAt: string): string {
  const date = new Date(recordedAt);
  if (Number.isNaN(date.getTime())) return 'Previous upload';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function documentFingerprint(parts: {
  imageUrl?: string;
  number?: string;
  issuer?: string;
}): string {
  return [parts.imageUrl?.trim() ?? '', parts.number?.trim() ?? '', parts.issuer?.trim() ?? ''].join('|');
}

function revisionQualifiesAsArchiveHistory(
  revision: CertificationRevision,
  currentFingerprint: string,
  pendingFingerprint: string | null
): boolean {
  const fp = documentFingerprint(revision);

  if (revision.event === 'superseded') {
    return Boolean(revision.imageUrl?.trim());
  }

  if (revision.event === 'rejected') {
    return Boolean(revision.imageUrl?.trim()) && fp !== currentFingerprint && fp !== pendingFingerprint;
  }

  if (revision.event === 'update_submitted') {
    return Boolean(revision.imageUrl?.trim()) && fp !== currentFingerprint && fp !== pendingFingerprint;
  }

  return false;
}

function revisionToArchiveItem(revision: CertificationRevision): CredentialRecordDisplayItem {
  return certRecordFromParts({
    id: revision.id,
    recordedAt: revision.recordedAt,
    label: formatArchiveLabel(revision.recordedAt),
    status: revision.status,
    issuer: revision.issuer,
    number: revision.number,
    state: revision.state,
    expiryDate: revision.expiryDate,
    imageUrl: revision.imageUrl,
    note: revision.note,
    isArchiveHistory: true,
  });
}

function dedupeArchiveItems(items: CredentialRecordDisplayItem[]): CredentialRecordDisplayItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const fp = documentFingerprint({
      imageUrl: item.thumbnailUrl,
      number: item.number,
      issuer: item.details?.find((d) => d.label === 'Issuing organization')?.value,
    });
    if (!fp.replace(/\|/g, '')) return true;
    if (seen.has(fp)) return false;
    seen.add(fp);
    return true;
  });
}

/** Newest-first timeline for credential detail views. */
export function getCertificationRevisionTimeline(cert: Certification): CredentialRecordDisplayItem[] {
  const items: CredentialRecordDisplayItem[] = [];

  if (cert.pendingUpdate) {
    items.push(
      certRecordFromParts({
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
      })
    );
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
    items.push(
      certRecordFromParts({
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
      })
    );
  }

  const currentFingerprint = documentFingerprint(cert);
  const pendingFingerprint = cert.pendingUpdate ? documentFingerprint(cert.pendingUpdate) : null;

  const historyItems = dedupeArchiveItems(
    [...(cert.revisionHistory ?? [])]
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
      .filter((revision) =>
        revisionQualifiesAsArchiveHistory(revision, currentFingerprint, pendingFingerprint)
      )
      .map(revisionToArchiveItem)
  );

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
