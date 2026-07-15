import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  SecurityGuard,
  Certification,
  SessionUser,
  Experience,
  GuardEducation,
  CreateSupportTicketInput,
  GuardPayoutInvoice,
  SupportTicket,
  JobChatThread,
  JobChatMessage,
  GuardMessage,
  TeamChatThread,
  TeamChatMessage,
  GuardStandingCrewMember,
} from '../types';
import { ShiftMap, type MapZoomControls } from './guard/ShiftMap';
import { MapViewportInsetsProvider } from '../lib/mapViewportInsets';
import { MapRouteBanner } from './map/MapRouteBanner';
import { MapRouteSummary } from '../lib/mapRouting';
import { MapSelectionExperience } from './map/MapSelectionExperience';
import { guardMapPinKind, GUARD_MAP_STATUS_FILTERS, guardMapShouldRouteToJob, type GuardMapStatusFilter } from '../lib/mapJobVisibility';
import {
  filterGuardBrowseJobs,
  getGuardBrowseJobLists,
  guardBrowseTabFromMapFilter,
  mapFilterFromBrowseTab,
  type GuardJobsBrowseTab,
} from '../lib/guardJobsBrowse';
import { MapPinFilterStepper } from './map/MapPinFilterStepper';
import type { SecurityRequest } from '../types';
import { GuardActiveShift } from './guard/GuardActiveShift';
import { ReplacementOfferCard } from './guard/ReplacementOfferCard';
import { activeReplacementOffers } from '../lib/emergencyReplacement';
import { useGuardLiveLocation } from '../lib/useGuardLiveLocation';
import { midShiftCheckInDue } from './guard/MidShiftCheckInPanel';
import { shiftDutyStartedAt } from '../lib/shiftWindow';
import { GuardEarningsPanel } from './guard/GuardEarningsPanel';
import { GuardStripeConnectSheet } from './guard/GuardStripeConnectSheet';
import { GuardJobDetailView } from './guard/GuardJobDetailView';
import { GuardMyJobsPanel } from './guard/GuardMyJobsPanel';
import { GuardCrewHubPanel } from './guard/GuardCrewHubPanel';
import { GuardSelfAuditModal } from './guard/GuardSelfAuditModal';
import { GuardRatingModal } from './guard/GuardRatingModal';
import { GuardActivityLogModal } from './guard/GuardActivityLogModal';
import { GuardIncidentReportModal } from './guard/GuardIncidentReportModal';
import { LateClockOutPrompt } from './guard/LateClockOutPrompt';
import { showAppToast } from './ui/AppToast';
import { showAppConfirm } from './ui/AppConfirm';
import { ProfileSavePayload, UserProfileScreen } from './profile/UserProfileScreen';
import { UserSettingsScreen } from './profile/UserSettingsScreen';
import { GuardAvailabilityCalendar } from './guard/GuardAvailabilityCalendar';
import { SupportComposePage } from './support/SupportComposePage';
import { SupportReportPage } from './support/SupportReportPage';
import { RoleAppShell } from './layouts/RoleAppShell';
import { AccountMenu } from './layouts/AccountMenu';
import { EMPTY_MESSAGES_CHROME, type MessagesChrome } from '../lib/messagesChrome';
import { AppGuidePage } from './docs/AppGuidePage';
import { AppModal, AppPageTransition } from './ui/motion/AppMotion';
import { AppScreen } from './ui/app/AppPrimitives';
import { SlideToConfirm } from './ui/SlideToConfirm';
import { AlertTriangle, Map, DollarSign, Briefcase, MessagesSquare, BookOpen, Users } from 'lucide-react';
import {
  guardCanApplyToJob,
  guardCanViewJob,
  checkJobRequirements,
  loadShiftPhase,
  saveShiftPhase,
  ShiftPhase,
} from '../lib/guardJobs';
import { guardScheduleConflictError, type ScheduleJob } from '../lib/guardSchedule';
import { getCoordinatingCrewJobs } from '../lib/guardTeams';
import {
  getPendingStandingCrewIncoming,
  shouldOfferTeamCodeJoin,
} from '../lib/guardStandingCrew';
import { isGuardTrusted } from '../lib/guardTrust';
import { computeGuardEarningsBreakdown } from '../lib/guardEarnings';
import { openGuardPayoutInvoices } from '../lib/guardPayoutInvoiceStorage';
import { GuardJobView, GuardPayoutView } from '../lib/guardJobView';
import { createConnectAccount, createConnectAccountLink, getConnectAccountStatus } from '../lib/stripeApi';
import { GUARD_STATUS_LABELS, guardWorkBlockedMessage } from '../lib/guardQualification';
import { getGuardUserStatus, isGuardAccountPreActive } from '../lib/accountStatus';
import { isGuardCredentialExpiryRestricted } from '../lib/guardCredentialExpiryEnforcement';
import { isGuardAccountActive } from '../lib/guardAccountActivation';
import { AccountPendingScreen } from './account/AccountPendingScreen';
import { GuardMessagesPanel } from './guard/GuardMessagesPanel';
import { GuardCredentialGraceBanner } from './guard/GuardCredentialGraceBanner';
import type { AddCertificationResult } from '../lib/certUniqueness';
import type { CertImageMutationResult } from '../lib/certImagePolicy';
import type { CertUpdatePayload, CertUpdateResult } from './credentials/CertDetailModal';
import { captureIdentitySelfie } from '../lib/idVerificationPhoto';
import { verifyOnSiteForJob, formatSiteProximityHint, isWithinSiteRadius } from '../lib/siteProximity';
import { shouldNotifyGeofenceLeave } from '../lib/shiftGeofence';
import {
  canGuardClockIn,
  canGuardClockOut,
  guardClockInBlockedMessage,
  guardClockOutBlockedMessage,
  isLateClockOut,
} from '../lib/shiftWindow';
import {
  activeShiftBreak,
  canGuardEndBreak,
  canGuardStartBreak,
  guardBreakBlockedMessage,
} from '../lib/shiftBreaks';
import type { IncidentReportFormInput } from '../lib/incidentReports';
import { isTutorialDemoId } from '../lib/tutorialDemoData';
import { useUserLocation } from '../lib/useUserLocation';

