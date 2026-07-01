import type { GuardInsurancePolicy, SecurityGuard } from '../types';
import type { CourseUploadStatus } from './certStatus';
import { isSelfSubmittedGuardAccount } from './approvalSubmissions';

export const INSURANCE_STATUS_LABELS: Record<GuardInsurancePolicy['status'], string> = {
  not_submitted: 'Not submitted',
  pending: 'Pending review',
  verified: 'Verified',
  rejected: 'Rejected',
  expired: 'Expired',
};

export function isInsuranceExpired(policy: Pick<GuardInsurancePolicy, 'expiryDate' | 'status'>): boolean {
  if (policy.status === 'expired') return true;
  if (!policy.expiryDate) return false;
  const expiry = new Date(`${policy.expiryDate}T23:59:59`);
  return !Number.isNaN(expiry.getTime()) && expiry.getTime() < Date.now();
}

export function resolveInsuranceStatus(policy: GuardInsurancePolicy): GuardInsurancePolicy['status'] {
  if (policy.status === 'rejected') return 'rejected';
  if (policy.status === 'not_submitted') return 'not_submitted';
  if (isInsuranceExpired(policy)) return 'expired';
  if (policy.status === 'verified') return 'verified';
  return 'pending';
}

export function guardHasValidInsurance(guard: Pick<SecurityGuard, 'insurancePolicy'>): boolean {
  const policy = guard.insurancePolicy;
  if (!policy) return false;
  return resolveInsuranceStatus(policy) === 'verified';
}

export function guardInsuranceSubmitted(guard: Pick<SecurityGuard, 'insurancePolicy'>): boolean {
  const policy = guard.insurancePolicy;
  if (!policy) return false;
  return policy.status !== 'not_submitted' && !!policy.documentUrl?.trim();
}

export function guardCoiOnFile(guard: Pick<SecurityGuard, 'insurancePolicy'>): boolean {
  const policy = guard.insurancePolicy;
  return Boolean(policy?.documentUrl?.trim() || policy?.carrier?.trim());
}

export function formatCoiSummaryLine(policy: GuardInsurancePolicy | undefined): string {
  if (!policy?.carrier?.trim() && !policy?.policyNumber?.trim()) {
    return 'Certificate of Insurance not on file';
  }
  const parts: string[] = [];
  if (policy.carrier?.trim()) parts.push(policy.carrier.trim());
  if (policy.policyNumber?.trim()) parts.push(`#${policy.policyNumber.trim()}`);
  return parts.join(' · ');
}

export function getCoiUploadStatus(guard: Pick<SecurityGuard, 'insurancePolicy'>): CourseUploadStatus {
  const policy = guard.insurancePolicy;
  if (!policy) return 'missing';
  if (!policy.documentUrl?.trim() && !policy.carrier?.trim()) return 'missing';
  if (resolveInsuranceStatus(policy) === 'expired') return 'expired';
  if (!policy.documentUrl?.trim()) return 'listed';
  return 'on-file';
}

export function getCoiCredentialUploadLabel(guard: Pick<SecurityGuard, 'insurancePolicy'>): string | null {
  const status = getCoiUploadStatus(guard);
  if (status === 'on-file') return 'On file';
  if (status === 'expired') return 'On file';
  if (status === 'listed') return 'Incomplete — upload COI document';
  return 'Not on file';
}

export function getCoiCredentialVerificationLabel(guard: Pick<SecurityGuard, 'insurancePolicy'>): string {
  const policy = guard.insurancePolicy;
  if (!policy) return 'Not submitted';
  return INSURANCE_STATUS_LABELS[resolveInsuranceStatus(policy)];
}

export function getCoiCredentialUploadBadgeClass(guard: Pick<SecurityGuard, 'insurancePolicy'>): string {
  const status = getCoiUploadStatus(guard);
  if (status === 'on-file' || status === 'expired') {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
  }
  return 'border-brand-border bg-brand-surface-elevated text-brand-text-muted';
}

export function getCoiCredentialVerificationBadgeClass(guard: Pick<SecurityGuard, 'insurancePolicy'>): string {
  const policy = guard.insurancePolicy;
  const resolved = policy ? resolveInsuranceStatus(policy) : 'not_submitted';
  if (resolved === 'verified') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
  if (resolved === 'pending') return 'border-amber-500/30 bg-amber-500/10 text-amber-400';
  if (resolved === 'rejected' || resolved === 'expired') return 'border-red-500/30 bg-red-500/10 text-red-400';
  return 'border-brand-border bg-brand-surface-elevated text-brand-text-muted';
}

/** Guard-facing activation checklist copy for COI. */
export function guardInsuranceActivationDetail(guard: Pick<SecurityGuard, 'insurancePolicy'>): {
  done: boolean;
  detail: string;
} {
  if (guardHasValidInsurance(guard)) {
    return { done: true, detail: 'Certificate of Insurance verified by staff' };
  }
  const policy = guard.insurancePolicy;
  if (!policy || policy.status === 'not_submitted' || !policy.documentUrl?.trim()) {
    return {
      done: false,
      detail: 'Upload your general liability Certificate of Insurance (COI)',
    };
  }
  const status = resolveInsuranceStatus(policy);
  if (status === 'pending') {
    return { done: false, detail: 'Submitted — awaiting staff verification' };
  }
  if (status === 'rejected') {
    return {
      done: false,
      detail: policy.rejectionReason
        ? `Rejected — ${policy.rejectionReason}`
        : 'Rejected — upload an updated COI',
    };
  }
  if (status === 'expired') {
    return { done: false, detail: 'Expired — upload a current COI' };
  }
  return { done: false, detail: 'Upload your Certificate of Insurance' };
}

