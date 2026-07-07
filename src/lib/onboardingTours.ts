export type JobReviewMode = 'staff-all' | 'trusted-auto' | 'none';

export interface OnboardingTourStep {
  id: string;
  title: string;
  body: string;
  targetSelector?: string;
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
    { id: 'map', title: 'Browse jobs', body: 'Open the map to see available security work near you.', targetSelector: '[data-tour="guard-map"]' },
    { id: 'activation', title: 'Get activated', body: 'Complete credentials and ID verification to accept jobs.', targetSelector: '[data-tour="guard-activation"]' },
    { id: 'earnings', title: 'Track earnings', body: 'View payouts and connect Stripe for direct deposits.', targetSelector: '[data-tour="guard-earnings"]' },
  ],
};

export const CLIENT_ONBOARDING_TOUR: OnboardingTour = {
  id: 'client-welcome',
  role: 'client',
  steps: [
    { id: 'request', title: 'Post a request', body: 'Describe your site, schedule, and requirements.', targetSelector: '[data-tour="client-request"]' },
    { id: 'map', title: 'Live coverage', body: 'Watch guard assignments on your coverage map.', targetSelector: '[data-tour="client-map"]' },
    { id: 'guards', title: 'Find guards', body: 'Browse verified guards and save favorites.', targetSelector: '[data-tour="client-guards"]' },
  ],
};

export const STAFF_ONBOARDING_TOUR: OnboardingTour = {
  id: 'staff-welcome',
  role: 'staff',
  steps: [
    { id: 'approvals', title: 'Approvals queue', body: 'Review pending accounts, credentials, and job postings.', targetSelector: '[data-tour="staff-approvals"]' },
    { id: 'map', title: 'Ops map', body: 'Monitor live jobs and guard locations.', targetSelector: '[data-tour="staff-map"]' },
    { id: 'payments', title: 'Payments', body: 'Process deposits, payouts, and platform fees.', targetSelector: '[data-tour="staff-payments"]' },
  ],
};

const STORAGE_PREFIX = 'guardr_tour_';

export function getTourForRole(role: string): OnboardingTour | null {
  if (role === 'guard') return GUARD_ONBOARDING_TOUR;
  if (role === 'client') return CLIENT_ONBOARDING_TOUR;
  if (['owner', 'director', 'administrator', 'moderator'].includes(role)) return STAFF_ONBOARDING_TOUR;
  return null;
}

export function isTourCompleted(userId: string, tourId: string): boolean {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${userId}_${tourId}`) === 'done';
  } catch {
    return false;
  }
}

export function markTourCompleted(userId: string, tourId: string): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}_${tourId}`, 'done');
  } catch {
    /* ignore */
  }
}
