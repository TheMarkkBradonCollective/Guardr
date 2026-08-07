import { SecurityGuard, StaffRole } from '../types';
import { resolvePersonNameParts } from './personName';
import { isThemeMode } from './platform/theme';
import { normalizeManagedCities } from './platformCities';

export type StaffRow = {
  id: string;
  name: string;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  email: string;
  badge_number: string;
  avatar?: string | null;
  phone?: string | null;
  bio?: string | null;
  headline?: string | null;
  summary?: string | null;
  about?: string | null;
  specialties?: string[] | null;
  staff_role: StaffRole;
  user_status?: string | null;
  managed_cities?: string[] | null;
  assigned_manager_ids?: string[] | null;
  password?: string | null;
  must_change_password?: boolean | null;
  theme_preference?: string | null;
};

export function mapStaffRowToSecurityGuard(row: StaffRow): SecurityGuard {
  const nameParts = resolvePersonNameParts({
    firstName: row.first_name,
    middleName: row.middle_name,
    lastName: row.last_name,
    name: row.name,
  });

  return {
    id: row.id,
    name: nameParts.name,
    firstName: nameParts.firstName,
    middleName: nameParts.middleName,
    lastName: nameParts.lastName,
    email: row.email,
    badgeNumber: row.badge_number,
    avatar: row.avatar ?? '',
    phone: row.phone ?? '',
    bio: row.bio ?? '',
    headline: row.headline ?? undefined,
    summary: row.summary ?? undefined,
    about: row.about ?? undefined,
    specialties: Array.isArray(row.specialties) ? row.specialties : [],
    isArmed: false,
    backgroundChecked: true,
    verified: true,
    rating: 5,
    jobsCompleted: 0,
    certifications: [],
    experience: [],
    hourlyRateRequirement: 0,
    isStaff: true,
    staffRole: row.staff_role,
    managedCities: normalizeManagedCities(
      Array.isArray(row.managed_cities) ? (row.managed_cities as string[]) : undefined
    ),
    assignedManagerIds: Array.isArray(row.assigned_manager_ids)
      ? (row.assigned_manager_ids as string[])
      : [],
    userStatus:
      row.user_status === 'suspended' || row.user_status === 'blocked'
        ? row.user_status
        : row.user_status === 'pending'
          ? 'pending'
          : 'active',
    themePreference: isThemeMode(row.theme_preference) ? row.theme_preference : undefined,
    password: row.password ?? undefined,
    mustChangePassword: row.must_change_password ?? false,
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
