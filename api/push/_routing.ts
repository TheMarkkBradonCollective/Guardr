import type { PushNotificationData, PushNotificationType, PushRole, PlatformRole } from './_types';

export function platformRoleToPushRole(role: PlatformRole | string): PushRole {
  switch (role) {
    case 'guard':
      return 'guard';
    case 'moderator':
    case 'administrator':
    case 'director':
    case 'owner':
      return 'dispatch';
    case 'client':
      return 'client';
    default:
      return 'guard';
  }
}

export function pushRoleToPlatformRole(pushRole: string | null | undefined): PlatformRole | string {
  switch (pushRole) {
    case 'guard':
      return 'guard';
    case 'client':
      return 'client';
    case 'dispatch':
    case 'admin':
      return 'administrator';
    default:
      return 'administrator';
  }
}

export function resolveNotificationUrl(
  type: PushNotificationType,
  options: { guardId?: string; requestId?: string; ticketId?: string } = {}
): string {
  switch (type) {
    case 'missed_checkin':
    case 'guard_checkin':
      return options.requestId
        ? `/staff/jobs?j=${encodeURIComponent(options.requestId)}`
        : '/staff/jobs';
    case 'assignment':
      return options.requestId
        ? `/guard/my-jobs?jc=${encodeURIComponent(options.requestId)}`
        : '/guard/my-jobs';
    case 'emergency_alert':
      if (options.requestId) {
        return `/staff/jobs?j=${encodeURIComponent(options.requestId)}`;
      }
      if (options.ticketId) {
        return `/staff/support?st=${encodeURIComponent(options.ticketId)}`;
      }
      return '/staff/incidents';
    case 'support_message':
      return options.ticketId ? `/staff/support?st=${encodeURIComponent(options.ticketId)}` : '/staff/support';
    case 'job_chat_message':
      return options.requestId
        ? `/staff/messages?mtab=jobs&jc=${encodeURIComponent(options.requestId)}`
        : '/staff/messages?mtab=jobs';
    case 'staff_message':
      return '/staff/messages?mtab=team';
    case 'guard_message':
      return '/guard/guard-chat';
    case 'job_submitted':
      return options.requestId
        ? `/staff/jobs?j=${encodeURIComponent(options.requestId)}`
        : '/staff/approvals?aq=job-offers';
    case 'guard_application':
      return options.requestId
        ? `/staff/jobs?j=${encodeURIComponent(options.requestId)}`
        : '/staff/approvals?aq=applications';
    case 'guard_pending_approval':
      return options.guardId
        ? `/staff/guards?g=${encodeURIComponent(options.guardId)}`
        : '/staff/approvals?aq=accounts';
    case 'client_pending_approval':
      return '/staff/approvals?aq=accounts';
    case 'credential_pending':
      return options.guardId
        ? `/staff/approvals?aq=credentials&g=${encodeURIComponent(options.guardId)}`
        : '/staff/approvals?aq=credentials';
    case 'payment_attention':
      return options.requestId
        ? `/staff/payments?j=${encodeURIComponent(options.requestId)}`
        : '/staff/payments';
    case 'test':
      return '/';
    default:
      return '/';
  }
}

