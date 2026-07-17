export interface NavItemDef {
  id: string;
  label: string;
}

export const CLIENT_NAV: NavItemDef[] = [
  { id: 'home', label: 'Home' },
  { id: 'requests', label: 'Jobs' },
  { id: 'map', label: 'Map' },
  { id: 'messages', label: 'Messages' },
  { id: 'guards', label: 'Guards' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'locations', label: 'Locations' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' },
];

export const GUARD_NAV: NavItemDef[] = [
  { id: 'map', label: 'Map' },
  { id: 'myJobs', label: 'Jobs' },
  { id: 'crew', label: 'Crew' },
  { id: 'messages', label: 'Messages' },
  { id: 'availability', label: 'Availability' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'performance', label: 'Performance' },
  { id: 'vehicle', label: 'Vehicle' },
  { id: 'earnings', label: 'Pay' },
  { id: 'activation', label: 'Activation' },
  { id: 'profile', label: 'Profile' },
  { id: 'settings', label: 'Settings' },
];

export const STAFF_GROUPS: { title: string; ids: string[] }[] = [
  { title: 'Command', ids: ['overview', 'map'] },
  { title: 'Operations', ids: ['jobs', 'applications', 'credentials', 'clients', 'guards', 'crews', 'team', 'messages'] },
  { title: 'Finance', ids: ['payments', 'payment-settings', 'agreements', 'audit-log'] },
  { title: 'Insights', ids: ['incidents', 'violations', 'stats', 'disputes', 'analytics'] },
  { title: 'Platform', ids: ['cities', 'permissions', 'settings', 'integrations', 'guide', 'dev-updates', 'design-qa'] },
];

export const STAFF_NAV: NavItemDef[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'map', label: 'Map' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'applications', label: 'Applications' },
  { id: 'credentials', label: 'Credentials' },
  { id: 'clients', label: 'Clients' },
  { id: 'guards', label: 'Guards' },
  { id: 'crews', label: 'Crews' },
  { id: 'team', label: 'Staff' },
  { id: 'messages', label: 'Messages' },
  { id: 'payments', label: 'Payments' },
  { id: 'payment-settings', label: 'Pay settings' },
  { id: 'agreements', label: 'Agreements' },
  { id: 'audit-log', label: 'Audit log' },
  { id: 'incidents', label: 'Incidents' },
  { id: 'violations', label: 'Violations' },
  { id: 'stats', label: 'Stats' },
  { id: 'disputes', label: 'Disputes' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'cities', label: 'Operations' },
  { id: 'permissions', label: 'Permissions' },
  { id: 'settings', label: 'Public info' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'guide', label: 'Guide' },
  { id: 'dev-updates', label: 'Dev notes' },
  { id: 'design-qa', label: 'Design QA' },
  { id: 'profile', label: 'Profile' },
  { id: 'preferences', label: 'Settings' },
];

export const BRAND_LABEL: Record<string, string> = {
  client: 'Guardr Client',
  guard: 'Guardr Pro',
  staff: 'Guardr Ops',
};

export function navForLayout(layout: string): NavItemDef[] {
  if (layout === 'client') return CLIENT_NAV;
  if (layout === 'guard') return GUARD_NAV;
  if (layout === 'staff') return STAFF_NAV;
  return [];
}
