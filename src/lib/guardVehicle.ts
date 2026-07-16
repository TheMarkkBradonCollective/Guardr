import type { GuardVehicleProfile, SecurityGuard } from '../types';
import { getGuardIdVerificationStatus } from './guardIdentityVerification';
import {
  guardHasVerifiedVehicleInsurance,
  guardVehicleInsuranceIsExpired,
  guardVehicleInsuranceOnFile,
  guardVehicleInsuranceSubmitted,
  isVehicleInsuranceExpired,
} from './guardVehicleInsurance';

export const VEHICLE_PHOTO_SLOTS = [
  { id: 'front', label: 'Front' },
  { id: 'left', label: 'Left side' },
  { id: 'right', label: 'Right side' },
  { id: 'back', label: 'Back' },
] as const;

export type VehiclePhotoSlotId = (typeof VEHICLE_PHOTO_SLOTS)[number]['id'];

export function guardHasDriversLicenseOnFile(
  guard: Pick<
    SecurityGuard,
    | 'idDocumentType'
    | 'idFrontUrl'
    | 'idBackUrl'
    | 'idSelfieUrl'
    | 'idState'
    | 'idNumber'
    | 'idExpiryDate'
  >
): boolean {
  if (guard.idDocumentType !== 'drivers_license') return false;
  return Boolean(
    guard.idFrontUrl?.trim() &&
      guard.idBackUrl?.trim() &&
      guard.idSelfieUrl?.trim() &&
      guard.idState?.trim() &&
      guard.idNumber?.trim() &&
      guard.idExpiryDate?.trim()
  );
}

export function guardHasVerifiedDriversLicense(
  guard: Pick<SecurityGuard, 'idDocumentType' | 'idVerificationStatus'>
): boolean {
  return (
    guard.idDocumentType === 'drivers_license' &&
    getGuardIdVerificationStatus(guard) === 'verified'
  );
}

export function guardVehiclePhotosComplete(
  profile: Pick<
    GuardVehicleProfile,
    'frontPhotoUrl' | 'leftSidePhotoUrl' | 'rightSidePhotoUrl' | 'backPhotoUrl'
  >
): boolean {
  return Boolean(
    profile.frontPhotoUrl?.trim() &&
      profile.leftSidePhotoUrl?.trim() &&
      profile.rightSidePhotoUrl?.trim() &&
      profile.backPhotoUrl?.trim()
  );
}

export function guardVehicleDetailsComplete(
  profile: Pick<GuardVehicleProfile, 'make' | 'model' | 'plateNumber' | 'plateState'>
): boolean {
  return Boolean(
    profile.make?.trim() && profile.model?.trim() && profile.plateNumber?.trim() && profile.plateState?.trim()
  );
}

export function guardCanSaveVehicleDraft(
  profile: Partial<GuardVehicleProfile> | undefined
): boolean {
  return Boolean(
    profile?.make?.trim() ||
      profile?.model?.trim() ||
      profile?.plateNumber?.trim() ||
      profile?.frontPhotoUrl?.trim()
  );
}

export function guardCanSubmitVehicleForApproval(
  guard: SecurityGuard,
  profile: GuardVehicleProfile
): { ok: true } | { ok: false; reason: string } {
  if (!guardHasDriversLicenseOnFile(guard)) {
    return { ok: false, reason: "Upload your driver's license in Credentials before submitting a vehicle." };
  }
  if (!guardVehicleInsuranceOnFile(guard)) {
    return {
      ok: false,
      reason: 'Upload vehicle insurance in Credentials before submitting your vehicle for approval.',
    };
  }
  if (guard.vehicleInsurancePolicy && isVehicleInsuranceExpired(guard.vehicleInsurancePolicy)) {
    return {
      ok: false,
      reason:
        'Your vehicle insurance has expired. Upload updated insurance in Credentials before submitting your vehicle.',
    };
  }
  if (!guardVehicleDetailsComplete(profile)) {
    return { ok: false, reason: 'Enter make, model, plate number, and plate state.' };
  }
  if (!guardVehiclePhotosComplete(profile)) {
    return { ok: false, reason: 'Upload front, left, right, and back photos of your vehicle.' };
  }
  if (!profile.vehicleInsurancePolicyId?.trim() && !guard.vehicleInsurancePolicy?.id) {
    return { ok: false, reason: 'Link your vehicle insurance credential before submitting.' };
  }
  return { ok: true };
}

export function guardHasApprovedVehicle(
  guard: Pick<SecurityGuard, 'vehicleProfile' | 'vehicleInsurancePolicy'>
): boolean {
  if (guard.vehicleProfile?.status !== 'verified') return false;
  return guardHasVerifiedVehicleInsurance(guard);
}

