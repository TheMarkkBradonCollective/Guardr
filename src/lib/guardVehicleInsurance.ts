import type { GuardVehicleInsurancePolicy, SecurityGuard } from '../types';
import type { CourseUploadStatus } from './certStatus';

export const VEHICLE_INSURANCE_STATUS_LABELS: Record<GuardVehicleInsurancePolicy['status'], string> = {
  not_submitted: 'Not submitted',
  pending: 'Pending review',
  verified: 'Verified',
  rejected: 'Rejected',
  expired: 'Expired',
};

export function isVehicleInsuranceExpired(
  policy: Pick<GuardVehicleInsurancePolicy, 'expiryDate' | 'status'>
): boolean {
  if (policy.status === 'expired') return true;
  if (!policy.expiryDate) return false;
  const expiry = new Date(`${policy.expiryDate}T23:59:59`);
  return !Number.isNaN(expiry.getTime()) && expiry.getTime() < Date.now();
}

export function resolveVehicleInsuranceStatus(
  policy: GuardVehicleInsurancePolicy
): GuardVehicleInsurancePolicy['status'] {
  if (policy.status === 'rejected') return 'rejected';
  if (policy.status === 'not_submitted') return 'not_submitted';
  if (isVehicleInsuranceExpired(policy)) return 'expired';
  if (policy.status === 'verified') return 'verified';
  return 'pending';
}

export function guardHasVerifiedVehicleInsurance(
  guard: Pick<SecurityGuard, 'vehicleInsurancePolicy'>
): boolean {
  const policy = guard.vehicleInsurancePolicy;
  if (!policy) return false;
  return resolveVehicleInsuranceStatus(policy) === 'verified';
}

export function guardVehicleInsuranceOnFile(
  guard: Pick<SecurityGuard, 'vehicleInsurancePolicy'>
): boolean {
  const policy = guard.vehicleInsurancePolicy;
  return Boolean(policy?.documentUrl?.trim() || policy?.carrier?.trim());
}

export function guardVehicleInsuranceSubmitted(
  guard: Pick<SecurityGuard, 'vehicleInsurancePolicy'>
): boolean {
  const policy = guard.vehicleInsurancePolicy;
  if (!policy) return false;
  return policy.status !== 'not_submitted' && !!policy.documentUrl?.trim();
}

export function getVehicleInsuranceUploadStatus(
  guard: Pick<SecurityGuard, 'vehicleInsurancePolicy'>
): CourseUploadStatus {
  const policy = guard.vehicleInsurancePolicy;
  if (!policy) return 'missing';
  if (!policy.documentUrl?.trim() && !policy.carrier?.trim()) return 'missing';
  if (resolveVehicleInsuranceStatus(policy) === 'expired') return 'expired';
  if (!policy.documentUrl?.trim()) return 'listed';
  return 'on-file';
}

export function vehicleInsurancePolicyFromRow(row: Record<string, unknown>): GuardVehicleInsurancePolicy {
  return {
    id: String(row.id),
    guardId: String(row.guard_id),
    carrier: String(row.carrier ?? ''),
    policyNumber: String(row.policy_number ?? ''),
    effectiveDate: row.effective_date ? String(row.effective_date) : undefined,
    expiryDate: row.expiry_date ? String(row.expiry_date) : undefined,
    documentUrl: row.document_url ? String(row.document_url) : undefined,
    status: (['not_submitted', 'pending', 'verified', 'rejected', 'expired'].includes(String(row.status))
      ? row.status
      : 'not_submitted') as GuardVehicleInsurancePolicy['status'],
    rejectionReason: row.rejection_reason ? String(row.rejection_reason) : undefined,
    submittedAt: row.submitted_at ? String(row.submitted_at) : undefined,
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : undefined,
    reviewedBy: row.reviewed_by ? String(row.reviewed_by) : undefined,
    updateRequestedAt: row.update_requested_at ? String(row.update_requested_at) : undefined,
    updateRequestNote: row.update_request_note ? String(row.update_request_note) : undefined,
  };
}

export function vehicleInsurancePolicyToDbRow(
  policy: Partial<GuardVehicleInsurancePolicy> & { guardId: string }
): Record<string, unknown> {
  return {
    guard_id: policy.guardId,
    carrier: policy.carrier ?? '',
    policy_number: policy.policyNumber ?? '',
    effective_date: policy.effectiveDate ?? null,
    expiry_date: policy.expiryDate ?? null,
    document_url: policy.documentUrl ?? null,
    status: policy.status ?? 'not_submitted',
    rejection_reason: policy.rejectionReason ?? null,
    submitted_at: policy.submittedAt ?? null,
    reviewed_at: policy.reviewedAt ?? null,
    reviewed_by: policy.reviewedBy ?? null,
    update_requested_at: policy.updateRequestedAt ?? null,
    update_request_note: policy.updateRequestNote ?? null,
    updated_at: new Date().toISOString(),
  };
}
