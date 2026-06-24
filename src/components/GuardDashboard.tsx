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
} from '../types';
import { ShiftMap } from './guard/ShiftMap';
import { MapRouteBanner } from './map/MapRouteBanner';
import { MapRouteSummary } from '../lib/mapRouting';
import { GuardBottomSheet } from './guard/GuardBottomSheet';
import { GuardActiveShift } from './guard/GuardActiveShift';
import { GuardEarningsPanel } from './guard/GuardEarningsPanel';
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
import { SupportComposePage } from './support/SupportComposePage';
import { SupportReportPage } from './support/SupportReportPage';
import { RoleAppShell } from './layouts/RoleAppShell';
import { AppGuidePage } from './docs/AppGuidePage';
import { AppModal, AppPageTransition } from './ui/motion/AppMotion';
import { SlideToConfirm } from './ui/SlideToConfirm';
import { AlertTriangle, Map, DollarSign, Briefcase, MessagesSquare, BookOpen, Users } from 'lucide-react';
import {
  filterJobsByCategory,
  guardCanApplyToJob,
  guardCanViewJob,
  checkJobRequirements,
  JobCategoryId,
  loadShiftPhase,
  saveShiftPhase,
  ShiftPhase,
  sortJobs,
} from '../lib/guardJobs';
import { guardScheduleConflictError, type ScheduleJob } from '../lib/guardSchedule';
import { getCoordinatingCrewJobs, getOpenCrewLeadOpportunities } from '../lib/guardTeams';
import { isGuardTrusted } from '../lib/guardTrust';
import { computeGuardEarningsBreakdown } from '../lib/guardEarnings';
import { openGuardPayoutInvoices } from '../lib/guardPayoutInvoiceStorage';
import { GuardJobView, GuardPayoutView, toGuardJobView } from '../lib/guardJobView';
import { createConnectAccount, createConnectAccountLink, getConnectAccountStatus } from '../lib/stripeApi';
import { GUARD_STATUS_LABELS, guardWorkBlockedMessage } from '../lib/guardQualification';
import { getGuardUserStatus, isGuardAccountPreActive } from '../lib/accountStatus';
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

interface GuardDashboardProps {
  guard: SecurityGuard;
  requests: GuardJobView[];
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
  onAcceptJob: (requestId: string) => void;
  onDeclineDirectJob?: (requestId: string) => void | Promise<void>;
  onApplyAsTeamLead?: (requestId: string) => void | Promise<void>;
  onInviteTeamGuard?: (requestId: string, guardId: string) => void | Promise<void>;
  onRemoveTeamGuard?: (requestId: string, guardId: string) => void | Promise<void>;
  onUpdateCrewProfile?: (
    requestId: string,
    patch: { crewName: string; crewDescription: string }
  ) => void | Promise<void>;
  onJoinTeamWithCode?: (code: string) => void | Promise<void>;
  onAcceptTeamInvite?: (requestId: string) => void | Promise<void>;
  onDeclineTeamInvite?: (requestId: string) => void | Promise<void>;
  coworkerGuards?: SecurityGuard[];
  onUpdateJobAudit: (requestId: string, auditPayload: any) => void;
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
  openJobChat?: boolean;
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
}

export type GuardTab = 'map' | 'earnings' | 'myJobs' | 'messages' | 'guardChat' | 'support' | 'profile' | 'settings' | 'guide' | 'crew';
export type GuardSupportMode = 'compose' | 'report';

const GUARD_TAB_TITLES: Record<GuardTab, string> = {
  map: 'Map',
  myJobs: 'My jobs',
  earnings: 'Pay',
  messages: 'Messages',
  guardChat: 'Messages',
  support: 'Messages',
  profile: 'Profile',
  settings: 'Settings',
  guide: 'General guide',
  crew: 'Crew',
};