export function guardVehicleAccessBlockedReason(
  guard: Pick<SecurityGuard, 'vehicleProfile' | 'vehicleInsurancePolicy'>
): string | null {
  if (guard.vehicleProfile?.status !== 'verified') return null;
  if (guardHasVerifiedVehicleInsurance(guard)) return null;
  if (guardVehicleInsuranceIsExpired(guard)) {
    return 'Your vehicle insurance has expired. Upload updated insurance in Credentials to restore driving and vehicle patrol access.';
  }
  if (
    guard.vehicleInsurancePolicy &&
    guardVehicleInsuranceSubmitted(guard) &&
    guard.vehicleInsurancePolicy.status === 'pending'
  ) {
    return 'Updated vehicle insurance is pending staff review. Driving access returns once it is approved.';
  }
  return 'Verified vehicle insurance is required for driving and vehicle patrol access.';
}

export function guardVehicleTabVisible(
  guard: Pick<
    SecurityGuard,
    | 'idDocumentType'
    | 'idFrontUrl'
    | 'idBackUrl'
    | 'idSelfieUrl'
    | 'idState'
    | 'idNumber'
    | 'idExpiryDate'
  >
): boolean {
  return guardHasDriversLicenseOnFile(guard);
}

export function guardDrivingPerformanceVisible(guard: SecurityGuard): boolean {
  return guardHasApprovedVehicle(guard);
}

export function staffApproveVehicleBlocker(guard: SecurityGuard): string | null {
  if (!guardHasVerifiedDriversLicense(guard)) {
    return "Approve the guard's driver's license in Credentials before approving their vehicle.";
  }
  if (!guardHasVerifiedVehicleInsurance(guard)) {
    return 'Approve vehicle insurance in Credentials before approving this vehicle.';
  }
  const profile = guard.vehicleProfile;
  if (!profile) return 'No vehicle profile on file.';
  if (!guardVehiclePhotosComplete(profile)) {
    return 'Vehicle photos are incomplete — request updated images before approval.';
  }
  if (!guardVehicleDetailsComplete(profile)) {
    return 'Vehicle details are incomplete.';
  }
  return null;
}

export function staffCanApproveVehicle(guard: SecurityGuard): boolean {
  return (
    guard.vehicleProfile?.status === 'pending' && staffApproveVehicleBlocker(guard) === null
  );
}

export function formatVehicleSummaryLine(profile: GuardVehicleProfile | undefined): string {
  if (!profile?.make?.trim() && !profile?.model?.trim()) {
    return 'No vehicle on file';
  }
  const parts = [profile.make?.trim(), profile.model?.trim()].filter(Boolean);
  if (profile.year?.trim()) parts.push(profile.year.trim());
  if (profile.plateNumber?.trim()) {
    parts.push(`${profile.plateState?.trim() || ''} ${profile.plateNumber.trim()}`.trim());
  }
  return parts.join(' · ');
}

export function vehicleProfileFromRow(row: Record<string, unknown>): GuardVehicleProfile {
  return {
    id: String(row.id),
    guardId: String(row.guard_id),
    make: String(row.make ?? ''),
    model: String(row.model ?? ''),
    year: row.year ? String(row.year) : undefined,
    color: row.color ? String(row.color) : undefined,
    plateNumber: String(row.plate_number ?? ''),
    plateState: String(row.plate_state ?? ''),
    frontPhotoUrl: row.front_photo_url ? String(row.front_photo_url) : undefined,
    leftSidePhotoUrl: row.left_side_photo_url ? String(row.left_side_photo_url) : undefined,
    rightSidePhotoUrl: row.right_side_photo_url ? String(row.right_side_photo_url) : undefined,
    backPhotoUrl: row.back_photo_url ? String(row.back_photo_url) : undefined,
    vehicleInsurancePolicyId: row.vehicle_insurance_policy_id
      ? String(row.vehicle_insurance_policy_id)
      : undefined,
    status: (['draft', 'pending', 'verified', 'rejected'].includes(String(row.status))
      ? row.status
      : 'draft') as GuardVehicleProfile['status'],
    rejectionReason: row.rejection_reason ? String(row.rejection_reason) : undefined,
    submittedAt: row.submitted_at ? String(row.submitted_at) : undefined,
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : undefined,
    reviewedBy: row.reviewed_by ? String(row.reviewed_by) : undefined,
  };
}

export function vehicleProfileToDbRow(
  profile: Partial<GuardVehicleProfile> & { guardId: string }
): Record<string, unknown> {
  return {
    guard_id: profile.guardId,
    make: profile.make ?? '',
    model: profile.model ?? '',
    year: profile.year ?? null,
    color: profile.color ?? null,
    plate_number: profile.plateNumber ?? '',
    plate_state: profile.plateState ?? '',
    front_photo_url: profile.frontPhotoUrl ?? null,
    left_side_photo_url: profile.leftSidePhotoUrl ?? null,
    right_side_photo_url: profile.rightSidePhotoUrl ?? null,
    back_photo_url: profile.backPhotoUrl ?? null,
    vehicle_insurance_policy_id: profile.vehicleInsurancePolicyId ?? null,
    status: profile.status ?? 'draft',
    rejection_reason: profile.rejectionReason ?? null,
    submitted_at: profile.submittedAt ?? null,
    reviewed_at: profile.reviewedAt ?? null,
    reviewed_by: profile.reviewedBy ?? null,
    updated_at: new Date().toISOString(),
  };
}
