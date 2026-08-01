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
      id: 'map-intro',
      title: 'Map — your job board',
      body: 'The Map tab is where you discover open work near you.',
      detail:
        'Pins show open jobs in your service area. Zoom with the +/− controls or pinch on mobile. Your location helps sort nearby listings — enable location when prompted.',
      navigate: { guardTab: 'map' },
      targetSelector: '[data-tour="guard-map"]',
    },
    {
      id: 'map-filters',
      title: 'Map — status filters',
      body: 'Use the filter strip to focus on the kind of work you want right now.',
      detail:
        'Tap Open, Scheduled, In progress, or Completed to change which pins appear. Filters apply instantly so you can scan only relevant listings without leaving the map.',
      navigate: { guardTab: 'map' },
      targetSelector: '[data-tour="guard-map-filters"]',
    },
    {
      id: 'map-sample',
      title: 'Map — sample listing',
      body: 'While the tutorial runs, a private sample job appears at the top of the map.',
      detail:
        'This listing exists only on your device — it is not sent to clients or staff. Tap the highlighted card or the map pin to open the job sheet and see how rates, site details, and apply actions work on real postings.',
      navigate: { guardTab: 'map' },
      targetSelector: '[data-tour="guard-demo-job"]',
    },
    {
      id: 'map-browse',
      title: 'Map — browse dock',
      body: 'The carousel along the bottom summarizes nearby open jobs.',
      detail:
        'Swipe through cards to preview site name, schedule, and pay without tapping every pin. Selecting a card centers the map and opens the same detail sheet you would use on a live job.',
      navigate: { guardTab: 'map' },
      targetSelector: '[data-tour="guard-map-browse"]',
    },
    {
      id: 'my-jobs-intro',
      title: 'My Jobs — shift hub',
      body: 'Everything you applied to, are scheduled for, or completed lives on My Jobs.',
      detail:
        'This page is your personal roster — not the public job board. Use it to track applications waiting on client approval, upcoming shifts, and past work for pay history.',
      navigate: { guardTab: 'myJobs' },
      targetSelector: '[data-tour="guard-my-jobs"]',
    },
    {
      id: 'my-jobs-tabs',
      title: 'My Jobs — status tabs',
      body: 'The tally chips across the top filter your shift list.',
      detail:
        'Available shows open work you can still apply to. Scheduled lists confirmed shifts. Completed and Missed help you audit attendance. Counts update as jobs move through the pipeline.',
      navigate: { guardTab: 'myJobs' },
      targetSelector: '[data-tour="guard-my-jobs-tabs"]',
    },
    {
      id: 'my-jobs-detail',
      title: 'My Jobs — row detail',
      body: 'Select any row to open the detail panel on the right (or full screen on mobile).',
      detail:
        'The detail view shows site instructions, crew roster, chat shortcuts, briefing access, and check-in actions when a shift is active. This is the same layout you will use on live assignments.',
      navigate: { guardTab: 'myJobs' },
      targetSelector: '[data-tour="guard-my-jobs"]',
    },
    {
      id: 'crew-intro',
      title: 'Crew — standing teams',
      body: 'Trusted guards can build a standing crew for recurring multi-guard work.',
      detail:
        'Open Crew from the sidebar when your account is trusted. You can request crew-lead status, invite members with a team code, or join another guard’s crew. You may only belong to one standing crew at a time.',
      navigate: { guardTab: 'crew' },
      targetSelector: '[data-tour="guard-crew"]',
    },
    {
      id: 'messages-intro',
      title: 'Messages — job threads',
      body: 'Job chats, crew threads, and client coordination live under Messages.',
      detail:
        'Each active job can have its own thread. Unread badges appear on the sidebar and bottom nav. Open a thread to send updates, photos, or arrival notices without leaving the app.',
      navigate: { guardTab: 'messages' },
      targetSelector: '[data-tour="guard-messages"]',
    },
    {
      id: 'messages-support',
      title: 'Messages — support',
      body: 'Support reaches Guardr staff directly when you need help outside a job thread.',
      detail:
        'Use Support for account issues, credential questions, or platform bugs. Compose a ticket from the Support tab — staff replies appear in the same inbox.',
      navigate: { guardTab: 'support' },
      targetSelector: '[data-tour="guard-support"]',
    },
    {
      id: 'earnings-intro',
      title: 'Pay — earnings overview',
      body: 'The Pay tab tracks completed shift payouts and open invoices.',
      detail:
        'After jobs finish, earnings roll up here with breakdowns by job type and date. Pending payouts show until Stripe settles them to your connected account.',
      navigate: { guardTab: 'earnings' },
      targetSelector: '[data-tour="guard-earnings"]',
    },
    {
      id: 'earnings-stripe',
      title: 'Pay — Stripe setup',
      body: 'Connect Stripe before your first live payout.',
      detail:
        'Tap Connect Stripe in Pay or Account settings. Guardr uses Stripe Express so you can receive direct deposits. You must finish onboarding before funds release from completed shifts.',
      navigate: { guardTab: 'earnings' },
      targetSelector: '[data-tour="guard-earnings"]',
    },
    {
      id: 'settings-finish',
      title: 'Account settings & wrap-up',
      body: 'Profile, credentials, availability, and legal documents live under Account settings in the sidebar footer.',
      detail:
        'Upload guard cards and certifications under Profile. Set weekly availability so clients see when you are bookable. You can restart this tutorial anytime from Guide → Interactive tutorial. Tap Finish on the last step or End tutorial when you are done.',
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
      id: 'home-intro',
      title: 'Home — command center',
      body: 'Home summarizes coverage health, upcoming shifts, and quick actions.',
      detail:
        'The hero shows your organization name and high-level status. Use it as a launch point before diving into Jobs or the map. Pending account reviews may limit some actions until staff approves your company.',
      navigate: { clientView: 'home' },
      targetSelector: '[data-tour="client-home"]',
    },
    {
      id: 'home-actions',
      title: 'Home — post coverage',
      body: 'The primary call-to-action posts a new security request.',
      detail:
        'Tap + Post a job (sidebar or home) to open the request wizard. You will enter site address, schedule, armed requirements, headcount, and budget. Drafts can be saved before publishing to guards.',
      navigate: { clientView: 'home' },
      targetSelector: '[data-tour="client-home-cta"]',
    },
    {
      id: 'jobs-intro',
      title: 'Jobs — request board',
      body: 'The Jobs page lists every posting your company created.',
      detail:
        'While the tutorial runs, a sample draft appears at the top — it stays on your device only and is not visible to guards or staff. Real postings follow the same layout once you publish.',
      navigate: { clientView: 'requests' },
      targetSelector: '[data-tour="client-jobs"]',
    },
    {
      id: 'jobs-tabs',
      title: 'Jobs — status filters',
      body: 'Tabs and tally chips separate open, scheduled, completed, and missed coverage.',
      detail:
        'Open shows unfilled postings accepting applications. Scheduled lists confirmed guards. Completed archives past work for invoices and reports. Tap a row to edit, message assigned guards, or cancel remaining shifts.',
      navigate: { clientView: 'requests' },
      targetSelector: '[data-tour="client-jobs-tabs"]',
    },
    {
      id: 'jobs-detail',
      title: 'Jobs — posting detail',
      body: 'Selecting a job opens applicants, assigned guards, and chat shortcuts.',
      detail:
        'Review guard applications, approve a fit, or request staff help when trusted-auto rules apply. Job chat keeps site instructions and schedule changes with the assigned team.',
      navigate: { clientView: 'requests' },
      targetSelector: '[data-tour="client-jobs"]',
    },
    {
      id: 'map-intro',
      title: 'Map — live coverage',
      body: 'Watch assigned guards and active shifts on the map.',
      detail:
        'Pins update as guards check in, go en route, or complete shifts. Use this view during events to confirm someone is on site without opening each job individually.',
      navigate: { clientView: 'map' },
      targetSelector: '[data-tour="client-map"]',
    },
    {
      id: 'guards-intro',
      title: 'Guards — talent directory',
      body: 'Browse verified guards and save favorites for future postings.',
      detail:
        'Filter by armed status, ratings, credentials, and distance. Tap a profile to read experience, gear, and reviews. You can invite a guard directly to a new posting from their card.',
      navigate: { clientView: 'guards' },
      targetSelector: '[data-tour="client-guards"]',
    },
    {
      id: 'guards-filters',
      title: 'Guards — search & filters',
      body: 'Narrow the directory before inviting someone to a job.',
      detail:
        'Use search for name or keyword matches. Armed, vehicle, and rating filters help you comply with site requirements. Favorited guards appear at the top of future invite lists.',
      navigate: { clientView: 'guards' },
      targetSelector: '[data-tour="client-guards"]',
    },
    {
      id: 'messages-intro',
      title: 'Messages — job inbox',
      body: 'All job threads and support tickets are in one inbox.',
      detail:
        'Unread counts show on the sidebar. Open a thread to coordinate arrival times, gate codes, or incidents. Support messages reach Guardr staff for billing or account help.',
      navigate: { clientView: 'messages' },
      targetSelector: '[data-tour="client-messages"]',
    },
    {
      id: 'settings-finish',
      title: 'Settings & wrap-up',
      body: 'Company profile, billing, notifications, and legal documents are under Account settings.',
      detail:
        'Update public company information staff displays to guards. Connect payment methods for job charges. Restart this tutorial from Guide → Interactive tutorial whenever you need a refresher.',
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
      id: 'overview-intro',
      title: 'Overview — ops snapshot',
      body: 'The Overview page is your morning briefing across the platform.',
      detail:
        'KPI tiles summarize open jobs, pending applications, incidents, and staffing gaps. Tutorial sample items may appear locally on your browser — they never enter the live queue or notify anyone.',
      navigate: { staffSection: 'overview' },
      targetSelector: '[data-tour="staff-overview"]',
    },
    {
      id: 'overview-shortcuts',
      title: 'Overview — quick actions',
      body: 'Shortcut chips jump straight into common workflows.',
      detail:
        'Create jobs, review applications, or open the map from here without hunting the sidebar. Role permissions may hide actions your account cannot perform.',
      navigate: { staffSection: 'overview' },
      targetSelector: '[data-tour="staff-overview-shortcuts"]',
    },
    {
      id: 'overview-queues',
      title: 'Overview — attention queues',
      body: 'Attention panels surface items that need a human decision today.',
      detail:
        'Pending approvals, expiring credentials, and SLA risks bubble up here. Click through to the underlying roster page — the overview is a dashboard, not the system of record.',
      navigate: { staffSection: 'overview' },
      targetSelector: '[data-tour="staff-overview-queues"]',
    },
    {
      id: 'applications-intro',
      title: 'Applications — guard intake',
      body: 'Every guard who applies to an open job appears here.',
      detail:
        'Review credentials, standing, and fit before forwarding to the client. Tutorial mode includes a sample application stored only in your browser.',
      navigate: { staffSection: 'applications' },
      targetSelector: '[data-tour="staff-applications"]',
    },
    {
      id: 'applications-actions',
      title: 'Applications — approve or pass',
      body: 'Use row actions to advance, hold, or decline applicants.',
      detail:
        'Open the detail drawer to read BSIS status, gear, and history. Approved guards move to the client for final selection when required. Notes stay on the record for audit.',
      navigate: { staffSection: 'applications' },
      targetSelector: '[data-tour="staff-applications"]',
    },
    {
      id: 'jobs-intro',
      title: 'Jobs — live roster',
      body: 'The Jobs board is the canonical list of client postings.',
      detail:
        'Filter by status, city, or client. Edit listings, adjust pay, reassign guards, or open job chat. This is where most day-to-day ops work happens.',
      navigate: { staffSection: 'jobs' },
      targetSelector: '[data-tour="staff-jobs"]',
    },
    {
      id: 'jobs-table',
      title: 'Jobs — table & detail',
      body: 'Click a row to open the split detail pane.',
      detail:
        'The detail view shows timeline, assigned guards, incidents, and payment state. Use the toolbar filters to focus on open, in-progress, or disputed jobs during busy shifts.',
      navigate: { staffSection: 'jobs' },
      targetSelector: '[data-tour="staff-jobs"]',
    },
    {
      id: 'map-intro',
      title: 'Map — field picture',
      body: 'The ops map aggregates guard locations and active coverage.',
      detail:
        'Spot geographic gaps when multiple sites run at once. Selecting a pin opens the same job record you would see on the Jobs board.',
      navigate: { staffSection: 'map' },
      targetSelector: '[data-tour="staff-map"]',
    },
    {
      id: 'messages-intro',
      title: 'Messages — staff inbox',
      body: 'Internal staff chat plus guard and client threads live here.',
      detail:
        'Switch between channels without leaving ops. Unread badges follow the same rules as guard and client apps. Support escalations from the field appear in your queue.',
      navigate: { staffSection: 'messages' },
      targetSelector: '[data-tour="staff-messages"]',
    },
    {
      id: 'credentials-intro',
      title: 'Credentials — compliance',
      body: 'Audit guard cards, permits, and uploads from the Credentials roster.',
      detail:
        'Filter by expiring, pending review, or restricted. Staff actions here gate whether a guard can accept armed work or activate their account.',
      navigate: { staffSection: 'credentials' },
      targetSelector: '[data-tour="staff-credentials"]',
    },
    {
      id: 'settings-finish',
      title: 'Settings & wrap-up',
      body: 'Public information, integrations, and permissions live under Platform in the sidebar.',
      detail:
        'Update placards clients see, connect webhooks, and manage role access. Restart this walkthrough from Guide → Interactive tutorial. End tutorial clears local sample data from your browser.',
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
