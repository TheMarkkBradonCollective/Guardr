import type { ClientView } from '../components/ClientDashboard';
import type { GuardTab } from '../components/GuardDashboard';
import type { AppRole, AppRoute } from './appNavigation';
import { isStaffSupportSection, type StaffSection } from './staffOps';

const MESSENGER_GUARD_TABS = new Set<GuardTab>([
  'messages',
  'support',
  'settings',
  'profile',
  'guide',
]);

const MESSENGER_CLIENT_VIEWS = new Set<ClientView>([
  'messages',
  'support',
  'support-compose',
  'support-report',
  'settings',
  'profile',
  'guide',
]);

const MESSENGER_STAFF_SECTIONS = new Set<StaffSection>(['messages', 'support', 'profile', 'preferences', 'guide']);

export function defaultMessengerRoute(role: AppRole): AppRoute {
  if (role === 'guard') return { role: 'guard', guardTab: 'messages' };
  if (role === 'client') return { role: 'client', clientView: 'messages' };
  return { role: 'staff', staffSection: 'messages' };
}

export function constrainGuardTabToMessenger(tab: GuardTab): GuardTab {
  if (tab === 'support') return 'support';
  if (MESSENGER_GUARD_TABS.has(tab)) return tab;
  return 'messages';
}

export function constrainClientViewToMessenger(view: ClientView): ClientView {
  if (MESSENGER_CLIENT_VIEWS.has(view)) return view;
  return 'messages';
}

export function constrainStaffSectionToMessenger(section: StaffSection): StaffSection {
  if (isStaffSupportSection(section)) return 'support';
  if (MESSENGER_STAFF_SECTIONS.has(section)) return section;
  return 'messages';
}

/** Signed-in Messenger stays on messages and support — never field ops, jobs, or dispatch. */
export function constrainRouteToMessenger(route: AppRoute): AppRoute {
  if (route.authView) return route;
  if (route.role === 'guard') {
    const tab = route.guardTab ?? 'messages';
    return {
      ...route,
      websiteAccount: undefined,
      accountView: undefined,
      guardTab: constrainGuardTabToMessenger(tab === 'activation' ? 'messages' : tab),
    };
  }
  if (route.role === 'client') {
    return {
      ...route,
      websiteAccount: undefined,
      accountView: undefined,
      clientView: constrainClientViewToMessenger(route.clientView ?? 'messages'),
    };
  }
  return {
    ...route,
    websiteAccount: undefined,
    accountView: undefined,
    staffSection: constrainStaffSectionToMessenger(route.staffSection ?? 'messages'),
  };
}
