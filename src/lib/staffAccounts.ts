import { SecurityGuard, StaffRole, StaffSideRole } from '../types';
import { resolvePersonNameParts } from './personName';
import { isThemeMode } from './platform/theme';
import { normalizeManagedCities } from './platformCities';
import { parseGovIdRevisionHistory } from './govIdRevisionHistory';
import type { GuardUserStatus } from './accountStatus';
import {
  bounceUnverifiedGovernmentIdStatus,
  type GuardIdVerificationStatus,
} from './guardIdentityVerification';
import { normalizeStaffRole, normalizeStaffSideRole } from './permissions';

export type StaffRow = {
  id: string;
  name: string;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  email: string;
  personal_email?: string | null;
  badge_number: string;
  avatar?: string | null;
  phone?: string | null;
  bio?: string | null;
  headline?: string | null;
  summary?: string | null;
  about?: string | null;
  specialties?: string[] | null;
  staff_role: StaffRole | null;
  side_role?: StaffSideRole | string | null;
  user_status?: string | null;
  managed_cities?: string[] | null;
  assigned_manager_ids?: string[] | null;
  password?: string | null;
  must_change_password?: boolean | null;
  theme_preference?: string | null;
  years_experience?: number | null;
  availability_notes?: string | null;
  referred_by?: string | null;
  application_revision_requested_at?: string | null;
  application_revision_note?: string | null;
  stripe_connect_account_id?: string | null;
  id_verification_status?: string | null;
  id_state?: string | null;
  id_number?: string | null;
  id_expiry_date?: string | null;
  id_front_url?: string | null;
  id_back_url?: string | null;
  id_selfie_url?: string | null;
  id_verification_submitted_at?: string | null;
  id_verification_reviewed_at?: string | null;
  id_verification_rejection_reason?: string | null;
  id_update_requested_at?: string | null;
  id_update_request_note?: string | null;
  id_submitted_by?: string | null;
  id_document_type?: string | null;
  id_license_class?: string | null;
  id_revision_history?: unknown;
};

function bounceStaffIdVerificationStatus(row: StaffRow): GuardIdVerificationStatus {
  const stored =
    row.id_verification_status === 'pending' ||
    row.id_verification_status === 'verified' ||
    row.id_verification_status === 'rejected'
      ? row.id_verification_status
      : 'not_submitted';
  return bounceUnverifiedGovernmentIdStatus({
    idVerificationStatus: stored,
    idFrontUrl: row.id_front_url ?? undefined,
    idBackUrl: row.id_back_url ?? undefined,
    idSelfieUrl: row.id_selfie_url ?? undefined,
  });
}

function normalizeStaffUserStatus(raw: unknown): GuardUserStatus {
  if (typeof raw !== 'string') return 'pending';
  const status = raw.trim().toLowerCase();
  if (
    status === 'pending' ||
    status === 'approved' ||
    status === 'active' ||
    status === 'suspended' ||
    status === 'blocked'
  ) {
    return status;
  }
  return 'pending';
}

