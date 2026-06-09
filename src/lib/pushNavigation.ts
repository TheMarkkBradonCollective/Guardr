import type { GuardTab } from '../components/GuardDashboard';
import { parseAppRoute, type AppRoute } from './appNavigation';
import type { StaffSection } from './staffOps';

export interface PushDeepLink {
  staffSection?: StaffSection;
  guardTab?: GuardTab;
  guardId?: string;
}

export function parsePushDeepLink(url: string): PushDeepLink | null {
  const route = parseAppRoute(url);
  if (!route) return null;

  const link: PushDeepLink = {};
  if (route.staffSection) link.staffSection = route.staffSection;
  if (route.guardTab) link.guardTab = route.guardTab;
  if (route.guardId) link.guardId = route.guardId;
  return link;
}

export function pushDeepLinkToRoute(link: PushDeepLink): AppRoute | null {
  if (link.staffSection) return { role: 'staff', staffSection: link.staffSection };
  if (link.guardTab || link.guardId) {
    return { role: 'guard', guardTab: link.guardTab ?? 'map', guardId: link.guardId };
  }
  return null;
}
