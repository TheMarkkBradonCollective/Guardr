import { resolveNotificationUrlForRole } from '../../lib/push/routing';
import type { PushNotificationType } from '../../lib/push/types';
import type { SessionUser, UserNotification } from '../types';
import type { AppRole } from './appNavigation';

function platformRoleForUser(user: SessionUser): string {
  if (user.role === 'client' || user.role === 'guard') return user.role;
  return user.role;
}

function appRoleForUser(user: SessionUser): AppRole | null {
  if (user.role === 'client') return 'client';
  if (user.role === 'guard') return 'guard';
  if (
    user.role === 'support' ||
    user.role === 'moderator' ||
    user.role === 'administrator' ||
    user.role === 'manager' ||
    user.role === 'director' ||
    user.role === 'owner'
  ) {
    return 'staff';
  }
  return null;
}

function parsePath(url: string): { pathname: string; searchParams: URLSearchParams } {
  try {
    const parsed = new URL(url, window.location.origin);
    return {
      pathname: parsed.pathname.replace(/\/$/, '') || '/',
      searchParams: parsed.searchParams,
    };
  } catch {
    return { pathname: '/', searchParams: new URLSearchParams() };
  }
}

/** Resolve the in-app destination for a notification row or push payload. */
export function resolveNotificationDestination(
  notification: Pick<UserNotification, 'type' | 'url' | 'requestId' | 'guardId' | 'ticketId'>,
  user: SessionUser
): string | null {
  const role = appRoleForUser(user);
  if (!role) return null;

  const trimmedUrl = notification.url?.trim();
  if (trimmedUrl) {
    return remapNotificationUrlForUser(trimmedUrl, user) ?? trimmedUrl;
  }

  return resolveNotificationUrlForRole(notification.type as PushNotificationType, platformRoleForUser(user), {
    requestId: notification.requestId,
    guardId: notification.guardId,
    ticketId: notification.ticketId,
  });
}

/**
 * When a stored push URL targets another role's shell (e.g. staff link opened by a guard),
 * remap using shared deep-link params instead of dropping navigation.
 */
export function remapNotificationUrlForUser(url: string, user: SessionUser): string | null {
  const role = appRoleForUser(user);
  if (!role) return null;

  const { pathname, searchParams } = parsePath(url);
  const requestId = searchParams.get('jc') || searchParams.get('j') || searchParams.get('inv') || undefined;
  const ticketId = searchParams.get('st') || undefined;
  const guardId = searchParams.get('g') || undefined;
  const openChat = searchParams.get('chat') === '1' || searchParams.get('chat') === 'true';

  if (requestId) {
    if (role === 'client') {
      if (pathname.includes('/invoices')) {
        return `/client/invoices?inv=${encodeURIComponent(requestId)}`;
      }
      const onMap = pathname.includes('/map') || openChat;
      const base = onMap ? '/client/map' : '/client/requests';
      return `${base}?jc=${encodeURIComponent(requestId)}${openChat ? '&chat=1' : ''}`;
    }
    if (role === 'guard') {
      const onMap = pathname.includes('/map');
      const base = onMap ? '/guard/map' : '/guard/my-jobs';
      return `${base}?jc=${encodeURIComponent(requestId)}${openChat ? '&chat=1' : ''}`;
    }
    if (role === 'staff') {
      return `/staff/jobs?j=${encodeURIComponent(requestId)}`;
    }
  }

  if (ticketId) {
    if (role === 'client') return `/client/messages?st=${encodeURIComponent(ticketId)}`;
    if (role === 'guard') return `/guard/messages?st=${encodeURIComponent(ticketId)}`;
    if (role === 'staff') return `/staff/messages?st=${encodeURIComponent(ticketId)}`;
  }

  if (guardId && role === 'staff') {
    if (pathname.includes('/credentials')) {
      return `/staff/credentials?g=${encodeURIComponent(guardId)}`;
    }
    return `/staff/guards?g=${encodeURIComponent(guardId)}`;
  }

  if (pathname.includes('/earnings') || pathname.includes('/payments')) {
    if (role === 'guard') return '/guard/earnings';
    if (role === 'client') return '/client/requests';
    if (role === 'staff') return '/staff/payments';
  }

  if (pathname.includes('/crew')) {
    if (role === 'guard') return '/guard/crew';
  }

  if (pathname.includes('/settings')) {
    if (role === 'client') return '/client/settings';
    if (role === 'guard') return '/guard/settings';
    if (role === 'staff') return '/staff/settings';
  }

  if (pathname.includes('/profile')) {
    if (role === 'client') return '/client/profile';
    if (role === 'guard') return '/guard/profile';
    if (role === 'staff') return '/staff/profile';
  }

  if (role === 'client') return '/client/home';
  if (role === 'guard') return '/guard/map';
  return '/staff/overview';
}
