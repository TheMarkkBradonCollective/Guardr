import { PlatformRole, SessionUser, StaffRole } from '../types';

/** Platform permission keys aligned with Guardr role spec */
export type Permission =
  // Client
  | 'client.create_account'
  | 'client.manage_profile'
  | 'client.post_requests'
  | 'client.edit_open_requests'
  | 'client.cancel_requests'
  | 'client.view_guard_profiles'
  | 'client.hire_guards'
  | 'client.message_guards'
  | 'client.review_reports'
  | 'client.rate_guards'
  | 'client.manage_payments'
  | 'client.view_invoices'
  // Guard
  | 'guard.create_profile'
  | 'guard.upload_credentials'
  | 'guard.browse_assignments'
  | 'guard.accept_assignments'
  | 'guard.self_audits'
  | 'guard.submit_reports'
  | 'guard.message_clients'
  | 'guard.view_earnings'
  | 'guard.receive_payouts'
  | 'guard.rate_clients'
  // Moderator
  | 'moderator.approve_guards'
  | 'moderator.approve_clients'
  | 'moderator.review_certifications'
  | 'moderator.review_reports'
  | 'moderator.review_job_requests'
  | 'moderator.handle_disputes'
  | 'moderator.suspend_users'
  | 'moderator.issue_warnings'
  | 'moderator.monitor_activity'
  // Administrator (+ all moderator)
  | 'admin.manage_users'
  | 'admin.manage_payouts'
  | 'admin.manage_fees'
  | 'admin.manage_settings'
  | 'admin.view_analytics'
  | 'admin.manage_content'
  | 'admin.manage_platform_config'
  // Director (+ all administrator)
  | 'director.manage_administrators'
  | 'director.manage_moderators'
  | 'director.view_all_financial_data'
  | 'director.access_audit_logs'
  | 'director.override_restrictions'
  | 'director.manage_company_operations'
  // Owner (+ all director)
  | 'owner.manage_directors'
  | 'owner.manage_owners'
  | 'owner.platform_governance';

const CLIENT_PERMISSIONS: Permission[] = [
  'client.create_account',
  'client.manage_profile',
  'client.post_requests',
  'client.edit_open_requests',
  'client.cancel_requests',
  'client.view_guard_profiles',
  'client.hire_guards',
  'client.message_guards',
  'client.review_reports',
  'client.rate_guards',
  'client.manage_payments',
  'client.view_invoices',
];

const GUARD_PERMISSIONS: Permission[] = [
  'guard.create_profile',
  'guard.upload_credentials',
  'guard.browse_assignments',
  'guard.accept_assignments',
  'guard.self_audits',
  'guard.submit_reports',
  'guard.message_clients',
  'guard.view_earnings',
  'guard.receive_payouts',
  'guard.rate_clients',
];

const MODERATOR_PERMISSIONS: Permission[] = [
  ...GUARD_PERMISSIONS,
  'moderator.approve_guards',
  'moderator.approve_clients',
  'moderator.review_certifications',
  'moderator.review_reports',
  'moderator.review_job_requests',
  'moderator.handle_disputes',
  'moderator.suspend_users',
  'moderator.issue_warnings',
  'moderator.monitor_activity',
];

const ADMINISTRATOR_PERMISSIONS: Permission[] = [
  ...MODERATOR_PERMISSIONS,
  'admin.manage_users',
  'admin.manage_payouts',
  'admin.manage_fees',
  'admin.manage_settings',
  'admin.view_analytics',
  'admin.manage_content',
  'admin.manage_platform_config',
];

const DIRECTOR_PERMISSIONS: Permission[] = [
  ...ADMINISTRATOR_PERMISSIONS,
  'director.manage_administrators',
  'director.manage_moderators',
  'director.view_all_financial_data',
  'director.access_audit_logs',
  'director.override_restrictions',
  'director.manage_company_operations',
];

const OWNER_PERMISSIONS: Permission[] = [
  ...DIRECTOR_PERMISSIONS,
  'owner.manage_directors',
  'owner.manage_owners',
  'owner.platform_governance',
];

export const ROLE_PERMISSIONS: Record<PlatformRole, Permission[]> = {
  client: CLIENT_PERMISSIONS,
  guard: GUARD_PERMISSIONS,
  moderator: MODERATOR_PERMISSIONS,
  administrator: ADMINISTRATOR_PERMISSIONS,
  director: DIRECTOR_PERMISSIONS,
  owner: OWNER_PERMISSIONS,
};

