import type { PushNotificationData, PushNotificationType, PushRole, PlatformRole } from './types';

export function platformRoleToPushRole(role: PlatformRole | string): PushRole {
  switch (role) {
    case 'guard':
      return 'guard';
    case 'moderator':
    case 'administrator':
    case 'director':
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
      return '/dispatch';
    case 'assignment':
      return options.guardId ? `/guard/${options.guardId}` : '/guard';
    case 'emergency_alert':
      return '/dispatch';
    case 'test':
      return '/';
    default:
      return '/';
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
