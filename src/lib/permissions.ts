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
  // Moderator — field support, account approvals
  | 'moderator.approve_guards'
  | 'moderator.approve_clients'
  | 'moderator.review_reports'
  | 'moderator.monitor_activity'
  // Administrator (+ moderator) — credential verification, ops
  | 'moderator.review_certifications'
  | 'moderator.review_job_requests'
  | 'moderator.handle_disputes'
  | 'moderator.suspend_users'
  | 'moderator.issue_warnings'
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
  // Founder (+ all director) — platform governance overseer
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
  'moderator.review_reports',
  'moderator.monitor_activity',
];

const ADMINISTRATOR_PERMISSIONS: Permission[] = [
  ...MODERATOR_PERMISSIONS,
  'moderator.review_certifications',
  'moderator.review_job_requests',
  'moderator.handle_disputes',
  'moderator.suspend_users',
  'moderator.issue_warnings',
  'admin.manage_users',
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
  owner: 'Founder',
};

export const ROLE_DESCRIPTIONS: Record<PlatformRole, string> = {
  client: 'Individuals or businesses seeking security services.',
  guard: 'Independent licensed security professionals.',
  moderator: 'Approves guard and client applications, monitors activity, and escalates issues.',
  administrator: 'Verifies credentials, reviews jobs and disputes, and manages daily operations.',
  director: 'Executive platform operations and unrestricted staff-side access.',
  owner: 'Platform governance overseer — manages staff below the Founder tier.',
};

export const STAFF_ROLES_ORDERED: StaffRole[] = ['Moderator', 'Administrator', 'Director', 'Founder'];

const STAFF_ROLE_RANK: Record<StaffRole, number> = {
  Moderator: 1,
  Administrator: 2,
  Director: 3,
  Founder: 4,
};

/** Legacy DB rows may still store Owner — normalize to Founder. */
export function normalizeStaffRole(staffRole?: string | null): StaffRole | undefined {
  if (!staffRole) return undefined;
  if (staffRole === 'Owner' || staffRole === 'Founder') return 'Founder';
  if (staffRole === 'Director') return 'Director';
  if (staffRole === 'Administrator') return 'Administrator';
  if (staffRole === 'Moderator') return 'Moderator';
  return undefined;
}

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

export function isFounder(user: Pick<SessionUser, 'role'>): boolean {
  return user.role === 'owner';
}

/** @deprecated Use isFounder */
export const isOwner = isFounder;

/** Founder-only platform configuration (payment modes, etc.) */
export function canManagePlatformSettings(user: Pick<SessionUser, 'role'>): boolean {
  return isFounder(user);
}

/** Director and Founder share executive payment and ops controls */
export function hasExecutivePaymentControls(user: Pick<SessionUser, 'role'>): boolean {
  return user.role === 'director' || user.role === 'owner';
}