export const ROLE_LABELS: Record<PlatformRole, string> = {
  client: 'Client',
  guard: 'Guard',
  moderator: 'Moderator',
  administrator: 'Administrator',
  director: 'Director',
  owner: 'Owner',
};

export const ROLE_DESCRIPTIONS: Record<PlatformRole, string> = {
  client: 'Individuals or businesses seeking security services.',
  guard: 'Independent licensed security professionals.',
  moderator: 'Operations and support — no financial controls.',
  administrator: 'Platform management and daily operations.',
  director: 'Executive platform operations and unrestricted staff-side access.',
  owner: 'Platform governance — manages staff below the Owner tier.',
};

export const STAFF_ROLES_ORDERED: StaffRole[] = ['Moderator', 'Administrator', 'Director', 'Owner'];

const STAFF_ROLE_RANK: Record<StaffRole, number> = {
  Moderator: 1,
  Administrator: 2,
  Director: 3,
  Owner: 4,
};

export function staffRoleRank(staffRole: StaffRole): number {
  return STAFF_ROLE_RANK[staffRole];
}

export function platformStaffRank(role: PlatformRole): number | null {
  const staffRole = platformRoleToStaffRole(role);
  return staffRole ? staffRoleRank(staffRole) : null;
}

export function isStaffRole(role: PlatformRole): role is 'moderator' | 'administrator' | 'director' | 'owner' {
  return role === 'moderator' || role === 'administrator' || role === 'director' || role === 'owner';
}

export function isDirector(user: Pick<SessionUser, 'role'>): boolean {
  return user.role === 'director';
}

export function isOwner(user: Pick<SessionUser, 'role'>): boolean {
  return user.role === 'owner';
}

/** Owner-only platform configuration (payment modes, etc.) */
export function canManagePlatformSettings(user: Pick<SessionUser, 'role'>): boolean {
  return isOwner(user);
}

/** Director and Owner share executive payment and ops controls */
export function hasExecutivePaymentControls(user: Pick<SessionUser, 'role'>): boolean {
  return user.role === 'director' || user.role === 'owner';
}

/** Director has unrestricted staff-side operational access; Owner inherits the same overrides */
export function hasDirectorStaffOverride(user: Pick<SessionUser, 'role'>): boolean {
  return (
    isDirector(user) ||
    isOwner(user) ||
    hasPermission(user, 'director.override_restrictions')
  );
}

export function hasPermission(user: Pick<SessionUser, 'role'>, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[user.role] ?? [];
  return perms.includes(permission);
}

export function hasAnyPermission(user: Pick<SessionUser, 'role'>, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(user, p));
}

export function canAccessFinancialControls(user: Pick<SessionUser, 'role'>): boolean {
  return hasAnyPermission(user, ['admin.manage_payouts', 'admin.manage_fees', 'director.view_all_financial_data']);
}

/** Directors manage moderators and administrators; Owners manage all staff tiers */
export function canManageStaffAccounts(user: Pick<SessionUser, 'role'>): boolean {
  return hasAnyPermission(user, [
    'director.manage_administrators',
    'director.manage_moderators',
    'owner.manage_directors',
  ]);
}

export function canManageDirectorAccounts(user: Pick<SessionUser, 'role'>): boolean {
  return hasPermission(user, 'owner.manage_directors');
}

export function getAssignableStaffRoles(role: PlatformRole): StaffRole[] {
  const actorRank = platformStaffRank(role);
  if (actorRank === null) return [];
  return STAFF_ROLES_ORDERED.filter((staffRole) => staffRoleRank(staffRole) < actorRank);
}

export function canAssignStaffRole(actorRole: PlatformRole, targetRole: StaffRole): boolean {
  return getAssignableStaffRoles(actorRole).includes(targetRole);
}

/**
 * Staff may only moderate accounts strictly below their own role tier.
 * Same-role peers and higher tiers are never manageable.
 */
export function canModifyStaffMember(actorRole: PlatformRole, memberStaffRole?: StaffRole): boolean {
  if (!memberStaffRole) return false;
  const actorRank = platformStaffRank(actorRole);
  if (actorRank === null) return false;
  return actorRank > staffRoleRank(memberStaffRole);
}

