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
  // Support — help desk, reports, activity monitoring, messaging
  | 'moderator.review_reports'
  | 'moderator.monitor_activity'
  | 'moderator.access_support_inbox'
  | 'moderator.access_messages'
  | 'moderator.view_violations'
  // Moderator — field support, account approvals
  | 'moderator.approve_guards'
  | 'moderator.approve_clients'
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
  | 'admin.view_stats'
  | 'admin.manage_integrations'
  | 'admin.manage_locations'
  | 'admin.manage_crews'
  | 'admin.view_staff_roster'
  // Director (+ all administrator)
  | 'director.manage_administrators'
  | 'director.manage_moderators'
  | 'director.manage_city_markets'
  | 'director.view_all_financial_data'
  | 'director.access_audit_logs'
  | 'director.override_restrictions'
  | 'director.manage_company_operations'
  | 'director.recommend_city_open'
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

const SUPPORT_PERMISSIONS: Permission[] = [
  'moderator.review_reports',
  'moderator.monitor_activity',
  'moderator.access_support_inbox',
  'moderator.access_messages',
  'moderator.view_violations',
];

const MODERATOR_PERMISSIONS: Permission[] = [
  ...GUARD_PERMISSIONS,
  ...SUPPORT_PERMISSIONS,
  'moderator.approve_guards',
  'moderator.approve_clients',
  'admin.view_stats',
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
  'admin.manage_integrations',
  'admin.manage_locations',
  'admin.manage_crews',
  'admin.view_staff_roster',
];

const MANAGER_PERMISSIONS: Permission[] = [
  ...ADMINISTRATOR_PERMISSIONS,
  'admin.manage_payouts',
  'admin.manage_fees',
  'director.view_all_financial_data',
  'director.access_audit_logs',
  'director.manage_company_operations',
  'director.recommend_city_open',
  'director.manage_administrators',
  'director.manage_moderators',
  'director.override_restrictions',
];

/** Director adds global city-market control; Founder adds platform governance above this. */
const DIRECTOR_PERMISSIONS: Permission[] = [
  ...MANAGER_PERMISSIONS,
  'director.manage_city_markets',
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
  support: SUPPORT_PERMISSIONS,
  moderator: MODERATOR_PERMISSIONS,
  administrator: ADMINISTRATOR_PERMISSIONS,
  manager: MANAGER_PERMISSIONS,
  director: DIRECTOR_PERMISSIONS,
  owner: OWNER_PERMISSIONS,
};

export const ROLE_LABELS: Record<PlatformRole, string> = {
  client: 'Client',
  guard: 'Guard',
  support: 'Support',
  moderator: 'Moderator',
  administrator: 'Administrator',
  manager: 'Manager',
  director: 'Director',
  owner: 'Founder',
};

export const ROLE_DESCRIPTIONS: Record<PlatformRole, string> = {
  client: 'Individuals or businesses seeking security services.',
  guard: 'Independent licensed security professionals.',
  support: 'Handles support messages, reviews incident reports, and monitors platform activity.',
  moderator: 'Approves guard and client applications, monitors activity, and escalates issues.',
  administrator: 'Verifies credentials, reviews jobs and disputes, and manages daily operations.',
  manager: 'Executive operations — same command center as Director for payouts, jobs, financials, and live coverage. City actions follow your assigned markets.',
  director: 'Executive operations with global city markets and governance-adjacent controls shared with Founder.',
  owner: 'Platform governance overseer — manages staff below the Founder tier.',
};

export const STAFF_ROLES_ORDERED: StaffRole[] = [
  'Support',
  'Moderator',
  'Administrator',
  'Manager',
  'Director',
  'Founder',
];

