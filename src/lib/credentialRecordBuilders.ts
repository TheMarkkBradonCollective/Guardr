import type { SecurityGuard } from '../types';
import {
  formatIdExpiryLabel,
  getGuardIdVerificationStatus,
  guardHasGovernmentIdOnFile,
  ID_VERIFICATION_SLOT_LABELS,
  isIdExpired,
} from './guardIdentityVerification';
import { formatCoiSummaryLine, guardInsuranceSubmitted, resolveInsuranceStatus } from './guardInsurance';
import { formatStateName } from './states';
import type { CredentialRecordDisplayItem, CredentialRecordStatus } from './credentialRecords';

function mapInsuranceStatus(status: ReturnType<typeof resolveInsuranceStatus>): CredentialRecordStatus {
  if (status === 'verified') return 'verified';
  if (status === 'rejected') return 'rejected';
  return 'pending';
}

function mapIdStatus(status: ReturnType<typeof getGuardIdVerificationStatus>): CredentialRecordStatus {
  if (status === 'verified') return 'verified';
  if (status === 'rejected') return 'rejected';
  return 'pending';
}

function formatDisplayDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getCoiCredentialRecords(guard: SecurityGuard): CredentialRecordDisplayItem[] {
  const policy = guard.insurancePolicy;
  if (!policy || (!policy.documentUrl?.trim() && !policy.carrier?.trim() && !policy.policyNumber?.trim())) {
    return [];
  }

  const resolved = resolveInsuranceStatus(policy);
  const status = mapInsuranceStatus(resolved);
  const documentUrl = policy.documentUrl?.trim();
  const details = [
    { label: 'Category', value: 'Certificate of Insurance' },
    { label: 'Insurance carrier', value: policy.carrier?.trim() || '' },
    { label: 'Policy number', value: policy.policyNumber?.trim() || '' },
    policy.generalLiabilityLimit != null
      ? { label: 'General liability limit', value: `$${policy.generalLiabilityLimit.toLocaleString()}` }
      : null,
    policy.effectiveDate ? { label: 'Effective date', value: formatDisplayDate(policy.effectiveDate) ?? '' } : null,
    policy.expiryDate ? { label: 'Expiration date', value: formatDisplayDate(policy.expiryDate) ?? '' } : null,
  ].filter((row): row is { label: string; value: string } => Boolean(row?.value));

  return [
    {
      id: `coi-${guard.id}`,
      recordedAt: policy.submittedAt ?? policy.reviewedAt ?? policy.effectiveDate ?? new Date().toISOString(),
      label: status === 'verified' ? 'Current on file' : 'Current submission',
      status,
      thumbnailUrl: documentUrl,
      number: policy.policyNumber?.trim(),
      note: resolved === 'rejected' ? policy.rejectionReason : undefined,
      isCurrentOnFile: status === 'verified',
      isPendingReview: status === 'pending' && guardInsuranceSubmitted(guard),
      details,
      images: documentUrl
        ? [{ id: 'coi-document', label: 'Certificate of Insurance', url: documentUrl }]
        : undefined,
    },
  ];
}

export function getGovIdCredentialRecords(guard: SecurityGuard): CredentialRecordDisplayItem[] {
  if (!guardHasGovernmentIdOnFile(guard)) return [];

  const verificationStatus = getGuardIdVerificationStatus(guard);
  const status = mapIdStatus(verificationStatus);
  const expired = isIdExpired(guard);
  const expiryLabel = formatIdExpiryLabel(guard.idExpiryDate);
  const images = [
    guard.idFrontUrl?.trim()
      ? { id: 'id-front', label: ID_VERIFICATION_SLOT_LABELS.front, url: guard.idFrontUrl.trim() }
      : null,
    guard.idBackUrl?.trim()
      ? { id: 'id-back', label: ID_VERIFICATION_SLOT_LABELS.back, url: guard.idBackUrl.trim() }
      : null,
    guard.idSelfieUrl?.trim()
      ? { id: 'id-selfie', label: ID_VERIFICATION_SLOT_LABELS.selfie, url: guard.idSelfieUrl.trim() }
      : null,
  ].filter(
    (image): image is { id: string; label: (typeof ID_VERIFICATION_SLOT_LABELS)[keyof typeof ID_VERIFICATION_SLOT_LABELS]; url: string } =>
      image != null
  );

  const details = [
    guard.idState ? { label: 'Issuing state', value: formatStateName(guard.idState) } : null,
    guard.idNumber?.trim() ? { label: 'ID number', value: `#${guard.idNumber.trim()}` } : null,
    expiryLabel
      ? {
          label: 'Expiration date',
          value: expired ? `Expired ${expiryLabel}` : expiryLabel,
        }
      : null,
    guard.idVerificationSubmittedAt
      ? {
          label: 'Submitted',
          value: new Date(guard.idVerificationSubmittedAt).toLocaleString(),
        }
      : null,
  ].filter((row): row is { label: string; value: string } => Boolean(row?.value));

  return [
    {
      id: `gov-id-${guard.id}`,
      recordedAt: guard.idVerificationSubmittedAt ?? guard.idExpiryDate ?? new Date().toISOString(),
      label: status === 'verified' ? 'Current on file' : 'Current submission',
      status,
      thumbnailUrl: guard.idFrontUrl?.trim(),
      number: guard.idNumber?.trim(),
      note: verificationStatus === 'rejected' ? guard.idVerificationRejectionReason : undefined,
      isCurrentOnFile: status === 'verified',
      isPendingReview: status === 'pending',
      details,
      images: images.length ? images : undefined,
    },
  ];
}

export function getCoiCredentialRecordSummary(guard: SecurityGuard): string {
  const policy = guard.insurancePolicy;
  if (!policy) return 'Certificate of Insurance';
  return policy.carrier?.trim() || formatCoiSummaryLine(policy);
}