export function canModerateStaffMember(
  actorRole: PlatformRole,
  actorId: string,
  member: { id: string; staffRole?: StaffRole }
): boolean {
  if (!member.staffRole) return false;
  if (member.id === actorId) return false;
  return canModifyStaffMember(actorRole, member.staffRole);
}

export function canSuspendUsers(user: Pick<SessionUser, 'role'>): boolean {
  return hasPermission(user, 'moderator.suspend_users');
}

/** All platform staff can manage field guards (add, verify, suspend) */
export function canManageGuards(user: Pick<SessionUser, 'role'>): boolean {
  return hasAnyPermission(user, ['moderator.approve_guards', 'admin.manage_users']);
}

/** All platform staff can manage client accounts (add, approve, suspend) */
export function canManageClients(user: Pick<SessionUser, 'role'>): boolean {
  return hasAnyPermission(user, ['moderator.approve_clients', 'admin.manage_users']);
}

/** @deprecated Use canManageGuards / canManageClients */
export function canOnboardPlatformUsers(user: Pick<SessionUser, 'role'>): boolean {
  return isStaffRole(user.role);
}

export function canToggleStaffRole(user: Pick<SessionUser, 'role'>): boolean {
  return hasAnyPermission(user, ['director.manage_moderators', 'owner.manage_directors']);
}

/** Cash client payments and cash guard payouts are Director/Owner overrides */
export function canRecordCashPayments(user: Pick<SessionUser, 'role'>): boolean {
  return hasExecutivePaymentControls(user);
}

/** Director and Owner create jobs for clients and assign guards */
export function canManageCompanyOperations(user: Pick<SessionUser, 'role'>): boolean {
  return hasPermission(user, 'director.manage_company_operations');
}

/** Staff may upload self-audit photos when a guard sent them outside the app */
export function canUploadJobSelfAuditPhotos(user: Pick<SessionUser, 'role'>): boolean {
  return hasDirectorStaffOverride(user) || hasPermission(user, 'moderator.review_reports');
}

/** Staff may upload spot-check photos to confirm guard presence on site */
export function canUploadJobSpotCheck(user: Pick<SessionUser, 'role'>): boolean {
  return hasDirectorStaffOverride(user) || hasPermission(user, 'moderator.review_reports');
}

/** Director and Owner may edit job listings (any non-closed job) */
export function canEditJobListingDetails(user: Pick<SessionUser, 'role'>): boolean {
  return hasDirectorStaffOverride(user) || user.role === 'administrator';
}

/** Administrators, Directors, and Owners may delete resolved support chat tickets */
export function canDeleteResolvedSupportChat(user: Pick<SessionUser, 'role'>): boolean {
  return user.role === 'administrator' || user.role === 'director' || user.role === 'owner';
}

/** Director and Owner receive all staff job-management capabilities */
export function canStaffManageJobs(user: Pick<SessionUser, 'role'>): boolean {
  return (
    hasDirectorStaffOverride(user) ||
    canManageCompanyOperations(user) ||
    canEditJobListingDetails(user) ||
    canUploadJobSelfAuditPhotos(user) ||
    canUploadJobSpotCheck(user)
  );
}

/** Map legacy auth / DB staff_role to platform role */
export function resolvePlatformRole(input: {
  isStaff?: boolean;
  staffRole?: StaffRole;
  legacyRole?: string;
}): PlatformRole {
  if (input.legacyRole === 'client') return 'client';
  if (input.isStaff && input.staffRole) {
    switch (input.staffRole) {
      case 'Owner':
        return 'owner';
      case 'Director':
        return 'director';
      case 'Administrator':
        return 'administrator';
      case 'Moderator':
        return 'moderator';
    }
  }
  if (input.legacyRole === 'auditor') return 'moderator';
  if (input.legacyRole === 'staff') return 'administrator';
  return 'guard';
}

export function staffRoleToPlatformRole(staffRole: StaffRole): PlatformRole {
  switch (staffRole) {
    case 'Owner':
      return 'owner';
    case 'Director':
      return 'director';
    case 'Administrator':
      return 'administrator';
    case 'Moderator':
      return 'moderator';
  }
}

export function platformRoleToStaffRole(role: PlatformRole): StaffRole | null {
  switch (role) {
    case 'owner':
      return 'Owner';
    case 'director':
      return 'Director';
    case 'administrator':
      return 'Administrator';
    case 'moderator':
      return 'Moderator';
    default:
      return null;
  }
}
