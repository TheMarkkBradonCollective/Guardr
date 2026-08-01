export type JobReviewMode = 'staff-all' | 'trusted-auto' | 'none';

export interface OnboardingTourStep {
  id: string;
  title: string;
  body: string;
  detail: string;
  targetSelector?: string;
  navigate?: {
    guardTab?: string;
    clientView?: string;
    staffSection?: string;
  };
}

export interface OnboardingTour {
  id: string;
  role: 'guard' | 'client' | 'staff';
  steps: OnboardingTourStep[];
}

export const GUARD_ONBOARDING_TOUR: OnboardingTour = {
  id: 'guard-welcome',
  role: 'guard',
  steps: [
    {
      id: 'map-overview',
      title: 'Map',
      body: 'Pins show open jobs nearby. Use the filter strip to narrow by status.',
      detail: 'Map overview and filters.',
      navigate: { guardTab: 'map' },
      targetSelector: '[data-tour="guard-map-filters"]',
    },
    {
      id: 'map-jobs',
      title: 'Map listings',
      body: 'Sample job at top is local-only. Swipe the bottom carousel to preview pay and schedule.',
      detail: 'Sample listing and browse dock.',
      navigate: { guardTab: 'map' },
      targetSelector: '[data-tour="guard-demo-job"]',
    },
    {
      id: 'my-jobs-list',
      title: 'My Jobs',
      body: 'Your applications and shifts. Tally chips filter Available, Scheduled, Completed, and Missed.',
      detail: 'My Jobs list and tabs.',
      navigate: { guardTab: 'myJobs' },
      targetSelector: '[data-tour="guard-my-jobs-tabs"]',
    },
    {
      id: 'my-jobs-detail',
      title: 'Shift detail',
      body: 'Tap a row for site notes, crew, chat, briefing, and check-in when a shift is live.',
      detail: 'Shift detail panel.',
      navigate: { guardTab: 'myJobs' },
      targetSelector: '[data-tour="guard-my-jobs"]',
    },
    {
      id: 'crew',
      title: 'Crew',
      body: 'Trusted guards build standing teams here — invite members or join with a team code.',
      detail: 'Standing crew hub.',
      navigate: { guardTab: 'crew' },
      targetSelector: '[data-tour="guard-crew"]',
    },
    {
      id: 'messages',
      title: 'Messages',
      body: 'Job and crew threads live here. Support tab reaches Guardr staff for account help.',
      detail: 'Messages and support.',
      navigate: { guardTab: 'messages' },
      targetSelector: '[data-tour="guard-messages"]',
    },
    {
      id: 'pay',
      title: 'Pay',
      body: 'Track earnings and connect Stripe before your first payout.',
      detail: 'Pay and Stripe.',
      navigate: { guardTab: 'earnings' },
      targetSelector: '[data-tour="guard-earnings"]',
    },
    {
      id: 'settings',
      title: 'Account settings',
      body: 'Profile, credentials, and availability are in the sidebar footer. Restart the tour from Guide anytime.',
      detail: 'Account settings wrap-up.',
      navigate: { guardTab: 'settings' },
      targetSelector: '[data-tour="guard-settings"]',
    },
  ],
};

export const CLIENT_ONBOARDING_TOUR: OnboardingTour = {
  id: 'client-welcome',
  role: 'client',
  steps: [
    {
      id: 'home-overview',
      title: 'Home',
      body: 'Coverage stats and quick links to your active jobs and guards on duty.',
      detail: 'Home overview.',
      navigate: { clientView: 'home' },
      targetSelector: '[data-tour="client-home"]',
    },
    {
      id: 'home-post',
      title: 'Post a job',
      body: 'Tap Jobs or + Post a job to create coverage — site, schedule, armed needs, and budget.',
      detail: 'Post coverage CTA.',
      navigate: { clientView: 'home' },
      targetSelector: '[data-tour="client-home-cta"]',
    },
    {
      id: 'jobs-board',
      title: 'Jobs board',
      body: 'All postings live here. Sample draft at top is device-only until you publish for real.',
      detail: 'Jobs board.',
      navigate: { clientView: 'requests' },
      targetSelector: '[data-tour="client-jobs"]',
    },
    {
      id: 'jobs-detail',
      title: 'Job filters & detail',
      body: 'Tabs split open, scheduled, completed, and missed. Tap a row for applicants and chat.',
      detail: 'Job tabs and detail.',
      navigate: { clientView: 'requests' },
      targetSelector: '[data-tour="client-jobs-tabs"]',
    },
    {
      id: 'map',
      title: 'Live map',
      body: 'See assigned guards check in and move through active shifts in real time.',
      detail: 'Live coverage map.',
      navigate: { clientView: 'map' },
      targetSelector: '[data-tour="client-map"]',
    },
    {
      id: 'guards',
      title: 'Find guards',
      body: 'Browse verified guards, filter by armed status and ratings, and save favorites.',
      detail: 'Guard directory.',
      navigate: { clientView: 'guards' },
      targetSelector: '[data-tour="client-guards"]',
    },
    {
      id: 'messages',
      title: 'Messages',
      body: 'Job threads and support tickets share one inbox with unread badges.',
      detail: 'Client messages.',
      navigate: { clientView: 'messages' },
      targetSelector: '[data-tour="client-messages"]',
    },
    {
      id: 'settings',
      title: 'Account settings',
      body: 'Company profile, billing, and legal docs are under Account settings in the sidebar.',
      detail: 'Client settings.',
      navigate: { clientView: 'settings' },
      targetSelector: '[data-tour="client-settings"]',
    },
  ],
};

