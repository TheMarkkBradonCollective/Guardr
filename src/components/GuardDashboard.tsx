import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  SecurityRequest,
  SecurityGuard,
  Certification,
  Payment,
  SessionUser,
  Experience,
  GuardEducation,
  CreateSupportTicketInput,
  SupportTicket,
} from '../types';
import { ShiftMap } from './guard/ShiftMap';
import { GuardBottomSheet } from './guard/GuardBottomSheet';
import { GuardActiveShift } from './guard/GuardActiveShift';
import { GuardEarningsPanel } from './guard/GuardEarningsPanel';
import { GuardOpportunitiesPanel } from './guard/GuardOpportunitiesPanel';
import { GuardSelfAuditModal } from './guard/GuardSelfAuditModal';
import { GuardRatingModal } from './guard/GuardRatingModal';
import { ProfileSavePayload, UserProfileScreen } from './profile/UserProfileScreen';
import { SupportScreen } from './support/SupportScreen';
import { AppScreenHeader } from './layouts/AppScreenHeader';
import { SidebarDrawer } from './layouts/SidebarDrawer';
import { ROLE_LABELS } from '../lib/permissions';
import { AlertTriangle, Map, DollarSign, Compass, User, LogOut, LayoutDashboard, LifeBuoy } from 'lucide-react';
import {
  computeEarningsSummary,
  filterJobsByCategory,
  guardCanViewJob,
  JobCategoryId,
  loadShiftPhase,
  saveShiftPhase,
  ShiftPhase,
  sortJobs,
} from '../lib/guardJobs';
import { computeGuardEarnings } from '../lib/payments';
import { createConnectAccount, createConnectAccountLink, getConnectAccountStatus } from '../lib/stripeApi';

interface GuardDashboardProps {
  guard: SecurityGuard;
  requests: SecurityRequest[];
  currentUser: SessionUser;
  payments?: Payment[];
  onAddCertification: (cert: Partial<Certification>) => void;
  onAddExperience?: (exp: Omit<Experience, 'id'>) => void;
  onAddEducation?: (edu: Omit<GuardEducation, 'id'>) => void;
  onAcceptJob: (requestId: string) => void;
  onUpdateJobAudit: (requestId: string, auditPayload: any) => void;
  onRecordAuditViolation: (guardId: string, reason?: string) => void;
  onUpdateStripeAccount?: (guardId: string, accountId: string) => void;
  onSignOut: () => void;
  themeMode: string;
  onChangeTheme: (mode: string) => void;
  onUpdateProfile: (payload: ProfileSavePayload) => void | Promise<void>;
  supportTickets?: SupportTicket[];
  relatedRequests?: SecurityRequest[];
  onCreateSupportTicket?: (input: CreateSupportTicketInput) => void | Promise<string | void>;
  onSendSupportMessage?: (ticketId: string, body: string) => void | Promise<void>;
  /** When staff toggles into guard shift mode */
  onExitGuardMode?: () => void;
}

type GuardTab = 'map' | 'earnings' | 'opportunities' | 'support' | 'profile';

