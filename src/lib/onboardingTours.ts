export type JobReviewMode = 'staff-all' | 'trusted-auto' | 'none';

export interface OnboardingTourStep {
  id: string;
  title: string;
  body: string;
  detail: string;
  /** Optional actionable bullets shown below the detail paragraph. */
  tips?: string[];
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
      body: 'The Map tab is the starting point for finding open security work near you.',
      detail:
        'Think of the map as a live job board plotted geographically. Each pin represents a client posting that still needs coverage. The map recenters on your service area and uses your location (when enabled) to sort nearby listings by distance. On desktop the map fills the workspace; on mobile it sits above the browse carousel and bottom navigation.',
      tips: [
        'Enable location services when prompted so distance sorting is accurate.',
        'Use pinch or the +/− controls to zoom into dense areas with many pins.',
        'A highlighted pin usually means you already have a relationship with that job (applied, scheduled, or active).',
      ],
      navigate: { guardTab: 'map' },
      targetSelector: '[data-tour="guard-map"]',
    },
    {
      id: 'map-filters',
      title: 'Map — status filters',
      body: 'The filter strip lets you focus on the kind of work you want right now.',
      detail:
        'Open shows unfilled postings you can still apply to. Scheduled lists jobs you are confirmed for but have not started. In progress covers active shifts where check-in or en-route actions may apply. Completed archives past work for your records. Filters apply instantly — you do not need to reload the page.',
      tips: [
        'Start on Open when you are looking for new work.',
        'Switch to Scheduled the morning of a shift to confirm site details.',
        'Completed is useful when reconciling hours before checking Pay.',
      ],
      navigate: { guardTab: 'map' },
      targetSelector: '[data-tour="guard-map-filters"]',
    },
    {
      id: 'map-sample',
      title: 'Map — sample listing',
      body: 'During the tutorial, a private sample job appears at the top of the map.',
      detail:
        'This listing exists only in your browser — it is never sent to clients, guards, or staff. It mirrors the layout of a real posting so you can practice opening the job sheet, reading rates, reviewing site instructions, and walking through apply actions without affecting anyone else on the platform.',
      tips: [
        'Tap the highlighted card or the map pin to open the detail sheet.',
        'Read the rate breakdown, armed requirements, and schedule before applying on live jobs.',
        'The sample disappears automatically when you end the tutorial.',
      ],
      navigate: { guardTab: 'map' },
      targetSelector: '[data-tour="guard-demo-job"]',
    },
    {
      id: 'map-apply',
      title: 'Map — applying to a job',
      body: 'When you find a fit, the job sheet is where you commit to a shift.',
      detail:
        'The detail sheet shows site address, headcount, armed status, pay rate, and any special instructions from the client. Applying sends your profile to the client (and sometimes staff) for review. You may be asked to confirm availability, gear, and transportation. Pending applications appear under My Jobs until approved or declined.',
      tips: [
        'Make sure your credentials and profile photo are current before applying.',
        'If a job requires armed work, your guard card must be approved in Account settings.',
        'You can withdraw an application from My Jobs while it is still pending.',
      ],
      navigate: { guardTab: 'map' },
      targetSelector: '[data-tour="guard-demo-job"]',
    },
    {
      id: 'map-browse',
      title: 'Map — browse dock',
      body: 'The carousel along the bottom summarizes nearby open jobs without tapping every pin.',
      detail:
        'Each card shows site name, schedule window, estimated pay, and distance. Swipe horizontally to preview multiple listings. Selecting a card centers the map on that site and opens the same detail sheet you would use on a live posting. On desktop the dock may appear as a side rail depending on your layout.',
      tips: [
        'Use the dock when you are comparing several nearby sites quickly.',
        'Cards update as filters change — hide Completed when browsing for new work.',
        'Long-press or right-click is not required; a single tap opens details.',
      ],
      navigate: { guardTab: 'map' },
      targetSelector: '[data-tour="guard-map-browse"]',
    },
    {
      id: 'my-jobs-intro',
      title: 'My Jobs — shift hub',
      body: 'Everything you applied to, are scheduled for, or completed lives on My Jobs.',
      detail:
        'This page is your personal roster — not the public job board. Applications waiting on client approval, confirmed upcoming shifts, active check-ins, and historical work all surface here. The list is sorted by relevance: active and imminent shifts rise to the top so you do not miss a call time.',
      tips: [
        'Check My Jobs daily when you have pending applications.',
        'Tap a row to open the full detail panel (split view on desktop, full screen on mobile).',
        'Missed shifts also appear here so you can review what happened.',
      ],
      navigate: { guardTab: 'myJobs' },
      targetSelector: '[data-tour="guard-my-jobs"]',
    },
    {
      id: 'my-jobs-tabs',
      title: 'My Jobs — status tabs',
      body: 'Tally chips across the top filter your shift list by lifecycle stage.',
      detail:
        'Available shows open work you can still apply to from this view. Scheduled lists confirmed shifts with future start times. In progress covers shifts where check-in or en-route is expected. Completed and Missed help you audit attendance and pay history. Counts on each chip update in real time as jobs move through the pipeline.',
      tips: [
        'Scheduled + In progress are the tabs to watch on shift days.',
        'Completed is the source of truth before disputing hours in Pay.',
        'Filters combine with search when you have a long work history.',
      ],
      navigate: { guardTab: 'myJobs' },
      targetSelector: '[data-tour="guard-my-jobs-tabs"]',
    },
    {
      id: 'my-jobs-detail',
      title: 'My Jobs — shift detail',
      body: 'Selecting a row opens site instructions, roster details, chat, and check-in tools.',
      detail:
        'The detail view is the command center for a single assignment. You will see gate codes, parking notes, uniform requirements, the guard roster for multi-guard jobs, and buttons to message the client or open the job briefing. When a shift is active, check-in, en-route, and clock-out actions appear here — these timestamps feed payroll and client visibility on the map.',
      tips: [
        'Read the briefing before arriving on site — clients often add last-minute notes.',
        'Use job chat for arrival updates instead of texting personal numbers.',
        'Clock out promptly when the shift ends so pay is not delayed.',
      ],
      navigate: { guardTab: 'myJobs' },
      targetSelector: '[data-tour="guard-my-jobs"]',
    },
    {
      id: 'messages-intro',
      title: 'Messages — job threads',
      body: 'Job chats and coordination with clients live under Messages.',
      detail:
        'Each active job can have its own thread shared with assigned guards and the client contact. Unread badges appear on the sidebar tab and bottom navigation. Messages support text and photo attachments for incident documentation or gate updates. Push notifications (when enabled) alert you to new messages even when the app is in the background.',
      tips: [
        'Keep job-related communication inside the thread for audit purposes.',
        'Photos of incidents should be sent here, not only by SMS.',
        'Mute noisy threads from the thread menu if you are off duty.',
      ],
      navigate: { guardTab: 'messages' },
      targetSelector: '[data-tour="guard-messages"]',
    },
    {
      id: 'messages-support',
      title: 'Messages — support',
      body: 'Support reaches Guardr staff directly when you need help outside a job thread.',
      detail:
        'Use Support for account issues, credential questions, payment problems, or platform bugs. Compose a ticket from the Support tab — staff replies appear in the same inbox as job messages but are routed to the operations team. Include your guard ID, job ID, and screenshots when reporting a technical issue.',
      tips: [
        'Job-site emergencies should still go to 911 first, then notify the client in job chat.',
        'Credential upload issues are faster to resolve with a clear photo of the card.',
        'Billing questions may require Stripe dashboard access — staff will guide you.',
      ],
      navigate: { guardTab: 'support' },
      targetSelector: '[data-tour="guard-support"]',
    },
    {
      id: 'earnings-intro',
      title: 'Pay — earnings overview',
      body: 'The Pay tab tracks completed shift payouts, pending transfers, and invoice history.',
      detail:
        'After jobs finish and hours are approved, earnings roll up here with breakdowns by job type, date, and client. Pending payouts show until Stripe settles them to your connected bank account. You can drill into individual shifts to see gross pay, platform fees, and any adjustments. Disputes or late clock-outs may delay a line item until staff resolves it.',
      tips: [
        'Payout timing depends on Stripe — typically 2–3 business days after approval.',
        'Compare Completed shifts in My Jobs if a line item is missing here.',
        'Download or screenshot pay stubs for your own tax records.',
      ],
      navigate: { guardTab: 'earnings' },
      targetSelector: '[data-tour="guard-earnings"]',
    },
    {
      id: 'earnings-stripe',
      title: 'Pay — Stripe setup',
      body: 'Connect Stripe before your first live payout — without it, funds cannot be released.',
      detail:
        'Guardr uses Stripe Express so guards receive direct deposits without Guardr holding your balance. Tap Connect Stripe in Pay or Account settings and complete identity verification, bank account linking, and tax information. Until onboarding is finished, completed shifts accrue internally but cannot transfer. You can revisit Stripe anytime to update bank details.',
      tips: [
        'Use the same legal name as on your guard card for faster verification.',
        'Stripe may ask for a photo ID — have it ready on mobile.',
        'Check Pay after your first completed shift to confirm the pipeline end-to-end.',
      ],
      navigate: { guardTab: 'earnings' },
      targetSelector: '[data-tour="guard-earnings"]',
    },
    {
      id: 'settings-profile',
      title: 'Account — profile & credentials',
      body: 'Your public profile and compliance documents live under Account settings.',
      detail:
        'Clients see your photo, bio, experience, gear list, and ratings when you apply. Upload guard cards, permits, and certifications under Credentials — staff reviews uploads before armed or restricted work unlocks. Keep expiration dates current; expiring credentials trigger reminders and may block new applications.',
      tips: [
        'A professional headshot increases application acceptance rates.',
        'Upload both sides of guard cards when required.',
        'Turn on notifications so you hear about credential expirations early.',
      ],
      navigate: { guardTab: 'settings' },
      targetSelector: '[data-tour="guard-settings"]',
    },
    {
      id: 'settings-availability',
      title: 'Account — availability & preferences',
      body: 'Set when you are bookable and how the app should behave on shift days.',
      detail:
        'Weekly availability tells clients and matching engines when you prefer work. Vehicle, gear, and job-type preferences filter which postings surface prominently. Notification settings control push, email, and SMS for applications, messages, and shift reminders. Legal documents — Terms, Privacy, ICA, and Code of Conduct — are linked from the sidebar footer.',
      tips: [
        'Update availability when your day job schedule changes.',
        'Mark armed/unarmed preferences honestly to avoid mismatched postings.',
        'Restart this tutorial anytime from Guide → Interactive tutorial.',
      ],
      navigate: { guardTab: 'settings' },
      targetSelector: '[data-tour="guard-settings"]',
    },
    {
      id: 'settings-finish',
      title: 'Wrap-up — you are ready',
      body: 'You have toured every major area of the guard app.',
      detail:
        'Day-to-day flow: browse Open jobs on the Map, apply from the detail sheet, track approvals on My Jobs, check in when scheduled, coordinate in Messages, and confirm pay in Pay. Sample data from this tutorial is removed when you tap Finish or End tutorial. Welcome to Guardr — stay safe and professional on every shift.',
      tips: [
        'Pin the app to your home screen for faster check-ins on site.',
        'Re-run the tutorial after major app updates from Guide.',
        'Contact Support if anything in the live app does not match this walkthrough.',
      ],
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
      body: 'Home summarizes coverage health, upcoming shifts, and the fastest path to post work.',
      detail:
        'The hero shows your organization name, account status, and high-level KPIs — open postings, guards en route, and shifts completing today. Use Home as your morning check-in before diving into Jobs or the map. If your company is pending staff approval, some actions may be disabled until review completes.',
      tips: [
        'Scan KPI tiles first to spot unfilled shifts for today.',
        'Pending account reviews show a banner with next steps.',
        'Desktop Home adds shortcut cards; mobile stacks them vertically.',
      ],
      navigate: { clientView: 'home' },
      targetSelector: '[data-tour="client-home"]',
    },
    {
      id: 'home-actions',
      title: 'Home — post coverage',
      body: 'The primary call-to-action launches the request wizard for new security coverage.',
      detail:
        'Tap + Post a job from Home or the sidebar to open the multi-step wizard. You will enter site address, schedule, armed requirements, headcount, rate budget, and special instructions. Drafts can be saved and published later — useful when procurement still needs to approve spend. Published postings become visible to guards on the map immediately (subject to your account status).',
      tips: [
        'Save as draft if you are still confirming dates with your venue.',
        'Armed requirements filter which guards can apply — set them accurately.',
        'Add gate codes and parking notes in instructions to reduce message back-and-forth.',
      ],
      navigate: { clientView: 'home' },
      targetSelector: '[data-tour="client-home-cta"]',
    },
    {
      id: 'jobs-intro',
      title: 'Jobs — request board',
      body: 'The Jobs page lists every posting your company created, from draft through completed.',
      detail:
        'While the tutorial runs, a sample draft appears at the top — it stays on your device only and is not visible to guards or staff. Real postings follow the same row layout: site name, schedule, headcount filled, status chip, and quick actions. This board is the system of record for your coverage requests.',
      tips: [
        'Draft rows can be edited or deleted before publishing.',
        'Open rows accept guard applications until you fill headcount or close the posting.',
        'Use search when you manage many venues or recurring events.',
      ],
      navigate: { clientView: 'requests' },
      targetSelector: '[data-tour="client-jobs"]',
    },
    {
      id: 'jobs-tabs',
      title: 'Jobs — status filters',
      body: 'Tabs and tally chips separate open, scheduled, in-progress, completed, and missed coverage.',
      detail:
        'Open shows unfilled postings still accepting applications. Scheduled lists confirmed guards with future start times. In progress covers active shifts you can track on the map. Completed archives past work for invoices and internal reporting. Missed highlights no-shows or late coverage gaps that may need staff follow-up.',
      tips: [
        'Review Open daily until every shift shows Scheduled.',
        'Completed is where you verify hours before paying invoices.',
        'Tap a status chip to filter without losing your place in the list.',
      ],
      navigate: { clientView: 'requests' },
      targetSelector: '[data-tour="client-jobs-tabs"]',
    },
    {
      id: 'jobs-applicants',
      title: 'Jobs — applicants & assignment',
      body: 'Selecting a job opens applicants, assigned guards, schedule edits, and chat shortcuts.',
      detail:
        'Review guard profiles, credentials, ratings, and distance before approving. Some accounts use trusted-auto rules where staff pre-screens applicants. Once approved, guards appear in the assigned roster and receive job chat access. You can message the team, adjust instructions, or request staff help when disputes arise.',
      tips: [
        'Read guard reviews from other clients when choosing between applicants.',
        'Approve enough guards to meet your posted headcount.',
        'Use job chat for schedule changes so everyone sees the same update.',
      ],
      navigate: { clientView: 'requests' },
      targetSelector: '[data-tour="client-jobs"]',
    },
    {
      id: 'jobs-edit',
      title: 'Jobs — edits & cancellations',
      body: 'Posted jobs can be updated when plans change — with guard notification built in.',
      detail:
        'Extend end time, change headcount, or update site instructions from the job detail panel. Major schedule changes may require guard re-confirmation. Cancelling a shift notifies assigned guards and may incur fees depending on your agreement. Staff can assist with complex edits or billing adjustments.',
      tips: [
        'Edit early — last-minute changes are harder to fill.',
        'Document changes in job chat for audit trails.',
        'Contact Support for cancellations inside the billing dispute window.',
      ],
      navigate: { clientView: 'requests' },
      targetSelector: '[data-tour="client-jobs"]',
    },
    {
      id: 'map-intro',
      title: 'Map — live coverage',
      body: 'Watch assigned guards and active shifts geographically during events.',
      detail:
        'Pins update as guards check in, mark en route, or complete shifts. Color and iconography reflect status so you can confirm someone is on site without opening each job individually. The map is especially useful for multi-venue events or large campuses where several postings run simultaneously.',
      tips: [
        'Zoom to your venue before doors open to confirm early arrivals.',
        'A missing pin may mean location sharing is off — message the guard in job chat.',
        'Map filters mirror Jobs status chips for consistency.',
      ],
      navigate: { clientView: 'map' },
      targetSelector: '[data-tour="client-map"]',
    },
    {
      id: 'guards-intro',
      title: 'Guards — talent directory',
      body: 'Browse verified guards and save favorites for faster staffing on future postings.',
      detail:
        'Filter by armed status, ratings, credentials, gear, vehicle, and distance from your sites. Tap a profile to read experience, certifications, client reviews, and availability hints. You can invite a guard directly to a new posting from their card instead of waiting for open applications.',
      tips: [
        'Favorite reliable guards so they surface first on future jobs.',
        'Direct invites still require guard acceptance.',
        'Verify armed credentials before inviting to restricted sites.',
      ],
      navigate: { clientView: 'guards' },
      targetSelector: '[data-tour="client-guards"]',
    },
    {
      id: 'guards-filters',
      title: 'Guards — search & filters',
      body: 'Narrow the directory before inviting someone or comparing applicants.',
      detail:
        'Search matches guard name, keywords in bios, and skill tags. Armed, vehicle, language, and rating filters help you comply with site requirements and insurance rules. Sort by distance when you need someone on site within the hour. Saved favorites appear at the top of invite lists on new postings.',
      tips: [
        'Combine distance + armed filters for urgent armed coverage.',
        'Clear filters between searches — they persist until you reset them.',
        'Export or screenshot profiles for internal security reviews if needed.',
      ],
      navigate: { clientView: 'guards' },
      targetSelector: '[data-tour="client-guards"]',
    },
    {
      id: 'messages-intro',
      title: 'Messages — job inbox',
      body: 'All job threads, direct guard messages, and support tickets share one inbox.',
      detail:
        'Unread counts show on the sidebar and mobile navigation. Open a thread to coordinate arrival times, gate codes, uniform changes, or incident updates. Attach photos when documenting property damage or access issues. Support messages reach Guardr staff for billing, account, or platform help.',
      tips: [
        'Pin active event threads during multi-day coverage.',
        'Use @mentions sparingly — all assigned guards see job chat.',
        'Escalate payment issues to Support with your invoice number.',
      ],
      navigate: { clientView: 'messages' },
      targetSelector: '[data-tour="client-messages"]',
    },
    {
      id: 'invoices-intro',
      title: 'Invoices — billing history',
      body: 'Review charges, download invoices, and reconcile completed shifts.',
      detail:
        'Invoices aggregate completed jobs by billing period. Each line shows site, hours, rate, fees, and payment status. Paid, pending, and disputed states help your finance team close books. Connect your payment method in Settings before your first live posting to avoid coverage delays.',
      tips: [
        'Match invoice line items to Completed jobs before approving payment.',
        'Dispute incorrect hours from the invoice detail drawer.',
        'Download PDF copies for your accounting system.',
      ],
      navigate: { clientView: 'invoices' },
      targetSelector: '[data-tour="client-settings"]',
    },
    {
      id: 'settings-company',
      title: 'Settings — company & billing',
      body: 'Company profile, payment methods, notifications, and user permissions live under Account settings.',
      detail:
        'Update the public company information staff displays to guards — logo, description, and primary contact. Connect cards or ACH for job charges. Notification preferences control email and push for applications, messages, and invoice events. Role-based access lets you invite teammates with appropriate limits.',
      tips: [
        'Keep billing contacts current for failed payment alerts.',
        'Upload your company logo — guards recognize your postings faster.',
        'Review user permissions when staff turnover occurs.',
      ],
      navigate: { clientView: 'settings' },
      targetSelector: '[data-tour="client-settings"]',
    },
    {
      id: 'settings-finish',
      title: 'Wrap-up — you are ready',
      body: 'You have toured the core client workflow from posting to payment.',
      detail:
        'Typical flow: post coverage from Home, review applicants on Jobs, track guards on the Map, coordinate in Messages, and pay via Invoices. Sample data from this tutorial is removed when you finish. Restart anytime from Guide → Interactive tutorial when onboarding new team members.',
      tips: [
        'Bookmark Home for daily coverage checks.',
        'Re-run this tutorial after major app updates.',
        'Contact Support if your account status blocks publishing.',
      ],
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
      body: 'The Overview page is your morning briefing across the entire platform.',
      detail:
        'KPI tiles summarize open jobs, pending applications, credential expirations, incidents, and staffing gaps in your active cities. Tutorial sample items may appear locally in your browser — they never enter the live queue, notify clients, or affect billing. Treat Overview as a dashboard, not the canonical record for any single entity.',
      tips: [
        'Scan KPI deltas first — red badges mean SLA risk today.',
        'Click any tile to jump to the underlying roster page.',
        'Refresh at shift change when multiple metros are active.',
      ],
      navigate: { staffSection: 'overview' },
      targetSelector: '[data-tour="staff-overview"]',
    },
    {
      id: 'overview-shortcuts',
      title: 'Overview — quick actions',
      body: 'Shortcut chips jump straight into common workflows without hunting the sidebar.',
      detail:
        'Create jobs, review applications, open the ops map, or jump to credentials from here. Role permissions may hide actions your account cannot perform — moderators see fewer financial controls than directors, for example. Shortcuts respect the same deep links as the full sidebar navigation.',
      tips: [
        'Pin mentally: Applications shortcut during hiring surges.',
        'Map shortcut when clients call about missing check-ins.',
        'Credentials shortcut on the first of the month when cards expire.',
      ],
      navigate: { staffSection: 'overview' },
      targetSelector: '[data-tour="staff-overview-shortcuts"]',
    },
    {
      id: 'overview-queues',
      title: 'Overview — attention queues',
      body: 'Attention panels surface items that need a human decision today.',
      detail:
        'Pending client approvals, guard applications awaiting staff review, expiring credentials, open incidents, payment holds, and schedule-change requests bubble up here. Each row links to the detail drawer on the target page. Resolve or snooze items to keep the queue honest — stale entries erode trust with clients and guards.',
      tips: [
        'Work top-to-bottom by severity when the queue is long.',
        'Snoozed items return — do not use snooze to avoid hard decisions.',
        'Escalate disputes to Payments or Incidents sections as appropriate.',
      ],
      navigate: { staffSection: 'overview' },
      targetSelector: '[data-tour="staff-overview-queues"]',
    },
    {
      id: 'applications-intro',
      title: 'Applications — guard intake',
      body: 'Every guard who applies to an open job appears in this roster.',
      detail:
        'Review credentials, standing, distance, and fit before forwarding to the client. Tutorial mode includes a sample application stored only in your browser. Live applications show guard profile links, BSIS status, gear, prior client reviews, and any flags on the account. This is often the first human gate before a guard works a new client site.',
      tips: [
        'Open the detail drawer — row summaries hide credential edge cases.',
        'Cross-check armed requirements against uploaded guard cards.',
        'Add internal notes for the next reviewer when handing off a shift.',
      ],
      navigate: { staffSection: 'applications' },
      targetSelector: '[data-tour="staff-applications"]',
    },
    {
      id: 'applications-actions',
      title: 'Applications — approve, hold, or decline',
      body: 'Row actions advance applicants through the pipeline with audit history.',
      detail:
        'Approve moves the guard to client selection (when required) or directly to scheduled status under trusted-auto rules. Hold pauses the application pending more information. Decline notifies the guard with a reason code when configured. All actions are logged for compliance. Bulk actions are available on desktop for high-volume events.',
      tips: [
        'Decline with a clear reason — guards can fix credentials and reapply.',
        'Hold when you need client confirmation on armed work.',
        'Approved guards still need client acceptance on non-trusted postings.',
      ],
      navigate: { staffSection: 'applications' },
      targetSelector: '[data-tour="staff-applications"]',
    },
    {
      id: 'jobs-intro',
      title: 'Jobs — live roster',
      body: 'The Jobs board is the canonical list of every client posting on the platform.',
      detail:
        'Filter by status, city, client, date range, or assigned guard. Edit listings, adjust pay, reassign guards, open job chat, or force status transitions when field reality diverges from the app. Most day-to-day ops work happens here — Overview is the alarm bell, Jobs is the workbench.',
      tips: [
        'Use toolbar filters during busy weekends with overlapping events.',
        'Split view on desktop keeps the detail pane open while scanning rows.',
        'Never delete rows — cancel or complete to preserve audit history.',
      ],
      navigate: { staffSection: 'jobs' },
      targetSelector: '[data-tour="staff-jobs"]',
    },
    {
      id: 'jobs-detail',
      title: 'Jobs — table & detail pane',
      body: 'Click a row to open timeline, roster, incidents, chat, and payment state.',
      detail:
        'The detail pane shows full schedule history, check-in timestamps, assigned guards with contact shortcuts, open incidents, and billing status. Staff can post internal notes visible only to other staff. Schedule changes initiated by clients or guards appear here for approval when they exceed policy thresholds.',
      tips: [
        'Verify check-in/out times before approving payment release.',
        'Open job chat from the pane instead of impersonating users.',
        'Link incidents from this pane so they stay tied to the posting.',
      ],
      navigate: { staffSection: 'jobs' },
      targetSelector: '[data-tour="staff-jobs"]',
    },
    {
      id: 'map-intro',
      title: 'Map — field picture',
      body: 'The ops map aggregates guard locations and active coverage geographically.',
      detail:
        'Spot geographic gaps when multiple sites run at once — a common failure mode during festivals or retail openings. Selecting a pin opens the same job record you would see on the Jobs board. Location accuracy depends on guard device permissions; stale pins may mean the guard has not checked in yet.',
      tips: [
        'Cross-reference map pins with Jobs In progress filter.',
        'Use map + Messages when a client reports no guard on site.',
        'Zoom to city level before declaring a metro fully covered.',
      ],
      navigate: { staffSection: 'map' },
      targetSelector: '[data-tour="staff-map"]',
    },
    {
      id: 'guards-intro',
      title: 'Guards — roster & account actions',
      body: 'Search every guard account, view standing, and take moderation actions.',
      detail:
        'Open a guard profile to see credentials, job history, client reviews, Stripe status, and flags. Staff can activate or suspend accounts, reset credentials, or assign trusted status. Changes here affect whether the guard can see armed postings.',
      tips: [
        'Search by email or guard ID when handling support tickets.',
        'Suspension immediately blocks new applications.',
        'Trusted status speeds up applicant review — grant it deliberately.',
      ],
      navigate: { staffSection: 'guards' },
      targetSelector: '[data-tour="staff-jobs"]',
    },
    {
      id: 'credentials-intro',
      title: 'Credentials — compliance',
      body: 'Audit guard cards, permits, uploads, and expiration dates from the Credentials roster.',
      detail:
        'Filter by expiring, pending review, rejected, or restricted. Staff approvals here gate whether a guard can accept armed work or activate their account. Side-by-side viewers show upload images next to extracted metadata. Rejection reasons are sent to the guard with resubmission instructions.',
      tips: [
        'Process expiring cards before the first of the month rush.',
        'Reject blurry uploads immediately — guards usually resubmit same day.',
        'Armed approvals require matching BSIS records when integrated.',
      ],
      navigate: { staffSection: 'credentials' },
      targetSelector: '[data-tour="staff-credentials"]',
    },
    {
      id: 'messages-intro',
      title: 'Messages — staff inbox',
      body: 'Internal staff chat plus guard and client threads live in one hub.',
      detail:
        'Switch between channels without leaving ops. Unread badges follow the same rules as guard and client apps. Support escalations from the field appear in your queue with priority tags. Team chat is for internal coordination — never share sensitive client data in public channels.',
      tips: [
        'Claim support tickets so colleagues do not double-reply.',
        'Use job chat when the guard and client both need visibility.',
        'Archive resolved threads to keep the inbox manageable.',
      ],
      navigate: { staffSection: 'messages' },
      targetSelector: '[data-tour="staff-messages"]',
    },
    {
      id: 'incidents-intro',
      title: 'Incidents — field reports',
      body: 'Review incident reports filed by guards or clients during or after shifts.',
      detail:
        'Incidents capture category, severity, photos, and narrative. Staff triage determines whether clients, insurers, or law enforcement need notification. Open incidents block payment release on some accounts until resolved. Link every incident to a job row for traceability.',
      tips: [
        'Triage within SLA — clients expect same-day acknowledgment.',
        'Download photo evidence before retention windows expire.',
        'Close loops in job chat when resolution affects guards on site.',
      ],
      navigate: { staffSection: 'incidents' },
      targetSelector: '[data-tour="staff-jobs"]',
    },
    {
      id: 'payments-intro',
      title: 'Payments & invoices — releases & holds',
      body: 'Monitor payout pipeline, payment holds, and client billing exceptions.',
      detail:
        'Completed shifts flow through approval, platform fee calculation, guard Stripe transfer, and client invoice. Holds appear when hours are disputed, incidents are open, or credentials lapse mid-shift. Directors can override holds with logged justification.',
      tips: [
        'Resolve holds from the job detail pane when possible.',
        'Match payment attention queue items to Overview badges.',
        'Never share Stripe dashboard links in client-facing chat.',
      ],
      navigate: { staffSection: 'payments' },
      targetSelector: '[data-tour="staff-jobs"]',
    },
    {
      id: 'locations-intro',
      title: 'Locations — sites & venues',
      body: 'Manage saved client sites, geocoding, and venue metadata used across postings.',
      detail:
        'Locations power map pins, distance calculations, and repeat postings for regular clients. Fix missing coordinates here when jobs show map warnings. Venue notes (parking, entrances, Wi-Fi) can propagate to new postings when staff or clients clone prior jobs.',
      tips: [
        'Geocode new venues before publishing urgent postings.',
        'Merge duplicate locations when clients typo addresses.',
        'Venue notes reduce guard message volume on recurring events.',
      ],
      navigate: { staffSection: 'locations' },
      targetSelector: '[data-tour="staff-locations"]',
    },
    {
      id: 'settings-finish',
      title: 'Wrap-up — platform settings',
      body: 'Public placards, integrations, permissions, and team access live under Platform settings.',
      detail:
        'Update client-facing copy, webhook endpoints, role permissions, and city launch toggles. Restart this walkthrough from Guide → Interactive tutorial when onboarding new staff. End tutorial clears local sample data from your browser only.',
      tips: [
        'Permissions changes take effect on next login for affected users.',
        'Document integration changes in the audit log.',
        'Contact engineering for city launches not yet in the toggle list.',
      ],
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
