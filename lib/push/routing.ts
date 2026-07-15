import type { PushNotificationData, PushNotificationType, PushRole, PlatformRole } from './types';

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
    case 'guard_clockout':
    case 'guard_arrived':
    case 'guard_left_site':
    case 'guard_break_start':
    case 'guard_break_end':
      return options.requestId
        ? `/staff/jobs?j=${encodeURIComponent(options.requestId)}`
        : '/staff/jobs';
    case 'job_open_to_guards':
      return options.requestId
        ? `/guard/map?jc=${encodeURIComponent(options.requestId)}`
        : '/guard/map';
    case 'client_cash_payment_requested':
    case 'guard_cash_payout_requested':
    case 'stripe_payment_complete':
      return options.requestId
        ? `/staff/payments?j=${encodeURIComponent(options.requestId)}`
        : '/staff/payments';
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
    case 'client_message':
      return '/client/messages';
    case 'job_submitted':
      return options.requestId
        ? `/staff/jobs?j=${encodeURIComponent(options.requestId)}`
        : '/staff/jobs';
    case 'guard_application':
      return options.requestId
        ? `/staff/applications?j=${encodeURIComponent(options.requestId)}`
        : '/staff/applications';
    case 'guard_pending_approval':
      return options.guardId
        ? `/staff/guards?g=${encodeURIComponent(options.guardId)}`
        : '/staff/guards';
    case 'client_pending_approval':
      return '/staff/clients';
    case 'credential_pending':
      return options.guardId
        ? `/staff/credentials?g=${encodeURIComponent(options.guardId)}`
        : '/staff/credentials';
    case 'payment_attention':
      return options.requestId
        ? `/staff/payments?j=${encodeURIComponent(options.requestId)}`
        : '/staff/payments';
    case 'support_ticket':
    case 'support_ticket_status':
      return options.ticketId
        ? `/staff/messages?st=${encodeURIComponent(options.ticketId)}`
        : '/staff/messages';
    case 'account_update':
      return '/staff/settings';
    case 'job_status_update':
      return options.requestId
        ? `/staff/jobs?j=${encodeURIComponent(options.requestId)}`
        : '/staff/jobs';
    case 'payout_ready':
      return '/guard/earnings';
    case 'dispute_update':
      return options.ticketId
        ? `/staff/disputes?st=${encodeURIComponent(options.ticketId)}`
        : '/staff/disputes';
    case 'guard_trusted_status':
      return options.guardId
        ? `/guard/profile?g=${encodeURIComponent(options.guardId)}`
        : '/guard/profile';
    case 'client_trusted_status':
      return '/client/profile';
    case 'job_relisted':
      return options.requestId
        ? `/client/requests?jc=${encodeURIComponent(options.requestId)}`
        : '/client/requests';
    case 'job_schedule_changed':
      return options.requestId
        ? `/guard/my-jobs?jc=${encodeURIComponent(options.requestId)}`
        : '/guard/my-jobs';
    case 'team_chat_message':
      return options.requestId
        ? `/staff/messages?mtab=team&jc=${encodeURIComponent(options.requestId)}`
        : '/staff/messages?mtab=team';
    case 'standing_crew_invite':
      return '/guard/crew';
    case 'company_placard_expiry':
      return '/staff/settings';
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
    case 'guard_arrived':
    case 'guard_left_site':
      if (role === 'client') {
        return options.requestId
          ? `/client/map?jc=${encodeURIComponent(options.requestId)}`
          : '/client/map';
      }
      if (role === 'guard') {
        return options.requestId
          ? `/guard/my-jobs?jc=${encodeURIComponent(options.requestId)}`
          : '/guard/my-jobs';
      }
      return options.requestId
        ? `/staff/jobs?j=${encodeURIComponent(options.requestId)}`
        : '/staff/jobs';

    case 'job_open_to_guards':
      return options.requestId
        ? `/guard/map?jc=${encodeURIComponent(options.requestId)}`
        : '/guard/map';

    case 'client_cash_payment_requested':
    case 'guard_cash_payout_requested':
    case 'stripe_payment_complete':
      if (role === 'client') {
        return options.requestId
          ? `/client/requests?jc=${encodeURIComponent(options.requestId)}`
          : '/client/requests';
      }
      if (role === 'guard') {
        return '/guard/earnings';
      }
      return options.requestId
        ? `/staff/payments?j=${encodeURIComponent(options.requestId)}`
        : '/staff/payments';

    case 'payment_attention':
      if (role === 'client') {
        return options.requestId
          ? `/client/requests?jc=${encodeURIComponent(options.requestId)}`
          : '/client/requests';
      }
      if (role === 'guard') {
        return '/guard/earnings';
      }
      return options.requestId
        ? `/staff/payments?j=${encodeURIComponent(options.requestId)}`
        : '/staff/payments';

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
          ? `/client/map?jc=${encodeURIComponent(options.requestId)}&chat=1`
          : '/client/messages';
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
          ? `/client/map?jc=${encodeURIComponent(options.requestId)}`
          : '/client/map';
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
    case 'guard_clockout':
    case 'guard_break_start':
    case 'guard_break_end':
      if (role === 'guard') {
        return options.requestId
          ? `/guard/my-jobs?jc=${encodeURIComponent(options.requestId)}`
          : '/guard/my-jobs';
      }
      if (role === 'client') {
        return options.requestId
          ? `/client/map?jc=${encodeURIComponent(options.requestId)}`
          : '/client/map';
      }
      return options.requestId
        ? `/staff/jobs?j=${encodeURIComponent(options.requestId)}`
        : '/staff/jobs';
    case 'staff_message':
      return '/staff/messages?mtab=team';
    case 'guard_message':
      return '/guard/guard-chat';
    case 'client_message':
      if (role === 'client') return '/client/messages';
      return '/staff/messages?mtab=team';
    case 'support_ticket':
    case 'support_ticket_status':
      if (role === 'client' && options.requestId) {
        return `/client/requests?jc=${encodeURIComponent(options.requestId)}`;
      }
      if (role === 'client') {
        return options.ticketId
          ? `/client/messages?st=${encodeURIComponent(options.ticketId)}`
          : '/client/messages';
      }
      if (role === 'guard') {
        return options.ticketId
          ? `/guard/messages?st=${encodeURIComponent(options.ticketId)}`
          : '/guard/messages';
      }
      return options.ticketId
        ? `/staff/messages?st=${encodeURIComponent(options.ticketId)}`
        : '/staff/messages';
    case 'account_update':
      if (role === 'client') return '/client/settings';
      if (role === 'guard') return '/guard/settings';
      return '/staff/settings';
    case 'job_status_update':
      if (role === 'client') {
        return options.requestId
          ? `/client/requests?jc=${encodeURIComponent(options.requestId)}`
          : '/client/requests';
      }
      if (role === 'guard') {
        return options.requestId
          ? `/guard/my-jobs?jc=${encodeURIComponent(options.requestId)}`
          : '/guard/my-jobs';
      }
      return options.requestId
        ? `/staff/jobs?j=${encodeURIComponent(options.requestId)}`
        : '/staff/jobs';
    case 'payout_ready':
      return role === 'guard' ? '/guard/earnings' : '/staff/payments';
    case 'dispute_update':
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
        ? `/staff/disputes?st=${encodeURIComponent(options.ticketId)}`
        : '/staff/disputes';
    case 'assignment':
    case 'guard_application':
      if (role === 'client') {
        return options.requestId
          ? `/client/requests?jc=${encodeURIComponent(options.requestId)}`
          : '/client/requests';
      }
      if (type === 'guard_application') {
        return options.requestId
          ? `/staff/applications?j=${encodeURIComponent(options.requestId)}`
          : '/staff/applications';
      }
      return options.requestId
        ? `/guard/my-jobs?jc=${encodeURIComponent(options.requestId)}`
        : '/guard/my-jobs';
    case 'guard_trusted_status':
      return '/guard/profile';
    case 'client_trusted_status':
      return '/client/profile';
    case 'job_relisted':
      return options.requestId
        ? `/client/requests?jc=${encodeURIComponent(options.requestId)}`
        : '/client/requests';
    case 'job_schedule_changed':
      return options.requestId
        ? `/guard/my-jobs?jc=${encodeURIComponent(options.requestId)}`
        : '/guard/my-jobs';
    case 'team_chat_message':
      if (role === 'guard') {
        return options.requestId
          ? `/guard/messages?jc=${encodeURIComponent(options.requestId)}`
          : '/guard/messages';
      }
      return options.requestId
        ? `/staff/messages?mtab=team&jc=${encodeURIComponent(options.requestId)}`
        : '/staff/messages?mtab=team';
    case 'standing_crew_invite':
      return '/guard/crew';
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
    case 'guard_clockout':
    case 'guard_arrived':
    case 'guard_left_site':
    case 'guard_break_start':
    case 'guard_break_end':
      return ['dispatch', 'admin'];
    case 'job_open_to_guards':
      return ['guard'];
    case 'client_cash_payment_requested':
    case 'guard_cash_payout_requested':
    case 'stripe_payment_complete':
      return ['dispatch', 'admin'];
    case 'assignment':
      return ['guard'];
    case 'guard_application':
      return ['dispatch', 'admin'];
    case 'emergency_alert':
      return ['guard', 'client', 'dispatch', 'admin'];
    case 'support_message':
      return ['dispatch', 'admin', 'client', 'guard'];
    case 'job_chat_message':
      return ['client', 'guard', 'dispatch', 'admin'];
    case 'staff_message':
      return ['dispatch', 'admin'];
    case 'guard_message':
      return ['guard'];
    case 'client_message':
      return ['client'];
    case 'job_submitted':
    case 'guard_pending_approval':
    case 'client_pending_approval':
    case 'credential_pending':
    case 'payment_attention':
      return ['dispatch', 'admin'];
    case 'support_ticket':
      return ['dispatch', 'admin'];
    case 'support_ticket_status':
      return ['client', 'guard'];
    case 'dispute_update':
      return ['dispatch', 'admin', 'client', 'guard'];
    case 'guard_trusted_status':
      return ['guard'];
    case 'client_trusted_status':
      return ['client'];
    case 'job_relisted':
      return ['client'];
    case 'job_schedule_changed':
      return ['guard'];
    case 'team_chat_message':
      return ['guard', 'dispatch', 'admin'];
    case 'standing_crew_invite':
      return ['guard'];
    case 'company_placard_expiry':
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
