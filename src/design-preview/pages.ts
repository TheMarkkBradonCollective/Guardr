export type PreviewRole = 'public' | 'client' | 'guard' | 'staff';

export type PageType =
  | 'landing'
  | 'auth'
  | 'auth-signup'
  | 'guide'
  | 'legal'
  | 'dashboard'
  | 'list'
  | 'grid'
  | 'form'
  | 'messages'
  | 'profile'
  | 'settings'
  | 'calendar'
  | 'earnings'
  | 'activation'
  | 'map-guard'
  | 'map-client'
  | 'map-staff';

export interface PreviewPage {
  id: string;
  role: PreviewRole;
  path: string;
  title: string;
  layout: PreviewRole | 'public';
  type: PageType;
  nav?: string;
}

export const PREVIEW_PAGES: PreviewPage[] = [
  { id: 'landing', role: 'public', path: '/', title: 'Landing', layout: 'public', type: 'landing' },
  { id: 'auth-signin', role: 'public', path: '/?auth=sign-in', title: 'Sign in', layout: 'public', type: 'auth' },
  { id: 'auth-signup', role: 'public', path: '/?auth=sign-up', title: 'Sign up', layout: 'public', type: 'auth-signup' },
  { id: 'guide', role: 'public', path: '/guide', title: 'Product guide', layout: 'public', type: 'guide' },
  { id: 'legal-terms', role: 'public', path: '/legal/terms', title: 'Terms of Service', layout: 'public', type: 'legal' },
  { id: 'legal-privacy', role: 'public', path: '/legal/privacy', title: 'Privacy Policy', layout: 'public', type: 'legal' },
  { id: 'legal-ica', role: 'public', path: '/legal/ica', title: 'ICA', layout: 'public', type: 'legal' },
  { id: 'legal-client', role: 'public', path: '/legal/client-agreement', title: 'Client Agreement', layout: 'public', type: 'legal' },
  { id: 'legal-conduct', role: 'public', path: '/legal/guard-conduct', title: 'Guard Conduct', layout: 'public', type: 'legal' },

  { id: 'client-home', role: 'client', path: '/client/home', title: 'Home', layout: 'client', type: 'dashboard', nav: 'home' },
  { id: 'client-map', role: 'client', path: '/client/map', title: 'Map', layout: 'client', type: 'map-client', nav: 'map' },
  { id: 'client-request', role: 'client', path: '/client/request', title: 'Post job', layout: 'client', type: 'form', nav: 'requests' },
  { id: 'client-direct', role: 'client', path: '/client/direct-request', title: 'Hire guard', layout: 'client', type: 'form', nav: 'guards' },
  { id: 'client-requests', role: 'client', path: '/client/requests', title: 'Jobs', layout: 'client', type: 'list', nav: 'requests' },
  { id: 'client-guards', role: 'client', path: '/client/guards', title: 'Guards', layout: 'client', type: 'grid', nav: 'guards' },
  { id: 'client-messages', role: 'client', path: '/client/messages', title: 'Messages', layout: 'client', type: 'messages', nav: 'messages' },
  { id: 'client-support-compose', role: 'client', path: '/client/support-compose', title: 'Contact support', layout: 'client', type: 'form', nav: 'messages' },
  { id: 'client-support-report', role: 'client', path: '/client/support-report', title: 'File report', layout: 'client', type: 'form', nav: 'messages' },
  { id: 'client-reports', role: 'client', path: '/client/reports', title: 'Reports', layout: 'client', type: 'list', nav: 'reports' },
  { id: 'client-invoices', role: 'client', path: '/client/invoices', title: 'Invoices', layout: 'client', type: 'list', nav: 'invoices' },
  { id: 'client-locations', role: 'client', path: '/client/locations', title: 'Locations', layout: 'client', type: 'list', nav: 'locations' },
  { id: 'client-profile', role: 'client', path: '/client/profile', title: 'Profile', layout: 'client', type: 'profile', nav: 'settings' },
  { id: 'client-settings', role: 'client', path: '/client/settings', title: 'Settings', layout: 'client', type: 'settings', nav: 'settings' },
  { id: 'client-guide', role: 'client', path: '/client/guide', title: 'Guide', layout: 'client', type: 'guide', nav: 'settings' },

  { id: 'guard-map', role: 'guard', path: '/guard/map', title: 'Map', layout: 'guard', type: 'map-guard', nav: 'map' },
  { id: 'guard-activation', role: 'guard', path: '/guard/activation', title: 'Activation', layout: 'guard', type: 'activation', nav: 'activation' },
  { id: 'guard-jobs', role: 'guard', path: '/guard/my-jobs', title: 'Jobs', layout: 'guard', type: 'list', nav: 'myJobs' },
  { id: 'guard-earnings', role: 'guard', path: '/guard/earnings', title: 'Pay', layout: 'guard', type: 'earnings', nav: 'earnings' },
  { id: 'guard-messages', role: 'guard', path: '/guard/messages', title: 'Messages', layout: 'guard', type: 'messages', nav: 'messages' },
  { id: 'guard-crew', role: 'guard', path: '/guard/crew', title: 'Crew', layout: 'guard', type: 'grid', nav: 'crew' },
  { id: 'guard-preferences', role: 'guard', path: '/guard/preferences', title: 'Preferences', layout: 'guard', type: 'settings', nav: 'preferences' },
  { id: 'guard-performance', role: 'guard', path: '/guard/performance', title: 'Performance', layout: 'guard', type: 'dashboard', nav: 'performance' },
  { id: 'guard-availability', role: 'guard', path: '/guard/availability', title: 'Availability', layout: 'guard', type: 'calendar', nav: 'availability' },
  { id: 'guard-vehicle', role: 'guard', path: '/guard/vehicle', title: 'Vehicle', layout: 'guard', type: 'form', nav: 'vehicle' },
  { id: 'guard-profile', role: 'guard', path: '/guard/profile', title: 'Profile', layout: 'guard', type: 'profile', nav: 'profile' },
  { id: 'guard-settings', role: 'guard', path: '/guard/settings', title: 'Settings', layout: 'guard', type: 'settings', nav: 'settings' },
  { id: 'guard-guide', role: 'guard', path: '/guard/guide', title: 'Guide', layout: 'guard', type: 'guide', nav: 'settings' },

  { id: 'staff-overview', role: 'staff', path: '/staff/overview', title: 'Overview', layout: 'staff', type: 'dashboard', nav: 'overview' },
  { id: 'staff-map', role: 'staff', path: '/staff/map', title: 'Operations map', layout: 'staff', type: 'map-staff', nav: 'map' },
  { id: 'staff-jobs', role: 'staff', path: '/staff/jobs', title: 'Jobs', layout: 'staff', type: 'list', nav: 'jobs' },
  { id: 'staff-applications', role: 'staff', path: '/staff/applications', title: 'Applications', layout: 'staff', type: 'list', nav: 'applications' },
  { id: 'staff-credentials', role: 'staff', path: '/staff/credentials', title: 'Credentials', layout: 'staff', type: 'list', nav: 'credentials' },
  { id: 'staff-guards', role: 'staff', path: '/staff/guards', title: 'Field guards', layout: 'staff', type: 'grid', nav: 'guards' },
  { id: 'staff-crews', role: 'staff', path: '/staff/crews', title: 'Crews', layout: 'staff', type: 'grid', nav: 'crews' },
  { id: 'staff-clients', role: 'staff', path: '/staff/clients', title: 'Clients', layout: 'staff', type: 'grid', nav: 'clients' },
  { id: 'staff-team', role: 'staff', path: '/staff/team', title: 'Staff', layout: 'staff', type: 'grid', nav: 'team' },
  { id: 'staff-messages', role: 'staff', path: '/staff/messages', title: 'Messages', layout: 'staff', type: 'messages', nav: 'messages' },
  { id: 'staff-payments', role: 'staff', path: '/staff/payments', title: 'Payments', layout: 'staff', type: 'list', nav: 'payments' },
  { id: 'staff-payment-settings', role: 'staff', path: '/staff/payment-settings', title: 'Payment settings', layout: 'staff', type: 'settings', nav: 'payment-settings' },
  { id: 'staff-agreements', role: 'staff', path: '/staff/agreements', title: 'Agreements', layout: 'staff', type: 'list', nav: 'agreements' },
  { id: 'staff-audit', role: 'staff', path: '/staff/audit-log', title: 'Audit log', layout: 'staff', type: 'list', nav: 'audit-log' },
  { id: 'staff-incidents', role: 'staff', path: '/staff/incidents', title: 'Incidents', layout: 'staff', type: 'list', nav: 'incidents' },
  { id: 'staff-violations', role: 'staff', path: '/staff/violations', title: 'Violations', layout: 'staff', type: 'list', nav: 'violations' },
  { id: 'staff-stats', role: 'staff', path: '/staff/stats', title: 'Stats', layout: 'staff', type: 'dashboard', nav: 'stats' },
  { id: 'staff-disputes', role: 'staff', path: '/staff/disputes', title: 'Disputes', layout: 'staff', type: 'list', nav: 'disputes' },
  { id: 'staff-analytics', role: 'staff', path: '/staff/analytics', title: 'Analytics', layout: 'staff', type: 'dashboard', nav: 'analytics' },
  { id: 'staff-cities', role: 'staff', path: '/staff/cities', title: 'Operations', layout: 'staff', type: 'list', nav: 'cities' },
  { id: 'staff-permissions', role: 'staff', path: '/staff/permissions', title: 'Permissions', layout: 'staff', type: 'settings', nav: 'permissions' },
  { id: 'staff-settings', role: 'staff', path: '/staff/settings', title: 'Public information', layout: 'staff', type: 'settings', nav: 'settings' },
  { id: 'staff-integrations', role: 'staff', path: '/staff/integrations', title: 'Integrations', layout: 'staff', type: 'settings', nav: 'integrations' },
  { id: 'staff-guide', role: 'staff', path: '/staff/guide', title: 'Guide', layout: 'staff', type: 'guide', nav: 'guide' },
  { id: 'staff-dev', role: 'staff', path: '/staff/dev-updates', title: 'Dev notes', layout: 'staff', type: 'list', nav: 'dev-updates' },
  { id: 'staff-profile', role: 'staff', path: '/staff/profile', title: 'Profile', layout: 'staff', type: 'profile', nav: 'profile' },
  { id: 'staff-preferences', role: 'staff', path: '/staff/preferences', title: 'Settings', layout: 'staff', type: 'settings', nav: 'preferences' },
];