export function guardHasInsuranceSubmitted(guard: Pick<SecurityGuard, 'insurancePolicy'>): boolean {
  const policy = guard.insurancePolicy;
  if (!policy) return false;
  return Boolean(
    policy.carrier?.trim() &&
      policy.policyNumber?.trim() &&
      policy.expiryDate &&
      policy.documentUrl
  );
}

/** Pending COI uploaded by the guard awaiting staff verification. */
export function isUserSubmittedPendingInsurance(guard: SecurityGuard): boolean {
  if (guard.isStaff) return false;
  const policy = guard.insurancePolicy;
  if (!policy?.documentUrl?.trim()) return false;
  if (resolveInsuranceStatus(policy) !== 'pending') return false;
  return isSelfSubmittedGuardAccount(guard);
}

export function getPendingInsuranceReviews(guards: SecurityGuard[]): SecurityGuard[] {
  return guards.filter(isUserSubmittedPendingInsurance);
}

export function buildInsuranceSubmissionBlockers(
  guard: Pick<SecurityGuard, 'insurancePolicy'>
): string[] {
  const policy = guard.insurancePolicy;
  const blockers: string[] = [];

  if (!guardHasInsuranceSubmitted(guard)) {
    blockers.push(
      'Certificate of Insurance not on file — general liability COI required for independent contractors'
    );
    return blockers;
  }

  const status = resolveInsuranceStatus(policy!);
  if (status === 'rejected') {
    blockers.push(
      policy?.rejectionReason
        ? `Insurance COI rejected — ${policy.rejectionReason}`
        : 'Insurance COI rejected — guard must upload an updated certificate'
    );
  } else if (status === 'expired') {
    blockers.push('Insurance COI has expired — guard must upload a current certificate');
  }

  return blockers;
}

/** @deprecated Use buildInsuranceSubmissionBlockers — verification is for client trust, not approval. */
export function buildInsuranceApprovalBlockers(
  guard: Pick<SecurityGuard, 'insurancePolicy'>
): string[] {
  return buildInsuranceSubmissionBlockers(guard);
}

/** Guards may upload COI until staff verifies or while a submission is pending review. */
export function guardCoiCanGuardEdit(guard: Pick<SecurityGuard, 'insurancePolicy'>): boolean {
  if (guardHasValidInsurance(guard)) return false;
  const policy = guard.insurancePolicy;
  if (!policy || policy.status === 'not_submitted') return true;
  const status = resolveInsuranceStatus(policy);
  if (status === 'rejected' || status === 'expired') return true;
  if (status === 'pending' && policy.documentUrl?.trim()) return false;
  return !policy.documentUrl?.trim();
}

export function guardInsuranceBlockedMessage(guard: Pick<SecurityGuard, 'insurancePolicy'>): string | null {
  const policy = guard.insurancePolicy;
  if (!policy || policy.status === 'not_submitted') {
    return 'Upload a current Certificate of Insurance (general liability) before your profile can be approved or you can apply to jobs.';
  }
  const status = resolveInsuranceStatus(policy);
  if (status === 'pending') {
    return 'Your insurance certificate is on file — staff verification is shown to clients for trust.';
  }
  if (status === 'rejected') {
    return policy.rejectionReason
      ? `Insurance certificate rejected: ${policy.rejectionReason}`
      : 'Your insurance certificate was rejected — upload an updated COI in Credentials.';
  }
  if (status === 'expired') {
    return 'Your insurance certificate has expired — upload a current COI in Credentials.';
  }
  if (status !== 'verified') {
    return 'A verified insurance certificate is required before applying to jobs.';
  }
  return null;
}

export function insurancePolicyFromRow(row: Record<string, unknown>): GuardInsurancePolicy {
  return {
    id: String(row.id),
    guardId: String(row.guard_id),
    carrier: String(row.carrier ?? ''),
    policyNumber: String(row.policy_number ?? ''),
    generalLiabilityLimit:
      row.general_liability_limit != null ? Number(row.general_liability_limit) : undefined,
    effectiveDate: row.effective_date ? String(row.effective_date) : undefined,
    expiryDate: row.expiry_date ? String(row.expiry_date) : undefined,
    documentUrl: row.document_url ? String(row.document_url) : undefined,
    status: (['not_submitted', 'pending', 'verified', 'rejected', 'expired'].includes(
      String(row.status)
    )
      ? row.status
      : 'not_submitted') as GuardInsurancePolicy['status'],
    rejectionReason: row.rejection_reason ? String(row.rejection_reason) : undefined,
    submittedAt: row.submitted_at ? String(row.submitted_at) : undefined,
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : undefined,
    reviewedBy: row.reviewed_by ? String(row.reviewed_by) : undefined,
  };
}

export function insurancePolicyToDbRow(
  policy: Partial<GuardInsurancePolicy> & { guardId: string }
): Record<string, unknown> {
  return {
    guard_id: policy.guardId,
    carrier: policy.carrier ?? '',
    policy_number: policy.policyNumber ?? '',
    general_liability_limit: policy.generalLiabilityLimit ?? null,
    effective_date: policy.effectiveDate ?? null,
    expiry_date: policy.expiryDate ?? null,
    document_url: policy.documentUrl ?? null,
    status: policy.status ?? 'not_submitted',
    rejection_reason: policy.rejectionReason ?? null,
    submitted_at: policy.submittedAt ?? null,
    reviewed_at: policy.reviewedAt ?? null,
    reviewed_by: policy.reviewedBy ?? null,
    updated_at: new Date().toISOString(),
  };
}
