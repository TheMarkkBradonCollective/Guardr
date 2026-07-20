import type { GovIdRevision, GovIdRevisionEvent, SecurityGuard } from '../types';
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
  idFrontUrl?: string;
  idNumber?: string;
  idState?: string;
}): string {
  return [
    parts.idFrontUrl?.trim() ?? '',
    parts.idNumber?.trim() ?? '',
    parts.idState?.trim() ?? '',
  ].join('|');
}

function revisionQualifiesAsArchiveHistory(
  revision: GovIdRevision,
  currentFingerprint: string
): boolean {
  const fp = documentFingerprint(revision);
  if (!revision.idFrontUrl?.trim()) return false;
  if (revision.event === 'superseded') return true;
  if (revision.event === 'rejected' && fp !== currentFingerprint) return true;
  if (revision.event === 'update_submitted' && fp !== currentFingerprint) return true;
  return false;
}

function revisionToArchiveItem(revision: GovIdRevision): CredentialRecordDisplayItem {
  const front = revision.idFrontUrl?.trim();
  const images = [
    front ? { id: `${revision.id}-front`, label: 'ID front', url: front } : null,
    revision.idBackUrl?.trim()
      ? { id: `${revision.id}-back`, label: 'ID back', url: revision.idBackUrl.trim() }
      : null,
    revision.idSelfieUrl?.trim()
      ? { id: `${revision.id}-selfie`, label: 'Identity selfie', url: revision.idSelfieUrl.trim() }
      : null,
  ].filter((image): image is { id: string; label: string; url: string } => image != null);

  return {
    id: revision.id,
    recordedAt: revision.recordedAt,
    label: formatArchiveLabel(revision.recordedAt),
    status: revision.status,
    thumbnailUrl: front,
    number: revision.idNumber?.trim(),
    note: revision.note,
    isArchiveHistory: true,
    images: images.length ? images : undefined,
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

export function createGovIdRevisionId(): string {
  return crypto.randomUUID();
}

export function snapshotGovIdRevision(
  guard: Pick<
    SecurityGuard,
    | 'idDocumentType'
    | 'idLicenseClass'
    | 'idState'
    | 'idNumber'
    | 'idExpiryDate'
    | 'idFrontUrl'
    | 'idBackUrl'
    | 'idSelfieUrl'
    | 'idVerificationStatus'
    | 'idVerificationRejectionReason'
  >,
  event: GovIdRevisionEvent,
  options?: { note?: string; recordedAt?: string }
): GovIdRevision {
  const status =
    guard.idVerificationStatus === 'verified' ||
    guard.idVerificationStatus === 'pending' ||
    guard.idVerificationStatus === 'rejected'
      ? guard.idVerificationStatus
      : 'pending';

  return {
    id: createGovIdRevisionId(),
    recordedAt: options?.recordedAt ?? new Date().toISOString(),
    event,
    status,
    idDocumentType: guard.idDocumentType,
    idLicenseClass: guard.idLicenseClass,
    idState: guard.idState,
    idNumber: guard.idNumber,
    idExpiryDate: guard.idExpiryDate,
    idFrontUrl: guard.idFrontUrl,
    idBackUrl: guard.idBackUrl,
    idSelfieUrl: guard.idSelfieUrl,
    note: options?.note ?? guard.idVerificationRejectionReason,
  };
}

export function prependGovIdRevision(
  history: GovIdRevision[] | undefined,
  revision: GovIdRevision
): GovIdRevision[] {
  return [revision, ...(history ?? [])];
}

export function getGovIdArchiveHistory(guard: SecurityGuard): CredentialRecordDisplayItem[] {
  const currentFingerprint = documentFingerprint(guard);
  return dedupeArchiveItems(
    [...(guard.idRevisionHistory ?? [])]
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
      .filter((revision) => revisionQualifiesAsArchiveHistory(revision, currentFingerprint))
      .map(revisionToArchiveItem)
  );
}

export function parseGovIdRevisionHistory(value: unknown): GovIdRevision[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is GovIdRevision => {
      return (
        entry != null &&
        typeof entry === 'object' &&
        typeof (entry as GovIdRevision).id === 'string' &&
        typeof (entry as GovIdRevision).recordedAt === 'string'
      );
    })
    .map((entry) => ({ ...entry }));
}