interface GuardDashboardProps {
  guard: SecurityGuard;
  requests: GuardJobView[];
  /** Full job records for matching, replacement offers, and live tracking. */
  allRequests?: SecurityRequest[];
  currentUser: SessionUser;
  payments?: GuardPayoutView[];
  onAddCertification: (cert: Partial<Certification>) => Promise<AddCertificationResult>;
  onDeleteCertification?: (certId: string) => Promise<CertImageMutationResult>;
  onAttachCertificationImage?: (certId: string, imageUrl: string) => Promise<CertImageMutationResult>;
  onUpdateCertification?: (certId: string, payload: CertUpdatePayload) => Promise<CertUpdateResult>;
  onAddExperience?: (exp: Omit<Experience, 'id'>) => void;
  onAddEducation?: (edu: Omit<GuardEducation, 'id'>) => void;
  onSubmitIdentityVerification?: (
    payload: import('./profile/GuardIdentityVerificationPanel').GuardIdentityVerificationPayload
  ) => Promise<import('./profile/GuardIdentityVerificationPanel').IdentityVerificationSubmitResult>;
  onSaveInsurance?: (
    policy: Partial<import('../types').GuardInsurancePolicy> & { guardId: string }
  ) => Promise<void>;
  onAcceptJob: (requestId: string) => void;
  onDeclineDirectJob?: (requestId: string) => void | Promise<void>;
  onApplyAsTeamLead?: (requestId: string) => void | Promise<void>;
  onInviteTeamGuard?: (requestId: string, guardId: string) => void | Promise<void>;
  onRemoveTeamGuard?: (requestId: string, guardId: string) => void | Promise<void>;
  onUpdateCrewProfile?: (
    requestId: string,
    patch: { crewName: string; crewDescription: string }
  ) => void | Promise<void>;
  onUpdateStandingCrewProfile?: (patch: {
    crewName: string;
    crewDescription: string;
  }) => void | Promise<void>;
  onJoinTeamWithCode?: (code: string) => void | Promise<void>;
  onAcceptTeamInvite?: (requestId: string) => void | Promise<void>;
  onDeclineTeamInvite?: (requestId: string) => void | Promise<void>;
  standingCrewMembers?: GuardStandingCrewMember[];
  onInviteStandingCrew?: (guardId: string) => void | Promise<void>;
  onRemoveStandingCrew?: (guardId: string) => void | Promise<void>;
  onAcceptStandingCrewInvite?: (inviteId: string) => void | Promise<void>;
  onDeclineStandingCrewInvite?: (inviteId: string) => void | Promise<void>;
  headerRight?: React.ReactNode;
  feeConfig?: import('../lib/payments').PlatformFeeConfig;
  onSubmitPriceOffer?: (
    requestId: string,
    input: {
      hourlyRate: number;
      agreementFeeConfig?: import('../types').AgreementPlatformFeeConfig;
      message?: string;
    }
  ) => void | Promise<void>;
  onAcceptPriceOffer?: (requestId: string, offerId: string) => void | Promise<void>;
  coworkerGuards?: SecurityGuard[];
  onUpdateJobAudit: (requestId: string, auditPayload: any) => void;
  onStartEnRoute?: (requestId: string) => void | Promise<void>;
  onUpdateGuardLiveLocation?: (
    requestId: string,
    location: { lat: number; lng: number; updatedAt: string }
  ) => void | Promise<void>;
  onAcceptReplacementOffer?: (requestId: string) => void | Promise<void>;
  onGuardArrived?: (requestId: string) => void;
  onGeofenceLeave?: (requestId: string) => void;
  onApproveOvertime?: (requestId: string) => void | Promise<void>;
  onRecordAuditViolation: (guardId: string, reason?: string) => void;
  onUpdateStripeAccount?: (guardId: string, accountId: string) => void;
  onSignOut: () => void;
  themeMode: string;
  onChangeTheme: (mode: string) => void;
  onUpdateProfile: (payload: ProfileSavePayload) => void | Promise<void>;
  supportTickets?: SupportTicket[];
  guardPayoutInvoices?: GuardPayoutInvoice[];
  relatedRequests?: GuardJobView[];
  onCreateSupportTicket?: (input: CreateSupportTicketInput) => void | Promise<string | void>;
  onSendSupportMessage?: (ticketId: string, body: string) => void | Promise<void>;
  jobChatThreads?: JobChatThread[];
  jobChatMessages?: JobChatMessage[];
  teamChatThreads?: TeamChatThread[];
  teamChatMessages?: TeamChatMessage[];
  onSendJobChatMessage?: (requestId: string, body: string) => void | Promise<void>;
  onSendTeamChatMessage?: (requestId: string, body: string) => void | Promise<void>;
  guardMessages?: GuardMessage[];
  onSendGuardMessage?: (body: string) => void | Promise<void>;
  onRefreshGuardMessages?: () => void | Promise<void>;
  onSubmitIncidentReport?: (requestId: string, input: IncidentReportFormInput) => void | Promise<void>;
  onRequestCashPayout?: () => Promise<void>;
  onRequestStripePayout?: () => Promise<void>;
  jobChatRequestId?: string | null;
  initialTeamChatRequestId?: string | null;
  openJobChat?: boolean;
  /** Deep-link job selection without opening chat (notifications) */
  initialSelectedJobId?: string | null;
  onJobChatRequestIdChange?: (requestId: string | null) => void;
  onJobChatOpenChange?: (open: boolean) => void;
  supportTicketId?: string | null;
  onSupportTicketIdChange?: (ticketId: string | null) => void;
  supportMode?: GuardSupportMode | null;
  supportSection?: 'support' | 'reports';
  onOpenSupportCompose?: () => void;
  onOpenSupportReport?: () => void;
  onCloseSupportForm?: () => void;
  /** Render inside staff dashboard — no outer shell */
  variant?: 'standalone' | 'embedded';
  shiftTab?: GuardTab;
  initialTab?: GuardTab;
  /** Controlled tab — when set, parent owns navigation state (URL sync). */
  tab?: GuardTab;
  onTabChange?: (tab: GuardTab) => void;
  onOpenLegal?: (page: import('../lib/legalContent').LegalPageId) => void;
  tutorialAvailable?: boolean;
  tutorialCompleted?: boolean;
  tutorialActive?: boolean;
  onStartTutorial?: () => void;
  onEnterPracticeMode?: () => void;
}

export type GuardTab = 'map' | 'activation' | 'earnings' | 'myJobs' | 'messages' | 'guardChat' | 'support' | 'profile' | 'settings' | 'guide' | 'crew';
export type GuardSupportMode = 'compose' | 'report';

const GUARD_ACTIVATION_ALLOWED_TABS: GuardTab[] = ['settings'];
const GUARD_BOTTOM_NAV_TABS = new Set<GuardTab>(['map', 'myJobs', 'messages', 'earnings', 'crew']);

const GUARD_TAB_TITLES: Record<GuardTab, string> = {
  map: 'Map',
  activation: 'Complete application',
  myJobs: 'Jobs',
  earnings: 'Pay',
  messages: 'Messages',
  guardChat: 'Messages',
  support: 'Messages',
  profile: 'Profile',
  settings: 'Settings',
  guide: 'Guide',
  crew: 'Crew',
};

