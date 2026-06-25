import type { GuardInsurancePolicy, SecurityGuard } from '../types';

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

export function guardInsuranceBlockedMessage(guard: Pick<SecurityGuard, 'insurancePolicy'>): string | null {
  const policy = guard.insurancePolicy;
  if (!policy || policy.status === 'not_submitted') {
    return 'Upload a current Certificate of Insurance (general liability) in Credentials before applying to jobs.';
  }
  const status = resolveInsuranceStatus(policy);
  if (status === 'pending') {
    return 'Your insurance certificate is pending staff review. You can apply once it is verified.';
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
