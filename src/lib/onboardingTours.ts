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
      id: 'welcome',
      title: 'Welcome to Guardr',
      body: 'This guided tour uses private practice data only you can see.',
      detail:
        'We created a sample job on your map so you can learn the workflow without affecting real clients or guards. Nothing here is public.',
      navigate: { guardTab: 'map' },
      targetSelector: '[data-tour="guard-map"]',
    },
    {
      id: 'browse',
      title: 'Browse open work',
      body: 'The map shows open jobs near you — including your tutorial listing.',
      detail:
        'Tap a pin to read the site, schedule, and pay rate. Real jobs work the same way once your account is activated.',
      targetSelector: '[data-tour="guard-demo-job"]',
      navigate: { guardTab: 'map' },
    },
    {
      id: 'my-jobs',
      title: 'Track applications & shifts',
      body: 'My Jobs lists everything you applied to or are scheduled for.',
      detail:
        'After activation you can apply from the map, get approved by staff, and clock in here for active shifts.',
      targetSelector: '[data-tour="guard-my-jobs"]',
      navigate: { guardTab: 'myJobs' },
    },
    {
      id: 'messages',
      title: 'Messages & support',
      body: 'Job chats, team threads, and support tickets live under Messages.',
      detail:
        'Use Messages to coordinate with clients and crew leads. Support reaches Guardr staff directly.',
      targetSelector: '[data-tour="guard-messages"]',
      navigate: { guardTab: 'messages' },
    },
    {
      id: 'earnings',
      title: 'Pay & Stripe',
      body: 'Connect Stripe and track payouts from completed shifts.',
      detail:
        'The Pay tab shows earnings breakdowns and open payout invoices after jobs complete.',
      targetSelector: '[data-tour="guard-earnings"]',
      navigate: { guardTab: 'earnings' },
    },
    {
      id: 'practice',
      title: 'Practice on your own',
      body: 'Tutorial steps are done — explore freely or add more practice jobs.',
      detail:
        'Use “Add practice data” while practice mode is on. Tap End tutorial (top right) when finished — practice data is deleted automatically.',
      targetSelector: '[data-tour="guard-map"]',
      navigate: { guardTab: 'map' },
    },
  ],
};

export const CLIENT_ONBOARDING_TOUR: OnboardingTour = {
  id: 'client-welcome',
  role: 'client',
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to Guardr',
      body: 'Learn how to post coverage with private tutorial data.',
      detail:
        'We added a draft request that only exists on your device. It is not sent to guards or staff until you post a real job.',
      navigate: { clientView: 'home' },
      targetSelector: '[data-tour="client-home"]',
    },
    {
      id: 'request',
      title: 'Create a job request',
      body: 'Requests describe the site, schedule, armed needs, and budget.',
      detail:
        'Trusted clients can open jobs instantly; others go through staff approval first. Your tutorial draft shows what that looks like.',
      targetSelector: '[data-tour="client-request"]',
      navigate: { clientView: 'requests' },
    },
    {
      id: 'map',
      title: 'Live coverage map',
      body: 'Watch assigned guards and job status on the map.',
      detail:
        'When a job is active you can see check-ins and shift progress here in real time.',
      targetSelector: '[data-tour="client-map"]',
      navigate: { clientView: 'map' },
    },
    {
      id: 'guards',
      title: 'Find guards',
      body: 'Browse verified guards and save favorites for future jobs.',
      detail:
        'Filter by armed status, ratings, and credentials before you invite someone to a posting.',
      targetSelector: '[data-tour="client-guards"]',
      navigate: { clientView: 'guards' },
    },
    {
      id: 'messages',
      title: 'Messages',
      body: 'Job chats and support live in one inbox.',
      detail:
        'Message assigned guards about site details, schedule changes, or incidents.',
      targetSelector: '[data-tour="client-messages"]',
      navigate: { clientView: 'messages' },
    },
    {
      id: 'practice',
      title: 'Practice on your own',
      body: 'Explore the app and add more practice drafts.',
      detail:
        'Use “Add practice data” to create another local-only example. End tutorial removes all practice data.',
      targetSelector: '[data-tour="client-home"]',
      navigate: { clientView: 'home' },
    },
  ],
};

export const STAFF_ONBOARDING_TOUR: OnboardingTour = {
  id: 'staff-welcome',
  role: 'staff',
  steps: [
    {
      id: 'welcome',
      title: 'Staff command center',
      body: 'This tour walks through ops with private practice items.',
      detail:
        'Tutorial approvals and jobs are stored locally on your browser — they never hit the live queue or notify anyone.',
      navigate: { staffSection: 'overview' },
      targetSelector: '[data-tour="staff-overview"]',
    },
    {
      id: 'applications',
      title: 'Guard applications',
      body: 'Review guards who applied to open jobs and send the best fit to the client.',
      detail:
        'Your tutorial includes a sample application. Real guard applicants appear here the same way.',
      targetSelector: '[data-tour="staff-applications"]',
      navigate: { staffSection: 'applications' },
    },
    {
      id: 'jobs',
      title: 'Jobs & live ops',
      body: 'Manage open jobs, assignments, and live shifts.',
      detail:
        'Edit listings, assign guards, and jump into job chats from the Jobs section.',
      targetSelector: '[data-tour="staff-jobs"]',
      navigate: { staffSection: 'jobs' },
    },
    {
      id: 'map',
      title: 'Ops map',
      body: 'Monitor guard locations and active coverage.',
      detail:
        'The map aggregates live and open jobs so you can spot gaps in coverage quickly.',
      targetSelector: '[data-tour="staff-map"]',
      navigate: { staffSection: 'map' },
    },
    {
      id: 'messages',
      title: 'Team messages',
      body: 'Internal staff chat plus guard and client inboxes.',
      detail:
        'Coordinate with moderators and directors without leaving the ops console.',
      targetSelector: '[data-tour="staff-messages"]',
      navigate: { staffSection: 'messages' },
    },
    {
      id: 'practice',
      title: 'Practice on your own',
      body: 'Keep exploring or add more practice approvals.',
      detail:
        'Add practice data to simulate another pending offer. End tutorial clears everything from local storage.',
      targetSelector: '[data-tour="staff-overview"]',
      navigate: { staffSection: 'overview' },
    },
  ],
};

/** @deprecated Use tutorialSession.ts lifecycle instead */
const LEGACY_STORAGE_PREFIX = 'guardr_tour_';

export function getTourForRole(role: string): OnboardingTour | null {
  if (role === 'guard') return GUARD_ONBOARDING_TOUR;
  if (role === 'client') return CLIENT_ONBOARDING_TOUR;
  if (['owner', 'director', 'administrator', 'moderator'].includes(role)) return STAFF_ONBOARDING_TOUR;
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
