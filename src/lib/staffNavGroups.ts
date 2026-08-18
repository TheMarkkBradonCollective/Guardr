import type { StaffSection } from './staffOps';

/** Shared staff sidebar / drawer section order — keep DesktopStaffAdminShell in sync. */
export const STAFF_NAV_GROUPS: { title: string; ids: StaffSection[] }[] = [
  { title: 'Dashboard', ids: ['overview', 'map'] },
  {
    title: 'Operations',
    ids: ['jobs', 'locations', 'applications', 'credentials', 'guards', 'clients', 'team', 'management'],
  },
  { title: 'Communications', ids: ['messages', 'support'] },
  { title: 'Issues', ids: ['incidents', 'violations', 'disputes'] },
  { title: 'Insights', ids: ['stats', 'analytics'] },
  { title: 'Finance', ids: ['payments', 'platform-fees', 'staff-compensation', 'agreements', 'audit-log'] },
  { title: 'Platform', ids: ['cities', 'permissions', 'settings', 'integrations'] },
  { title: 'Resources', ids: ['guide', 'dev-updates'] },
];