/** Director has unrestricted staff-side operational access; Founder inherits the same overrides */
export function hasDirectorStaffOverride(user: Pick<SessionUser, 'role'>): boolean {
  return (
    isDirector(user) ||
    isFounder(user) ||
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

/** Payouts, fees, cash handling, and financial analytics — Director and Founder only */
export function canAccessFinancialControls(user: Pick<SessionUser, 'role'>): boolean {
  return hasExecutivePaymentControls(user);
}

export function canAccessStaffSettings(user: Pick<SessionUser, 'role'>): boolean {
  return hasPermission(user, 'admin.manage_settings') || canManagePlatformSettings(user);
}

/** Directors manage moderators and administrators; Founders manage all staff tiers */
export function canManageStaffAccounts(user: Pick<SessionUser, 'role'>): boolean {
  return hasAnyPermission(user, [
    'director.manage_administrators',
    'director.manage_moderators',
    'owner.manage_directors',
  ]);
}

/** Administrator+ may submit new staff for onboarding */
export function canProposeStaffAccounts(user: Pick<SessionUser, 'role'>): boolean {
  return hasPermission(user, 'admin.manage_users');
}

/** Director+ may approve pending staff and activate accounts immediately on create */
export function canApproveStaffAccounts(user: Pick<SessionUser, 'role'>): boolean {
  return canManageStaffAccounts(user);
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

export function canReviewJobRequests(user: Pick<SessionUser, 'role'>): boolean {
  return hasPermission(user, 'moderator.review_job_requests');
}

/** Administrator+ — verify credential documents for client-facing trust */
export function canVerifyCredentials(user: Pick<SessionUser, 'role'>): boolean {
  return hasPermission(user, 'moderator.review_certifications');
}

/** @deprecated Use canVerifyCredentials — moderators do not verify credentials */
export function canReviewCertifications(user: Pick<SessionUser, 'role'>): boolean {
  return canVerifyCredentials(user);
}

export function canHandleDisputes(user: Pick<SessionUser, 'role'>): boolean {
  return hasPermission(user, 'moderator.handle_disputes');
}

export function canSuspendUsers(user: Pick<SessionUser, 'role'>): boolean {
  return hasPermission(user, 'moderator.suspend_users');
}

/** Moderator+ — approve guard applications (unlock credential upload) */
export function canApproveGuards(user: Pick<SessionUser, 'role'>): boolean {
  return hasPermission(user, 'moderator.approve_guards');
}

/** Administrator+ — manually activate approved guard accounts for marketplace work */
export function canActivateGuardAccounts(user: Pick<SessionUser, 'role'>): boolean {
  return canVerifyCredentials(user);
}

/** Moderator+ — approve client accounts */
export function canApproveClients(user: Pick<SessionUser, 'role'>): boolean {
  return hasPermission(user, 'moderator.approve_clients');
}

/** Moderator+ — approve applications and manage guard roster */
export function canManageGuards(user: Pick<SessionUser, 'role'>): boolean {
  return canApproveGuards(user) || hasPermission(user, 'admin.manage_users');
}

/** Administrator+ — approve client accounts and manage client roster */
export function canManageClients(user: Pick<SessionUser, 'role'>): boolean {
  return canApproveClients(user) || hasPermission(user, 'admin.manage_users');
}

/** @deprecated Use canManageGuards / canManageClients */
export function canOnboardPlatformUsers(user: Pick<SessionUser, 'role'>): boolean {
  return isStaffRole(user.role);
}

export function canToggleStaffRole(user: Pick<SessionUser, 'role'>): boolean {
  return hasAnyPermission(user, ['director.manage_moderators', 'owner.manage_directors']);
}

/** Cash client payments and cash guard payouts are Director/Founder overrides */
export function canRecordCashPayments(user: Pick<SessionUser, 'role'>): boolean {
  return hasExecutivePaymentControls(user);
}

/** Only Directors and Founders may mark guards or clients as trusted. */
export function canSetTrustedStatus(user: Pick<SessionUser, 'role'>): boolean {
  return hasExecutivePaymentControls(user);
}

/** Director and Founder create jobs for clients and assign guards */
export function canManageCompanyOperations(user: Pick<SessionUser, 'role'>): boolean {
  return hasPermission(user, 'director.manage_company_operations');
}

/** Director and Founder may edit job listings (any non-closed job) */
export function canEditJobListingDetails(user: Pick<SessionUser, 'role'>): boolean {
  return hasDirectorStaffOverride(user) || user.role === 'administrator';
}

/** Administrators, Directors, and Founders may delete resolved support chat tickets */
export function canDeleteResolvedSupportChat(user: Pick<SessionUser, 'role'>): boolean {
  return user.role === 'administrator' || user.role === 'director' || user.role === 'owner';
}

/** Director and Founder receive all staff job-management capabilities */
export function canStaffManageJobs(user: Pick<SessionUser, 'role'>): boolean {
  return (
    hasDirectorStaffOverride(user) ||
    canManageCompanyOperations(user) ||
    canEditJobListingDetails(user)
  );
}

/** Map legacy auth / DB staff_role to platform role */
export function resolvePlatformRole(input: {
  isStaff?: boolean;
  staffRole?: StaffRole | string;
  legacyRole?: string;
}): PlatformRole {
  if (input.legacyRole === 'client') return 'client';
  const normalizedStaffRole = normalizeStaffRole(
    typeof input.staffRole === 'string' ? input.staffRole : input.staffRole
  );
  if (input.isStaff && normalizedStaffRole) {
    return staffRoleToPlatformRole(normalizedStaffRole);
  }
  if (input.legacyRole === 'auditor') return 'moderator';
  if (input.legacyRole === 'staff') return 'administrator';
  return 'guard';
}

export function staffRoleToPlatformRole(staffRole: StaffRole): PlatformRole {
  switch (staffRole) {
    case 'Founder':
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
      return 'Founder';
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