export function resolveNotificationUrlForRole(
  type: PushNotificationType,
  role: PlatformRole | string,
  options: { guardId?: string; requestId?: string; ticketId?: string } = {}
): string {
  const isStaff =
    role === 'moderator' ||
    role === 'administrator' ||
    role === 'director' ||
    role === 'owner';

  switch (type) {
    case 'support_message':
      if (role === 'client') {
        return options.ticketId
          ? `/client/support?st=${encodeURIComponent(options.ticketId)}`
          : '/client/support';
      }
      if (role === 'guard') {
        return options.ticketId
          ? `/guard/support?st=${encodeURIComponent(options.ticketId)}`
          : '/guard/support';
      }
      return options.ticketId
        ? `/staff/support?st=${encodeURIComponent(options.ticketId)}`
        : '/staff/support';
    case 'job_chat_message':
      if (role === 'client') {
        return options.requestId
          ? `/client/coverage?jc=${encodeURIComponent(options.requestId)}&chat=1`
          : '/client/coverage';
      }
      if (role === 'guard') {
        return options.requestId
          ? `/guard/my-jobs?jc=${encodeURIComponent(options.requestId)}&chat=1`
          : '/guard/my-jobs';
      }
      return options.requestId
        ? `/staff/messages?mtab=jobs&jc=${encodeURIComponent(options.requestId)}`
        : '/staff/messages?mtab=jobs';
    case 'emergency_alert':
      if (role === 'client') {
        return options.requestId
          ? `/client/coverage?jc=${encodeURIComponent(options.requestId)}`
          : '/client/coverage';
      }
      if (role === 'guard') {
        return options.requestId
          ? `/guard/my-jobs?jc=${encodeURIComponent(options.requestId)}`
          : '/guard/my-jobs';
      }
      if (options.requestId) {
        return `/staff/jobs?j=${encodeURIComponent(options.requestId)}`;
      }
      if (options.ticketId) {
        return `/staff/support?st=${encodeURIComponent(options.ticketId)}`;
      }
      return '/staff/incidents';
    case 'missed_checkin':
    case 'guard_checkin':
      if (role === 'guard') {
        return options.requestId
          ? `/guard/my-jobs?jc=${encodeURIComponent(options.requestId)}`
          : '/guard/my-jobs';
      }
      if (role === 'client') {
        return options.requestId
          ? `/client/coverage?jc=${encodeURIComponent(options.requestId)}`
          : '/client/coverage';
      }
      return options.requestId
        ? `/staff/jobs?j=${encodeURIComponent(options.requestId)}`
        : '/staff/jobs';
    case 'staff_message':
      return '/staff/messages?mtab=team';
    case 'guard_message':
      return '/guard/guard-chat';
    case 'assignment':
      return options.requestId
        ? `/guard/my-jobs?jc=${encodeURIComponent(options.requestId)}`
        : '/guard/my-jobs';
    default:
      if (isStaff) return resolveNotificationUrl(type, options);
      if (role === 'client') return '/client/home';
      if (role === 'guard') return '/guard/map';
      return resolveNotificationUrl(type, options);
  }
}

export function rolesForNotificationType(type: PushNotificationType): PushRole[] {
  switch (type) {
    case 'missed_checkin':
    case 'guard_checkin':
      return ['dispatch', 'admin'];
    case 'assignment':
      return ['guard'];
    case 'emergency_alert':
      return ['guard', 'dispatch', 'admin'];
    case 'support_message':
      return ['dispatch', 'admin', 'client', 'guard'];
    case 'job_chat_message':
      return ['client', 'guard', 'dispatch', 'admin'];
    case 'staff_message':
      return ['dispatch', 'admin'];
    case 'guard_message':
      return ['guard'];
    case 'job_submitted':
    case 'guard_application':
    case 'guard_pending_approval':
    case 'client_pending_approval':
    case 'credential_pending':
    case 'payment_attention':
      return ['dispatch', 'admin'];
    case 'test':
      return [];
    default:
      return ['guard', 'dispatch'];
  }
}

export function buildNotificationData(
  type: PushNotificationType,
  options: {
    url?: string;
    siteId?: string;
    guardId?: string;
    requestId?: string;
    ticketId?: string;
    priority?: 'normal' | 'high';
    role?: PlatformRole | string;
  } = {}
): PushNotificationData {
  const urlOptions = {
    guardId: options.guardId,
    requestId: options.requestId,
    ticketId: options.ticketId,
  };
  const url =
    options.url ??
    (options.role
      ? resolveNotificationUrlForRole(type, options.role, urlOptions)
      : resolveNotificationUrl(type, urlOptions));

  return {
    type,
    url,
    siteId: options.siteId,
    guardId: options.guardId,
    requestId: options.requestId,
    ticketId: options.ticketId,
    priority: options.priority ?? (type === 'emergency_alert' ? 'high' : 'normal'),
  };
}