export function GuardDashboard({
  guard,
  requests,
  allRequests = [],
  currentUser,
  payments = [],
  onAddCertification,
  onDeleteCertification,
  onAttachCertificationImage,
  onUpdateCertification,
  onAddExperience,
  onAddEducation,
  onSubmitIdentityVerification,
  onSaveInsurance,
  onAcceptJob,
  onDeclineDirectJob,
  onApplyAsTeamLead,
  onInviteTeamGuard,
  onRemoveTeamGuard,
  onUpdateCrewProfile,
  onUpdateStandingCrewProfile,
  onJoinTeamWithCode,
  onAcceptTeamInvite,
  onDeclineTeamInvite,
  standingCrewMembers = [],
  onInviteStandingCrew,
  onRemoveStandingCrew,
  onAcceptStandingCrewInvite,
  onDeclineStandingCrewInvite,
  headerRight,
  feeConfig,
  onSubmitPriceOffer,
  onAcceptPriceOffer,
  coworkerGuards = [],
  onUpdateJobAudit,
  onStartEnRoute,
  onUpdateGuardLiveLocation,
  onAcceptReplacementOffer,
  onGuardArrived,
  onGeofenceLeave,
  onApproveOvertime,
  onRecordAuditViolation,
  onUpdateStripeAccount,
  onSignOut,
  themeMode,
  onChangeTheme,
  onUpdateProfile,
  supportTickets = [],
  guardPayoutInvoices = [],
  relatedRequests = [],
  onCreateSupportTicket,
  onSendSupportMessage,
  jobChatThreads = [],
  jobChatMessages = [],
  teamChatThreads = [],
  teamChatMessages = [],
  onSendJobChatMessage,
  onSendTeamChatMessage,
  guardMessages = [],
  onSendGuardMessage,
  onRefreshGuardMessages,
  onSubmitIncidentReport,
  onRequestCashPayout,
  onRequestStripePayout,
  jobChatRequestId = null,
  initialTeamChatRequestId = null,
  openJobChat = false,
  initialSelectedJobId = null,
  onJobChatRequestIdChange,
  onJobChatOpenChange,
  supportTicketId = null,
  onSupportTicketIdChange,
  supportMode = null,
  supportSection = 'support',
  onOpenSupportCompose,
  onOpenSupportReport,
  onCloseSupportForm,
  variant = 'standalone',
  shiftTab = 'map',
  initialTab = 'map',
  tab: controlledTab,
  onTabChange,
  onOpenLegal,
  tutorialAvailable,
  tutorialCompleted,
  tutorialActive,
  onStartTutorial,
  onEnterPracticeMode,
}: GuardDashboardProps) {
  const isEmbedded = variant === 'embedded';
  const isControlled = controlledTab !== undefined;
  const [standaloneTab, setStandaloneTab] = useState<GuardTab>(controlledTab ?? initialTab);
  const activeTab = isEmbedded ? shiftTab : (isControlled ? controlledTab : standaloneTab);
  const tab: GuardTab =
    activeTab === 'guardChat' || activeTab === 'support' ? 'messages' : activeTab;

  const setTab = useCallback(
    (next: GuardTab) => {
      const resolved =
        !isGuardAccountActive(guard) && !GUARD_ACTIVATION_ALLOWED_TABS.includes(next) ? 'activation' : next;
      if (!isControlled) setStandaloneTab(resolved);
      onTabChange?.(resolved);
    },
    [guard, isControlled, onTabChange]
  );

  useEffect(() => {
    if (isControlled && controlledTab) setStandaloneTab(controlledTab);
  }, [controlledTab, isControlled]);

  useEffect(() => {
    if (isGuardAccountActive(guard)) return;
    if (!GUARD_ACTIVATION_ALLOWED_TABS.includes(tab) && tab !== 'activation') {
      setTab('activation');
    }
  }, [guard, tab, setTab]);
  const [guardSelectedJobId, setGuardSelectedJobId] = useState<string | null>(null);
  const [guardMessagesDetailOpen, setGuardMessagesDetailOpen] = useState(false);
  const [guardMessagesChrome, setGuardMessagesChrome] = useState<MessagesChrome>(EMPTY_MESSAGES_CHROME);
  const [crewJobDetailOpen, setCrewJobDetailOpen] = useState(false);

  useEffect(() => {
    if (tab !== 'messages') {
      setGuardMessagesChrome(EMPTY_MESSAGES_CHROME);
    }
  }, [tab]);
  const [guardBrowseTab, setGuardBrowseTab] = useState<GuardJobsBrowseTab>('available');
  const [mapStatusFilter, setMapStatusFilter] = useState<GuardMapStatusFilter>('all');
  const mapZoomRef = useRef<MapZoomControls | null>(null);
  const [mapRoute, setMapRoute] = useState<MapRouteSummary | null>(null);
  const [mapRouteLoading, setMapRouteLoading] = useState(false);
  const [showSelfAudit, setShowSelfAudit] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showLateClockOutPrompt, setShowLateClockOutPrompt] = useState(false);
  const [pendingClockOutAt, setPendingClockOutAt] = useState<string | null>(null);
  const [pendingLeftEarlier, setPendingLeftEarlier] = useState(false);
  const [pendingOvertimeClaimed, setPendingOvertimeClaimed] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showIncidentReport, setShowIncidentReport] = useState(false);
  const [ratingJob, setRatingJob] = useState<GuardJobView | null>(null);
  const [cashRequestPending, setCashRequestPending] = useState(false);
  const [stripeRequestPending, setStripeRequestPending] = useState(false);
  const [connectPending, setConnectPending] = useState(false);
  const [connectSheetOpen, setConnectSheetOpen] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectReady, setConnectReady] = useState(false);
  const [shiftPhases, setShiftPhases] = useState<Record<string, ShiftPhase>>({});

  const browseJobLists = useMemo(
    () => getGuardBrowseJobLists(guard.id, requests),
    [guard.id, requests]
  );

  const upcomingForMessages = useMemo(() => {
    const inProgress = requests.filter(
      (r) => r.assignedGuardId === guard.id && r.status === 'in-progress'
    );
    return [...inProgress, ...browseJobLists.upcoming];
  }, [requests, guard.id, browseJobLists.upcoming]);

  const assignedJobs = useMemo(
    () => requests.filter((r) => r.assignedGuardId === guard.id && r.status !== 'completed' && r.status !== 'closed'),
    [requests, guard.id]
  );
  const completedJobs = useMemo(
    () => requests.filter((r) => r.assignedGuardId === guard.id && r.status === 'completed'),
    [requests, guard.id]
  );

  const activeShiftJob = useMemo(() => {
    const onDuty = assignedJobs.find((r) => r.status === 'in-progress');
    if (onDuty) return onDuty;
    return assignedJobs.find((r) => r.status === 'accepted') ?? null;
  }, [assignedJobs]);

  const activePhase: ShiftPhase | null = useMemo(() => {
    if (!activeShiftJob) return null;
    if (activeShiftJob.status === 'in-progress') return 'on-duty';
    const stored = shiftPhases[activeShiftJob.id] ?? loadShiftPhase(guard.id, activeShiftJob.id);
    if (activeShiftJob.enRouteAt && (stored === 'upcoming' || stored === 'en-route')) return 'en-route';
    return stored;
  }, [activeShiftJob, shiftPhases, guard.id]);

  const replacementOffers = useMemo(
    () => activeReplacementOffers(allRequests.length ? allRequests : (requests as SecurityRequest[]), guard.id),
    [allRequests, requests, guard.id]
  );

  const activeShiftRequest = useMemo(
    () => {
      if (!activeShiftJob) return null;
      return (allRequests.length ? allRequests : (requests as SecurityRequest[])).find((r) => r.id === activeShiftJob.id) ?? null;
    },
    [activeShiftJob, allRequests, requests]
  );

  useGuardLiveLocation({
    activeJob: activeShiftRequest,
    enabled: !!onUpdateGuardLiveLocation,
    onUpdate: (requestId, location) => {
      void onUpdateGuardLiveLocation?.(requestId, location);
    },
  });

  const selectedJob = useMemo(
    () => browseJobLists.all.find((j) => j.id === guardSelectedJobId) ?? null,
    [browseJobLists.all, guardSelectedJobId]
  );

  const selectedJobShouldRoute = useMemo(
    () =>
      selectedJob
        ? guardMapShouldRouteToJob(guard.id, selectedJob as unknown as SecurityRequest)
        : false,
    [selectedJob, guard.id]
  );

  const mapJobs = useMemo(() => {
    const onDutyOverlay =
      activeTab === 'map' &&
      activeShiftJob &&
      (activeShiftJob.status === 'in-progress' || activeShiftJob.status === 'accepted') &&
      activePhase &&
      activePhase !== 'complete';
    if (onDutyOverlay) {
      return requests.filter(
        (j) =>
          j.assignedGuardId === guard.id &&
          (j.status === 'in-progress' || j.status === 'accepted')
      );
    }
    return filterGuardBrowseJobs(guard.id, browseJobLists.all, mapStatusFilter);
  }, [
    requests,
    guard.id,
    activeTab,
    activeShiftJob,
    activePhase,
    mapStatusFilter,
    browseJobLists.all,
  ]);

  useEffect(() => {
    if (
      guardSelectedJobId &&
      activeTab === 'map' &&
      !(
        activeShiftJob?.status === 'in-progress' &&
        activePhase &&
        activePhase !== 'complete'
      ) &&
      !mapJobs.some((j) => j.id === guardSelectedJobId)
    ) {
      setGuardSelectedJobId(null);
      setMapRoute(null);
      setMapRouteLoading(false);
    }
  }, [mapJobs, guardSelectedJobId, activeTab, activeShiftJob, activePhase]);

  const handleMapFilterChange = useCallback((filter: GuardMapStatusFilter) => {
    setMapStatusFilter(filter);
    if (filter !== 'all') {
      setGuardBrowseTab(guardBrowseTabFromMapFilter(filter));
    }
  }, []);

  const handleBrowseTabChange = useCallback((tab: GuardJobsBrowseTab) => {
    setGuardBrowseTab(tab);
    setMapStatusFilter(mapFilterFromBrowseTab(tab));
  }, []);

  const handleGuardSelectedJobChange = useCallback(
    (jobId: string | null) => {
      setGuardSelectedJobId(jobId);
      if (!jobId) {
        setMapRoute(null);
        setMapRouteLoading(false);
        return;
      }
      const job = browseJobLists.all.find((j) => j.id === jobId);
      if (!job) return;
      const kind = guardMapPinKind(guard.id, job as unknown as SecurityRequest);
      if (kind === 'available') handleBrowseTabChange('available');
      else if (kind === 'scheduled') handleBrowseTabChange('upcoming');
      else if (kind === 'past') handleBrowseTabChange('past');
    },
    [browseJobLists.all, guard.id, handleBrowseTabChange]
  );

  const userLocation = useUserLocation(activeTab === 'map');
  const geofenceNotifiedRef = useRef(false);

  useEffect(() => {
    geofenceNotifiedRef.current = false;
  }, [activeShiftJob?.id]);

  useEffect(() => {
    if (!activeShiftJob || activeShiftJob.status !== 'in-progress' || !userLocation) return;
    if (!shouldNotifyGeofenceLeave(activeShiftJob, userLocation)) {
      geofenceNotifiedRef.current = false;
      return;
    }
    if (geofenceNotifiedRef.current) return;
    geofenceNotifiedRef.current = true;
    onGeofenceLeave?.(activeShiftJob.id);
  }, [activeShiftJob, userLocation, onGeofenceLeave]);

  const earningsBreakdown = useMemo(
    () => computeGuardEarningsBreakdown(completedJobs),
    [completedJobs]
  );

  const openCashInvoices = useMemo(
    () => openGuardPayoutInvoices(guardPayoutInvoices, guard.id, 'cash').length,
    [guardPayoutInvoices, guard.id]
  );
  const openStripeInvoices = useMemo(
    () => openGuardPayoutInvoices(guardPayoutInvoices, guard.id, 'stripe').length,
    [guardPayoutInvoices, guard.id]
  );

  const trustedGuard = isGuardTrusted(guard);
  const pendingStandingCrewInvites = useMemo(
    () => getPendingStandingCrewIncoming(standingCrewMembers, guard.id),
    [standingCrewMembers, guard.id]
  );
  const showCrewTab = trustedGuard || pendingStandingCrewInvites.length > 0;

  const coordinatingCrewJobs = useMemo(
    () => getCoordinatingCrewJobs(guard.id, requests),
    [requests, guard.id]
  );

  useEffect(() => {
    if (tab === 'crew' && !showCrewTab) {
      setTab('map');
    }
  }, [tab, showCrewTab, setTab]);

  useEffect(() => {
    if (tab !== 'crew') setCrewJobDetailOpen(false);
  }, [tab]);

  useEffect(() => {
    if (!guard.stripeConnectAccountId) return;
    getConnectAccountStatus(guard.stripeConnectAccountId)
      .then((s) => setConnectReady(s.payoutsEnabled && s.detailsSubmitted))
      .catch(() => setConnectReady(false));
  }, [guard.stripeConnectAccountId]);

  useEffect(() => {
    if (initialSelectedJobId && !openJobChat) {
      setGuardSelectedJobId(initialSelectedJobId);
    }
  }, [initialSelectedJobId, openJobChat]);

  useEffect(() => {
    if (tab === 'myJobs' && openJobChat && jobChatRequestId) {
      setTab('messages');
    }
  }, [tab, openJobChat, jobChatRequestId, setTab]);

  const [teamChatRequestId, setTeamChatRequestId] = useState<string | null>(initialTeamChatRequestId);

  useEffect(() => {
    if (initialTeamChatRequestId) {
      setTeamChatRequestId(initialTeamChatRequestId);
      setTab('messages');
    }
  }, [initialTeamChatRequestId, setTab]);

  const openMessagesForTeam = useCallback(
    (requestId: string) => {
      setTab('messages');
      setTeamChatRequestId(requestId);
      onJobChatOpenChange?.(false);
      onJobChatRequestIdChange?.(null);
      onSupportTicketIdChange?.(null);
    },
    [setTab, onJobChatOpenChange, onJobChatRequestIdChange, onSupportTicketIdChange]
  );

  const openMessagesForJob = useCallback(
    (requestId: string) => {
      setTab('messages');
      onJobChatRequestIdChange?.(requestId);
      onJobChatOpenChange?.(true);
    },
    [setTab, onJobChatRequestIdChange, onJobChatOpenChange]
  );

  const updatePhase = useCallback((jobId: string, phase: ShiftPhase) => {
    saveShiftPhase(guard.id, jobId, phase);
    setShiftPhases((p) => ({ ...p, [jobId]: phase }));
  }, [guard.id]);

  const captureSelfie = useCallback((): Promise<string | null> => {
    return captureIdentitySelfie();
  }, []);

  const handleAcceptJob = (jobId: string) => {
    const workBlocked = guardWorkBlockedMessage(guard);
    if (workBlocked) {
      showAppToast(workBlocked, { tone: 'error' });
      return;
    }
    const jobView = requests.find((r) => r.id === jobId) ?? null;
    if (!jobView || !guardCanApplyToJob(guard, jobView, requests)) {
      const scheduleBlocked = jobView
        ? guardScheduleConflictError(guard.id, jobView, requests)
        : null;
      if (scheduleBlocked) {
        showAppToast(scheduleBlocked, { tone: 'error' });
        return;
      }
      const missing = jobView
        ? checkJobRequirements(guard, jobView, requests).checks.filter((c) => !c.met).map((c) => c.label).join(', ')
        : 'job requirements';
      showAppToast(`You must qualify before applying: ${missing}. Upload the required credentials in your profile.`, { tone: 'error' });
      return;
    }
    onAcceptJob(jobId);
    setGuardSelectedJobId(null);
  };

  const handleArrived = async () => {
    if (!activeShiftJob) return;
    const workBlocked = guardWorkBlockedMessage(guard, activeShiftJob.state);
    if (workBlocked) {
      showAppToast(workBlocked, { tone: 'error' });
      return;
    }
    const blocked = guardClockInBlockedMessage(activeShiftJob);
    if (blocked) {
      showAppToast(blocked, { tone: 'error' });
      return;
    }
    const proximity = await verifyOnSiteForJob(activeShiftJob);
    if (!proximity.onSite) {
      showAppToast('Not on site yet', {
        tone: 'error',
        body: formatSiteProximityHint(proximity.distanceMeters),
      });
      return;
    }
    updatePhase(activeShiftJob.id, 'arrived');
    onGuardArrived?.(activeShiftJob.id);
  };

  const handleStartEnRoute = () => {
    if (!activeShiftJob || !onStartEnRoute) return;
    updatePhase(activeShiftJob.id, 'en-route');
    void onStartEnRoute(activeShiftJob.id);
  };

  const handleMidShiftCheckIn = async (payload: {
    selfie: string;
    uniformVerified: boolean;
    equipmentVerified: boolean;
  }) => {
    if (!activeShiftJob) return;
    await onUpdateJobAudit(activeShiftJob.id, {
      midShiftAudit: {
        checkedAt: new Date().toISOString(),
        selfie: payload.selfie,
        uniformVerified: payload.uniformVerified,
        equipmentVerified: payload.equipmentVerified,
      },
    });
    showAppToast('Hourly check-in recorded.', { tone: 'success' });
  };

  const midShiftDue =
    !!activeShiftJob &&
    activePhase === 'on-duty' &&
    midShiftCheckInDue(
      shiftDutyStartedAt(activeShiftJob) ?? activeShiftJob.checkInAudit?.checkedAt,
      activeShiftJob.midShiftAudits
    );

  const handleBeginAudit = async () => {
    if (!activeShiftJob) return;
    const workBlocked = guardWorkBlockedMessage(guard, activeShiftJob.state);
    if (workBlocked) {
      showAppToast(workBlocked, { tone: 'error' });
      return;
    }
    const blocked = guardClockInBlockedMessage(activeShiftJob);
    if (blocked) {
      showAppToast(blocked, { tone: 'error' });
      return;
    }
    const proximity = await verifyOnSiteForJob(activeShiftJob);
    if (!proximity.onSite) {
      showAppToast('Must be on site to clock in', {
        tone: 'error',
        body: formatSiteProximityHint(proximity.distanceMeters),
      });
      return;
    }
    setShowSelfAudit(true);
  };

  const handleSelfAuditSubmit = (payload: {
    uniform: { uniformPresent: boolean; blackShoes: boolean; dutyBelt: boolean; requiredEquipment: boolean };
    selfieUpload: string;
    uniformPhoto?: string;
    shoesPhoto?: string;
  }) => {
    if (!activeShiftJob) return;
    const workBlocked = guardWorkBlockedMessage(guard, activeShiftJob.state);
    if (workBlocked) {
      showAppToast(workBlocked, { tone: 'error' });
      return;
    }
    if (!canGuardClockIn(activeShiftJob)) {
      showAppToast(guardClockInBlockedMessage(activeShiftJob) ?? 'Clock-in is not open yet.', { tone: 'error' });
      return;
    }
    const failed = !payload.uniform.uniformPresent || !payload.uniform.blackShoes;
    if (failed) onRecordAuditViolation(guard.id, 'Pre-job check-in audit incomplete');
    onUpdateJobAudit(activeShiftJob.id, {
      status: 'in-progress',
      checkInAudit: {
        checkedAt: new Date().toISOString(),
        gpsVerified: true,
        selfAuditSkipped: false,
        uniform: {
          uniformPresent: payload.uniform.uniformPresent,
          blackShoes: payload.uniform.blackShoes,
          dutyBelt: payload.uniform.dutyBelt,
          nameBadge: true,
          professionalAppearance: payload.uniform.uniformPresent,
        },
        equipment: {
          radio: payload.uniform.requiredEquipment,
          flashlight: payload.uniform.requiredEquipment,
          requiredEquipment: payload.uniform.requiredEquipment,
        },
        selfieUpload: payload.selfieUpload,
        uniformPhoto: payload.uniformPhoto,
        shoesPhoto: payload.shoesPhoto,
        readyForDuty: !failed,
      },
    });
    updatePhase(activeShiftJob.id, 'on-duty');
    setShowSelfAudit(false);
  };

  const handleSkipSelfAudit = () => {
    if (!activeShiftJob) return;
    const workBlocked = guardWorkBlockedMessage(guard, activeShiftJob.state);
    if (workBlocked) {
      showAppToast(workBlocked, { tone: 'error' });
      return;
    }
    if (!canGuardClockIn(activeShiftJob)) {
      showAppToast(guardClockInBlockedMessage(activeShiftJob) ?? 'Clock-in is not open yet.', { tone: 'error' });
      return;
    }
    void (async () => {
      if (!(await showAppConfirm({
        title: 'Skip self audit?',
        message:
          'Clock in without completing your self-audit photos? This job will be flagged No Self Audit until you upload them.',
        confirmLabel: 'Skip and clock in',
        tone: 'danger',
      }))) {
        return;
      }
      onUpdateJobAudit(activeShiftJob.id, {
      status: 'in-progress',
      checkInAudit: {
        checkedAt: new Date().toISOString(),
        gpsVerified: true,
        selfAuditSkipped: true,
        uniform: {
          uniformPresent: false,
          blackShoes: false,
          dutyBelt: false,
          nameBadge: false,
          professionalAppearance: false,
        },
        equipment: {
          radio: false,
          flashlight: false,
          requiredEquipment: false,
        },
        selfieUpload: '',
        readyForDuty: false,
      },
    });
    updatePhase(activeShiftJob.id, 'on-duty');
    })();
  };

  const handleStartBreak = () => {
    if (!activeShiftJob) return;
    const blocked = guardBreakBlockedMessage(activeShiftJob);
    if (!canGuardStartBreak(activeShiftJob)) {
      showAppToast(blocked ?? 'Cannot start a break right now.', { tone: 'error' });
      return;
    }
    const id = crypto.randomUUID();
    const shiftBreaks = [...(activeShiftJob.shiftBreaks ?? []), { id, startedAt: new Date().toISOString() }];
    onUpdateJobAudit(activeShiftJob.id, { shiftBreaks });
    showAppToast('Break started', { body: 'Staff have been notified.', tone: 'info' });
  };

  const handleEndBreak = () => {
    if (!activeShiftJob) return;
    const active = activeShiftBreak(activeShiftJob);
    if (!active || !canGuardEndBreak(activeShiftJob)) {
      showAppToast('No active break to end.', { tone: 'error' });
      return;
    }
    const endedAt = new Date().toISOString();
    const shiftBreaks = (activeShiftJob.shiftBreaks ?? []).map((brk) =>
      brk.id === active.id ? { ...brk, endedAt } : brk
    );
    onUpdateJobAudit(activeShiftJob.id, { shiftBreaks });
    showAppToast('Back on duty', { body: 'Staff have been notified.', tone: 'info' });
  };

  const handleEndShift = () => {
    if (!activeShiftJob) return;
    const blocked = guardClockOutBlockedMessage(activeShiftJob);
    if (blocked) {
      showAppToast(blocked, { tone: 'error' });
      return;
    }
    if (isLateClockOut(activeShiftJob)) {
      setShowLateClockOutPrompt(true);
      return;
    }
    setPendingClockOutAt(null);
    setPendingLeftEarlier(false);
    setPendingOvertimeClaimed(false);
    setShowCheckout(true);
  };

  const handleLateClockOutConfirm = (result: import('./guard/LateClockOutPrompt').LateClockOutResult) => {
    setPendingClockOutAt(result.checkedAt);
    setPendingLeftEarlier(result.leftEarlier);
    setPendingOvertimeClaimed(result.overtimeClaimed);
    setShowLateClockOutPrompt(false);
    setShowCheckout(true);
  };

  const handleCheckoutConfirm = () => {
    if (!activeShiftJob) return;
    if (!canGuardClockOut(activeShiftJob)) {
      showAppToast(guardClockOutBlockedMessage(activeShiftJob) ?? 'Clock-out is not available right now.', { tone: 'error' });
      setShowCheckout(false);
      return;
    }
    const checkedAt = pendingClockOutAt ?? new Date().toISOString();
    const existing = activeShiftJob.checkOutAudit;
    const hasIncidents = (existing?.incidentReports?.length ?? 0) > 0 || existing?.incidentReport?.hasIncident;
    onUpdateJobAudit(activeShiftJob.id, {
      status: 'completed',
      checkOutAudit: {
        checkedAt,
        completed: true,
        noViolations: true,
        noEquipmentIssues: true,
        dailyActivityReport:
          existing?.dailyActivityReport ||
          (hasIncidents ? 'Shift completed with incident report(s) on file.' : 'Job completed. No incidents to report.'),
        incidentReport: existing?.incidentReport ?? { hasIncident: false },
        incidentReports: existing?.incidentReports,
        clientNotes: existing?.clientNotes ?? '',
        leftEarlier: pendingLeftEarlier || undefined,
        overtimeClaimed: pendingOvertimeClaimed || undefined,
      },
    });
    updatePhase(activeShiftJob.id, 'complete');
    setShowCheckout(false);
    setPendingClockOutAt(null);
    setPendingLeftEarlier(false);
    setPendingOvertimeClaimed(false);
    setRatingJob(activeShiftJob);
  };

  const handleConnectStripeClick = () => {
    setConnectError(null);
    setConnectSheetOpen(true);
  };

  const handleConnectStripeContinue = async () => {
    setConnectPending(true);
    setConnectError(null);
    try {
      let accountId = guard.stripeConnectAccountId;
      if (!accountId) {
        const result = await createConnectAccount({
          guardId: guard.id,
          email: guard.email,
          name: guard.name,
        });
        accountId = result.accountId;
        onUpdateStripeAccount?.(guard.id, accountId);
      }
      const { url } = await createConnectAccountLink(accountId);
      setConnectSheetOpen(false);
      window.location.assign(url);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to start Stripe onboarding';
      if (message.includes('Connect platform setup') || message.includes('signed up for Connect')) {
        setConnectError(
          'Stripe Connect is not fully activated on the Guardr platform yet. Contact Guardr support if this persists.'
        );
      } else {
        setConnectError(message);
      }
    } finally {
      setConnectPending(false);
    }
  };

  const handleRequestCashPayout = async () => {
    if (!onRequestCashPayout) return;
    setCashRequestPending(true);
    try {
      await onRequestCashPayout();
    } catch (error) {
      showAppToast('Cash payout request failed', {
        tone: 'error',
        body: error instanceof Error ? error.message : 'Try again or contact Guardr support.',
      });
    } finally {
      setCashRequestPending(false);
    }
  };

  const handleRequestStripePayout = async () => {
    if (!onRequestStripePayout) return;
    setStripeRequestPending(true);
    try {
      await onRequestStripePayout();
    } catch (error) {
      showAppToast('Stripe payout request failed', {
        tone: 'error',
        body: error instanceof Error ? error.message : 'Try again or contact Guardr support.',
      });
    } finally {
      setStripeRequestPending(false);
    }
  };

  const userStatus = getGuardUserStatus(guard);
  const credentialRestricted = isGuardCredentialExpiryRestricted(guard);
  const accountNeedsActivation = !isGuardAccountActive(guard);
  const showPendingGate =
    accountNeedsActivation && !GUARD_ACTIVATION_ALLOWED_TABS.includes(tab);
  const accountPreActive = isGuardAccountPreActive(guard);
  if (userStatus === 'suspended' || userStatus === 'blocked') {
    return (
      <AppScreen className="flex min-h-screen items-center justify-center p-6">
        <div className="app-card-elevated max-w-md w-full text-center p-8 space-y-4">
          <div className="app-empty-state-icon mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black tracking-[-0.03em]">Account {GUARD_STATUS_LABELS[userStatus]}</h2>
          <p className="text-brand-text-muted text-sm leading-relaxed">Contact Guardr support to restore access.</p>
        </div>
      </AppScreen>
    );
  }

  const showShiftOverlay =
    activeTab === 'map' &&
    !!activeShiftJob &&
    (activeShiftJob.status === 'in-progress' || activeShiftJob.status === 'accepted') &&
    activePhase &&
    activePhase !== 'complete';
  const workBlockedMessage = guardWorkBlockedMessage(guard);

  const NAV_TABS: { id: GuardTab; icon: typeof Map; label: string }[] = [
    { id: 'myJobs', icon: Briefcase, label: 'Jobs' },
    { id: 'messages', icon: MessagesSquare, label: 'Messages' },
    { id: 'map', icon: Map, label: 'Map' },
    { id: 'earnings', icon: DollarSign, label: 'Pay' },
    ...(showCrewTab ? [{ id: 'crew' as const, icon: Users, label: 'Crew' }] : []),
  ];

  const accountMenu = {
    userName: guard.name,
    userSubtitle: currentUser.email,
    avatarUrl: guard.avatar,
    onOpenProfile: () => setTab('profile'),
    onOpenSettings: () => setTab('settings'),
    onSignOut,
    hideProfile: accountNeedsActivation,
    active: activeTab === 'profile' || activeTab === 'settings',
    extraLinks: accountNeedsActivation
      ? []
      : [
          {
            label: 'Guide',
            icon: BookOpen,
            onClick: () => setTab('guide'),
            active: tab === 'guide',
          },
        ],
  };

  const messagesChromeActive =
    tab === 'messages' && supportMode !== 'compose' && supportMode !== 'report';
  const messagesShellHeaderTrailing =
    messagesChromeActive ? (
      <div className="shrink-0 flex items-center gap-2">
        {headerRight}
        <AccountMenu {...accountMenu} />
      </div>
    ) : null;

  const renderGuardMainPanel = () => (
    <div
      className={`h-full min-h-0 relative overflow-hidden flex flex-col ${activeTab === 'map' ? 'guard-map-layout' : ''}`}
      data-tour={activeTab === 'map' ? 'guard-map' : undefined}
    >
      {!accountPreActive && activeTab !== 'profile' && (
        <GuardCredentialGraceBanner guard={guard} onOpenCredentials={() => setTab('profile')} />
      )}
      <div className="relative flex-1 min-h-0">
      {activeTab === 'map' && workBlockedMessage && (
        <div className="absolute top-0 left-0 right-0 z-[1002] px-4 py-3 bg-amber-500/15 border-b border-amber-500/30 text-sm text-brand-text">
          {workBlockedMessage}
        </div>
      )}

      {activeTab === 'map' && requests.find((r) => isTutorialDemoId(r.id)) && (
        <div data-tour="guard-demo-job" className="tutorial-demo-card relative z-[1003] mx-4 mt-3">
          <p className="tutorial-demo-card-label">Tutorial practice job</p>
          <p className="text-sm font-semibold mt-1">
            {requests.find((r) => isTutorialDemoId(r.id))?.title}
          </p>
          <p className="text-xs text-brand-text-muted mt-1">
            Only you can see this listing. Tap the map pin to preview how open jobs work.
          </p>
        </div>
      )}

      {activeTab === 'map' && (
        <MapViewportInsetsProvider>
      {activeTab === 'map' && !showShiftOverlay && (
        <MapPinFilterStepper
          filters={GUARD_MAP_STATUS_FILTERS}
          value={mapStatusFilter}
          onChange={handleMapFilterChange}
          onZoomIn={() => mapZoomRef.current?.zoomIn()}
          onZoomOut={() => mapZoomRef.current?.zoomOut()}
          routeSlot={
            selectedJobShouldRoute ? (
              <MapRouteBanner
                route={mapRoute}
                loading={mapRouteLoading}
                label="Route to job"
              />
            ) : null
          }
        />
      )}

      {activeTab === 'map' && (
        <ShiftMap
          jobs={mapJobs}
          selectedJobId={guardSelectedJobId}
          onSelectJob={handleGuardSelectedJobChange}
          drawRoute={selectedJobShouldRoute}
          onRouteChange={setMapRoute}
          onRouteLoadingChange={setMapRouteLoading}
          getPinKind={(job) => guardMapPinKind(guard.id, job as unknown as SecurityRequest)}
          zoomRef={mapZoomRef}
          routeFitResetKey={guardSelectedJobId ?? ''}
        />
      )}

      {activeTab === 'map' && showShiftOverlay && activeShiftJob && activePhase && (
        <GuardActiveShift
          job={activeShiftJob}
          phase={activePhase}
          onSite={
            userLocation ? isWithinSiteRadius(userLocation, activeShiftJob) : false
          }
          onArrived={handleArrived}
          onStartEnRoute={onStartEnRoute ? handleStartEnRoute : undefined}
          onBeginAudit={handleBeginAudit}
          onSkipAudit={handleSkipSelfAudit}
          onIncidentReport={() => setShowIncidentReport(true)}
          onActivityReport={() => setShowActivityLog(true)}
          onEndShift={handleEndShift}
          onStartBreak={handleStartBreak}
          onEndBreak={handleEndBreak}
          onOpenJobChat={
            onSendJobChatMessage ? () => openMessagesForJob(activeShiftJob.id) : undefined
          }
          onMidShiftCheckIn={handleMidShiftCheckIn}
          captureSelfie={captureSelfie}
          midShiftCheckInDue={midShiftDue}
        />
      )}

      {activeTab === 'map' && replacementOffers.length > 0 && !showShiftOverlay && (
        <div className="absolute inset-x-4 bottom-28 z-[1002] space-y-2 map-browse-offset">
          {replacementOffers.map((offer) => (
            <ReplacementOfferCard
              key={offer.id}
              request={offer}
              onAccept={(requestId) => void onAcceptReplacementOffer?.(requestId)}
            />
          ))}
        </div>
      )}

      {activeTab === 'map' && !showShiftOverlay && selectedJob && (
        <MapSelectionExperience
          job={selectedJob}
          role="guard"
          guardId={guard.id}
          route={mapRoute}
          loadingRoute={mapRouteLoading}
          onClose={() => handleGuardSelectedJobChange(null)}
          bottomOffsetClass="map-browse-offset"
          guardFullBody={
            <GuardJobDetailView
              job={selectedJob}
              guard={guard}
              jobChatThreads={jobChatThreads}
              coworkerGuards={coworkerGuards}
              scheduleRequests={requests}
              onAccept={() => handleAcceptJob(selectedJob.id)}
              onDeclineDirectJob={
                onDeclineDirectJob && selectedJob.requestType === 'direct'
                  ? () => void onDeclineDirectJob(selectedJob.id)
                  : undefined
              }
              onApplyAsLead={
                onApplyAsTeamLead ? () => void onApplyAsTeamLead(selectedJob.id) : undefined
              }
              onInviteGuard={
                onInviteTeamGuard
                  ? (guardId) => void onInviteTeamGuard(selectedJob.id, guardId)
                  : undefined
              }
              onRemoveGuard={
                onRemoveTeamGuard
                  ? (guardId) => void onRemoveTeamGuard(selectedJob.id, guardId)
                  : undefined
              }
              onUpdateCrewProfile={
                onUpdateCrewProfile
                  ? (patch) => void onUpdateCrewProfile(selectedJob.id, patch)
                  : undefined
              }
              onAcceptInvite={
                onAcceptTeamInvite ? () => void onAcceptTeamInvite(selectedJob.id) : undefined
              }
              onDeclineInvite={
                onDeclineTeamInvite ? () => void onDeclineTeamInvite(selectedJob.id) : undefined
              }
              onOpenMessages={openMessagesForJob}
              onApproveOvertime={onApproveOvertime}
              onClose={() => handleGuardSelectedJobChange(null)}
              feeConfig={feeConfig}
              onSubmitPriceOffer={
                onSubmitPriceOffer
                  ? (input) => void onSubmitPriceOffer(selectedJob.id, input)
                  : undefined
              }
              onAcceptPriceOffer={
                onAcceptPriceOffer
                  ? (offerId) => void onAcceptPriceOffer(selectedJob.id, offerId)
                  : undefined
              }
            />
          }
        />
      )}
        </MapViewportInsetsProvider>
      )}

      {tab !== 'map' && (
        <AppPageTransition motionKey={tab} className="absolute inset-0">
          {tab === 'earnings' && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden" data-tour="guard-earnings">
              <div className="guard-scroll-panel flex-1">
                <GuardEarningsPanel
                  breakdown={earningsBreakdown}
                  completedJobs={completedJobs}
                  stripeConnected={!!guard.stripeConnectAccountId}
                  stripeReady={connectReady}
                  connectPending={connectPending}
                  onConnectStripe={handleConnectStripeClick}
                  onRequestCashPayout={onRequestCashPayout ? handleRequestCashPayout : undefined}
                  onRequestStripePayout={onRequestStripePayout ? handleRequestStripePayout : undefined}
                  cashRequestPending={cashRequestPending}
                  stripeRequestPending={stripeRequestPending}
                  openCashInvoices={openCashInvoices}
                  openStripeInvoices={openStripeInvoices}
                  payments={payments}
                />
              </div>
            </div>
          )}

          {tab === 'myJobs' && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden" data-tour="guard-my-jobs">
              <GuardMyJobsPanel
                availableJobs={browseJobLists.available}
                upcomingJobs={browseJobLists.upcoming}
                pastJobs={browseJobLists.past}
                guard={guard}
                currentUser={currentUser}
                coworkerGuards={coworkerGuards}
                jobChatThreads={jobChatThreads}
                scheduleRequests={requests}
                selectedJobId={guardSelectedJobId}
                onSelectedJobIdChange={handleGuardSelectedJobChange}
                activeTab={guardBrowseTab}
                onActiveTabChange={handleBrowseTabChange}
                onOpenMessages={openMessagesForJob}
                onApproveOvertime={onApproveOvertime}
                onAcceptJob={handleAcceptJob}
                onDeclineDirectJob={onDeclineDirectJob}
                onApplyAsLead={onApplyAsTeamLead}
                onInviteGuard={onInviteTeamGuard}
                onRemoveGuard={onRemoveTeamGuard}
                onUpdateCrewProfile={onUpdateCrewProfile}
                onAcceptInvite={onAcceptTeamInvite}
                onDeclineInvite={onDeclineTeamInvite}
                feeConfig={feeConfig}
                onSubmitPriceOffer={onSubmitPriceOffer}
                onAcceptPriceOffer={onAcceptPriceOffer}
              />
            </div>
          )}

          {tab === 'crew' && showCrewTab && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden">
              <GuardCrewHubPanel
                  guard={guard}
                  coordinatingJobs={coordinatingCrewJobs}
                  coworkerGuards={coworkerGuards}
                  standingCrewMembers={standingCrewMembers}
                  trusted={trustedGuard}
                  scheduleRequests={requests}
                  onInviteGuard={onInviteTeamGuard}
                  onRemoveGuard={onRemoveTeamGuard}
                  onUpdateCrewProfile={onUpdateCrewProfile}
                  onUpdateStandingCrewProfile={onUpdateStandingCrewProfile}
                  onAcceptInvite={onAcceptTeamInvite}
                  onDeclineInvite={onDeclineTeamInvite}
                  onInviteStandingCrew={onInviteStandingCrew}
                  onRemoveStandingCrew={onRemoveStandingCrew}
                  onAcceptStandingCrewInvite={onAcceptStandingCrewInvite}
                  onDeclineStandingCrewInvite={onDeclineStandingCrewInvite}
                  onDetailOpenChange={setCrewJobDetailOpen}
                  onJoinTeamWithCode={onJoinTeamWithCode}
                />
            </div>
          )}

          {tab === 'messages' && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden" data-tour="guard-messages">
              {supportMode === 'compose' && onCreateSupportTicket ? (
                <SupportComposePage
                  onBack={() => onCloseSupportForm?.()}
                  onCreateTicket={onCreateSupportTicket}
                  onCreated={(ticketId) => {
                    onCloseSupportForm?.();
                    onSupportTicketIdChange?.(ticketId);
                  }}
                />
              ) : supportMode === 'report' && onCreateSupportTicket ? (
                <SupportReportPage
                  relatedRequests={relatedRequests}
                  onBack={() => onCloseSupportForm?.()}
                  onCreateTicket={onCreateSupportTicket}
                  onSubmitted={() => onCloseSupportForm?.()}
                />
              ) : (
                <GuardMessagesPanel
                  upcomingJobs={upcomingForMessages}
                  pastJobs={browseJobLists.past}
                  guard={guard}
                  coworkerGuards={coworkerGuards}
                  currentUser={currentUser}
                  jobChatThreads={jobChatThreads}
                  jobChatMessages={jobChatMessages}
                  teamChatThreads={teamChatThreads}
                  teamChatMessages={teamChatMessages}
                  guardMessages={guardMessages}
                  supportTickets={supportTickets}
                  onSendJobChatMessage={onSendJobChatMessage}
                  onSendTeamChatMessage={onSendTeamChatMessage}
                  onSendGuardMessage={onSendGuardMessage}
                  onSendSupportMessage={onSendSupportMessage}
                  onRefreshGuardMessages={onRefreshGuardMessages}
                  initialJobChatRequestId={jobChatRequestId}
                  initialJobChatOpen={openJobChat}
                  initialTeamChatRequestId={teamChatRequestId}
                  onJobChatRequestIdChange={onJobChatRequestIdChange}
                  onJobChatOpenChange={onJobChatOpenChange}
                  initialSupportTicketId={supportTicketId}
                  onSupportTicketIdChange={onSupportTicketIdChange}
                  onOpenSupportCompose={onOpenSupportCompose}
                  onOpenSupportReport={onOpenSupportReport}
                  onDetailOpenChange={setGuardMessagesDetailOpen}
                  onMessagesChromeChange={setGuardMessagesChrome}
                  shellHeaderTrailing={messagesShellHeaderTrailing}
                />
              )}
            </div>
          )}

          {tab === 'guide' && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden">
              <AppGuidePage
                audience="guard"
                tutorialAvailable={tutorialAvailable}
                tutorialCompleted={tutorialCompleted}
                tutorialActive={tutorialActive}
                onStartTutorial={onStartTutorial}
                onEnterPracticeMode={onEnterPracticeMode}
              />
            </div>
          )}

          {tab === 'profile' && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden">
              <UserProfileScreen
                currentUser={currentUser}
                guard={guard}
                onSave={onUpdateProfile}
                onAddCertification={onAddCertification}
                onDeleteCertification={onDeleteCertification}
                onAttachCertificationImage={onAttachCertificationImage}
                onUpdateCertification={onUpdateCertification}
                onAddExperience={onAddExperience}
                onAddEducation={onAddEducation}
                onSubmitIdentityVerification={onSubmitIdentityVerification}
                onSaveInsurance={onSaveInsurance}
              />
            </div>
          )}

          {tab === 'settings' && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                <UserSettingsScreen
                  currentUser={currentUser}
                  themeMode={themeMode as 'dark' | 'light' | 'grey'}
                  onChangeTheme={onChangeTheme}
                  onOpenLegal={onOpenLegal}
                  onJoinTeamWithCode={
                    shouldOfferTeamCodeJoin(guard, standingCrewMembers)
                      ? onJoinTeamWithCode
                      : undefined
                  }
                />
                <div className="px-4 pb-8 max-w-lg mx-auto">
                  <GuardAvailabilityCalendar guardId={guard.id} />
                </div>
              </div>
            </div>
          )}
        </AppPageTransition>
      )}
      </div>
    </div>
  );

  const guardModals = (
    <>
      <GuardStripeConnectSheet
        open={connectSheetOpen}
        onClose={() => {
          if (connectPending) return;
          setConnectSheetOpen(false);
          setConnectError(null);
        }}
        onContinue={handleConnectStripeContinue}
        pending={connectPending}
        error={connectError}
        resumeSetup={!!guard.stripeConnectAccountId}
      />

      <GuardSelfAuditModal
        open={showSelfAudit}
        onClose={() => setShowSelfAudit(false)}
        onTriggerCamera={captureSelfie}
        onSubmit={handleSelfAuditSubmit}
      />

        <LateClockOutPrompt
          open={showLateClockOutPrompt && !!activeShiftJob}
          endDate={activeShiftJob?.endDate ?? ''}
          checkInAt={activeShiftJob?.checkInAudit?.checkedAt}
          onClose={() => setShowLateClockOutPrompt(false)}
          onConfirm={handleLateClockOutConfirm}
        />

        <AppModal
          open={showCheckout && !!activeShiftJob}
          align="center"
          position="absolute"
          zIndex={1003}
          onClose={() => {
            setShowCheckout(false);
            setPendingClockOutAt(null);
            setPendingLeftEarlier(false);
          }}
          panelClassName="p-6 space-y-4"
        >
          <h3 className="font-bold text-lg">Complete job?</h3>
          <p className="text-sm text-brand-text-muted">
            {pendingClockOutAt
              ? `Confirm you are clocking out at ${new Date(pendingClockOutAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })} and your job duties are complete.`
              : 'Confirm you are leaving the site and your job duties are complete.'}
          </p>
          <SlideToConfirm
            label="Slide to complete job"
            confirmedLabel="Completed"
            tone="success"
            onConfirm={handleCheckoutConfirm}
          />
          <button
            type="button"
            onClick={() => setShowCheckout(false)}
            className="app-button-outline app-btn-md"
          >
            Cancel
          </button>
        </AppModal>

      <GuardRatingModal
        open={!!ratingJob}
        clientName={ratingJob?.clientName ?? ''}
        onSkip={() => setRatingJob(null)}
        onSubmit={(rating, note) => {
          if (!ratingJob) return;
          const existing = ratingJob.checkOutAudit;
          onUpdateJobAudit(ratingJob.id, {
            checkOutAudit: {
              checkedAt: existing?.checkedAt ?? new Date().toISOString(),
              completed: existing?.completed ?? true,
              noViolations: existing?.noViolations ?? true,
              noEquipmentIssues: existing?.noEquipmentIssues ?? true,
              dailyActivityReport: existing?.dailyActivityReport ?? 'Job completed.',
              incidentReport: existing?.incidentReport ?? { hasIncident: false },
              incidentReports: existing?.incidentReports,
              clientNotes: `Guard rated client ${rating}/5: ${note}`,
            },
          });
          setRatingJob(null);
        }}
      />

      {activeShiftJob && (
        <GuardIncidentReportModal
          open={showIncidentReport}
          onClose={() => setShowIncidentReport(false)}
          siteName={activeShiftJob.siteName || activeShiftJob.location}
          onSubmit={async (input) => {
            if (!onSubmitIncidentReport) {
              throw new Error('Incident reporting is not available for this session.');
            }
            await onSubmitIncidentReport(activeShiftJob.id, input);
            showAppToast('Incident report filed', {
              body: 'Full details shared with the client and staff.',
              tone: 'success',
            });
          }}
        />
      )}

      {activeShiftJob && (
        <GuardActivityLogModal
          open={showActivityLog}
          onClose={() => setShowActivityLog(false)}
          onSubmit={(report) => {
            const stamp = new Date().toISOString();
            const entry = `[${new Date(stamp).toLocaleTimeString()}] ${report}`;
            const prior = activeShiftJob.checkOutAudit?.dailyActivityReport ?? '';
            onUpdateJobAudit(activeShiftJob.id, {
              checkOutAudit: {
                checkedAt: activeShiftJob.checkOutAudit?.checkedAt ?? stamp,
                completed: false,
                noViolations: activeShiftJob.checkOutAudit?.noViolations ?? true,
                noEquipmentIssues: activeShiftJob.checkOutAudit?.noEquipmentIssues ?? true,
                dailyActivityReport: prior ? `${prior}\n${entry}` : entry,
                incidentReport: activeShiftJob.checkOutAudit?.incidentReport ?? { hasIncident: false },
                incidentReports: activeShiftJob.checkOutAudit?.incidentReports,
                clientNotes: activeShiftJob.checkOutAudit?.clientNotes ?? '',
              },
            });
            showAppToast('Activity logged', { tone: 'success' });
          }}
        />
      )}
    </>
  );

  const shellFullBleed = !showPendingGate && tab === 'map';
  const shellVariant = shellFullBleed ? 'dark' : 'default';
  const visibleMainPanel = showPendingGate ? (
    <AccountPendingScreen
      role="guard"
      guard={guard}
      onOpenProfile={() => setTab('settings')}
      onAddCertification={onAddCertification}
      onDeleteCertification={onDeleteCertification}
      onAttachCertificationImage={onAttachCertificationImage}
      onUpdateCertification={onUpdateCertification}
      onSubmitIdentityVerification={onSubmitIdentityVerification}
      onSaveInsurance={onSaveInsurance}
    />
  ) : (
    renderGuardMainPanel()
  );

  if (isEmbedded) {
    return (
      <div className="h-full min-h-0 flex flex-col overflow-hidden guard-staff-embedded">
        {visibleMainPanel}
        {guardModals}
      </div>
    );
  }

  const guardScreenTitle = showPendingGate
    ? credentialRestricted
      ? 'Account restricted'
      : userStatus === 'approved'
        ? 'Awaiting activation'
        : 'Complete application'
    : tab === 'messages' && supportMode === 'compose'
      ? 'Contact support'
      : tab === 'messages' && supportMode === 'report'
        ? 'File a report'
        : GUARD_TAB_TITLES[tab];
  const guardHeaderStatus =
    activeShiftJob?.status === 'in-progress'
      ? `On shift · ${activeShiftJob.siteName || activeShiftJob.location}`
      : credentialRestricted
        ? 'Restricted — upload and verify expired credentials'
        : accountNeedsActivation
        ? userStatus === 'approved'
          ? 'Awaiting account activation'
          : 'Activation in review'
        : trustedGuard
          ? 'Trusted Guardr professional'
          : 'Available for vetted jobs';

  const shellHeaderOverride = messagesChromeActive ? guardMessagesChrome.override : null;
  const shellHeaderExtension = messagesChromeActive ? guardMessagesChrome.extension : null;

  const shellHideHeader =
    ((tab === 'myJobs' && !!guardSelectedJobId) ||
      (tab === 'crew' && crewJobDetailOpen)) &&
    !shellHeaderOverride;

  return (
    <RoleAppShell
      title={guardScreenTitle}
      locationLabel={guardHeaderStatus}
      hideHeader={shellHideHeader}
      headerRight={headerRight}
      headerExtension={shellHeaderExtension}
      headerOverride={shellHeaderOverride}
      accountMenu={accountMenu}
      navItems={accountNeedsActivation ? [] : NAV_TABS}
      activeNavId={GUARD_BOTTOM_NAV_TABS.has(tab) ? tab : ''}
      onNavigate={(id) => setTab(id as GuardTab)}
      fullBleed={shellFullBleed}
      variant={shellVariant}
    >
      <div className="relative h-full min-h-0">
        {visibleMainPanel}
        {guardModals}
      </div>
    </RoleAppShell>
  );
}
