import { PlatformRole, SessionUser } from '../types';

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
  | 'director.manage_company_operations';

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

export const ROLE_PERMISSIONS: Record<PlatformRole, Permission[]> = {
  client: CLIENT_PERMISSIONS,
  guard: GUARD_PERMISSIONS,
  moderator: MODERATOR_PERMISSIONS,
  administrator: ADMINISTRATOR_PERMISSIONS,
  director: DIRECTOR_PERMISSIONS,
};

export const ROLE_LABELS: Record<PlatformRole, string> = {
  client: 'Client',
  guard: 'Guard',
  moderator: 'Moderator',
  administrator: 'Administrator',
  director: 'Director',
};

export const ROLE_DESCRIPTIONS: Record<PlatformRole, string> = {
  client: 'Individuals or businesses seeking security services.',
  guard: 'Independent licensed security professionals.',
  moderator: 'Operations and support — no financial controls.',
  administrator: 'Platform management and daily operations.',
  director: 'Owner-level unrestricted platform access.',
};

export function isStaffRole(role: PlatformRole): role is 'moderator' | 'administrator' | 'director' {
  return role === 'moderator' || role === 'administrator' || role === 'director';
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

export function canManageStaffAccounts(user: Pick<SessionUser, 'role'>): boolean {
  return hasAnyPermission(user, ['director.manage_administrators', 'director.manage_moderators']);
}

export function canSuspendUsers(user: Pick<SessionUser, 'role'>): boolean {
  return hasPermission(user, 'moderator.suspend_users');
}

export function canToggleStaffRole(user: Pick<SessionUser, 'role'>): boolean {
  return hasPermission(user, 'director.manage_moderators');
}

/** Cash client payments and cash guard payouts are Director-only overrides */
export function canRecordCashPayments(user: Pick<SessionUser, 'role'>): boolean {
  return user.role === 'director';
}

/** Map legacy auth / DB staff_role to platform role */
export function resolvePlatformRole(input: {
  isStaff?: boolean;
  staffRole?: 'Director' | 'Administrator' | 'Moderator';
  legacyRole?: string;
}): PlatformRole {
  if (input.legacyRole === 'client') return 'client';
  if (input.isStaff && input.staffRole) {
    switch (input.staffRole) {
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

export function staffRoleToPlatformRole(staffRole: 'Director' | 'Administrator' | 'Moderator'): PlatformRole {
  switch (staffRole) {
    case 'Director':
      return 'director';
    case 'Administrator':
      return 'administrator';
    case 'Moderator':
      return 'moderator';
  }
}

export function platformRoleToStaffRole(role: PlatformRole): 'Director' | 'Administrator' | 'Moderator' | null {
  switch (role) {
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