export function GuardDashboard({
  guard,
  requests,
  currentUser,
  payments = [],
  onAddCertification,
  onDeleteCertification,
  onAttachCertificationImage,
  onUpdateCertification,
  onAddExperience,
  onAddEducation,
  onSubmitIdentityVerification,
  onAcceptJob,
  onDeclineDirectJob,
  onApplyAsTeamLead,
  onInviteTeamGuard,
  onRemoveTeamGuard,
  onUpdateCrewProfile,
  onJoinTeamWithCode,
  onAcceptTeamInvite,
  onDeclineTeamInvite,
  coworkerGuards = [],
  onUpdateJobAudit,
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
  openJobChat = false,
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
}: GuardDashboardProps) {
  const isEmbedded = variant === 'embedded';
  const isControlled = controlledTab !== undefined;
  const [standaloneTab, setStandaloneTab] = useState<GuardTab>(controlledTab ?? initialTab);
  const activeTab = isEmbedded ? shiftTab : (isControlled ? controlledTab : standaloneTab);
  const tab: GuardTab =
    activeTab === 'guardChat' || activeTab === 'support' ? 'messages' : activeTab;

  const setTab = useCallback(
    (next: GuardTab) => {
      if (!isControlled) setStandaloneTab(next);
      onTabChange?.(next);
    },
    [isControlled, onTabChange]
  );

  useEffect(() => {
    if (isControlled && controlledTab) setStandaloneTab(controlledTab);
  }, [controlledTab, isControlled]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [mapRoute, setMapRoute] = useState<MapRouteSummary | null>(null);
  const [mapRouteLoading, setMapRouteLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<JobCategoryId | null>(null);
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
  const [connectReady, setConnectReady] = useState(false);
  const [shiftPhases, setShiftPhases] = useState<Record<string, ShiftPhase>>({});
  const availableJobs = useMemo(
    () => requests.filter((r) => guardCanViewJob(guard, r)),
    [requests, guard]
  );
  const assignedJobs = useMemo(
    () => requests.filter((r) => r.assignedGuardId === guard.id && r.status !== 'completed' && r.status !== 'closed'),
    [requests, guard.id]
  );
  const completedJobs = useMemo(
    () => requests.filter((r) => r.assignedGuardId === guard.id && r.status === 'completed'),
    [requests, guard.id]
  );

  const upcomingMyJobs = useMemo(
    () =>
      requests
        .filter(
          (r) =>
            r.assignedGuardId === guard.id &&
            (r.status === 'accepted' || r.status === 'in-progress')
        )
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
    [requests, guard.id]
  );

  const pastMyJobs = useMemo(
    () =>
      requests
        .filter(
          (r) =>
            r.assignedGuardId === guard.id &&
            (r.status === 'completed' || r.status === 'closed')
        )
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
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
    return shiftPhases[activeShiftJob.id] ?? loadShiftPhase(guard.id, activeShiftJob.id);
  }, [activeShiftJob, shiftPhases, guard.id]);

  const filteredBrowseJobs = useMemo(
    () =>
      sortJobs(
        filterJobsByCategory(
          availableJobs.filter(
            (j) =>
              j.assignedGuardId !== guard.id &&
              !(j.status === 'accepted' && j.assignedGuardId === guard.id)
          ),
          selectedCategory
        ),
        'distance'
      ),
    [availableJobs, selectedCategory, guard.id]
  );

  const scheduledMapJobs = useMemo(
    () =>
      assignedJobs.filter(
        (j) => j.status === 'accepted' && j.assignedGuardId === guard.id
      ),
    [assignedJobs, guard.id]
  );

  const selectedJob = useMemo(() => {
    const all = [...filteredBrowseJobs, ...assignedJobs];
    return all.find((j) => j.id === selectedJobId) ?? null;
  }, [filteredBrowseJobs, assignedJobs, selectedJobId]);

  const mapJobs = useMemo(
    () => [...filteredBrowseJobs, ...scheduledMapJobs],
    [filteredBrowseJobs, scheduledMapJobs]
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

  const coordinatingCrewJobs = useMemo(
    () => getCoordinatingCrewJobs(guard.id, requests),
    [requests, guard.id]
  );

  const crewLeadOpportunityJobs = useMemo(() => {
    if (!trustedGuard) return [];
    return getOpenCrewLeadOpportunities(requests).filter((job) => guardCanViewJob(guard, job));
  }, [requests, guard, trustedGuard]);

  useEffect(() => {
    if (tab === 'crew' && !trustedGuard) {
      setTab('map');
    }
  }, [tab, trustedGuard, setTab]);

  useEffect(() => {
    if (!guard.stripeConnectAccountId) return;
    getConnectAccountStatus(guard.stripeConnectAccountId)
      .then((s) => setConnectReady(s.payoutsEnabled && s.detailsSubmitted))
      .catch(() => setConnectReady(false));
  }, [guard.stripeConnectAccountId]);

  useEffect(() => {
    if (tab === 'myJobs' && openJobChat && jobChatRequestId) {
      setTab('messages');
    }
  }, [tab, openJobChat, jobChatRequestId, setTab]);

  const [teamChatRequestId, setTeamChatRequestId] = useState<string | null>(null);

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
    setSelectedJobId(null);
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
          'Clock in without a self audit? This job will be flagged No Self Audit until staff add photos after the job.',
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

  const handleConnectStripe = async () => {
    setConnectPending(true);
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
      window.location.href = url;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to start Stripe onboarding';
      if (message.includes('Connect platform setup') || message.includes('signed up for Connect')) {
        showAppToast('Stripe Connect not ready', {
          tone: 'error',
          body:
            'Stripe Connect is not fully activated on the Guardr platform account yet. In Stripe Dashboard open Connect → Get started and complete your platform profile, then try again.',
          durationMs: 9000,
        });
      } else {
        showAppToast(message, { tone: 'error' });
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
    } finally {
      setCashRequestPending(false);
    }
  };

  const handleRequestStripePayout = async () => {
    if (!onRequestStripePayout) return;
    setStripeRequestPending(true);
    try {
      await onRequestStripePayout();
    } finally {
      setStripeRequestPending(false);
    }
  };

  const userStatus = getGuardUserStatus(guard);
  const accountPreActive = isGuardAccountPreActive(guard);
  if (userStatus === 'suspended' || userStatus === 'blocked') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg p-6">
        <div className="uber-card max-w-md w-full text-center space-y-5 rounded-2xl">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
          <h2 className="font-black text-lg uppercase">Account {GUARD_STATUS_LABELS[userStatus]}</h2>
          <p className="text-brand-text-muted text-sm">Contact Guardr support to restore access.</p>
        </div>
      </div>
    );
  }

  const showShiftOverlay =
    activeTab === 'map' &&
    activeShiftJob?.status === 'in-progress' &&
    activePhase &&
    activePhase !== 'complete';
  const workBlockedMessage = guardWorkBlockedMessage(guard);

  const NAV_TABS: { id: GuardTab; icon: typeof Map; label: string }[] = [
    { id: 'myJobs', icon: Briefcase, label: 'My jobs' },
    { id: 'earnings', icon: DollarSign, label: 'Pay' },
    { id: 'map', icon: Map, label: 'Map' },
    { id: 'messages', icon: MessagesSquare, label: 'Messages' },
    ...(trustedGuard ? [{ id: 'crew' as const, icon: Users, label: 'Crew' }] : []),
  ];

  const guardMainPanel = (
    <div className={`h-full min-h-0 relative overflow-hidden flex flex-col ${activeTab === 'map' ? 'guard-map-layout' : ''}`}>
      {!accountPreActive && activeTab !== 'profile' && (
        <GuardCredentialGraceBanner guard={guard} onOpenCredentials={() => setTab('profile')} />
      )}
      <div className="relative flex-1 min-h-0">
      {activeTab === 'map' && workBlockedMessage && (
        <div className="absolute top-0 left-0 right-0 z-[1002] px-4 py-3 bg-amber-500/15 border-b border-amber-500/30 text-sm text-brand-text">
          {workBlockedMessage}
        </div>
      )}

      {activeTab === 'map' && selectedJobId && !showShiftOverlay && (
        <MapRouteBanner
          route={mapRoute}
          loading={mapRouteLoading}
          label="Route to offer"
        />
      )}

      {activeTab === 'map' && (
        <ShiftMap
          jobs={mapJobs}
          selectedJobId={selectedJobId}
          onSelectJob={setSelectedJobId}
          onRouteChange={setMapRoute}
          onRouteLoadingChange={setMapRouteLoading}
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
        />
      )}

      {activeTab === 'map' && !showShiftOverlay && (
        <GuardBottomSheet
          jobs={filteredBrowseJobs}
          guard={guard}
          coworkerGuards={coworkerGuards}
          selectedJob={selectedJob}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onSelectJob={(job) => {
            setSelectedJobId(job?.id ?? null);
            if (!job) {
              setMapRoute(null);
              setMapRouteLoading(false);
            }
          }}
          onAcceptJob={handleAcceptJob}
          onDeclineDirectJob={onDeclineDirectJob}
          onApplyAsTeamLead={onApplyAsTeamLead}
          onInviteTeamGuard={onInviteTeamGuard}
          onRemoveTeamGuard={onRemoveTeamGuard}
          onUpdateCrewProfile={onUpdateCrewProfile}
          onAcceptTeamInvite={onAcceptTeamInvite}
          onDeclineTeamInvite={onDeclineTeamInvite}
          scheduleRequests={requests}
          scheduledJobs={scheduledMapJobs}
        />
      )}

      {tab !== 'map' && (
        <AppPageTransition motionKey={tab} className="absolute inset-0">
          {tab === 'earnings' && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden">
              <div className="guard-scroll-panel flex-1">
                <GuardEarningsPanel
                  breakdown={earningsBreakdown}
                  completedJobs={completedJobs}
                  stripeConnected={!!guard.stripeConnectAccountId}
                  stripeReady={connectReady}
                  connectPending={connectPending}
                  onConnectStripe={handleConnectStripe}
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
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden">
              <GuardMyJobsPanel
                upcomingJobs={upcomingMyJobs}
                pastJobs={pastMyJobs}
                guard={guard}
                currentUser={currentUser}
                jobChatThreads={jobChatThreads}
                initialSelectedJobId={jobChatRequestId}
                onSelectedJobIdChange={onJobChatRequestIdChange}
                onOpenMessages={openMessagesForJob}
                onApproveOvertime={onApproveOvertime}
              />
            </div>
          )}

          {tab === 'crew' && trustedGuard && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden">
              <div className="guard-scroll-panel flex-1">
                <GuardCrewHubPanel
                  guard={guard}
                  coordinatingJobs={coordinatingCrewJobs}
                  leadOpportunityJobs={crewLeadOpportunityJobs}
                  coworkerGuards={coworkerGuards}
                  scheduleRequests={requests}
                  onApplyAsLead={onApplyAsTeamLead}
                  onInviteGuard={onInviteTeamGuard}
                  onRemoveGuard={onRemoveTeamGuard}
                  onUpdateCrewProfile={onUpdateCrewProfile}
                  onAcceptInvite={onAcceptTeamInvite}
                  onDeclineInvite={onDeclineTeamInvite}
                />
              </div>
            </div>
          )}

          {tab === 'messages' && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden">
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
                  upcomingJobs={upcomingMyJobs}
                  pastJobs={pastMyJobs}
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
                />
              )}
            </div>
          )}

          {tab === 'guide' && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden">
              <AppGuidePage audience="guard" />
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
              />
            </div>
          )}

          {tab === 'settings' && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden">
              <UserSettingsScreen
                currentUser={currentUser}
                themeMode={themeMode as 'dark' | 'light' | 'grey'}
                onChangeTheme={onChangeTheme}
                onOpenLegal={onOpenLegal}
                onJoinTeamWithCode={onJoinTeamWithCode}
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
          onSubmit={(input) => {
            void onSubmitIncidentReport?.(activeShiftJob.id, input);
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

  const showPendingGate = accountPreActive && tab !== 'profile' && tab !== 'settings' && tab !== 'messages' && tab !== 'guide';
  const shellFullBleed = !showPendingGate && tab === 'map';
  const shellVariant = shellFullBleed ? 'dark' : 'default';
  const visibleMainPanel = showPendingGate ? (
    <AccountPendingScreen role="guard" guard={guard} onOpenProfile={() => setTab('profile')} />
  ) : (
    guardMainPanel
  );

  if (isEmbedded) {
    return (
      <div className="h-full min-h-0 flex flex-col overflow-hidden guard-staff-embedded">
        {visibleMainPanel}
        {guardModals}
      </div>
    );
  }

  const guardScreenTitle =
    tab === 'messages' && supportMode === 'compose'
      ? 'Contact support'
      : tab === 'messages' && supportMode === 'report'
        ? 'File a report'
        : GUARD_TAB_TITLES[tab];

  const shellHideHeader =
    tab === 'messages' ||
    (tab === 'myJobs' && !!jobChatRequestId);

  return (
    <RoleAppShell
      title={guardScreenTitle}
      locationLabel={guard.name}
      hideHeader={shellHideHeader}
      accountMenu={{
        userName: guard.name,
        userSubtitle: currentUser.email,
        avatarUrl: guard.avatar,
        onOpenProfile: () => setTab('profile'),
        onOpenSettings: () => setTab('settings'),
        onSignOut,
        active: activeTab === 'profile' || activeTab === 'settings',
        extraLinks: [
          {
            label: 'General guide',
            icon: BookOpen,
            onClick: () => setTab('guide'),
            active: tab === 'guide',
          },
        ],
      }}
      navItems={NAV_TABS}
      activeNavId={tab}
      onNavigate={(id) => setTab(id as GuardTab)}
      fullBleed={shellFullBleed}
      variant={shellVariant}
      experience="guard"
    >
      <div className="relative h-full min-h-0">
        {visibleMainPanel}
        {guardModals}
      </div>
    </RoleAppShell>
  );
}
