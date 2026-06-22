import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
} from '../types';
import { ShiftMap } from './guard/ShiftMap';
import { MapRouteBanner } from './map/MapRouteBanner';
import { MapRouteSummary } from '../lib/mapRouting';
import { GuardBottomSheet } from './guard/GuardBottomSheet';
import { GuardActiveShift } from './guard/GuardActiveShift';
import { GuardEarningsPanel } from './guard/GuardEarningsPanel';
import { GuardMyJobsPanel } from './guard/GuardMyJobsPanel';
import { GuardSelfAuditModal } from './guard/GuardSelfAuditModal';
import { GuardRatingModal } from './guard/GuardRatingModal';
import { GuardActivityLogModal } from './guard/GuardActivityLogModal';
import { showAppToast } from './ui/AppToast';
import { ProfileSavePayload, UserProfileScreen } from './profile/UserProfileScreen';
import { SupportScreen } from './support/SupportScreen';
import { JobChatPanel } from './messaging/JobChatPanel';
import { threadForRequest } from '../lib/jobChat';
import { RoleAppShell } from './layouts/RoleAppShell';
import { AppModal, AppPageTransition } from './ui/motion/AppMotion';
import { AlertTriangle, Map, DollarSign, Briefcase, LifeBuoy } from 'lucide-react';
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
import { computeGuardEarningsBreakdown } from '../lib/guardEarnings';
import { openGuardPayoutInvoices } from '../lib/guardPayoutInvoiceStorage';
import { GuardJobView, GuardPayoutView, toGuardJobView } from '../lib/guardJobView';
import { createConnectAccount, createConnectAccountLink, getConnectAccountStatus } from '../lib/stripeApi';
import { GUARD_STATUS_LABELS, guardWorkBlockedMessage } from '../lib/guardQualification';
import { getGuardUserStatus, isGuardAccountPreActive } from '../lib/accountStatus';
import { AccountPendingScreen } from './account/AccountPendingScreen';
import { GuardCredentialGraceBanner } from './guard/GuardCredentialGraceBanner';
import type { AddCertificationResult } from '../lib/certUniqueness';
import type { CertImageMutationResult } from '../lib/certImagePolicy';
import type { CertUpdatePayload, CertUpdateResult } from './credentials/CertDetailModal';
import { captureIdentitySelfie } from '../lib/idVerificationPhoto';
import {
  canGuardClockIn,
  canGuardClockOut,
  guardClockInBlockedMessage,
  guardClockOutBlockedMessage,
} from '../lib/shiftWindow';

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
  onUpdateJobAudit: (requestId: string, auditPayload: any) => void;
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
  onSendJobChatMessage?: (requestId: string, body: string) => void | Promise<void>;
  onReportIncident?: (requestId: string) => void | Promise<void>;
  onRequestCashPayout?: () => Promise<void>;
  onRequestStripePayout?: () => Promise<void>;
  jobChatRequestId?: string | null;
  openJobChat?: boolean;
  onJobChatRequestIdChange?: (requestId: string | null) => void;
  onJobChatOpenChange?: (open: boolean) => void;
  supportTicketId?: string | null;
  onSupportTicketIdChange?: (ticketId: string | null) => void;
  /** Render inside staff dashboard — no outer shell */
  variant?: 'standalone' | 'embedded';
  shiftTab?: GuardTab;
  initialTab?: GuardTab;
  /** Controlled tab — when set, parent owns navigation state (URL sync). */
  tab?: GuardTab;
  onTabChange?: (tab: GuardTab) => void;
  onOpenLegal?: (page: import('../lib/legalContent').LegalPageId) => void;
}

export type GuardTab = 'map' | 'earnings' | 'myJobs' | 'support' | 'profile';