export const STAFF_ONBOARDING_TOUR: OnboardingTour = {
  id: 'staff-welcome',
  role: 'staff',
  steps: [
    {
      id: 'overview-snapshot',
      title: 'Overview',
      body: 'KPI tiles and shortcuts for jobs, applications, and the map. Sample items stay local only.',
      detail: 'Overview snapshot.',
      navigate: { staffSection: 'overview' },
      targetSelector: '[data-tour="staff-overview-shortcuts"]',
    },
    {
      id: 'overview-queues',
      title: 'Attention queues',
      body: 'Pending approvals and SLA risks surface here — click through to the roster page.',
      detail: 'Attention queues.',
      navigate: { staffSection: 'overview' },
      targetSelector: '[data-tour="staff-overview-queues"]',
    },
    {
      id: 'applications',
      title: 'Applications',
      body: 'Review guard applicants, open the detail drawer, and forward the best fit to clients.',
      detail: 'Guard applications.',
      navigate: { staffSection: 'applications' },
      targetSelector: '[data-tour="staff-applications"]',
    },
    {
      id: 'jobs',
      title: 'Jobs',
      body: 'Canonical job roster — filter, edit pay, reassign guards, and open job chat.',
      detail: 'Jobs board.',
      navigate: { staffSection: 'jobs' },
      targetSelector: '[data-tour="staff-jobs"]',
    },
    {
      id: 'map',
      title: 'Ops map',
      body: 'Live guard locations and coverage gaps across active sites.',
      detail: 'Staff ops map.',
      navigate: { staffSection: 'map' },
      targetSelector: '[data-tour="staff-map"]',
    },
    {
      id: 'messages',
      title: 'Messages',
      body: 'Staff, guard, and client threads plus field support escalations.',
      detail: 'Staff messages.',
      navigate: { staffSection: 'messages' },
      targetSelector: '[data-tour="staff-messages"]',
    },
    {
      id: 'credentials',
      title: 'Credentials',
      body: 'Audit guard cards and permits — expiring and restricted rows need action here.',
      detail: 'Credentials roster.',
      navigate: { staffSection: 'credentials' },
      targetSelector: '[data-tour="staff-credentials"]',
    },
    {
      id: 'settings',
      title: 'Platform settings',
      body: 'Public information, integrations, and permissions live under Platform in the sidebar.',
      detail: 'Staff settings.',
      navigate: { staffSection: 'settings' },
      targetSelector: '[data-tour="staff-settings"]',
    },
  ],
};

/** @deprecated Use tutorialSession.ts lifecycle instead */
const LEGACY_STORAGE_PREFIX = 'guardr_tour_';

export function getTourForRole(role: string): OnboardingTour | null {
  if (role === 'guard') return GUARD_ONBOARDING_TOUR;
  if (role === 'client') return CLIENT_ONBOARDING_TOUR;
  if (['owner', 'director', 'manager', 'administrator', 'moderator', 'support'].includes(role)) return STAFF_ONBOARDING_TOUR;
  return null;
}

/** @deprecated */
export function isTourCompleted(userId: string, tourId: string): boolean {
  try {
    return localStorage.getItem(`${LEGACY_STORAGE_PREFIX}${userId}_${tourId}`) === 'done';
  } catch {
    return false;
  }
}

/** @deprecated */
export function markTourCompleted(userId: string, tourId: string): void {
  try {
    localStorage.setItem(`${LEGACY_STORAGE_PREFIX}${userId}_${tourId}`, 'done');
  } catch {
    /* ignore */
  }
}

export function migrateLegacyTourCompletion(userId: string, tourId: string): void {
  if (!isTourCompleted(userId, tourId)) return;
  try {
    const key = `guardr_tutorial_${userId}`;
    const raw = localStorage.getItem(key);
    const state = raw ? JSON.parse(raw) : { lifecycle: 'never', session: null };
    if (state.lifecycle === 'never') {
      localStorage.setItem(key, JSON.stringify({ lifecycle: 'completed', session: null }));
    }
    localStorage.removeItem(`${LEGACY_STORAGE_PREFIX}${userId}_${tourId}`);
  } catch {
    /* ignore */
  }
}