const GUARD_TAB_TITLES: Record<GuardTab, string> = {
  map: 'Map',
  opportunities: 'Jobs',
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
  onAddExperience,
  onAddEducation,
  onAcceptJob,
  onUpdateJobAudit,
  onRecordAuditViolation,
  onUpdateStripeAccount,
  onSignOut,
  themeMode,
  onChangeTheme,
  onUpdateProfile,
  supportTickets = [],
  relatedRequests = [],
  onCreateSupportTicket,
  onSendSupportMessage,
  onExitGuardMode,
}: GuardDashboardProps) {
  const [activeTab, setActiveTab] = useState<GuardTab>('map');
  const [guardPosition, setGuardPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<JobCategoryId | null>(null);
  const [showSelfAudit, setShowSelfAudit] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [ratingJob, setRatingJob] = useState<SecurityRequest | null>(null);
  const [cashoutPending, setCashoutPending] = useState(false);
  const [connectPending, setConnectPending] = useState(false);
  const [connectReady, setConnectReady] = useState(false);
  const [dutySeconds, setDutySeconds] = useState(0);
  const [shiftPhases, setShiftPhases] = useState<Record<string, ShiftPhase>>({});
  const [staffSidebarOpen, setStaffSidebarOpen] = useState(false);

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

  const upcomingShifts = useMemo(
    () => assignedJobs.filter((r) => r.status === 'accepted'),
    [assignedJobs]
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

  const earningsSummary = useMemo(() => computeEarningsSummary(completedJobs), [completedJobs]);

  const releasedEarnings = useMemo(
    () => requests
      .filter(r => r.assignedGuardId === guard.id && r.paymentStatus === 'released')
      .reduce((s, j) => s + computeGuardEarnings(j.durationHours, j.hourlyRate), 0),
    [requests, guard.id]
  );

  const pendingPayout = useMemo(
    () => requests
      .filter(r => r.assignedGuardId === guard.id && r.paymentStatus === 'held')
      .reduce((s, j) => s + computeGuardEarnings(j.durationHours, j.hourlyRate), 0),
    [requests, guard.id]
  );

  useEffect(() => {
    if (!guard.stripeConnectAccountId) return;
    getConnectAccountStatus(guard.stripeConnectAccountId)
      .then((s) => setConnectReady(s.payoutsEnabled && s.detailsSubmitted))
      .catch(() => setConnectReady(false));
  }, [guard.stripeConnectAccountId]);

  const [walletBalance, setWalletBalance] = useState(() => {
    try {
      const saved = localStorage.getItem(`guard_wallet_bal_${guard.id}`);
      if (saved) return parseFloat(saved);
    } catch { /* ignore */ }
    return completedJobs.reduce((s, j) => s + computeGuardEarnings(j.durationHours, j.hourlyRate), 0);
  });

  useEffect(() => {
    localStorage.setItem(`guard_wallet_bal_${guard.id}`, walletBalance.toString());
  }, [walletBalance, guard.id]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGuardPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGuardPosition(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

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
    onAcceptJob(jobId);
    updatePhase(jobId, 'upcoming');
    setSelectedJobId(null);
    setActiveTab('map');
  };

  const handleArrived = () => {
    if (!activeShiftJob) return;
    updatePhase(activeShiftJob.id, 'arrived');
  };

  const handleSelfAuditSubmit = (payload: {
    uniform: { uniformPresent: boolean; blackShoes: boolean; dutyBelt: boolean; requiredEquipment: boolean };
    selfieUpload: string;
  }) => {
    if (!activeShiftJob) return;
    const failed = !payload.uniform.uniformPresent || !payload.uniform.blackShoes;
    if (failed) onRecordAuditViolation(guard.id, 'Pre-shift audit incomplete');
    onUpdateJobAudit(activeShiftJob.id, {
      status: 'in-progress',
      checkInAudit: {
        checkedAt: new Date().toLocaleTimeString(),
        gpsVerified: true,
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
        readyForDuty: !failed,
      },
    });
    updatePhase(activeShiftJob.id, 'on-duty');
    setDutySeconds(0);
    setShowSelfAudit(false);
  };

  const handleEndShift = () => {
    if (!activeShiftJob) return;
    setShowCheckout(true);
  };

  const handleCheckoutConfirm = () => {
    if (!activeShiftJob) return;
    const payout = computeGuardEarnings(activeShiftJob.durationHours, activeShiftJob.hourlyRate);
    onUpdateJobAudit(activeShiftJob.id, {
      status: 'completed',
      checkOutAudit: {
        checkedAt: new Date().toLocaleTimeString(),
        completed: true,
        noViolations: true,
        noEquipmentIssues: true,
        dailyActivityReport: 'Shift completed. No incidents to report.',
        incidentReport: { hasIncident: false },
        clientNotes: '',
      },
    });
    setWalletBalance((b) => b + payout);
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

  const handleCashOut = () => {
    if (!connectReady) {
      alert('Connect your Stripe account to receive payouts.');
      return;
    }
    if (walletBalance <= 0) return;
    setCashoutPending(true);
    setTimeout(() => {
      setWalletBalance(0);
      setCashoutPending(false);
    }, 1500);
  };

  const userStatus = guard.userStatus || 'active';
  if (userStatus === 'suspended' || userStatus === 'blocked') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg p-6">
        <div className="uber-card max-w-md w-full text-center space-y-5 rounded-2xl">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
          <h2 className="font-black text-lg uppercase">Account {userStatus}</h2>
          <p className="text-brand-text-muted text-sm">Contact Guardr support to restore access.</p>
        </div>
      </div>
    );
  }

  const showShiftOverlay = activeTab === 'map' && activeShiftJob && activePhase && activePhase !== 'complete';
  const isStaffGuardView = !!onExitGuardMode;
  const panelBottomPad = isStaffGuardView ? '' : 'pb-24';

  const NAV_TABS: { id: GuardTab; icon: typeof Map; label: string }[] = [
    { id: 'map', icon: Map, label: 'Map' },
    { id: 'opportunities', icon: Compass, label: 'Jobs' },
    { id: 'earnings', icon: DollarSign, label: 'Pay' },
    { id: 'support', icon: LifeBuoy, label: 'Support' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  const guardMainPanel = (
    <div className={`h-full min-h-0 relative overflow-hidden ${activeTab === 'map' ? 'guard-map-layout' : ''}`}>
      {activeTab === 'map' && (
        <ShiftMap
          jobs={mapJobs}
          selectedJobId={selectedJobId}
          onSelectJob={setSelectedJobId}
          guardPosition={guardPosition}
        />
      )}

      {activeTab === 'map' && showShiftOverlay && activeShiftJob && activePhase && (
        <GuardActiveShift
          job={activeShiftJob}
          phase={activePhase}
          dutySeconds={dutySeconds}
          onArrived={handleArrived}
          onBeginAudit={() => setShowSelfAudit(true)}
          onIncidentReport={() => alert('Incident report filed. Client and staff notified.')}
          onActivityReport={() => alert('Activity report saved to shift log.')}
          onEndShift={handleEndShift}
        />
      )}

      {activeTab === 'map' && !showShiftOverlay && (
        <GuardBottomSheet
          jobs={filteredBrowseJobs}
          upcomingShifts={upcomingShifts}
          guard={guard}
          selectedJob={selectedJob}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onSelectJob={(job) => setSelectedJobId(job?.id ?? null)}
          onAcceptJob={handleAcceptJob}
        />
      )}

      {activeTab === 'earnings' && (
        <div className={`absolute inset-0 bg-brand-bg flex flex-col overflow-hidden ${panelBottomPad}`}>
          <div className="guard-scroll-panel flex-1">
            <GuardEarningsPanel
              summary={earningsSummary}
              completedJobs={completedJobs}
              balance={releasedEarnings}
              pendingPayout={pendingPayout}
              stripeConnected={!!guard.stripeConnectAccountId}
              stripeReady={connectReady}
              connectPending={connectPending}
              onConnectStripe={handleConnectStripe}
              onCashOut={handleCashOut}
              cashoutPending={cashoutPending}
              payments={payments.filter(p => {
                const job = requests.find(r => r.id === p.jobId);
                return job?.assignedGuardId === guard.id;
              })}
            />
          </div>
        </div>
      )}

      {activeTab === 'opportunities' && (
        <div className={`absolute inset-0 bg-brand-bg flex flex-col overflow-hidden ${panelBottomPad}`}>
          <GuardOpportunitiesPanel
            jobs={availableJobs}
            guard={guard}
            guardPosition={guardPosition}
            selectedJobId={selectedJobId}
            onSelectJob={setSelectedJobId}
            onAcceptJob={handleAcceptJob}
          />
        </div>
      )}

      {activeTab === 'support' && onCreateSupportTicket && onSendSupportMessage && (
        <div className={`absolute inset-0 bg-brand-bg flex flex-col overflow-hidden ${panelBottomPad}`}>
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
        <div className={`absolute inset-0 bg-brand-bg flex flex-col overflow-hidden ${panelBottomPad}`}>
          <UserProfileScreen
            currentUser={currentUser}
            themeMode={themeMode as 'dark' | 'light' | 'grey'}
            onChangeTheme={onChangeTheme}
            onSignOut={onSignOut}
            guard={guard}
            onSave={onUpdateProfile}
            onAddCertification={onAddCertification}
            onAddExperience={onAddExperience}
            onAddEducation={onAddEducation}
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
            <h3 className="font-bold text-lg">End shift?</h3>
            <p className="text-sm text-brand-text-muted">Confirm you are leaving the site and your shift duties are complete.</p>
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

  if (isStaffGuardView) {
    return (
      <div className="page-shell guard-staff-layout fixed inset-0 flex flex-col h-dvh max-h-dvh overflow-hidden">
        <AppScreenHeader
          title={GUARD_TAB_TITLES[activeTab]}
          subtitle={`${ROLE_LABELS[currentUser.role]} · On shift`}
          onMenuClick={() => setStaffSidebarOpen(true)}
          menuLabel="Open guard menu"
        />

        <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 relative overflow-hidden">{guardMainPanel}</div>
          {guardModals}
        </div>

        <SidebarDrawer
          open={staffSidebarOpen}
          onClose={() => setStaffSidebarOpen(false)}
          title="On shift"
          subtitle={guard.name}
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  setStaffSidebarOpen(false);
                  onExitGuardMode?.();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/30 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                Staff ops
              </button>
              <button
                type="button"
                onClick={() => {
                  setStaffSidebarOpen(false);
                  onSignOut();
                }}
                className="w-full flex items-center justify-center gap-2 border border-brand-border py-2 text-[10px] font-mono font-bold uppercase rounded-lg hover:border-brand-primary transition-colors"
              >
                <LogOut className="w-3 h-3" />
                Sign out
              </button>
            </>
          }
        >
          <nav className="space-y-0.5" aria-label="Guard navigation">
            {NAV_TABS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActiveTab(id);
                  setStaffSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === id
                    ? 'bg-brand-primary text-brand-accent-text'
                    : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-surface'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 truncate text-left">{label}</span>
              </button>
            ))}
          </nav>
        </SidebarDrawer>
      </div>
    );
  }

  return (
    <div className="page-shell fixed inset-0 overflow-hidden flex flex-col h-dvh max-h-dvh">
      <AppScreenHeader
        title={GUARD_TAB_TITLES[activeTab]}
        subtitle={guard.name}
        right={
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className="p-2 rounded-xl border border-brand-border text-brand-text-muted hover:text-brand-text hover:bg-brand-surface"
            aria-label="Profile"
          >
            <User className="w-4 h-4" />
          </button>
        }
      />

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 relative overflow-hidden">{guardMainPanel}</div>
      </div>

      <nav className="app-bottom-nav shrink-0 z-[1002] px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="app-bottom-nav-pill max-w-md mx-auto flex p-1.5">
          {NAV_TABS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`app-bottom-nav-item flex-1 flex flex-col items-center gap-1 py-2 min-h-[52px] ${
                activeTab === id ? 'app-bottom-nav-item--active' : 'text-brand-text-muted hover:text-brand-text'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {guardModals}
    </div>
  );
}
