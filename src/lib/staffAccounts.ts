import { SecurityGuard, StaffRole } from '../types';
import { resolvePersonNameParts } from './personName';
import { isThemeMode } from './platform/theme';

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
  staff_role: StaffRole;
  user_status?: string | null;
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
    userStatus:
      row.user_status === 'suspended' || row.user_status === 'blocked'
        ? row.user_status
        : 'active',
    themePreference: isThemeMode(row.theme_preference) ? row.theme_preference : undefined,
    password: row.password ?? undefined,
    mustChangePassword: row.must_change_password ?? false,
  };
}

export function isArchivedGuardShell(row: { is_staff?: boolean | null; migrated_to_staff_at?: string | null }): boolean {
  return Boolean(row.migrated_to_staff_at) || Boolean(row.is_staff);
}

export function splitGuardsAndStaffFromLegacyRows(rows: Record<string, unknown>[]): {
  staffRows: Record<string, unknown>[];
  fieldGuardRows: Record<string, unknown>[];
} {
  const staffRows: Record<string, unknown>[] = [];
  const fieldGuardRows: Record<string, unknown>[] = [];

  for (const row of rows) {
    if (row.migrated_to_staff_at) continue;
    if (row.is_staff) {
      staffRows.push(row);
    } else {
      fieldGuardRows.push(row);
    }
  }

  return { staffRows, fieldGuardRows };
}
