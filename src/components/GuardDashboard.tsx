import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SecurityRequest, SecurityGuard, Certification } from '../types';
import { ShiftMap } from './guard/ShiftMap';
import { GuardBottomSheet } from './guard/GuardBottomSheet';
import { GuardActiveShift } from './guard/GuardActiveShift';
import { GuardEarningsPanel } from './guard/GuardEarningsPanel';
import { GuardOpportunitiesPanel } from './guard/GuardOpportunitiesPanel';
import { GuardSelfAuditModal } from './guard/GuardSelfAuditModal';
import { GuardRatingModal } from './guard/GuardRatingModal';
import { Logo } from './Logo';
import { AlertTriangle, LogOut, Map, DollarSign, Compass } from 'lucide-react';
import {
  computeEarningsSummary,
  filterJobsByCategory,
  JobCategoryId,
  loadShiftPhase,
  saveShiftPhase,
  ShiftPhase,
  sortJobs,
} from '../lib/guardJobs';
import { computeGuardEarnings } from '../lib/payments';

interface GuardDashboardProps {
  guard: SecurityGuard;
  requests: SecurityRequest[];
  onAddCertification: (cert: Partial<Certification>) => void;
  onAcceptJob: (requestId: string) => void;
  onUpdateJobAudit: (requestId: string, auditPayload: any) => void;
  onRecordAuditViolation: (guardId: string, reason?: string) => void;
  onSignOut?: () => void;
  themeMode?: string;
  onChangeTheme?: (mode: string) => void;
}

type GuardTab = 'map' | 'earnings' | 'opportunities';

export function GuardDashboard({
  guard,
  requests,
  onAcceptJob,
  onUpdateJobAudit,
  onRecordAuditViolation,
  onSignOut,
}: GuardDashboardProps) {
  const [activeTab, setActiveTab] = useState<GuardTab>('map');
  const [isOnline, setIsOnline] = useState(true);
  const [guardPosition, setGuardPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<JobCategoryId | null>(null);
  const [showSelfAudit, setShowSelfAudit] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [ratingJob, setRatingJob] = useState<SecurityRequest | null>(null);
  const [cashoutPending, setCashoutPending] = useState(false);
  const [dutySeconds, setDutySeconds] = useState(0);
  const [shiftPhases, setShiftPhases] = useState<Record<string, ShiftPhase>>({});

  const availableJobs = useMemo(() => requests.filter((r) => r.status === 'open'), [requests]);
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

  const mapJobs = useMemo(() => {
    if (!isOnline) return assignedJobs;
    return [...availableJobs, ...assignedJobs.filter((j) => j.status === 'accepted')];
  }, [isOnline, availableJobs, assignedJobs]);

  const earningsSummary = useMemo(() => computeEarningsSummary(completedJobs), [completedJobs]);

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
      setTimeout(() => {
        resolve('https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&fit=crop&q=80');
      }, 900);
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

  const handleCashOut = () => {
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
  const showBottomNav = !showShiftOverlay;

  const BOTTOM_TABS: { id: GuardTab; icon: typeof Map; label: string }[] = [
    { id: 'map', icon: Map, label: 'Map' },
    { id: 'earnings', icon: DollarSign, label: 'Earnings' },
    { id: 'opportunities', icon: Compass, label: 'Jobs' },
  ];

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Map — always visible on map tab */}
      {activeTab === 'map' && (
        <ShiftMap
          jobs={mapJobs}
          selectedJobId={selectedJobId}
          onSelectJob={setSelectedJobId}
          guardPosition={guardPosition}
        />
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-[1001] p-3 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 bg-black/85 backdrop-blur-md rounded-xl px-3 py-2 border border-white/10">
          <Logo className="text-brand-primary" size={22} />
          <div>
            <p className="text-[8px] font-mono uppercase text-white/40 leading-none">Guardr</p>
            <p className="text-sm font-black leading-tight">{guard.name.split(' ')[0]}</p>
          </div>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOnline(!isOnline)}
            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider border backdrop-blur-md transition-all ${
              isOnline ? 'bg-brand-primary text-black border-brand-primary' : 'bg-black/85 text-white/50 border-white/10'
            }`}
          >
            {isOnline ? 'Online' : 'Go Online'}
          </button>
          {onSignOut && (
            <button type="button" onClick={onSignOut} className="p-2.5 rounded-xl bg-black/85 border border-white/10 text-white/50 hover:text-white backdrop-blur-md" aria-label="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Map tab: shift overlay OR job bottom sheet */}
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
          selectedJob={selectedJob?.status === 'open' ? selectedJob : null}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onSelectJob={(job) => setSelectedJobId(job?.id ?? null)}
          onAcceptJob={handleAcceptJob}
          isOnline={isOnline}
        />
      )}

      {activeTab === 'earnings' && (
        <GuardEarningsPanel
          summary={earningsSummary}
          completedJobs={completedJobs}
          balance={walletBalance}
          onCashOut={handleCashOut}
          cashoutPending={cashoutPending}
        />
      )}

      {activeTab === 'opportunities' && (
        <GuardOpportunitiesPanel
          jobs={availableJobs}
          guard={guard}
          guardPosition={guardPosition}
          selectedJobId={selectedJobId}
          onSelectJob={setSelectedJobId}
          onAcceptJob={handleAcceptJob}
        />
      )}

      {/* Bottom tab bar */}
      {showBottomNav && (
      <div className="absolute bottom-0 left-0 right-0 z-[1002] p-3 pb-4 pointer-events-none">
        <div className="pointer-events-auto max-w-md mx-auto flex bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-1">
          {BOTTOM_TABS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all ${
                activeTab === id ? 'bg-brand-primary text-black' : 'text-white/45 hover:text-white/70'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      </div>
      )}

      {showSelfAudit && (
        <GuardSelfAuditModal
          onClose={() => setShowSelfAudit(false)}
          onTriggerCamera={captureSelfie}
          onSubmit={handleSelfAuditSubmit}
        />
      )}

      {showCheckout && activeShiftJob && (
        <div className="absolute inset-0 z-[1003] bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="font-black text-lg">End Shift?</h3>
            <p className="text-sm text-white/60">Confirm you are leaving the site and your shift duties are complete.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowCheckout(false)} className="flex-1 py-3 rounded-xl border border-white/15 text-xs font-black uppercase">Cancel</button>
              <button type="button" onClick={handleCheckoutConfirm} className="flex-1 py-3 rounded-xl bg-brand-primary text-black font-black text-xs uppercase">Confirm</button>
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
    </div>
  );
}
