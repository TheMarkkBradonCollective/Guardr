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
import { MapBrowseDock } from './map/MapBrowseDock';
import { guardMapBrowseItems } from '../lib/mapBrowseItems';
import { GUARD_MAP_BROWSE_EMPTY_MESSAGE } from '../lib/mapEmptyMessages';
import { getGuardNextShift } from '../lib/guardNextShift';
import type { SecurityRequest } from '../types';
import { isJobMissed } from '../lib/jobTallies';
import { GuardActiveShift } from './guard/GuardActiveShift';
import { GuardPreShiftBriefing } from './guard/GuardPreShiftBriefing';
import { GuardNextShiftCard } from './guard/GuardNextShiftCard';
import { ReplacementOfferCard } from './guard/ReplacementOfferCard';
import { activeReplacementOffers } from '../lib/emergencyReplacement';
import { useGuardLiveLocation } from '../lib/useGuardLiveLocation';
import { midShiftCheckInDue } from './guard/MidShiftCheckInPanel';
import { shiftDutyStartedAt } from '../lib/shiftWindow';
import { GuardEarningsPanel } from './guard/GuardEarningsPanel';
import { GuardStripeConnectSheet } from './guard/GuardStripeConnectSheet';
import { GuardJobDetailView } from './guard/GuardJobDetailView';
import { GuardMyJobsPanel } from './guard/GuardMyJobsPanel';
import { GuardSelfAuditModal } from './guard/GuardSelfAuditModal';
import { GuardEndShiftCheckpointModal } from './guard/GuardEndShiftCheckpointModal';
import { GuardBriefingAckGate } from './guard/GuardBriefingAckGate';
import { GuardRatingModal } from './guard/GuardRatingModal';
import { GuardActivityLogModal } from './guard/GuardActivityLogModal';
import { GuardIncidentReportModal } from './guard/GuardIncidentReportModal';
import { LateClockOutPrompt } from './guard/LateClockOutPrompt';
import { showAppToast } from './ui/AppToast';
import { showAppConfirm } from './ui/AppConfirm';
import { AppOverlaySheet } from './ui/motion/AppMotion';
import { ProfileSavePayload, UserProfileScreen } from './profile/UserProfileScreen';
import { UserSettingsScreen } from './profile/UserSettingsScreen';
import { GuardPerformanceScreen } from './guard/GuardPerformanceScreen';
import { GuardVehiclePanel } from './guard/GuardVehiclePanel';
import { guardVehicleTabVisible } from '../lib/guardVehicle';
import { GuardPreferencesScreen } from './guard/GuardPreferencesScreen';
import { GuardAvailabilityScreen } from './guard/GuardAvailabilityScreen';
import { SupportComposePage } from './support/SupportComposePage';
import { SupportReportPage } from './support/SupportReportPage';
import { RoleAppShell } from './layouts/RoleAppShell';
import { AccountMenu, type AccountMenuNotificationProps } from './layouts/AccountMenu';
import { EMPTY_MESSAGES_CHROME, type MessagesChrome } from '../lib/messagesChrome';
import { AppGuidePage } from './docs/AppGuidePage';
import { SidebarFooterLinks } from './layouts/SidebarFooterLinks';
import { AppModal, AppPageTransition } from './ui/motion/AppMotion';
import { AppScreen, AppSubScreenHeader } from './ui/app/AppPrimitives';
import { SlideToConfirm } from './ui/SlideToConfirm';
import { AlertTriangle, Map, DollarSign, Briefcase, MessagesSquare, BookOpen, Users, BarChart3, SlidersHorizontal, CalendarDays, Car, Plus, LifeBuoy } from 'lucide-react';
import {
  guardCanApplyToJob,
  guardCanViewJob,
  checkJobRequirements,
  loadShiftPhase,
  saveShiftPhase,
  ShiftPhase,
} from '../lib/guardJobs';
import { guardScheduleConflictError, type ScheduleJob } from '../lib/guardSchedule';
import { isGuardTrusted } from '../lib/guardTrust';
import { computeGuardEarningsBreakdown } from '../lib/guardEarnings';
import { openGuardPayoutInvoices } from '../lib/guardPayoutInvoiceStorage';
import { GuardJobView, GuardPayoutView } from '../lib/guardJobView';
import { isPreShiftBriefingWindowOpen, canGuardStartEnRoute, enRouteBlockedMessage } from '../lib/preShiftBriefing';
import { jobRequiresPostOrdersAck } from '../lib/postOrdersAck';
import { guardMustAckBriefingOnSite } from '../lib/briefingAck';
import {
  createEndSkipViolations,
  createStartSkipViolations,
  mergeShiftAuditViolations,
} from '../lib/shiftAuditViolations';
import { createConnectAccount, createConnectAccountLink, getConnectAccountStatus } from '../lib/stripeApi';
import { GUARD_STATUS_LABELS, guardWorkBlockedMessage } from '../lib/guardQualification';
import {
  getGuardUserStatus,
  isGuardAccountApproved,
  isGuardAccountPreActive,
  isGuardUserStatusActive,
} from '../lib/accountStatus';
import { isGuardCredentialExpiryRestricted } from '../lib/guardCredentialExpiryEnforcement';
import { findActivationSupportChat } from '../lib/support';
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
import {
  captureGuardActivityOffline,
  captureGuardIncidentOffline,
  captureGuardSelfAuditOffline,
} from '../lib/platform/guardOfflineCapture';
import type { PerformanceFactorId } from '../lib/guardPerformanceFactorDetail';
import { registerSystemBackHandler } from '../lib/systemBackButton';

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
  onSaveVehicleInsurance?: (
    policy: Partial<import('../types').GuardVehicleInsurancePolicy> & { guardId: string }
  ) => Promise<void>;
  onSaveVehicle?: (
    profile: Partial<import('../types').GuardVehicleProfile> & { guardId: string }
  ) => Promise<void>;
  onSubmitVehicle?: (
    profile: Partial<import('../types').GuardVehicleProfile> & { guardId: string }
  ) => Promise<void>;
  onAcceptJob: (requestId: string) => void;
  onDeclineDirectJob?: (requestId: string) => void | Promise<void>;
  onApplyAsTeamLead?: (requestId: string) => void | Promise<void>;
  onInviteTeamGuard?: (requestId: string, guardId: string) => void | Promise<void>;
  onRemoveTeamGuard?: (requestId: string, guardId: string) => void | Promise<void>;
  onAcceptTeamInvite?: (requestId: string) => void | Promise<void>;
  onDeclineTeamInvite?: (requestId: string) => void | Promise<void>;
  accountNotifications?: AccountMenuNotificationProps;
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
  onAckPostOrders?: (requestId: string) => void | Promise<void>;
  onAckBriefing?: (requestId: string) => void | Promise<void>;
  onSaveJobPreferences?: (preferences: import('../types').JobType[]) => void | Promise<void>;
  onCompleteJobTypeOnboarding?: (jobType: import('../types').JobType) => void | Promise<void>;
  onUpdateJobAudit: (requestId: string, auditPayload: any) => void | Promise<boolean | void>;
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
  onDisputeShiftAuditViolation?: (
    requestId: string,
    violationId: string,
    note: string
  ) => void | Promise<void>;
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
  onSendJobChatMessage?: (requestId: string, body: string) => void | Promise<void>;
  guardMessages?: GuardMessage[];
  onSendGuardMessage?: (body: string) => void | Promise<void>;
  onRefreshGuardMessages?: () => void | Promise<void>;
  onSubmitIncidentReport?: (requestId: string, input: IncidentReportFormInput) => void | Promise<void>;
  onRequestCashPayout?: () => Promise<void>;
  onRequestStripePayout?: () => Promise<void>;
  jobChatRequestId?: string | null;
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
  onOpenActivationSupport?: () => void;
  onOpenSupportReport?: () => void;
  onCloseSupportForm?: () => void;
  performanceFactorId?: PerformanceFactorId | null;
  onPerformanceFactorChange?: (factorId: PerformanceFactorId | null) => void;
  /** Render inside staff dashboard — no outer shell */
  variant?: 'standalone' | 'embedded';
  shiftTab?: GuardTab;
  initialTab?: GuardTab;
  /** Controlled tab — when set, parent owns navigation state (URL sync). */
  tab?: GuardTab;
  onTabChange?: (tab: GuardTab) => void;
  /** Controlled Jobs selection / browse tab (URL sync from App). */
  selectedJobId?: string | null;
  onSelectedJobIdChange?: (jobId: string | null) => void;
  browseTab?: GuardJobsBrowseTab;
  onBrowseTabChange?: (tab: GuardJobsBrowseTab) => void;
  onOpenLegal?: (page: import('../lib/legalContent').LegalPageId) => void;
  onOpenDownload?: () => void;
  tutorialAvailable?: boolean;
  tutorialCompleted?: boolean;
  tutorialActive?: boolean;
  onStartTutorial?: () => void;
  isDbConnected?: boolean;
}