const GUARD_TAB_TITLES: Record<GuardTab, string> = {
  map: 'Map',
  myJobs: 'My jobs',
  earnings: 'Pay',
  support: 'Support',
  profile: 'Profile',
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
  onUpdateJobAudit,
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
  onSendJobChatMessage,
  onReportIncident,
  onRequestCashPayout,
  onRequestStripePayout,
  jobChatRequestId = null,
  openJobChat = false,
  onJobChatRequestIdChange,
  onJobChatOpenChange,
  supportTicketId = null,
  onSupportTicketIdChange,
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
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showJobChat, setShowJobChat] = useState(false);
  const [ratingJob, setRatingJob] = useState<GuardJobView | null>(null);
  const [cashRequestPending, setCashRequestPending] = useState(false);
  const [stripeRequestPending, setStripeRequestPending] = useState(false);
  const [connectPending, setConnectPending] = useState(false);
  const [connectReady, setConnectReady] = useState(false);
  const [dutySeconds, setDutySeconds] = useState(0);
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
    () => sortJobs(filterJobsByCategory(availableJobs, selectedCategory), 'distance'),
    [availableJobs, selectedCategory]
  );

  const selectedJob = useMemo(() => {
    const all = [...filteredBrowseJobs, ...assignedJobs];
    return all.find((j) => j.id === selectedJobId) ?? null;
  }, [filteredBrowseJobs, assignedJobs, selectedJobId]);

  const mapJobs = useMemo(
    () => [...availableJobs, ...assignedJobs.filter((j) => j.status === 'accepted')],
    [availableJobs, assignedJobs]
  );

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
    if (!guard.stripeConnectAccountId) return;
    getConnectAccountStatus(guard.stripeConnectAccountId)
      .then((s) => setConnectReady(s.payoutsEnabled && s.detailsSubmitted))
      .catch(() => setConnectReady(false));
  }, [guard.stripeConnectAccountId]);

  useEffect(() => {
    if (activePhase !== 'on-duty') return;
    const t = setInterval(() => setDutySeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [activePhase]);

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
    if (!jobView || !guardCanApplyToJob(guard, jobView)) {
      const missing = jobView
        ? checkJobRequirements(guard, jobView).checks.filter((c) => !c.met).map((c) => c.label).join(', ')
        : 'job requirements';
      showAppToast(`You must qualify before applying: ${missing}. Upload the required credentials in your profile.`, { tone: 'error' });
      return;
    }
    onAcceptJob(jobId);
    setSelectedJobId(null);
  };

  const handleArrived = () => {
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
    updatePhase(activeShiftJob.id, 'arrived');
  };

  const handleBeginAudit = () => {
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
    setDutySeconds(0);
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
    if (!window.confirm('Skip self audit and clock in? This job will be flagged No Self Audit until staff add photos after the job.')) {
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
    setDutySeconds(0);
  };

  const handleEndShift = () => {
    if (!activeShiftJob) return;
    const blocked = guardClockOutBlockedMessage(activeShiftJob);
    if (blocked) {
      showAppToast(blocked, { tone: 'error' });
      return;
    }
    setShowCheckout(true);
  };

  const handleCheckoutConfirm = () => {
    if (!activeShiftJob) return;
    if (!canGuardClockOut(activeShiftJob)) {
      showAppToast(guardClockOutBlockedMessage(activeShiftJob) ?? 'Clock-out is not available right now.', { tone: 'error' });
      setShowCheckout(false);
      return;
    }
    onUpdateJobAudit(activeShiftJob.id, {
      status: 'completed',
      checkOutAudit: {
        checkedAt: new Date().toISOString(),
        completed: true,
        noViolations: true,
        noEquipmentIssues: true,
        dailyActivityReport: 'Job completed. No incidents to report.',
        incidentReport: { hasIncident: false },
        clientNotes: '',
      },
    });
    updatePhase(activeShiftJob.id, 'complete');
    setShowCheckout(false);
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

  const showShiftOverlay = activeTab === 'map' && activeShiftJob && activePhase && activePhase !== 'complete';
  const workBlockedMessage = guardWorkBlockedMessage(guard);

  const NAV_TABS: { id: GuardTab; icon: typeof Map; label: string }[] = [
    { id: 'map', icon: Map, label: 'Map' },
    { id: 'myJobs', icon: Briefcase, label: 'My jobs' },
    { id: 'earnings', icon: DollarSign, label: 'Pay' },
    { id: 'support', icon: LifeBuoy, label: 'Support' },
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

      {activeTab === 'map' && showShiftOverlay && activeShiftJob && activePhase && !showJobChat && (
        <GuardActiveShift
          job={activeShiftJob}
          phase={activePhase}
          dutySeconds={dutySeconds}
          onArrived={handleArrived}
          onBeginAudit={handleBeginAudit}
          onSkipAudit={handleSkipSelfAudit}
          onIncidentReport={() => {
            void onReportIncident?.(activeShiftJob.id);
            showAppToast('Incident reported', {
              body: 'Client and staff have been notified.',
              tone: 'info',
            });
          }}
          onActivityReport={() => setShowActivityLog(true)}
          onEndShift={handleEndShift}
          onOpenJobChat={onSendJobChatMessage ? () => setShowJobChat(true) : undefined}
        />
      )}

      {activeTab === 'map' && showShiftOverlay && activeShiftJob && showJobChat && onSendJobChatMessage && (
        <div className="absolute inset-x-0 bottom-0 z-[1002] h-[70vh] rounded-t-2xl border border-brand-border bg-brand-bg shadow-xl overflow-hidden">
          <JobChatPanel
            request={activeShiftJob}
            thread={threadForRequest(jobChatThreads, activeShiftJob.id) ?? null}
            messages={jobChatMessages}
            currentUser={currentUser}
            onSend={(body) => onSendJobChatMessage(activeShiftJob.id, body)}
            onBack={() => setShowJobChat(false)}
            compact
          />
        </div>
      )}

      {activeTab === 'map' && !showShiftOverlay && (
        <GuardBottomSheet
          jobs={filteredBrowseJobs}
          guard={guard}
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
        />
      )}

      {activeTab !== 'map' && (
        <AppPageTransition motionKey={activeTab} className="absolute inset-0">
          {activeTab === 'earnings' && (
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

          {activeTab === 'myJobs' && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden">
              <GuardMyJobsPanel
                upcomingJobs={upcomingMyJobs}
                pastJobs={pastMyJobs}
                guard={guard}
                currentUser={currentUser}
                jobChatThreads={jobChatThreads}
                jobChatMessages={jobChatMessages}
                onSendJobChatMessage={onSendJobChatMessage}
                initialSelectedJobId={jobChatRequestId}
                initialChatOpen={openJobChat}
                onSelectedJobIdChange={onJobChatRequestIdChange}
                onChatOpenChange={onJobChatOpenChange}
              />
            </div>
          )}

          {activeTab === 'support' && onCreateSupportTicket && onSendSupportMessage && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden">
              <SupportScreen
                currentUser={currentUser}
                tickets={supportTickets}
                relatedRequests={relatedRequests}
                onCreateTicket={onCreateSupportTicket}
                onSendMessage={onSendSupportMessage}
                initialTicketId={supportTicketId}
                onActiveTicketIdChange={onSupportTicketIdChange}
              />
            </div>
          )}

          {activeTab === 'profile' && (
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
                onOpenLegal={onOpenLegal}
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

        <AppModal
          open={showCheckout && !!activeShiftJob}
          align="center"
          position="absolute"
          zIndex={1003}
          onClose={() => setShowCheckout(false)}
          panelClassName="p-6 space-y-4"
        >
          <h3 className="font-bold text-lg">Complete job?</h3>
          <p className="text-sm text-brand-text-muted">Confirm you are leaving the site and your job duties are complete.</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowCheckout(false)} className="flex-1 uber-button-outline h-11 text-sm">
              Cancel
            </button>
            <button type="button" onClick={handleCheckoutConfirm} className="flex-1 uber-button-sage h-11 text-sm">
              Confirm
            </button>
          </div>
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
              clientNotes: `Guard rated client ${rating}/5: ${note}`,
            },
          });
          setRatingJob(null);
        }}
      />

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
                clientNotes: activeShiftJob.checkOutAudit?.clientNotes ?? '',
              },
            });
            showAppToast('Activity logged', { tone: 'success' });
          }}
        />
      )}
    </>
  );

  const showPendingGate = accountPreActive && activeTab !== 'profile' && activeTab !== 'support';
  const shellFullBleed = !showPendingGate && activeTab === 'map';
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

  return (
    <RoleAppShell
      title={GUARD_TAB_TITLES[activeTab]}
      locationLabel={guard.name}
      accountMenu={{
        userName: guard.name,
        userSubtitle: currentUser.email,
        avatarUrl: guard.avatar,
        themeMode: themeMode as 'dark' | 'light' | 'grey',
        onChangeTheme,
        onOpenProfile: () => setTab('profile'),
        onSignOut,
        active: activeTab === 'profile',
      }}
      navItems={NAV_TABS}
      activeNavId={activeTab === 'profile' ? '' : activeTab}
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
