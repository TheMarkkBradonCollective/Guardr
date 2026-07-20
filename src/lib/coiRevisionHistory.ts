import type { CoiRevision, CoiRevisionEvent, GuardInsurancePolicy } from '../types';
import type { CredentialRecordDisplayItem } from './credentialRecords';

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
  documentUrl?: string;
  policyNumber?: string;
  carrier?: string;
}): string {
  return [
    parts.documentUrl?.trim() ?? '',
    parts.policyNumber?.trim() ?? '',
    parts.carrier?.trim() ?? '',
  ].join('|');
}

function revisionQualifiesAsArchiveHistory(
  revision: CoiRevision,
  currentFingerprint: string
): boolean {
  const fp = documentFingerprint(revision);
  if (!revision.documentUrl?.trim()) return false;
  if (revision.event === 'superseded') return true;
  if (revision.event === 'rejected' && fp !== currentFingerprint) return true;
  if (revision.event === 'update_submitted' && fp !== currentFingerprint) return true;
  return false;
}

function revisionToArchiveItem(revision: CoiRevision): CredentialRecordDisplayItem {
  const imageUrl = revision.documentUrl?.trim();
  return {
    id: revision.id,
    recordedAt: revision.recordedAt,
    label: formatArchiveLabel(revision.recordedAt),
    status: revision.status,
    thumbnailUrl: imageUrl,
    number: revision.policyNumber?.trim(),
    note: revision.note,
    isArchiveHistory: true,
    images: imageUrl
      ? [{ id: `${revision.id}-document`, label: formatArchiveLabel(revision.recordedAt), url: imageUrl }]
      : undefined,
  };
}

function dedupeArchiveItems(items: CredentialRecordDisplayItem[]): CredentialRecordDisplayItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const fp = [item.thumbnailUrl ?? '', item.number ?? ''].join('|');
    if (!fp.replace(/\|/g, '')) return true;
    if (seen.has(fp)) return false;
    seen.add(fp);
    return true;
  });
}

export function createCoiRevisionId(): string {
  return crypto.randomUUID();
}

export function snapshotCoiRevision(
  policy: Pick<
    GuardInsurancePolicy,
    | 'carrier'
    | 'policyNumber'
    | 'generalLiabilityLimit'
    | 'effectiveDate'
    | 'expiryDate'
    | 'documentUrl'
    | 'status'
    | 'rejectionReason'
  >,
  event: CoiRevisionEvent,
  options?: { note?: string; recordedAt?: string }
): CoiRevision {
  return {
    id: createCoiRevisionId(),
    recordedAt: options?.recordedAt ?? new Date().toISOString(),
    event,
    status:
      policy.status === 'verified' || policy.status === 'pending' || policy.status === 'rejected'
        ? policy.status
        : 'pending',
    carrier: policy.carrier,
    policyNumber: policy.policyNumber,
    generalLiabilityLimit: policy.generalLiabilityLimit,
    effectiveDate: policy.effectiveDate,
    expiryDate: policy.expiryDate,
    documentUrl: policy.documentUrl,
    note: options?.note ?? policy.rejectionReason,
  };
}

export function prependCoiRevision(
  history: CoiRevision[] | undefined,
  revision: CoiRevision
): CoiRevision[] {
  return [revision, ...(history ?? [])];
}

export function getCoiArchiveHistory(policy: GuardInsurancePolicy): CredentialRecordDisplayItem[] {
  const currentFingerprint = documentFingerprint(policy);
  return dedupeArchiveItems(
    [...(policy.revisionHistory ?? [])]
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
      .filter((revision) => revisionQualifiesAsArchiveHistory(revision, currentFingerprint))
      .map(revisionToArchiveItem)
  );
}

export function parseCoiRevisionHistory(value: unknown): CoiRevision[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is CoiRevision => {
      return (
        entry != null &&
        typeof entry === 'object' &&
        typeof (entry as CoiRevision).id === 'string' &&
        typeof (entry as CoiRevision).recordedAt === 'string'
      );
    })
    .map((entry) => ({ ...entry }));
}