/** Staff permissions that can be toggled per role on the Permissions page. */
export const STAFF_PERMISSION_CATALOG: {
  permission: Permission;
  label: string;
  group: string;
}[] = [
  { permission: 'moderator.approve_guards', label: 'Approve guard applications', group: 'Applications' },
  { permission: 'moderator.approve_clients', label: 'Approve client applications', group: 'Applications' },
  { permission: 'moderator.access_support_inbox', label: 'Handle support messages', group: 'Communications' },
  { permission: 'moderator.access_messages', label: 'Access job & staff messages', group: 'Communications' },
  { permission: 'moderator.review_reports', label: 'Review incident reports', group: 'Monitoring' },
  { permission: 'moderator.monitor_activity', label: 'Monitor platform activity', group: 'Monitoring' },
  { permission: 'moderator.view_violations', label: 'View shift violations', group: 'Monitoring' },
  { permission: 'moderator.review_certifications', label: 'Verify credentials', group: 'Credentials' },
  { permission: 'moderator.review_job_requests', label: 'Review job postings', group: 'Jobs' },
  { permission: 'admin.manage_locations', label: 'Manage shared locations', group: 'Jobs' },
  { permission: 'admin.manage_crews', label: 'Manage crews', group: 'Jobs' },
  { permission: 'moderator.handle_disputes', label: 'Handle disputes', group: 'Support' },
  { permission: 'moderator.suspend_users', label: 'Suspend users', group: 'User management' },
  { permission: 'moderator.issue_warnings', label: 'Issue warnings', group: 'User management' },
  { permission: 'admin.manage_users', label: 'Manage user accounts', group: 'User management' },
  { permission: 'admin.view_staff_roster', label: 'View staff roster', group: 'User management' },
  { permission: 'admin.manage_settings', label: 'Manage public information', group: 'Platform' },
  { permission: 'admin.manage_platform_config', label: 'Manage platform configuration', group: 'Platform' },
  { permission: 'admin.view_analytics', label: 'View analytics', group: 'Platform' },
  { permission: 'admin.view_stats', label: 'View performance stats', group: 'Platform' },
  { permission: 'admin.manage_content', label: 'Manage content', group: 'Platform' },
  { permission: 'admin.manage_integrations', label: 'Manage integrations', group: 'Platform' },
  { permission: 'admin.manage_payouts', label: 'Manage payouts', group: 'Finance' },
  { permission: 'admin.manage_fees', label: 'Manage fees', group: 'Finance' },
  { permission: 'director.view_all_financial_data', label: 'View all financial data', group: 'Finance' },
  { permission: 'director.access_audit_logs', label: 'Access audit log', group: 'Finance' },
  { permission: 'director.manage_company_operations', label: 'Manage company operations', group: 'Service Areas' },
  { permission: 'director.recommend_city_open', label: 'View Service Areas & recommend cities', group: 'Service Areas' },
  { permission: 'director.manage_city_markets', label: 'Manage city markets', group: 'Service Areas' },
  { permission: 'director.manage_administrators', label: 'Manage administrators', group: 'Staff management' },
  { permission: 'director.manage_moderators', label: 'Manage moderators', group: 'Staff management' },
  { permission: 'director.override_restrictions', label: 'Override system restrictions', group: 'Executive' },
  { permission: 'owner.manage_directors', label: 'Manage directors', group: 'Governance' },
  { permission: 'owner.manage_owners', label: 'Manage founders', group: 'Governance' },
  { permission: 'owner.platform_governance', label: 'Platform governance', group: 'Governance' },
];

export function getDefaultStaffRolePermissions(staffRole: StaffRole): Permission[] {
  const platformRole = staffRoleToPlatformRole(staffRole);
  return [...(ROLE_PERMISSIONS[platformRole] ?? [])];
}

export function getConfiguredStaffRolePermissions(
  staffRole: StaffRole,
  overrides?: StaffRolePermissionOverrides,
): Permission[] {
  const resolvedOverrides = overrides ?? activeStaffRolePermissionOverrides;
  if (resolvedOverrides?.[staffRole]) {
    return [...resolvedOverrides[staffRole]!];
  }
  return getDefaultStaffRolePermissions(staffRole);
}

const STAFF_ROLE_RANK: Record<StaffRole, number> = {
  Support: 1,
  Moderator: 2,
  Administrator: 3,
  Manager: 4,
  Director: 5,
  Founder: 6,
};

/** Legacy DB rows may still store Owner — normalize to Founder. */
export function normalizeStaffRole(staffRole?: string | null): StaffRole | undefined {
  if (!staffRole) return undefined;
  if (staffRole === 'Owner' || staffRole === 'Founder') return 'Founder';
  if (staffRole === 'Director') return 'Director';
  if (staffRole === 'Manager') return 'Manager';
  if (staffRole === 'Administrator') return 'Administrator';
  if (staffRole === 'Moderator') return 'Moderator';
  if (staffRole === 'Support') return 'Support';
  return undefined;
}

