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

export function resolveNotificationUrl(
  type: PushNotificationType,
  options: { guardId?: string; requestId?: string } = {}
): string {
  switch (type) {
    case 'missed_checkin':
    case 'guard_checkin':
      return '/staff/jobs';
    case 'assignment':
      return options.guardId ? `/guard/${options.guardId}` : '/guard/my-jobs';
    case 'emergency_alert':
      return '/staff/incidents';
    case 'support_message':
      return '/staff/support';
    case 'job_chat_message':
      return options.requestId ? `/staff/messages` : '/staff/messages';
    case 'staff_message':
      return '/staff/messages';
    case 'test':
      return '/';
    default:
      return '/';
  }
}

export function resolveNotificationUrlForRole(
  type: PushNotificationType,
  role: PlatformRole | string,
  options: { guardId?: string; requestId?: string } = {}
): string {
  const isStaff =
    role === 'moderator' ||
    role === 'administrator' ||
    role === 'director' ||
    role === 'owner';

  switch (type) {
    case 'support_message':
      if (role === 'client') return '/client/support';
      if (role === 'guard') return '/guard/support';
      return '/staff/support';
    case 'job_chat_message':
      if (role === 'client') return '/client/coverage';
      if (role === 'guard') return '/guard/my-jobs';
      return '/staff/messages';
    case 'staff_message':
      return '/staff/messages';
    case 'assignment':
      return '/guard/my-jobs';
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
    priority?: 'normal' | 'high';
  } = {}
): PushNotificationData {
  return {
    type,
    url: options.url ?? resolveNotificationUrl(type, options),
    siteId: options.siteId,
    guardId: options.guardId,
    requestId: options.requestId,
    priority: options.priority ?? (type === 'emergency_alert' ? 'high' : 'normal'),
  };
}
