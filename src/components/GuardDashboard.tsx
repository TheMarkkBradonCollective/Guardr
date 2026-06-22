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
import { ProfileSavePayload, UserProfileScreen } from './profile/UserProfileScreen';
import { SupportScreen } from './support/SupportScreen';
import { JobChatPanel } from './messaging/JobChatPanel';
import { threadForRequest } from '../lib/jobChat';
import { RoleAppShell } from './layouts/RoleAppShell';
import { ThemeToggle } from './ui/ThemeToggle';
import { AlertTriangle, Map, DollarSign, Briefcase, User, LifeBuoy } from 'lucide-react';
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
import { isGuardAccountPending } from '../lib/accountStatus';
import { AccountPendingScreen } from './account/AccountPendingScreen';
import type { AddCertificationResult } from '../lib/certUniqueness';
import type { CertImageMutationResult } from '../lib/certImagePolicy';
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
  /** Render inside staff dashboard — no outer shell */
  variant?: 'standalone' | 'embedded';
  shiftTab?: GuardTab;
  initialTab?: GuardTab;
  /** Controlled tab — when set, parent owns navigation state (URL sync). */
  tab?: GuardTab;
  onTabChange?: (tab: GuardTab) => void;
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
  variant = 'standalone',
  shiftTab = 'map',
  initialTab = 'map',
  tab: controlledTab,
  onTabChange,
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
    return new Promise((resolve) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        resolve(null);
        return;
      }
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'user' }, audio: false })
        .then((stream) => {
          const video = document.createElement('video');
          video.srcObject = stream;
          video.playsInline = true;
          video.onloadeddata = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d')?.drawImage(video, 0, 0);
            stream.getTracks().forEach((track) => track.stop());
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          };
          void video.play();
        })
        .catch(() => resolve(null));
    });
  }, []);

  const handleAcceptJob = (jobId: string) => {
    const workBlocked = guardWorkBlockedMessage(guard);
    if (workBlocked) {
      alert(workBlocked);
      return;
    }
    const job = requests.find((r) => r.id === jobId);
    const jobView = job ? toGuardJobView(job) : null;
    if (!jobView || !guardCanApplyToJob(guard, jobView)) {
      const missing = jobView
        ? checkJobRequirements(guard, jobView).checks.filter((c) => !c.met).map((c) => c.label).join(', ')
        : 'job requirements';
      alert(`You must qualify before applying: ${missing}. Upload the required credentials in your profile.`);
      return;
    }
    onAcceptJob(jobId);
    setSelectedJobId(null);
  };

  const handleArrived = () => {
    if (!activeShiftJob) return;
    const workBlocked = guardWorkBlockedMessage(guard, activeShiftJob.state);
    if (workBlocked) {
      alert(workBlocked);
      return;
    }
    const blocked = guardClockInBlockedMessage(activeShiftJob);
    if (blocked) {
      alert(blocked);
      return;
    }
    updatePhase(activeShiftJob.id, 'arrived');
  };

  const handleBeginAudit = () => {
    if (!activeShiftJob) return;
    const workBlocked = guardWorkBlockedMessage(guard, activeShiftJob.state);
    if (workBlocked) {
      alert(workBlocked);
      return;
    }
    const blocked = guardClockInBlockedMessage(activeShiftJob);
    if (blocked) {
      alert(blocked);
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
      alert(workBlocked);
      return;
    }
    if (!canGuardClockIn(activeShiftJob)) {
      alert(guardClockInBlockedMessage(activeShiftJob) ?? 'Clock-in is not open yet.');
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
      alert(workBlocked);
      return;
    }
    if (!canGuardClockIn(activeShiftJob)) {
      alert(guardClockInBlockedMessage(activeShiftJob) ?? 'Clock-in is not open yet.');
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
      alert(blocked);
      return;
    }
    setShowCheckout(true);
  };

  const handleCheckoutConfirm = () => {
    if (!activeShiftJob) return;
    if (!canGuardClockOut(activeShiftJob)) {
      alert(guardClockOutBlockedMessage(activeShiftJob) ?? 'Clock-out is not available right now.');
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
        alert(
          'Stripe Connect is not fully activated on the Guardr platform account yet.\n\n' +
            'Setting up webhooks is not the same as enabling Connect.\n\n' +
            'In Stripe Dashboard open Connect → Get started and complete your platform profile, then try again.'
        );
      } else {
        alert(message);
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

  const userStatus = guard.userStatus || 'active';
  const accountPending = isGuardAccountPending(guard);
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
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  const guardMainPanel = (
    <div className={`h-full min-h-0 relative overflow-hidden ${activeTab === 'map' ? 'guard-map-layout' : ''}`}>
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
            alert('Incident reported. Client and staff have been notified.');
          }}
          onActivityReport={() => alert('Activity report saved to job log.')}
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
          />
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden">
          <UserProfileScreen
            currentUser={currentUser}
            themeMode={themeMode as 'dark' | 'light' | 'grey'}
            onChangeTheme={onChangeTheme}
            onSignOut={onSignOut}
            guard={guard}
            onSave={onUpdateProfile}
            onAddCertification={onAddCertification}
            onDeleteCertification={onDeleteCertification}
            onAttachCertificationImage={onAttachCertificationImage}
            onAddExperience={onAddExperience}
            onAddEducation={onAddEducation}
            onSubmitIdentityVerification={onSubmitIdentityVerification}
          />
        </div>
      )}
    </div>
  );

  const guardModals = (
    <>
      {showSelfAudit && (
        <GuardSelfAuditModal
          onClose={() => setShowSelfAudit(false)}
          onTriggerCamera={captureSelfie}
          onSubmit={handleSelfAuditSubmit}
        />
      )}

      {showCheckout && activeShiftJob && (
        <div className="absolute inset-0 z-[1003] modal-overlay flex items-center justify-center p-4">
          <div className="w-full max-w-sm modal-panel p-6 space-y-4">
            <h3 className="font-bold text-lg">Complete job?</h3>
            <p className="text-sm text-brand-text-muted">Confirm you are leaving the site and your job duties are complete.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowCheckout(false)} className="flex-1 uber-button-outline h-11 text-sm">Cancel</button>
              <button type="button" onClick={handleCheckoutConfirm} className="flex-1 uber-button-sage h-11 text-sm">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {ratingJob && (
        <GuardRatingModal
          clientName={ratingJob.clientName}
          onSkip={() => setRatingJob(null)}
          onSubmit={() => setRatingJob(null)}
        />
      )}
    </>
  );

  const showPendingGate = accountPending && activeTab !== 'profile' && activeTab !== 'support';
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

  const themeToggle = (
    <ThemeToggle
      value={themeMode as 'dark' | 'light' | 'grey'}
      onChange={(m) => onChangeTheme(m)}
      size="sm"
    />
  );

  return (
    <RoleAppShell
      title={GUARD_TAB_TITLES[activeTab]}
      locationLabel={guard.name}
      avatarUrl={guard.avatar}
      avatarName={guard.name}
      onAvatarClick={() => setTab('profile')}
      onSignOut={onSignOut}
      navItems={NAV_TABS}
      activeNavId={activeTab}
      onNavigate={(id) => setTab(id as GuardTab)}
      headerRight={themeToggle}
      fullBleed={activeTab === 'map'}
      variant={activeTab === 'map' ? 'dark' : 'default'}
    >
      <div className="relative h-full min-h-0">
        {visibleMainPanel}
        {guardModals}
      </div>
    </RoleAppShell>
  );
}