export function staffRoleRank(staffRole: StaffRole): number {
  return STAFF_ROLE_RANK[staffRole];
}

export function platformStaffRank(role: PlatformRole): number | null {
  const staffRole = platformRoleToStaffRole(role);
  return staffRole ? staffRoleRank(staffRole) : null;
}

export function isStaffRole(role: PlatformRole): role is
  | 'support'
  | 'moderator'
  | 'administrator'
  | 'manager'
  | 'director'
  | 'owner' {
  return (
    role === 'support' ||
    role === 'moderator' ||
    role === 'administrator' ||
    role === 'manager' ||
    role === 'director' ||
    role === 'owner'
  );
}

export function isExecutiveOpsRole(role: PlatformRole): boolean {
  return role === 'manager' || role === 'director' || role === 'owner';
}

/** Director and Founder — global city markets and governance-adjacent platform controls */
export function isDirectorTierRole(role: PlatformRole): boolean {
  return role === 'director' || role === 'owner';
}

export function isDirector(user: Pick<SessionUser, 'role'>): boolean {
  return user.role === 'director';
}

export function isFounder(user: Pick<SessionUser, 'role'>): boolean {
  return user.role === 'owner';
}

/** @deprecated Use isFounder */
export const isOwner = isFounder;

/** Founder-only payment method / platform configuration (or explicit platform_config grant). */
export function canManagePlatformSettings(user: Pick<SessionUser, 'role'>): boolean {
  return isFounder(user) || hasPermission(user, 'owner.platform_governance');
}

/** Director and Founder — staff revenue-share compensation settings and payout confirmation */
export function canManageStaffCompensation(user: Pick<SessionUser, 'role'>): boolean {
  return isDirectorTierRole(user.role);
}

export function canConfirmStaffCompensationPayout(user: Pick<SessionUser, 'role'>): boolean {
  return isDirectorTierRole(user.role);
}

/** Any staff member can view their own revenue-share summary. */
export function canViewStaffCompensation(user: Pick<SessionUser, 'role'>): boolean {
  return isStaffRole(user.role);
}

/** Manager, Director, and Founder share executive payment and ops controls */
export function hasExecutivePaymentControls(user: Pick<SessionUser, 'role'>): boolean {
  return isExecutiveOpsRole(user.role);
}

/** Manager+ operational overrides (job edits, staff job management) */
export function hasDirectorStaffOverride(user: Pick<SessionUser, 'role'>): boolean {
  return (
    isExecutiveOpsRole(user.role) ||
    hasPermission(user, 'director.override_restrictions')
  );
}

/** Configurable staff-role permission lists — stored in platform settings when customized. */
export type StaffRolePermissionOverrides = Partial<Record<StaffRole, Permission[]>>;

let activeStaffRolePermissionOverrides: StaffRolePermissionOverrides | undefined;

/** Sync effective staff permissions from loaded platform settings (App root). */
export function setStaffRolePermissionOverrides(overrides?: StaffRolePermissionOverrides): void {
  activeStaffRolePermissionOverrides = overrides;
}

export function getEffectiveRolePermissions(
  role: PlatformRole,
  overrides?: StaffRolePermissionOverrides,
): Permission[] {
  const staffRole = platformRoleToStaffRole(role);
  const resolvedOverrides = overrides ?? activeStaffRolePermissionOverrides;
  if (staffRole && resolvedOverrides?.[staffRole]) {
    return resolvedOverrides[staffRole]!;
  }
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(user: Pick<SessionUser, 'role'>, permission: Permission): boolean {
  return getEffectiveRolePermissions(user.role).includes(permission);
}

export function hasAnyPermission(user: Pick<SessionUser, 'role'>, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(user, p));
}

/** Payouts, fees, cash handling, and financial analytics — driven by finance catalog permissions. */
export function canAccessFinancialControls(user: Pick<SessionUser, 'role'>): boolean {
  return hasAnyPermission(user, [
    'admin.manage_payouts',
    'admin.manage_fees',
    'director.view_all_financial_data',
    'director.access_audit_logs',
  ]);
}

export function canAccessStaffSettings(user: Pick<SessionUser, 'role'>): boolean {
  return hasPermission(user, 'admin.manage_settings') || canManagePlatformSettings(user);
}