export function mapStaffRowToSecurityGuard(row: StaffRow): SecurityGuard {
  const nameParts = resolvePersonNameParts({
    firstName: row.first_name,
    middleName: row.middle_name,
    lastName: row.last_name,
    name: row.name,
  });
  const userStatus = normalizeStaffUserStatus(row.user_status);

  return {
    id: row.id,
    name: nameParts.name,
    firstName: nameParts.firstName,
    middleName: nameParts.middleName,
    lastName: nameParts.lastName,
    email: row.email,
    personalEmail: row.personal_email?.trim() || undefined,
    badgeNumber: row.badge_number,
    avatar: row.avatar ?? '',
    phone: row.phone ?? '',
    bio: row.bio ?? '',
    headline: row.headline ?? undefined,
    summary: row.summary ?? undefined,
    about: row.about ?? undefined,
    specialties: Array.isArray(row.specialties) ? row.specialties : [],
    yearsExperience: row.years_experience ?? undefined,
    availabilityNotes: row.availability_notes ?? undefined,
    referredBy: row.referred_by ?? undefined,
    isArmed: false,
    backgroundChecked: true,
    verified: userStatus === 'active',
    rating: 5,
    jobsCompleted: 0,
    certifications: [],
    experience: [],
    hourlyRateRequirement: 0,
    isStaff: true,
    staffRole: normalizeStaffRole(row.staff_role),
    sideRole: normalizeStaffSideRole(row.side_role) ?? null,
    managedCities: normalizeManagedCities(
      Array.isArray(row.managed_cities) ? (row.managed_cities as string[]) : undefined
    ),
    assignedManagerIds: Array.isArray(row.assigned_manager_ids)
      ? (row.assigned_manager_ids as string[])
      : [],
    userStatus,
    stripeConnectAccountId: row.stripe_connect_account_id ?? undefined,
    idVerificationStatus: bounceStaffIdVerificationStatus(row),
    idState: row.id_state ?? undefined,
    idNumber: row.id_number ?? undefined,
    idExpiryDate: row.id_expiry_date ?? undefined,
    idFrontUrl: row.id_front_url ?? undefined,
    idBackUrl: row.id_back_url ?? undefined,
    idSelfieUrl: row.id_selfie_url ?? undefined,
    idVerificationSubmittedAt: row.id_verification_submitted_at ?? undefined,
    idVerificationReviewedAt: row.id_verification_reviewed_at ?? undefined,
    idVerificationRejectionReason: row.id_verification_rejection_reason ?? undefined,
    idUpdateRequestedAt: row.id_update_requested_at ?? undefined,
    idUpdateRequestNote: row.id_update_request_note ?? undefined,
    applicationRevisionRequestedAt: row.application_revision_requested_at ?? undefined,
    applicationRevisionNote: row.application_revision_note ?? undefined,
    idSubmittedBy: row.id_submitted_by === 'staff' || row.id_submitted_by === 'guard' ? row.id_submitted_by : undefined,
    idDocumentType:
      row.id_document_type === 'drivers_license' || row.id_document_type === 'state_id'
        ? row.id_document_type
        : undefined,
    idLicenseClass: row.id_license_class ?? undefined,
    idRevisionHistory: parseGovIdRevisionHistory(row.id_revision_history),
    themePreference: isThemeMode(row.theme_preference) ? row.theme_preference : undefined,
    password: row.password ?? undefined,
    mustChangePassword: row.must_change_password ?? false,
  };
}

export function staffRowPatchFromGuard(member: SecurityGuard): Record<string, unknown> {
  return {
    name: member.name,
    first_name: member.firstName ?? null,
    middle_name: member.middleName ?? null,
    last_name: member.lastName ?? null,
    email: member.email,
    personal_email: member.personalEmail ?? null,
    badge_number: member.badgeNumber,
    avatar: member.avatar,
    phone: member.phone,
    bio: member.bio,
    headline: member.headline ?? '',
    summary: member.summary ?? '',
    about: member.about ?? '',
    specialties: member.specialties ?? [],
    staff_role: member.staffRole ?? null,
    side_role: member.sideRole ?? null,
    user_status: member.userStatus ?? 'pending',
    managed_cities: member.managedCities ?? [],
    assigned_manager_ids: member.assignedManagerIds ?? [],
    years_experience: member.yearsExperience ?? null,
    availability_notes: member.availabilityNotes ?? null,
    referred_by: member.referredBy ?? null,
    application_revision_requested_at: member.applicationRevisionRequestedAt ?? null,
    application_revision_note: member.applicationRevisionNote ?? null,
    stripe_connect_account_id: member.stripeConnectAccountId ?? null,
    id_verification_status: member.idVerificationStatus ?? 'not_submitted',
    id_state: member.idState ?? null,
    id_number: member.idNumber ?? null,
    id_expiry_date: member.idExpiryDate ?? null,
    id_front_url: member.idFrontUrl ?? null,
    id_back_url: member.idBackUrl ?? null,
    id_selfie_url: member.idSelfieUrl ?? null,
    id_verification_submitted_at: member.idVerificationSubmittedAt ?? null,
    id_verification_reviewed_at: member.idVerificationReviewedAt ?? null,
    id_verification_rejection_reason: member.idVerificationRejectionReason ?? null,
    id_update_requested_at: member.idUpdateRequestedAt ?? null,
    id_update_request_note: member.idUpdateRequestNote ?? null,
    id_submitted_by: member.idSubmittedBy ?? null,
    id_document_type: member.idDocumentType ?? null,
    id_license_class: member.idLicenseClass ?? null,
    id_revision_history: member.idRevisionHistory ?? [],
  };
}

export function getPendingStaffAccountReviews(guards: SecurityGuard[]): SecurityGuard[] {
  return guards.filter((g) => g.isStaff && g.userStatus === 'pending');
}

export function isLegacyStaffGuardRow(row: {
  is_staff?: boolean | null;
  migrated_to_staff_at?: string | null;
}): boolean {
  return Boolean(row.migrated_to_staff_at) || Boolean(row.is_staff);
}
