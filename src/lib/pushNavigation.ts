import type { GuardTab } from '../components/GuardDashboard';
import type { StaffSection } from './staffOps';

export interface PushDeepLink {
  staffSection?: StaffSection;
  guardTab?: GuardTab;
  guardId?: string;
}

export function parsePushDeepLink(url: string): PushDeepLink | null {
  try {
    const parsed = new URL(url, window.location.origin);
    const path = parsed.pathname.replace(/\/$/, '') || '/';

    if (path === '/dispatch') {
      return { staffSection: 'live-jobs' };
    }

    if (path === '/guard') {
      return { guardTab: 'map' };
    }

    const guardMatch = path.match(/^\/guard\/([^/]+)$/);
    if (guardMatch) {
      return { guardTab: 'map', guardId: guardMatch[1] };
    }

    return null;
  } catch {
    return null;
  }
}