/** Manager+ — view and edit staff role permissions and approval rules */
export function canAccessStaffPermissions(user: Pick<SessionUser, 'role'>): boolean {
  return hasExecutivePaymentControls(user);
}

export const canManageStaffPermissions = canAccessStaffPermissions;

/** Edit public information and integrations when catalog grants allow it. */
export function canManageStaffPlatformContent(user: Pick<SessionUser, 'role'>): boolean {
  return (
    hasAnyPermission(user, [
      'admin.manage_settings',
      'admin.manage_content',
      'admin.manage_integrations',
    ]) || canAccessStaffPermissions(user)
  );
}

export function canAccessSupportInbox(user: Pick<SessionUser, 'role'>): boolean {
  return hasPermission(user, 'moderator.access_support_inbox');
}

export function canAccessStaffMessages(user: Pick<SessionUser, 'role'>): boolean {
  return hasPermission(user, 'moderator.access_messages');
}

export function canViewIncidents(user: Pick<SessionUser, 'role'>): boolean {
  return hasPermission(user, 'moderator.review_reports');
}

export function canViewViolations(user: Pick<SessionUser, 'role'>): boolean {
  return hasPermission(user, 'moderator.view_violations');
}

export function canViewAnalytics(user: Pick<SessionUser, 'role'>): boolean {
  return hasPermission(user, 'admin.view_analytics');
}

export function canViewStats(user: Pick<SessionUser, 'role'>): boolean {
  return hasPermission(user, 'admin.view_stats');
}

export function canManageLocations(user: Pick<SessionUser, 'role'>): boolean {
  return hasPermission(user, 'admin.manage_locations') || canReviewJobRequests(user);
}

export function canManageCrews(user: Pick<SessionUser, 'role'>): boolean {
  return hasPermission(user, 'admin.manage_crews') || canManageGuards(user);
}

export function canViewStaffRoster(user: Pick<SessionUser, 'role'>): boolean {
  return hasPermission(user, 'admin.view_staff_roster') || canManageStaffAccounts(user);
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

/** Director and Founder create jobs for clients */
export function canManageCompanyOperations(user: Pick<SessionUser, 'role'>): boolean {
  return hasPermission(user, 'director.manage_company_operations');
}

/** Manager+ may view Service Areas; Director+ may change open/closed/waitlist status */
export function canViewCityMarkets(user: Pick<SessionUser, 'role'>): boolean {
  return hasPermission(user, 'director.recommend_city_open');
}

export function canManageCityMarkets(user: Pick<SessionUser, 'role'>): boolean {
  return hasPermission(user, 'director.manage_city_markets');
}

export function canRecommendCityOpen(user: Pick<SessionUser, 'role'>): boolean {
  return hasPermission(user, 'director.recommend_city_open');
}

/** Only Managers may flag cities for Director review — not Directors or Founders */
export function canRecommendCityMarket(user: Pick<SessionUser, 'role'>): boolean {
  return user.role === 'manager';
}

/** Director+ assign which cities managers and lower staff may manage */
export function canAssignStaffCityAccess(user: Pick<SessionUser, 'role'>): boolean {
  return canManageCityMarkets(user) || user.role === 'manager';
}

/** Director and Founder may edit job listings (any non-closed job) */
export function canEditJobListingDetails(user: Pick<SessionUser, 'role'>): boolean {
  return hasDirectorStaffOverride(user) || user.role === 'administrator';
}

/** Administrators, Managers, Directors, and Founders may delete resolved support chat tickets */
export function canDeleteResolvedSupportChat(user: Pick<SessionUser, 'role'>): boolean {
  return (
    user.role === 'administrator' ||
    user.role === 'manager' ||
    user.role === 'director' ||
    user.role === 'owner'
  );
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
    case 'Manager':
      return 'manager';
    case 'Administrator':
      return 'administrator';
    case 'Moderator':
      return 'moderator';
    case 'Support':
      return 'support';
  }
}

export function platformRoleToStaffRole(role: PlatformRole): StaffRole | null {
  switch (role) {
    case 'owner':
      return 'Founder';
    case 'director':
      return 'Director';
    case 'manager':
      return 'Manager';
    case 'administrator':
      return 'Administrator';
    case 'moderator':
      return 'Moderator';
    case 'support':
      return 'Support';
    default:
      return null;
  }
}