export type GuardTab = 'map' | 'activation' | 'earnings' | 'myJobs' | 'messages' | 'guardChat' | 'support' | 'profile' | 'settings' | 'guide' | 'preferences' | 'performance' | 'availability' | 'vehicle';
export type GuardSupportMode = 'compose' | 'report';

function guardActivationAllowedTabs(guard: SecurityGuard): GuardTab[] {
  const tabs: GuardTab[] = ['settings'];
  if (guard.applicationRevisionRequestedAt) {
    tabs.push('profile');
  }
  if (isGuardAccountApproved(guard)) {
    tabs.push('support');
  }
  return tabs;
}
const GUARD_SIDE_NAV_TABS = new Set<GuardTab>([
  'map',
  'myJobs',
  'messages',
  'support',
  'availability',
  'preferences',
  'performance',
  'vehicle',
  'earnings',
]);

const GUARD_TAB_TITLES: Record<GuardTab, string> = {
  map: 'Map',
  activation: 'Complete application',
  myJobs: 'Jobs',
  earnings: 'Pay',
  messages: 'Messages',
  guardChat: 'Messages',
  support: 'Support',
  profile: 'Profile',
  settings: 'Settings',
  guide: 'Guide',
  preferences: 'Preferences',
  performance: 'Performance',
  availability: 'Availability',
  vehicle: 'Vehicle',
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
  onSaveVehicleInsurance,
  onSaveVehicle,
  onSubmitVehicle,
  onAcceptJob,
  onDeclineDirectJob,
  onApplyAsTeamLead,
  onInviteTeamGuard,
  onRemoveTeamGuard,
  onAcceptTeamInvite,
  onDeclineTeamInvite,
  accountNotifications,
  feeConfig,
  onSubmitPriceOffer,
  onAcceptPriceOffer,
  coworkerGuards = [],
  onUpdateJobAudit,
  onAckPostOrders,
  onAckBriefing,
  onSaveJobPreferences,
  onCompleteJobTypeOnboarding,
  onStartEnRoute,
  onUpdateGuardLiveLocation,
  onAcceptReplacementOffer,
  onGuardArrived,
  onGeofenceLeave,
  onApproveOvertime,
  onRecordAuditViolation,
  onDisputeShiftAuditViolation,
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
  onSendJobChatMessage,
  guardMessages = [],
  onSendGuardMessage,
  onRefreshGuardMessages,
  onSubmitIncidentReport,
  onRequestCashPayout,
  onRequestStripePayout,
  jobChatRequestId = null,
  openJobChat = false,
  initialSelectedJobId = null,
  onJobChatRequestIdChange,
  onJobChatOpenChange,
  supportTicketId = null,
  onSupportTicketIdChange,
  supportMode = null,
  supportSection = 'support',
  onOpenSupportCompose,
  onOpenActivationSupport,
  onOpenSupportReport,
  onCloseSupportForm,
  performanceFactorId = null,
  onPerformanceFactorChange,
  variant = 'standalone',
  shiftTab = 'map',
  initialTab = 'map',
  tab: controlledTab,
  onTabChange,
  selectedJobId: controlledSelectedJobId,
  onSelectedJobIdChange,
  browseTab: controlledBrowseTab,
  onBrowseTabChange,
  onOpenLegal,
  onOpenDownload,
  tutorialAvailable,
  tutorialCompleted,
  tutorialActive,
  onStartTutorial,
  isDbConnected = false,
}: GuardDashboardProps) {
  const isEmbedded = variant === 'embedded';
  const isControlled = controlledTab !== undefined;
  const [standaloneTab, setStandaloneTab] = useState<GuardTab>(controlledTab ?? initialTab);
  const activeTab = isEmbedded ? shiftTab : (isControlled ? controlledTab : standaloneTab);
  const tab: GuardTab = activeTab === 'guardChat' ? 'messages' : activeTab;

  const setTab = useCallback(
    (next: GuardTab) => {
      const allowed = guardActivationAllowedTabs(guard);
      const resolved =
        !isGuardUserStatusActive(guard) && !allowed.includes(next) ? 'activation' : next;
      if (!isControlled) setStandaloneTab(resolved);
      onTabChange?.(resolved);
    },
    [guard, isControlled, onTabChange]
  );

  useEffect(() => {
    if (isControlled && controlledTab) setStandaloneTab(controlledTab);
  }, [controlledTab, isControlled]);

  useEffect(() => {
    if (isGuardUserStatusActive(guard)) return;
    const allowed = guardActivationAllowedTabs(guard);
    if (!allowed.includes(tab) && tab !== 'activation') {
      setTab('activation');
    }
  }, [guard, tab, setTab]);
  const [guardSelectedJobIdInternal, setGuardSelectedJobIdInternal] = useState<string | null>(null);
  const guardSelectedJobId =
    controlledSelectedJobId !== undefined ? controlledSelectedJobId : guardSelectedJobIdInternal;
  const setGuardSelectedJobId = useCallback(
    (jobId: string | null) => {
      if (controlledSelectedJobId === undefined) setGuardSelectedJobIdInternal(jobId);
      onSelectedJobIdChange?.(jobId);
    },
    [controlledSelectedJobId, onSelectedJobIdChange]
  );
  const [guardMessagesDetailOpen, setGuardMessagesDetailOpen] = useState(false);
  const [guardMessagesChrome, setGuardMessagesChrome] = useState<MessagesChrome>(EMPTY_MESSAGES_CHROME);

  useEffect(() => {
    if (tab !== 'messages' && tab !== 'support') {
      setGuardMessagesChrome(EMPTY_MESSAGES_CHROME);
    }
  }, [tab]);
  const [guardBrowseTabInternal, setGuardBrowseTabInternal] = useState<GuardJobsBrowseTab>('available');
  const guardBrowseTab = controlledBrowseTab ?? guardBrowseTabInternal;
  const setGuardBrowseTab = useCallback(
    (next: GuardJobsBrowseTab) => {
      if (controlledBrowseTab === undefined) setGuardBrowseTabInternal(next);
      onBrowseTabChange?.(next);
    },
    [controlledBrowseTab, onBrowseTabChange]
  );
  const [mapStatusFilter, setMapStatusFilter] = useState<GuardMapStatusFilter>('all');
  const mapZoomRef = useRef<MapZoomControls | null>(null);
  const [mapRoute, setMapRoute] = useState<MapRouteSummary | null>(null);
  const [mapRouteLoading, setMapRouteLoading] = useState(false);
  const [showSelfAudit, setShowSelfAudit] = useState(false);
  const [showEndCheckpoint, setShowEndCheckpoint] = useState(false);
  const [showBriefingGate, setShowBriefingGate] = useState(false);
  const [pendingCheckInAudit, setPendingCheckInAudit] = useState<SecurityRequest['checkInAudit'] | null>(null);
  const [pendingStartViolations, setPendingStartViolations] = useState<import('../types').ShiftAuditViolation[]>([]);
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
  const [manualBriefingJobId, setManualBriefingJobId] = useState<string | null>(null);

  const browseJobLists = useMemo(
    () => getGuardBrowseJobLists(guard, requests),
    [guard, requests]
  );

  const upcomingForMessages = useMemo(() => {
    const inProgress = requests.filter(
      (r) => r.assignedGuardId === guard.id && r.status === 'in-progress'
    );
    return [...inProgress, ...browseJobLists.scheduled];
  }, [requests, guard.id, browseJobLists.scheduled]);

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

  const nextShiftJob = useMemo(
    () => getGuardNextShift(assignedJobs, guard.id),
    [assignedJobs, guard.id]
  );

  const manualBriefingJob = useMemo(
    () =>
      manualBriefingJobId
        ? requests.find((r) => r.id === manualBriefingJobId && r.assignedGuardId === guard.id) ?? null
        : null,
    [manualBriefingJobId, requests, guard.id]
  );

  const openBriefingForJob = useCallback((jobId: string) => {
    setManualBriefingJobId(jobId);
  }, []);

  const closeManualBriefing = useCallback(() => {
    setManualBriefingJobId(null);
  }, []);

  const activePhase: ShiftPhase | null = useMemo(() => {
    if (!activeShiftJob) return null;
    if (activeShiftJob.status === 'in-progress') return 'on-duty';
    // Prefer persisted server milestones so refresh/device switch keeps phase.
    if (activeShiftJob.arrivedAt && !activeShiftJob.checkInAudit?.checkedAt) return 'arrived';
    if (activeShiftJob.enRouteAt && !activeShiftJob.checkInAudit?.checkedAt) {
      const stored = shiftPhases[activeShiftJob.id] ?? loadShiftPhase(guard.id, activeShiftJob.id);
      if (stored === 'arrived') return 'arrived';
      return 'en-route';
    }
    const stored = shiftPhases[activeShiftJob.id] ?? loadShiftPhase(guard.id, activeShiftJob.id);
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
    // Active shift overlay (en route / arrived / on duty / late clock-in after briefing window)
    const lateClockInPath =
      !!activeShiftJob &&
      activeShiftJob.status === 'accepted' &&
      activePhase === 'upcoming' &&
      !isPreShiftBriefingWindowOpen(activeShiftJob);
    const onDutyOverlay =
      activeTab === 'map' &&
      activeShiftJob &&
      (activeShiftJob.status === 'in-progress' || activeShiftJob.status === 'accepted') &&
      activePhase &&
      activePhase !== 'complete' &&
      (activePhase !== 'upcoming' || lateClockInPath);
    if (onDutyOverlay) {
      return requests.filter(
        (j) =>
          j.assignedGuardId === guard.id &&
          (j.status === 'in-progress' || j.status === 'accepted')
      );
    }
    const browse = filterGuardBrowseJobs(guard.id, browseJobLists.all, mapStatusFilter);
    if (
      nextShiftJob &&
      activePhase === 'upcoming' &&
      !browse.some((j) => j.id === nextShiftJob.id)
    ) {
      return [nextShiftJob, ...browse];
    }
    return browse;
  }, [
    requests,
    guard.id,
    activeTab,
    activeShiftJob,
    activePhase,
    mapStatusFilter,
    browseJobLists.all,
    nextShiftJob,
  ]);

  const mapBrowseItems = useMemo(() => {
    const browse = filterGuardBrowseJobs(guard.id, browseJobLists.all, mapStatusFilter);
    return guardMapBrowseItems(guard.id, browse).filter(
      (item) => item.id !== nextShiftJob?.id
    );
  }, [guard.id, browseJobLists.all, mapStatusFilter, nextShiftJob?.id]);

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
  }, [setGuardBrowseTab]);

  const handleBrowseTabChange = useCallback((tab: GuardJobsBrowseTab) => {
    setGuardBrowseTab(tab);
    setMapStatusFilter(mapFilterFromBrowseTab(tab));
  }, [setGuardBrowseTab]);

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
      if (kind === 'available' || kind === 'direct') handleBrowseTabChange('available');
      else if (kind === 'scheduled') handleBrowseTabChange('scheduled');
    },
    [browseJobLists.all, guard.id, handleBrowseTabChange, setGuardSelectedJobId]
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

  useEffect(() => {
    return registerSystemBackHandler(() => {
      if (guardMessagesDetailOpen) {
        setGuardMessagesDetailOpen(false);
        return true;
      }
      return false;
    });
  }, [guardMessagesDetailOpen]);

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
  }, [initialSelectedJobId, openJobChat, setGuardSelectedJobId]);

  useEffect(() => {
    if (tab === 'myJobs' && openJobChat && jobChatRequestId) {
      setTab('messages');
    }
  }, [tab, openJobChat, jobChatRequestId, setTab]);

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
    try {
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
    } catch (err) {
      showAppToast('Location required', {
        tone: 'error',
        body: err instanceof Error ? err.message : 'Enable GPS and try again.',
      });
    }
  };

  const handleStartEnRoute = (jobId?: string) => {
    const targetJob = jobId
      ? requests.find((r) => r.id === jobId && r.assignedGuardId === guard.id)
      : activeShiftJob;
    if (!targetJob || !onStartEnRoute) return;
    const blocked = enRouteBlockedMessage(targetJob);
    if (blocked) {
      showAppToast(blocked, { tone: 'error' });
      return;
    }
    if (!canGuardStartEnRoute(targetJob)) {
      showAppToast('Start heading unlocks 1 hour before your job.', { tone: 'error' });
      return;
    }
    if (jobRequiresPostOrdersAck(targetJob, guard.id)) {
      showAppToast('Acknowledge post orders in the briefing before heading to site.', { tone: 'error' });
      return;
    }
    updatePhase(targetJob.id, 'en-route');
    setManualBriefingJobId(null);
    if (tab !== 'map') setTab('map');
    void onStartEnRoute(targetJob.id);
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
    try {
      const proximity = await verifyOnSiteForJob(activeShiftJob);
      if (!proximity.onSite) {
        showAppToast('Must be on site to start the job', {
          tone: 'error',
          body: formatSiteProximityHint(proximity.distanceMeters),
        });
        return;
      }
      setShowSelfAudit(true);
    } catch (err) {
      showAppToast('Location required', {
        tone: 'error',
        body: err instanceof Error ? err.message : 'Enable GPS and try again.',
      });
    }
  };

  const finalizeClockIn = async (
    checkInAudit: NonNullable<SecurityRequest['checkInAudit']>,
    skipViolations: import('../types').ShiftAuditViolation[]
  ) => {
    if (!activeShiftJob) return;
    const mergedViolations = mergeShiftAuditViolations(activeShiftJob.shiftAuditViolations, skipViolations);
    const ok = await onUpdateJobAudit(activeShiftJob.id, {
      status: 'in-progress',
      checkInAudit,
      shiftAuditViolations: mergedViolations,
    });
    if (ok === false) return;
    updatePhase(activeShiftJob.id, 'on-duty');
    setShowSelfAudit(false);
    setShowBriefingGate(false);
    setPendingCheckInAudit(null);
    setPendingStartViolations([]);
  };

  const queueClockIn = (
    checkInAudit: NonNullable<SecurityRequest['checkInAudit']>,
    skipViolations: import('../types').ShiftAuditViolation[]
  ) => {
    if (!activeShiftJob) return;
    if (guardMustAckBriefingOnSite(activeShiftJob, guard.id)) {
      setPendingCheckInAudit(checkInAudit);
      setPendingStartViolations(skipViolations);
      setShowSelfAudit(false);
      setShowBriefingGate(true);
      return;
    }
    void finalizeClockIn(checkInAudit, skipViolations);
  };

  const handleBriefingGateAck = async () => {
    if (!activeShiftJob || !onAckBriefing) return;
    await onAckBriefing(activeShiftJob.id);
    if (pendingCheckInAudit) {
      await finalizeClockIn(pendingCheckInAudit, pendingStartViolations);
    }
  };

  const handleSelfAuditSubmit = async (payload: {
    uniform: { uniformPresent: boolean; blackShoes: boolean; dutyBelt: boolean; requiredEquipment: boolean };
    selfieUpload: string;
    uniformPhoto?: string;
    shoesPhoto?: string;
    locationPhoto?: string;
    locationPhotoSkipped: boolean;
  }) => {
    if (!activeShiftJob) return;
    const workBlocked = guardWorkBlockedMessage(guard, activeShiftJob.state);
    if (workBlocked) {
      showAppToast(workBlocked, { tone: 'error' });
      return;
    }
    if (!canGuardClockIn(activeShiftJob)) {
      showAppToast(guardClockInBlockedMessage(activeShiftJob) ?? 'Job start is not open yet.', { tone: 'error' });
      return;
    }
    const failed = !payload.uniform.uniformPresent || !payload.uniform.blackShoes;
    if (failed) onRecordAuditViolation(guard.id, 'Pre-job check-in audit incomplete');
    const skipViolations = createStartSkipViolations(guard.id, {
      selfAuditSkipped: false,
      locationPhotoSkipped: payload.locationPhotoSkipped,
    });
    const checkInAudit: NonNullable<SecurityRequest['checkInAudit']> = {
      checkedAt: new Date().toISOString(),
      gpsVerified: true,
      selfAuditSkipped: false,
      locationPhotoSkipped: payload.locationPhotoSkipped,
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
      locationPhoto: payload.locationPhoto,
      readyForDuty: !failed,
    };
    const queued = await captureGuardSelfAuditOffline(guard.id, activeShiftJob.id, checkInAudit);
    if (queued) {
      showAppToast('Self-audit saved offline — will sync when you reconnect.', { tone: 'info' });
    }
    queueClockIn(checkInAudit, skipViolations);
  };

  const handleSkipSelfAudit = () => {
    if (!activeShiftJob) return;
    const workBlocked = guardWorkBlockedMessage(guard, activeShiftJob.state);
    if (workBlocked) {
      showAppToast(workBlocked, { tone: 'error' });
      return;
    }
    if (!canGuardClockIn(activeShiftJob)) {
      showAppToast(guardClockInBlockedMessage(activeShiftJob) ?? 'Job start is not open yet.', { tone: 'error' });
      return;
    }
    void (async () => {
      try {
        const proximity = await verifyOnSiteForJob(activeShiftJob);
        if (!proximity.onSite) {
          showAppToast('Must be on site to start the job', {
            tone: 'error',
            body: formatSiteProximityHint(proximity.distanceMeters),
          });
          return;
        }
      } catch (err) {
        showAppToast('Location required', {
          tone: 'error',
          body: err instanceof Error ? err.message : 'Enable GPS and try again.',
        });
        return;
      }
      if (!(await showAppConfirm({
        title: 'Skip start package?',
        message:
          'Clock in without self-audit and location photos? This will be automatically flagged for the client.',
        confirmLabel: 'Skip and continue',
        tone: 'danger',
      }))) {
        return;
      }
      const skipViolations = createStartSkipViolations(guard.id, {
        selfAuditSkipped: true,
        locationPhotoSkipped: true,
      });
      const checkInAudit: NonNullable<SecurityRequest['checkInAudit']> = {
        checkedAt: new Date().toISOString(),
        gpsVerified: true,
        selfAuditSkipped: true,
        locationPhotoSkipped: true,
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
      };
      queueClockIn(checkInAudit, skipViolations);
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
    setShowEndCheckpoint(true);
  };

  const handleLateClockOutConfirm = (result: import('./guard/LateClockOutPrompt').LateClockOutResult) => {
    setPendingClockOutAt(result.checkedAt);
    setPendingLeftEarlier(result.leftEarlier);
    setPendingOvertimeClaimed(result.overtimeClaimed);
    setShowLateClockOutPrompt(false);
    setShowEndCheckpoint(true);
  };

  const handleEndCheckpointSkip = () => {
    void (async () => {
      if (!(await showAppConfirm({
        title: 'Skip end package?',
        message:
          'End shift without photos and report? Missing items will be automatically flagged for the client.',
        confirmLabel: 'Skip and end shift',
        tone: 'danger',
      }))) {
        return;
      }
      handleEndCheckpointSubmit({
        dailyActivityReport: activeShiftJob?.checkOutAudit?.dailyActivityReport ?? '',
        endSelfAuditSkipped: true,
        locationPhotoSkipped: true,
        endReportSkipped: true,
      });
    })();
  };

  const handleEndCheckpointSubmit = (payload: {
    endSelfie?: string;
    locationPhoto?: string;
    dailyActivityReport: string;
    endSelfAuditSkipped: boolean;
    locationPhotoSkipped: boolean;
    endReportSkipped: boolean;
  }) => {
    if (!activeShiftJob) return;
    if (!canGuardClockOut(activeShiftJob)) {
      showAppToast(guardClockOutBlockedMessage(activeShiftJob) ?? 'Complete job is not available right now.', { tone: 'error' });
      setShowEndCheckpoint(false);
      return;
    }
    const checkedAt = pendingClockOutAt ?? new Date().toISOString();
    const existing = activeShiftJob.checkOutAudit;
    const hasIncidents = (existing?.incidentReports?.length ?? 0) > 0 || existing?.incidentReport?.hasIncident;
    const endViolations = createEndSkipViolations(
      guard.id,
      {
        endSelfAuditSkipped: payload.endSelfAuditSkipped,
        locationPhotoSkipped: payload.locationPhotoSkipped,
        endReportSkipped: payload.endReportSkipped,
      },
      checkedAt
    );
    onUpdateJobAudit(activeShiftJob.id, {
      status: 'completed',
      checkOutAudit: {
        checkedAt,
        completed: true,
        noViolations: true,
        noEquipmentIssues: true,
        endSelfie: payload.endSelfie,
        locationPhoto: payload.locationPhoto,
        endSelfAuditSkipped: payload.endSelfAuditSkipped,
        locationPhotoSkipped: payload.locationPhotoSkipped,
        dailyActivityReport:
          payload.dailyActivityReport ||
          existing?.dailyActivityReport ||
          (hasIncidents ? 'Shift completed with incident report(s) on file.' : 'Job completed. No incidents to report.'),
        incidentReport: existing?.incidentReport ?? { hasIncident: false },
        incidentReports: existing?.incidentReports,
        clientNotes: existing?.clientNotes ?? '',
        leftEarlier: pendingLeftEarlier || undefined,
        overtimeClaimed: pendingOvertimeClaimed || undefined,
      },
      shiftAuditViolations: mergeShiftAuditViolations(activeShiftJob.shiftAuditViolations, endViolations),
    });
    updatePhase(activeShiftJob.id, 'complete');
    setShowEndCheckpoint(false);
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
  const accountNeedsActivation = !isGuardUserStatusActive(guard);
  const approvedAwaitingActivation = isGuardAccountApproved(guard) && accountNeedsActivation;
  const activationAllowedTabs = guardActivationAllowedTabs(guard);
  const showPendingGate =
    accountNeedsActivation && !activationAllowedTabs.includes(tab);
  const accountPreActive = isGuardAccountPreActive(guard);
  const revisionOpen = Boolean(guard.applicationRevisionRequestedAt);
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

  const showLateClockInPath =
    !!activeShiftJob &&
    activeShiftJob.status === 'accepted' &&
    activePhase === 'upcoming' &&
    !isPreShiftBriefingWindowOpen(activeShiftJob);

  const showShiftOverlay =
    activeTab === 'map' &&
    !!activeShiftJob &&
    (activeShiftJob.status === 'in-progress' || activeShiftJob.status === 'accepted') &&
    activePhase &&
    activePhase !== 'complete' &&
    (activePhase !== 'upcoming' || showLateClockInPath);

  const showNextShiftOnDock =
    !!nextShiftJob &&
    activePhase === 'upcoming' &&
    nextShiftJob.status === 'accepted' &&
    !showShiftOverlay;

  // Uber-style trip lock: stay on the job map (messages allowed for client chat).
  useEffect(() => {
    if (!showShiftOverlay) return;
    if (tab !== 'map' && tab !== 'messages') setTab('map');
  }, [showShiftOverlay, tab, setTab]);

  const workBlockedMessage = guardWorkBlockedMessage(guard);

  const showVehicleTab = guardVehicleTabVisible(guard);

  const GUARD_PRIMARY_NAV: { id: GuardTab; icon: typeof Map; label: string }[] = [
    { id: 'map', icon: Map, label: 'Map' },
    { id: 'myJobs', icon: Briefcase, label: 'Jobs' },
  ];

  const GUARD_MESSAGES_NAV: { id: GuardTab; icon: typeof Map; label: string }[] = [
    { id: 'messages', icon: MessagesSquare, label: 'Messages' },
    { id: 'support', icon: LifeBuoy, label: 'Support' },
  ];

  const GUARD_MANAGEMENT_NAV: { id: GuardTab; icon: typeof Map; label: string }[] = [
    { id: 'availability', icon: CalendarDays, label: 'Availability' },
    { id: 'preferences', icon: SlidersHorizontal, label: 'Preferences' },
    { id: 'performance', icon: BarChart3, label: 'Performance' },
    ...(showVehicleTab ? [{ id: 'vehicle' as const, icon: Car, label: 'Vehicle' }] : []),
    { id: 'earnings', icon: DollarSign, label: 'Pay' },
  ];

  const accountMenu = {
    userName: guard.name,
    userSubtitle: currentUser.email,
    avatarUrl: guard.avatar,
    onOpenProfile: () => setTab('profile'),
    onOpenSettings: () => setTab('settings'),
    onOpenDownload,
    onSignOut,
    themeMode: themeMode as 'dark' | 'light',
    onChangeTheme: (mode: 'dark' | 'light') => onChangeTheme(mode),
    hideProfile: accountNeedsActivation && !revisionOpen,
    active: activeTab === 'profile' || activeTab === 'settings' || activeTab === 'preferences' || activeTab === 'performance' || activeTab === 'availability',
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
    ...accountNotifications,
  };

  const messagesChromeActive =
    (tab === 'messages' || tab === 'support') && supportMode !== 'compose' && supportMode !== 'report';
  const messagesShellHeaderTrailing =
    messagesChromeActive ? (
      <div className="shrink-0 flex items-center gap-2">
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
          <p className="tutorial-demo-card-label">Tutorial sample job</p>
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
        <div data-tour="guard-map-filters">
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
        </div>
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

      {activeTab === 'map' && !showShiftOverlay && !guardSelectedJobId ? (
        <div data-tour="guard-map-browse">
        <MapBrowseDock
          items={mapBrowseItems}
          selectedId={guardSelectedJobId}
          onSelect={handleGuardSelectedJobChange}
          emptyMessage={GUARD_MAP_BROWSE_EMPTY_MESSAGE}
          leading={
            showNextShiftOnDock && nextShiftJob ? (
              <GuardNextShiftCard
                job={nextShiftJob}
                onOpen={() => openBriefingForJob(nextShiftJob.id)}
              />
            ) : null
          }
        />
        </div>
      ) : null}

      {activeTab === 'map' && showShiftOverlay && activeShiftJob && activePhase && (
        <GuardActiveShift
          job={activeShiftJob}
          phase={activePhase}
          onSite={
            userLocation ? isWithinSiteRadius(userLocation, activeShiftJob) : false
          }
          onArrived={handleArrived}
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
        <div className="absolute inset-x-4 bottom-28 z-[1002] space-y-2">
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
          bottomOffsetClass=""
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
                undefined
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
              onViewBriefing={openBriefingForJob}
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
              <div className="flex-1 min-h-0 overflow-hidden">
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
              <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
              <GuardMyJobsPanel
                availableJobs={browseJobLists.available}
                scheduledJobs={browseJobLists.scheduled}
                completedJobs={browseJobLists.completed}
                missedJobs={browseJobLists.missed}
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
                onUpdateCrewProfile={undefined}
                onAcceptInvite={onAcceptTeamInvite}
                onDeclineInvite={onDeclineTeamInvite}
                feeConfig={feeConfig}
                onSubmitPriceOffer={onSubmitPriceOffer}
                onAcceptPriceOffer={onAcceptPriceOffer}
                onViewBriefing={openBriefingForJob}
              />
              </div>
            </div>
          )}


          {tab === 'messages' && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden" data-tour="guard-messages">
              <GuardMessagesPanel
                scope="messages"
                upcomingJobs={upcomingForMessages}
                pastJobs={browseJobLists.past}
                guard={guard}
                currentUser={currentUser}
                jobChatThreads={jobChatThreads}
                jobChatMessages={jobChatMessages}
                guardMessages={guardMessages}
                supportTickets={supportTickets}
                onSendJobChatMessage={onSendJobChatMessage}
                onSendGuardMessage={onSendGuardMessage}
                onSendSupportMessage={onSendSupportMessage}
                onRefreshGuardMessages={onRefreshGuardMessages}
                initialJobChatRequestId={jobChatRequestId}
                initialJobChatOpen={openJobChat}
                onJobChatRequestIdChange={onJobChatRequestIdChange}
                onJobChatOpenChange={onJobChatOpenChange}
                onDetailOpenChange={setGuardMessagesDetailOpen}
                onMessagesChromeChange={setGuardMessagesChrome}
                shellHeaderTrailing={messagesShellHeaderTrailing}
              />
            </div>
          )}

          {tab === 'support' && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden" data-tour="guard-support">
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
                  scope="support"
                  upcomingJobs={upcomingForMessages}
                  pastJobs={browseJobLists.past}
                  guard={guard}
                  currentUser={currentUser}
                  jobChatThreads={jobChatThreads}
                  jobChatMessages={jobChatMessages}
                  guardMessages={guardMessages}
                  supportTickets={supportTickets}
                  onSendSupportMessage={onSendSupportMessage}
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
                onSaveVehicleInsurance={onSaveVehicleInsurance}
              />
            </div>
          )}

          {tab === 'settings' && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col min-h-0 overflow-hidden" data-tour="guard-settings">
              <UserSettingsScreen
                currentUser={currentUser}
                onOpenLegal={onOpenLegal}
                onOpenDownload={onOpenDownload}
                isDbConnected={isDbConnected}
              />
            </div>
          )}

          {tab === 'availability' && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 overflow-hidden">
                <GuardAvailabilityScreen guard={guard} />
              </div>
            </div>
          )}

          {tab === 'preferences' && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 overflow-hidden">
                <GuardPreferencesScreen
                  guard={guard}
                  onSaveJobPreferences={onSaveJobPreferences}
                  onCompleteJobTypeOnboarding={onCompleteJobTypeOnboarding}
                />
              </div>
            </div>
          )}

          {tab === 'performance' && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 overflow-hidden">
                <GuardPerformanceScreen
                  guard={guard}
                  requests={allRequests.length ? allRequests : (requests as SecurityRequest[])}
                  performanceFactorId={performanceFactorId}
                  onPerformanceFactorChange={onPerformanceFactorChange}
                  onDisputeShiftAuditViolation={onDisputeShiftAuditViolation}
                />
              </div>
            </div>
          )}

          {tab === 'vehicle' && onSaveVehicle && onSubmitVehicle && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden">
              <GuardVehiclePanel
                guard={guard}
                onSaveVehicle={onSaveVehicle}
                onSubmitVehicle={onSubmitVehicle}
              />
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

      {activeShiftJob && (
        <GuardBriefingAckGate
          open={showBriefingGate}
          job={activeShiftJob}
          onAcknowledge={handleBriefingGateAck}
        />
      )}

      <GuardEndShiftCheckpointModal
        open={showEndCheckpoint && !!activeShiftJob}
        onClose={() => setShowEndCheckpoint(false)}
        onTriggerCamera={captureSelfie}
        existingReport={activeShiftJob?.checkOutAudit?.dailyActivityReport}
        onSubmit={handleEndCheckpointSubmit}
        onSkip={handleEndCheckpointSkip}
      />

        <LateClockOutPrompt
          open={showLateClockOutPrompt && !!activeShiftJob}
          endDate={activeShiftJob?.endDate ?? ''}
          checkInAt={activeShiftJob?.checkInAudit?.checkedAt}
          onClose={() => setShowLateClockOutPrompt(false)}
          onConfirm={handleLateClockOutConfirm}
        />

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
            const queued = await captureGuardIncidentOffline(guard.id, activeShiftJob.id, input);
            if (queued) {
              showAppToast('Incident report saved offline — will sync when you reconnect.', { tone: 'info' });
              return;
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
          onSubmit={async (report) => {
            const queued = await captureGuardActivityOffline(guard.id, activeShiftJob.id, { notes: report });
            if (queued) {
              showAppToast('Activity log saved offline — will sync when you reconnect.', { tone: 'info' });
              return;
            }
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

      {manualBriefingJob && (
        <AppOverlaySheet
          open
          onClose={closeManualBriefing}
          ariaLabel="Pre-shift briefing"
          zIndex={2000}
        >
          <GuardPreShiftBriefing
            layout="modal"
            job={manualBriefingJob}
            guardId={guard.id}
            onClose={closeManualBriefing}
            onStartEnRoute={() => handleStartEnRoute(manualBriefingJob.id)}
            onAckPostOrders={
              onAckPostOrders ? () => onAckPostOrders(manualBriefingJob.id) : undefined
            }
            onAckBriefing={
              onAckBriefing ? () => onAckBriefing(manualBriefingJob.id) : undefined
            }
          />
        </AppOverlaySheet>
      )}
    </>
  );

  const shellFullBleed = !showPendingGate && tab === 'map';
  const shellVariant = shellFullBleed ? 'dark' : 'default';
  const visibleMainPanel = showPendingGate && tab !== 'support' ? (
    <AccountPendingScreen
      role="guard"
      guard={guard}
      onOpenProfile={() => setTab('settings')}
      onOpenApplicationProfile={revisionOpen ? () => setTab('profile') : undefined}
      onAddCertification={onAddCertification}
      onDeleteCertification={onDeleteCertification}
      onAttachCertificationImage={onAttachCertificationImage}
      onUpdateCertification={onUpdateCertification}
      onSubmitIdentityVerification={onSubmitIdentityVerification}
      onSaveInsurance={onSaveInsurance}
      onContactSupport={approvedAwaitingActivation ? onOpenActivationSupport : undefined}
      hasActivationSupportChat={Boolean(
        approvedAwaitingActivation &&
          currentUser &&
          findActivationSupportChat(supportTickets, currentUser)
      )}
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
    : tab === 'support' && supportMode === 'compose'
      ? 'Contact support'
      : tab === 'support' && supportMode === 'report'
        ? 'File a report'
        : GUARD_TAB_TITLES[tab];
  const guardHeaderStatus =
    activeShiftJob?.status === 'in-progress'
      ? `On job · ${activeShiftJob.siteName || activeShiftJob.location}`
      : activeShiftJob?.enRouteAt && activeShiftJob.status === 'accepted'
        ? `En route · ${activeShiftJob.siteName || activeShiftJob.location}`
      : credentialRestricted
        ? 'Restricted — upload and verify expired credentials'
        : accountNeedsActivation
        ? userStatus === 'approved'
          ? 'Awaiting account activation'
          : 'Activation in review'
        : isGuardTrusted(guard)
          ? 'Trusted Guardr professional'
          : 'Available for vetted jobs';

  const activationSupportHeader =
    approvedAwaitingActivation && tab === 'support' && !messagesChromeActive ? (
      <AppSubScreenHeader
        title="Activation support"
        onBack={() => setTab('activation')}
        backLabel="Credentials"
      />
    ) : null;
  const shellHeaderOverride = activationSupportHeader ?? (messagesChromeActive ? guardMessagesChrome.override : null);
  const shellHeaderExtension = messagesChromeActive ? guardMessagesChrome.extension : null;

  const shellHideHeader =
    (tab === 'myJobs' && !!guardSelectedJobId) &&
    !shellHeaderOverride;

  return (
    <RoleAppShell
      title={guardScreenTitle}
      hideHeader={shellHideHeader}
      headerExtension={shellHeaderExtension}
      headerOverride={shellHeaderOverride}
      accountMenu={accountMenu}
      navItems={accountNeedsActivation ? [] : GUARD_PRIMARY_NAV}
      messagesNavItems={accountNeedsActivation ? [] : GUARD_MESSAGES_NAV}
      overflowNavItems={accountNeedsActivation ? [] : GUARD_MANAGEMENT_NAV}
      activeNavId={GUARD_SIDE_NAV_TABS.has(tab) ? tab : ''}
      onNavigate={(id) => setTab(id as GuardTab)}
      fullBleed={shellFullBleed}
      hideBottomNav={showShiftOverlay}
      variant={shellVariant}
      workspaceLabel="Guard workspace"
      sidebarPrimaryAction={
        !accountNeedsActivation
          ? {
              label: '+ Find jobs',
              icon: <Plus size={16} strokeWidth={2.5} aria-hidden />,
              onClick: () => setTab('map'),
            }
          : undefined
      }
      sidebarFooter={
        <SidebarFooterLinks
          onOpenSettings={() => setTab('settings')}
          onOpenLegal={onOpenLegal}
        />
      }
    >
      <div className="relative h-full min-h-0">
        {visibleMainPanel}
        {guardModals}
      </div>
    </RoleAppShell>
  );
}
