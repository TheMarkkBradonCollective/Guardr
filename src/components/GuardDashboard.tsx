import React, { useState, useEffect, useRef } from 'react';
import { SecurityRequest, SecurityGuard, Certification } from '../types';
import { PREFAB_CERT_LIST } from '../initialData';
import { formatDuration, formatShiftRange } from '../lib/dates';
import { ShiftMap } from './guard/ShiftMap';
import { Logo } from './Logo';
import {
  Shield,
  Clock,
  MapPin,
  DollarSign,
  Check,
  AlertTriangle,
  TrendingUp,
  Briefcase,
  FileText,
  Award,
  Sparkles,
  User,
  Plus,
  Camera,
  Activity,
  PenTool,
  CheckCircle,
  Zap,
  Info,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  Compass,
  Navigation,
  Radio,
  ArrowRight,
  ChevronLeft,
  LogOut,
  Wallet,
  List,
  Map,
  Star,
  Calendar,
} from 'lucide-react';

/* ── Signature Pad ──────────────────────────────────────────── */
const SignaturePad = ({ onSave, initialSig }: { onSave: (dataUrl: string) => void; initialSig?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; }
    }
  }, []);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, rect: DOMRect) => {
    const clientX = ('touches' in e) ? e.touches[0].clientX : e.clientX;
    const clientY = ('touches' in e) ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const { x, y } = getPos(e, canvas.getBoundingClientRect());
    ctx.beginPath(); ctx.moveTo(x, y);
  };
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e, canvas.getBoundingClientRect());
    ctx.lineTo(x, y); ctx.stroke();
  };
  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) onSave(canvas.toDataURL());
  };
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) { const ctx = canvas.getContext('2d'); if (ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); onSave(''); } }
  };

  return (
    <div className="space-y-1 border border-brand-border bg-white p-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono font-bold text-brand-text-muted uppercase tracking-wider">Signature Pad</span>
        <button type="button" onClick={clearCanvas} className="text-[10px] text-red-400 hover:text-red-300 font-mono">Clear</button>
      </div>
      <canvas
        ref={canvasRef}
        width={350}
        height={80}
        style={{ width: '100%', height: '80px' }}
        className="bg-white border border-gray-200 cursor-crosshair touch-none"
        onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
        onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
      />
    </div>
  );
};

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

type NavTab = 'map' | 'shifts' | 'wallet' | 'licenses';

export function GuardDashboard({
  guard,
  requests,
  onAddCertification,
  onAcceptJob,
  onUpdateJobAudit,
  onRecordAuditViolation,
  onSignOut,
  themeMode = 'sage-dark',
  onChangeTheme,
}: GuardDashboardProps) {
  const [activeTab, setActiveTab] = useState<NavTab>('map');
  const [isOnline, setIsOnline] = useState(true);
  const [onlineSeconds, setOnlineSeconds] = useState(3725);

  const [isNavigating, setIsNavigating] = useState<string | null>(null);
  const [simulatedMiles, setSimulatedMiles] = useState(1.2);
  const [simulatedEta, setSimulatedEta] = useState(4);

  const [showAddCert, setShowAddCert] = useState(false);
  const [certName, setCertName] = useState(PREFAB_CERT_LIST[0]);
  const [issuer, setIssuer] = useState('');
  const [num, setNum] = useState('');
  const [issueDate, setIssueDate] = useState('2025-01-01');
  const [expiryDate, setExpiryDate] = useState('2028-01-01');

  const [checkingInJobId, setCheckingInJobId] = useState<string | null>(null);
  const [uniformChecks, setUniformChecks] = useState({ shirt: false, pants: false, belt: false, footwear: false, badge: false, equipment: false });
  const [equipmentChecks, setEquipmentChecks] = useState({ radio: false, flashlight: false, phoneCharged: false, baton: false, spray: false, firearm: false });
  const [photoFront, setPhotoFront] = useState<string | null>(null);
  const [photoFull, setPhotoFull] = useState<string | null>(null);
  const [typedCheckInName, setTypedCheckInName] = useState('');
  const [signatureInked, setSignatureInked] = useState('');
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<'gps' | 'checks' | 'photos' | 'sign'>('gps');
  const [cameraLoading, setCameraLoading] = useState(false);
  const [activeCamTarget, setActiveCamTarget] = useState<'front' | 'full' | 'mid' | 'end' | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsVerified, setGpsVerified] = useState(false);
  const [gpsTick, setGpsTick] = useState(150);
  const [midShiftAuditParentId, setMidShiftAuditParentId] = useState<string | null>(null);
  const [midShiftUniform, setMidShiftUniform] = useState(false);
  const [midShiftEquip, setMidShiftEquip] = useState(false);
  const [midShiftPhoto, setMidShiftPhoto] = useState<string | null>(null);
  const [checkingOutJobId, setCheckingOutJobId] = useState<string | null>(null);
  const [checkoutCompleteCheck, setCheckoutCompleteCheck] = useState(false);
  const [checkoutNoViolations, setCheckoutNoViolations] = useState(false);
  const [checkoutNoEquipIssues, setCheckoutNoEquipIssues] = useState(false);
  const [checkoutPhotoEnd, setCheckoutPhotoEnd] = useState<string | null>(null);
  const [darNote, setDarNote] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [hasIncidentReport, setHasIncidentReport] = useState(false);
  const [incidentSelection, setIncidentSelection] = useState('Disturbance');
  const [incidentPriority, setIncidentPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [cashoutAmount, setCashoutAmount] = useState<number | null>(null);
  const [cashoutTimer, setCashoutTimer] = useState(false);
  const [selectedMapJobId, setSelectedMapJobId] = useState<string | null>(null);
  const [guardPosition, setGuardPosition] = useState<{ lat: number; lng: number } | null>(null);

  const availableJobs = requests.filter(r => r.status === 'open');
  const assignedJobs = requests.filter(r => r.assignedGuardId === guard.id && r.status !== 'completed');
  const activeJobOnDuty = assignedJobs.find(r => r.status === 'in-progress');
  const assignedNotClockedIn = assignedJobs.find(r => r.status === 'assigned');
  const completedJobs = requests.filter(r => r.assignedGuardId === guard.id && r.status === 'completed');
  const mapJobs = [...availableJobs, ...assignedJobs];
  const selectedMapJob = mapJobs.find(j => j.id === selectedMapJobId) ?? null;

  const [digitalWalletBalance, setDigitalWalletBalance] = useState(() => {
    const saved = localStorage.getItem(`guard_wallet_bal_${guard.id}`);
    return saved ? parseFloat(saved) : completedJobs.reduce((sum, r) => sum + r.estimatedPayout, 0);
  });

  useEffect(() => { localStorage.setItem(`guard_wallet_bal_${guard.id}`, digitalWalletBalance.toString()); }, [digitalWalletBalance, guard.id]);
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGuardPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGuardPosition(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    const clock = setInterval(() => {
      if (isOnline) setOnlineSeconds(s => s + 1);
      if (isOnline && isNavigating) {
        setSimulatedMiles(m => Math.max(0.02, Math.round((m - 0.05) * 100) / 100));
        setSimulatedEta(e => Math.max(0, e - 1));
      }
    }, 1000);
    return () => clearInterval(clock);
  }, [isOnline, isNavigating]);

  useEffect(() => {
    let interval: any;
    if (gpsLoading) {
      interval = setInterval(() => {
        setGpsTick(tick => {
          if (tick <= 12) { setGpsLoading(false); setGpsVerified(true); setActiveWorkflowStep('checks'); clearInterval(interval); return 12; }
          return Math.max(12, tick - Math.floor(Math.random() * 34 + 12));
        });
      }, 550);
    }
    return () => clearInterval(interval);
  }, [gpsLoading]);

  const formatOnlineDuration = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const triggerCamera = (target: 'front' | 'full' | 'mid' | 'end') => {
    setCameraLoading(true); setActiveCamTarget(target);
    const imgs = {
      front: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&fit=crop&q=80',
      full:  'https://images.unsplash.com/photo-1600486913747-55e5470d6f40?w=400&fit=crop&q=80',
      mid:   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&fit=crop&q=80',
      end:   'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&fit=crop&q=80',
    };
    setTimeout(() => {
      if (target === 'front') setPhotoFront(imgs.front);
      if (target === 'full')  setPhotoFull(imgs.full);
      if (target === 'mid')   setMidShiftPhoto(imgs.mid);
      if (target === 'end')   setCheckoutPhotoEnd(imgs.end);
      setCameraLoading(false); setActiveCamTarget(null);
    }, 1200);
  };

  const handleCheckInComplete = (requestId: string) => {
    const failedUniform = !uniformChecks.shirt || !uniformChecks.pants || !uniformChecks.footwear || !uniformChecks.badge;
    if (!photoFront || !photoFull) { alert('⚠ Both check-in photos are required.'); return; }
    if (!typedCheckInName || !signatureInked) { alert('⚠ Typed name and digital signature are required.'); return; }
    if (failedUniform) {
      if (!window.confirm('⚠ Uniform check incomplete. This will log a compliance failure. Proceed?')) return;
      onRecordAuditViolation(guard.id, 'Pre-Shift Outfitting Violation');
    }
    onUpdateJobAudit(requestId, {
      status: 'in-progress',
      checkInAudit: { checkedAt: new Date().toLocaleTimeString(), gpsVerified: true, uniformChecks, equipmentChecks, selfieUrl: photoFront, fullBodyUrl: photoFull, officerSignature: signatureInked, officerCertifiedName: typedCheckInName, compliant: !failedUniform }
    });
    setCheckingInJobId(null); setIsNavigating(null); setGpsVerified(false);
    setPhotoFront(null); setPhotoFull(null); setTypedCheckInName(''); setSignatureInked('');
    alert('✓ Pre-shift audit complete. Shift started!');
  };

  const handleMidShiftAuditSubmit = (requestId: string) => {
    if (!midShiftPhoto) { alert('⚠ Compliance selfie required.'); return; }
    if (!midShiftUniform || !midShiftEquip) onRecordAuditViolation(guard.id, 'Mid-Shift Audit Violation');
    onUpdateJobAudit(requestId, { midShiftAudit: { checkedAt: new Date().toLocaleTimeString(), selfie: midShiftPhoto, uniformVerified: midShiftUniform, equipmentVerified: midShiftEquip } });
    setMidShiftAuditParentId(null); setMidShiftPhoto(null);
    alert('✓ Mid-shift audit recorded.');
  };

  const handleCheckOutCompleteSubmit = (requestId: string) => {
    if (!checkoutCompleteCheck) { alert('Please confirm shift duties are complete.'); return; }
    if (!darNote) { alert('Daily Activity Report note is required.'); return; }
    const req = requests.find(r => r.id === requestId);
    const payout = req ? req.estimatedPayout : 0;
    onUpdateJobAudit(requestId, {
      status: 'completed',
      checkOutAudit: { checkedAt: new Date().toLocaleTimeString(), completed: checkoutCompleteCheck, noViolations: checkoutNoViolations, noEquipmentIssues: checkoutNoEquipIssues, endSelfie: checkoutPhotoEnd || undefined, dailyActivityReport: darNote, incidentReport: { hasIncident: hasIncidentReport, incidentType: hasIncidentReport ? incidentSelection : undefined, priority: hasIncidentReport ? incidentPriority : undefined, description: hasIncidentReport ? incidentDescription : undefined }, clientNotes }
    });
    setDigitalWalletBalance(b => b + payout);
    setCheckingOutJobId(null); setCheckoutCompleteCheck(false); setCheckoutNoViolations(false); setCheckoutNoEquipIssues(false); setDarNote(''); setClientNotes(''); setHasIncidentReport(false); setIncidentDescription(''); setCheckoutPhotoEnd(null);
    alert(`✓ Shift complete! $${payout} added to wallet.`);
  };

  const handleInstantCashout = () => {
    if (digitalWalletBalance <= 0) { alert('No balance to cash out.'); return; }
    setCashoutAmount(digitalWalletBalance); setCashoutTimer(true);
    setTimeout(() => { setDigitalWalletBalance(0); setCashoutTimer(false); }, 1500);
  };

  const handleSubmitCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issuer || !num) { alert('Issuer and serial number are required.'); return; }
    onAddCertification({ name: certName, issuer, number: num, issueDate, expiryDate, status: 'pending' });
    setIssuer(''); setNum(''); setShowAddCert(false);
    alert('License submitted for verification.');
  };

  /* ── Suspended / Blocked state ─── */
  const status = guard.userStatus || 'active';
  if (status === 'suspended' || status === 'blocked') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg p-6">
        <div className="uber-card max-w-md w-full text-center space-y-5">
          <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <h2 className="font-black text-lg uppercase tracking-tight">Account {status === 'suspended' ? 'Suspended' : 'Blocked'}</h2>
            <p className="text-brand-text-muted text-xs mt-2 leading-relaxed">Your operator account has been restricted. Contact platform administration to restore access.</p>
          </div>
          <div className="text-xs font-mono border border-brand-border p-3 text-left space-y-1 text-brand-text-muted">
            <div className="flex justify-between"><span>Badge:</span><span className="font-bold text-brand-text">{guard.badgeNumber}</span></div>
            <div className="flex justify-between"><span>Status:</span><span className="font-bold text-red-400 uppercase">{status}</span></div>
          </div>
        </div>
      </div>
    );
  }

  const NAV_TABS = [
    { id: 'map'      as NavTab, icon: Map,      label: 'Map' },
    { id: 'shifts'   as NavTab, icon: List,     label: `Shifts (${availableJobs.length})` },
    { id: 'wallet'   as NavTab, icon: Wallet,   label: 'Wallet' },
    { id: 'licenses' as NavTab, icon: Award,    label: 'Licenses' },
  ];

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* ── FULL-SCREEN MAP ─── */}
      <ShiftMap
        jobs={isOnline ? mapJobs : assignedJobs}
        selectedJobId={selectedMapJobId}
        onSelectJob={setSelectedMapJobId}
        guardPosition={guardPosition}
      />

      {/* ── TOP BAR (floats over map) ─── */}
      <div className="absolute top-0 left-0 right-0 z-[1001] pointer-events-none">
        <div className="flex items-start justify-between gap-2 p-3 pointer-events-auto">
          {/* Brand + guard name */}
          <div className="bg-black/90 border border-white/8 backdrop-blur-md px-3 py-2 flex items-center gap-2">
            <Logo className="text-brand-primary shrink-0" size={20} />
            <div>
              <p className="text-[8px] font-mono uppercase text-brand-text-muted leading-none tracking-widest">Guard</p>
              <p className="text-xs font-black uppercase tracking-tight leading-tight">{guard.name.split(' ')[0]}</p>
            </div>
          </div>

          {/* Online/offline + sign out */}
          <div className="flex items-center gap-1.5">
            {isOnline && (
              <div className="bg-black/90 border border-white/8 backdrop-blur-md px-2.5 py-2">
                <p className="text-[9px] font-mono text-brand-primary font-black">{formatOnlineDuration(onlineSeconds)}</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsOnline(!isOnline)}
              className={`px-3 py-2 text-[10px] font-black font-mono uppercase tracking-widest border backdrop-blur-md transition-all ${
                isOnline
                  ? 'bg-brand-primary text-black border-brand-primary'
                  : 'bg-black/90 text-brand-text-muted border-white/8'
              }`}
            >
              {isOnline ? 'Online' : 'Go Online'}
            </button>
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="p-2 bg-black/90 border border-white/8 text-brand-text-muted hover:text-white backdrop-blur-md"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 px-3 pb-2 pointer-events-auto overflow-x-auto">
          {NAV_TABS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-wider border backdrop-blur-md transition-all ${
                activeTab === id
                  ? 'bg-brand-primary text-black border-brand-primary'
                  : 'bg-black/80 text-brand-text-muted border-white/8 hover:border-white/20'
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAP BOTTOM SHEET ─────────────────────────── */}
      {activeTab === 'map' && (
        <div className="guardr-bottom-sheet">
          {!isOnline ? (
            <div className="py-8 text-center">
              <Compass className="w-9 h-9 text-brand-text-muted mx-auto mb-3" />
              <p className="font-black text-sm uppercase tracking-tight">You are off-duty</p>
              <p className="text-xs text-brand-text-muted mt-1 font-mono">Go online to see available shifts on the map.</p>
            </div>
          ) : selectedMapJob ? (
            /* Selected job detail */
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[9px] font-mono text-brand-primary uppercase font-black tracking-wider">{selectedMapJob.type.replace('-', ' ')}</p>
                  <h3 className="font-black text-sm leading-tight">{selectedMapJob.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[10px] font-mono text-brand-text-muted"><MapPin className="w-2.5 h-2.5" />{selectedMapJob.location}</span>
                    <span className="flex items-center gap-1 text-[10px] font-mono text-brand-text-muted"><Calendar className="w-2.5 h-2.5" />{new Date(selectedMapJob.startDate).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-black font-mono text-brand-primary">${selectedMapJob.estimatedPayout}</p>
                  <p className="text-[10px] font-mono text-brand-text-muted">${selectedMapJob.hourlyRate}/hr · {formatDuration(selectedMapJob.durationHours)}</p>
                </div>
              </div>
              <p className="text-xs text-brand-text-muted leading-relaxed line-clamp-2">{selectedMapJob.description}</p>
              {selectedMapJob.status === 'open' && (
                <button
                  type="button"
                  onClick={() => {
                    if (!guard.verified) { alert('Your profile must be verified before accepting shifts.'); return; }
                    if (selectedMapJob.armedRequired && !guard.isArmed) { alert('This shift requires an armed permit.'); return; }
                    onAcceptJob(selectedMapJob.id);
                    setIsNavigating(selectedMapJob.id); setSimulatedMiles(1.2); setSimulatedEta(4);
                    alert('Shift accepted! Navigate to the location and complete your check-in.');
                  }}
                  disabled={!guard.verified || (selectedMapJob.armedRequired && !guard.isArmed)}
                  className="w-full py-3 bg-brand-primary text-black font-black font-mono text-xs uppercase tracking-wider disabled:opacity-40 transition-opacity"
                >
                  Accept Shift · ${selectedMapJob.estimatedPayout}
                </button>
              )}
              {selectedMapJob.status === 'assigned' && selectedMapJob.assignedGuardId === guard.id && (
                <button
                  type="button"
                  onClick={() => setCheckingInJobId(selectedMapJob.id)}
                  className="w-full py-3 bg-brand-primary text-black font-black font-mono text-xs uppercase tracking-wider"
                >
                  Begin Check-In Audit
                </button>
              )}
              <button type="button" onClick={() => setSelectedMapJobId(null)} className="w-full py-2 border border-white/8 text-[10px] font-mono uppercase text-brand-text-muted hover:border-white/20 transition-colors">
                Close
              </button>
            </div>
          ) : isNavigating && assignedNotClockedIn ? (
            /* En route banner */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-mono text-brand-primary uppercase font-black tracking-widest animate-pulse">En Route to Site</p>
                  <p className="font-black text-sm">{assignedNotClockedIn.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black font-mono text-brand-primary">{simulatedMiles} mi</p>
                  <p className="text-[10px] font-mono text-brand-text-muted">{simulatedEta} min</p>
                </div>
              </div>
              <button
                onClick={() => setCheckingInJobId(assignedNotClockedIn.id)}
                className="w-full py-2.5 bg-brand-primary text-black font-black font-mono text-xs uppercase tracking-wider"
              >
                Arrived — Start Check-In
              </button>
            </div>
          ) : activeJobOnDuty ? (
            /* Active duty banner */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-mono text-brand-primary uppercase font-black tracking-widest">🚨 Active Shift</p>
                  <p className="font-black text-sm">{activeJobOnDuty.title}</p>
                  <p className="text-[10px] font-mono text-brand-text-muted flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{activeJobOnDuty.location}</p>
                </div>
                <p className="text-xl font-black font-mono text-brand-primary">${activeJobOnDuty.estimatedPayout}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setMidShiftAuditParentId(activeJobOnDuty.id)}
                  className="flex-1 py-2 border border-white/8 text-[10px] font-mono uppercase font-bold hover:border-brand-primary transition-colors"
                >
                  Mid-Shift Audit
                </button>
                <button
                  onClick={() => setCheckingOutJobId(activeJobOnDuty.id)}
                  className="flex-1 py-2 bg-brand-primary text-black font-black font-mono text-[10px] uppercase"
                >
                  End Shift
                </button>
              </div>
            </div>
          ) : (
            /* Default: show available jobs list */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono uppercase text-brand-text-muted font-bold">
                  {availableJobs.length} open shifts · {formatOnlineDuration(onlineSeconds)}
                </p>
                <p className="text-[9px] font-mono text-brand-text-muted">Tap a pin on the map</p>
              </div>
              {availableJobs.slice(0, 3).map(job => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => setSelectedMapJobId(job.id)}
                  className="w-full text-left border border-white/8 p-3 hover:border-brand-primary transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold truncate pr-2">{job.title}</span>
                    <span className="text-sm font-black font-mono text-brand-primary shrink-0">${job.estimatedPayout}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-brand-text-muted">
                    <MapPin className="w-2.5 h-2.5" />{job.location}
                    <span>·</span>
                    <Calendar className="w-2.5 h-2.5" />{new Date(job.startDate).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── NON-MAP PANELS ───────────────────────────── */}
      {activeTab !== 'map' && (
        <div className="absolute inset-0 z-[1002] bg-brand-bg overflow-y-auto pt-24 pb-8 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">

            {/* ── SHIFTS TAB ─── */}
            {activeTab === 'shifts' && (
              <div className="space-y-4">
                <h3 className="font-black text-sm uppercase tracking-tight flex items-center gap-2">
                  <Shield className="w-4 h-4 text-brand-primary" />
                  Available Shifts ({availableJobs.length})
                </h3>
                {!guard.verified && (
                  <div className="flex items-start gap-2 border border-amber-500/30 bg-amber-500/8 p-3 text-xs font-mono text-amber-400">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Your profile is pending verification. Add certifications and wait for approval before accepting shifts.</span>
                  </div>
                )}
                {availableJobs.length === 0 ? (
                  <div className="uber-card py-12 text-center">
                    <Shield className="w-8 h-8 text-brand-primary/30 mx-auto mb-3" />
                    <p className="text-brand-text-muted text-sm font-mono">No open shifts right now.</p>
                    <p className="text-brand-text-muted/60 text-xs mt-1">Check back or enable notifications.</p>
                  </div>
                ) : (
                  availableJobs.map(job => {
                    const armedMismatch = job.armedRequired && !guard.isArmed;
                    const isQualified = guard.verified && !armedMismatch;
                    return (
                      <div key={job.id} className="uber-card space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className="text-[9px] font-mono font-bold bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 uppercase border border-brand-primary/20">{job.type.replace('-', ' ')}</span>
                              {job.armedRequired && <span className="text-[9px] font-mono font-black bg-red-500/10 text-red-400 px-1.5 py-0.5 border border-red-500/25">Armed</span>}
                            </div>
                            <h4 className="font-black text-sm">{job.title}</h4>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                              <span className="flex items-center gap-1 text-[10px] font-mono text-brand-text-muted"><MapPin className="w-2.5 h-2.5 text-brand-primary" />{job.location}</span>
                              <span className="flex items-center gap-1 text-[10px] font-mono text-brand-text-muted">
                                <Calendar className="w-2.5 h-2.5 text-brand-primary" />
                                {new Date(job.startDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                                {' '}—{' '}
                                {new Date(job.endDate).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xl font-black font-mono text-brand-primary">${job.estimatedPayout}</p>
                            <p className="text-[10px] font-mono text-brand-text-muted">${job.hourlyRate}/hr</p>
                            <p className="text-[10px] font-mono text-brand-text-muted">{formatDuration(job.durationHours)}</p>
                          </div>
                        </div>
                        <p className="text-xs text-brand-text-muted leading-relaxed border-l-2 border-brand-border pl-3">{job.description}</p>
                        {/* Cert check */}
                        <div className="space-y-1 text-[10px] font-mono">
                          {job.armedRequired && (
                            <p className={guard.isArmed ? 'text-brand-primary' : 'text-red-400'}>
                              {guard.isArmed ? '✓ Armed permit verified' : '✗ Missing: Armed permit required'}
                            </p>
                          )}
                          {job.requiredCertifications.map(rc => {
                            const has = guard.certifications.some(c => c.name.toLowerCase().includes(rc.toLowerCase()) && c.status === 'verified');
                            return <p key={rc} className={has ? 'text-brand-primary' : 'text-amber-400'}>{has ? `✓ ${rc}` : `⚠ Missing: ${rc}`}</p>;
                          })}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-brand-border">
                          <span className="text-[10px] font-mono text-brand-text-muted">{isQualified ? '✓ Eligible to apply' : '✗ Missing credentials'}</span>
                          <button
                            onClick={() => {
                              if (!isQualified) { alert('You do not meet the credential requirements for this shift.'); return; }
                              onAcceptJob(job.id); setIsNavigating(job.id); setSimulatedMiles(1.2); setSimulatedEta(4); setActiveTab('map');
                              alert('✓ Shift accepted! Check the Map tab for navigation.');
                            }}
                            disabled={!isQualified}
                            className={`h-9 px-5 text-xs font-black font-mono uppercase tracking-wider transition-all border ${
                              isQualified ? 'bg-brand-primary text-black border-brand-primary hover:opacity-90' : 'bg-brand-border/30 text-brand-text-muted border-brand-border cursor-not-allowed'
                            }`}
                          >
                            Accept Shift
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── WALLET TAB ─── */}
            {activeTab === 'wallet' && (
              <div className="space-y-5">
                {/* Balance card */}
                <div className="border border-brand-primary/30 bg-gradient-to-br from-brand-primary/12 to-transparent p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="uber-label text-brand-primary flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5" />Guardr Wallet</p>
                    <span className="text-[9px] bg-brand-primary/15 text-brand-primary border border-brand-primary/30 font-mono font-bold px-2 py-0.5 uppercase">Instant Payout</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-brand-text-muted uppercase">Available Balance</p>
                    <p className="text-4xl font-black font-mono">
                      ${digitalWalletBalance.toFixed(2)} <span className="text-lg text-brand-text-muted font-bold">USD</span>
                    </p>
                  </div>
                  {cashoutTimer ? (
                    <div className="border border-brand-primary/20 p-3 text-xs font-mono text-brand-primary text-center animate-pulse">
                      Processing transfer to registered card...
                    </div>
                  ) : (
                    <button
                      onClick={handleInstantCashout}
                      disabled={digitalWalletBalance <= 0}
                      className="w-full py-3 bg-brand-primary text-black font-black font-mono text-xs uppercase tracking-wider disabled:opacity-40 transition-opacity"
                    >
                      Cash Out Instantly → Debit Card
                    </button>
                  )}
                </div>

                {cashoutAmount !== null && !cashoutTimer && (
                  <div className="flex items-center justify-between border border-brand-primary/25 bg-brand-primary/8 p-3 text-xs font-mono text-brand-primary animate-fade-in">
                    <span>✓ ${cashoutAmount} deposited to card ****9012</span>
                    <button onClick={() => setCashoutAmount(null)} className="text-brand-text-muted hover:text-brand-text ml-2">✕</button>
                  </div>
                )}

                {/* Earnings history */}
                <div>
                  <h4 className="font-black text-sm uppercase tracking-tight mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-brand-primary" />
                    Completed Shifts ({completedJobs.length})
                  </h4>
                  {completedJobs.length === 0 ? (
                    <div className="uber-card py-10 text-center">
                      <p className="text-brand-text-muted text-xs font-mono">No completed shifts yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {completedJobs.map(job => (
                        <div key={job.id} className="uber-card flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[9px] font-mono bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 uppercase border border-brand-primary/20">{job.type}</span>
                              <span className="text-[9px] font-mono text-brand-primary">✓ Completed</span>
                            </div>
                            <p className="font-bold text-xs">{job.title}</p>
                            <p className="text-[10px] text-brand-text-muted font-mono">{job.location}</p>
                          </div>
                          <p className="text-lg font-black font-mono text-brand-primary shrink-0">+${job.estimatedPayout}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── LICENSES TAB ─── */}
            {activeTab === 'licenses' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-sm uppercase tracking-tight flex items-center gap-2">
                    <Award className="w-4 h-4 text-brand-primary" />
                    Certifications & Licenses
                  </h3>
                  <button
                    onClick={() => setShowAddCert(!showAddCert)}
                    className="uber-button-sage h-8 px-3 text-[10px] font-black uppercase gap-1.5"
                  >
                    <Plus className="w-3 h-3" />
                    Add License
                  </button>
                </div>

                {!guard.verified && (
                  <div className="flex items-start gap-2 border border-amber-500/30 bg-amber-500/8 p-3 text-xs font-mono text-amber-400">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Profile pending verification. Add your credentials and submit for review. Once verified, you can browse and accept shifts.</span>
                  </div>
                )}

                {showAddCert && (
                  <form onSubmit={handleSubmitCert} className="uber-card space-y-3 animate-slide-up">
                    <p className="uber-label">Upload License</p>
                    <div>
                      <label className="uber-label block mb-1.5">Certification Type</label>
                      <select value={certName} onChange={(e) => setCertName(e.target.value)} className="uber-select">
                        {PREFAB_CERT_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="uber-label block mb-1.5">Issuing Body</label>
                        <input type="text" required placeholder="e.g. State Licensing Dept" value={issuer} onChange={(e) => setIssuer(e.target.value)} className="uber-input" />
                      </div>
                      <div>
                        <label className="uber-label block mb-1.5">License Serial #</label>
                        <input type="text" required placeholder="e.g. BS-28192A" value={num} onChange={(e) => setNum(e.target.value)} className="uber-input" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="uber-label block mb-1.5">Issue Date</label>
                        <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="uber-input" />
                      </div>
                      <div>
                        <label className="uber-label block mb-1.5">Expiry Date</label>
                        <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="uber-input" />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={() => setShowAddCert(false)} className="uber-button-outline h-9 px-4 text-xs font-black uppercase flex-1">Cancel</button>
                      <button type="submit" className="uber-button-sage h-9 px-4 text-xs font-black uppercase flex-1">Submit</button>
                    </div>
                  </form>
                )}

                <div className="space-y-2">
                  {guard.certifications.length === 0 ? (
                    <div className="uber-card py-10 text-center">
                      <Award className="w-8 h-8 text-brand-primary/30 mx-auto mb-2" />
                      <p className="text-brand-text-muted text-xs font-mono">No certifications uploaded yet.</p>
                    </div>
                  ) : (
                    guard.certifications.map(cert => (
                      <div
                        key={cert.id}
                        className={`uber-card flex items-start justify-between gap-3 ${
                          cert.status === 'verified' ? 'border-brand-primary/25 bg-brand-primary/3' :
                          cert.status === 'rejected' ? 'border-red-500/25 bg-red-500/3' :
                          ''
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-black text-xs">{cert.name}</p>
                          <div className="text-[10px] font-mono text-brand-text-muted space-y-0.5 mt-1">
                            <p>Issuer: {cert.issuer}</p>
                            <p>Serial: {cert.number}</p>
                            <p>Expires: {cert.expiryDate}</p>
                          </div>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 text-[9px] font-mono uppercase font-black border ${
                          cert.status === 'verified' ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/30' :
                          cert.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                          'bg-brand-border/30 text-brand-text-muted border-brand-border animate-pulse'
                        }`}>
                          {cert.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FLOATING MODALS ──────────────────────────── */}

      {/* Check-In Audit Modal */}
      {checkingInJobId && (
        <div className="absolute inset-0 z-[1003] bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-lg bg-brand-bg border border-brand-border text-brand-text animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-brand-bg border-b border-brand-border px-4 py-3 flex items-center justify-between">
              <p className="font-black text-xs uppercase tracking-widest text-brand-primary">Pre-Shift Check-In Audit</p>
              <button onClick={() => setCheckingInJobId(null)} className="text-brand-text-muted hover:text-brand-text">✕</button>
            </div>
            <div className="p-4 space-y-4">
              {/* Steps */}
              <div className="flex gap-1">
                {(['gps','checks','photos','sign'] as const).map((step, i) => (
                  <div key={step} className={`flex-1 h-1 ${activeWorkflowStep === step || (i < ['gps','checks','photos','sign'].indexOf(activeWorkflowStep)) ? 'bg-brand-primary' : 'bg-brand-border'}`} />
                ))}
              </div>

              {/* Step 1: GPS */}
              {activeWorkflowStep === 'gps' && (
                <div className="space-y-3">
                  <p className="uber-label">Step 1 — GPS Verification</p>
                  {!gpsVerified ? (
                    <button
                      onClick={() => { setGpsLoading(true); setGpsTick(150); }}
                      disabled={gpsLoading}
                      className="w-full py-3 bg-brand-primary text-black font-black font-mono text-xs uppercase tracking-wider disabled:opacity-70"
                    >
                      {gpsLoading ? `Scanning... ${gpsTick}m accuracy` : 'Verify GPS Location'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 border border-brand-primary/30 bg-brand-primary/8 p-3 text-xs font-mono text-brand-primary">
                      <CheckCircle2 className="w-4 h-4" />
                      GPS verified — location confirmed at site
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Uniform/Equipment checks */}
              {activeWorkflowStep === 'checks' && (
                <div className="space-y-3">
                  <p className="uber-label">Step 2 — Uniform & Equipment Checklist</p>
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono text-brand-text-muted uppercase mb-2">Uniform</p>
                    {(Object.keys(uniformChecks) as (keyof typeof uniformChecks)[]).map(key => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer py-1">
                        <div
                          onClick={() => setUniformChecks(p => ({ ...p, [key]: !p[key] }))}
                          className={`w-4 h-4 border flex items-center justify-center ${uniformChecks[key] ? 'bg-brand-primary border-brand-primary' : 'border-brand-border'}`}
                        >
                          {uniformChecks[key] && <Check className="w-2.5 h-2.5 text-black" />}
                        </div>
                        <span className="text-xs font-mono capitalize">{key}</span>
                      </label>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono text-brand-text-muted uppercase mb-2">Equipment</p>
                    {(Object.keys(equipmentChecks) as (keyof typeof equipmentChecks)[]).map(key => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer py-1">
                        <div
                          onClick={() => setEquipmentChecks(p => ({ ...p, [key]: !p[key] }))}
                          className={`w-4 h-4 border flex items-center justify-center ${equipmentChecks[key] ? 'bg-brand-primary border-brand-primary' : 'border-brand-border'}`}
                        >
                          {equipmentChecks[key] && <Check className="w-2.5 h-2.5 text-black" />}
                        </div>
                        <span className="text-xs font-mono capitalize">{String(key).replace(/([A-Z])/g, ' $1')}</span>
                      </label>
                    ))}
                  </div>
                  <button onClick={() => setActiveWorkflowStep('photos')} className="w-full py-2.5 bg-brand-primary text-black font-black font-mono text-xs uppercase">Continue to Photos</button>
                </div>
              )}

              {/* Step 3: Photos */}
              {activeWorkflowStep === 'photos' && (
                <div className="space-y-3">
                  <p className="uber-label">Step 3 — Verification Photos</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <p className="text-[10px] font-mono text-brand-text-muted">Front selfie</p>
                      {photoFront ? (
                        <img src={photoFront} className="w-full h-24 object-cover border border-brand-primary/30" alt="front" />
                      ) : (
                        <button
                          onClick={() => triggerCamera('front')}
                          disabled={cameraLoading && activeCamTarget === 'front'}
                          className="w-full h-24 border border-brand-border flex items-center justify-center hover:border-brand-primary transition-colors"
                        >
                          <Camera className="w-6 h-6 text-brand-text-muted" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-mono text-brand-text-muted">Full body</p>
                      {photoFull ? (
                        <img src={photoFull} className="w-full h-24 object-cover border border-brand-primary/30" alt="full" />
                      ) : (
                        <button
                          onClick={() => triggerCamera('full')}
                          disabled={cameraLoading && activeCamTarget === 'full'}
                          className="w-full h-24 border border-brand-border flex items-center justify-center hover:border-brand-primary transition-colors"
                        >
                          <Camera className="w-6 h-6 text-brand-text-muted" />
                        </button>
                      )}
                    </div>
                  </div>
                  {photoFront && photoFull && (
                    <button onClick={() => setActiveWorkflowStep('sign')} className="w-full py-2.5 bg-brand-primary text-black font-black font-mono text-xs uppercase">Continue to Signature</button>
                  )}
                </div>
              )}

              {/* Step 4: Signature */}
              {activeWorkflowStep === 'sign' && (
                <div className="space-y-3">
                  <p className="uber-label">Step 4 — Digital Signature</p>
                  <div>
                    <label className="uber-label block mb-1.5">Type Your Full Name</label>
                    <input type="text" placeholder="Officer Full Name" value={typedCheckInName} onChange={(e) => setTypedCheckInName(e.target.value)} className="uber-input" />
                  </div>
                  <SignaturePad onSave={setSignatureInked} />
                  <button
                    onClick={() => handleCheckInComplete(checkingInJobId)}
                    className="w-full py-3 bg-brand-primary text-black font-black font-mono text-xs uppercase"
                  >
                    Complete Check-In & Start Shift
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mid-Shift Audit Modal */}
      {midShiftAuditParentId && (
        <div className="absolute inset-0 z-[1003] bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-brand-bg border border-brand-border animate-slide-up">
            <div className="border-b border-brand-border px-4 py-3 flex items-center justify-between">
              <p className="font-black text-xs uppercase tracking-widest text-brand-primary">Mid-Shift Integrity Audit</p>
              <button onClick={() => setMidShiftAuditParentId(null)} className="text-brand-text-muted hover:text-brand-text">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => setMidShiftUniform(!midShiftUniform)} className={`w-4 h-4 border ${midShiftUniform ? 'bg-brand-primary border-brand-primary' : 'border-brand-border'} flex items-center justify-center`}>
                    {midShiftUniform && <Check className="w-2.5 h-2.5 text-black" />}
                  </div>
                  <span className="text-xs font-mono">Uniform compliant</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => setMidShiftEquip(!midShiftEquip)} className={`w-4 h-4 border ${midShiftEquip ? 'bg-brand-primary border-brand-primary' : 'border-brand-border'} flex items-center justify-center`}>
                    {midShiftEquip && <Check className="w-2.5 h-2.5 text-black" />}
                  </div>
                  <span className="text-xs font-mono">Equipment present</span>
                </label>
              </div>
              <div>
                <label className="uber-label block mb-1.5">Compliance Selfie</label>
                {midShiftPhoto ? (
                  <img src={midShiftPhoto} className="w-full h-28 object-cover border border-brand-primary/30" alt="mid" />
                ) : (
                  <button onClick={() => triggerCamera('mid')} className="w-full h-28 border border-brand-border flex items-center justify-center hover:border-brand-primary transition-colors">
                    <Camera className="w-7 h-7 text-brand-text-muted" />
                  </button>
                )}
              </div>
              <button
                onClick={() => handleMidShiftAuditSubmit(midShiftAuditParentId)}
                className="w-full py-3 bg-brand-primary text-black font-black font-mono text-xs uppercase"
              >
                Submit Mid-Shift Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Check-Out Modal */}
      {checkingOutJobId && (
        <div className="absolute inset-0 z-[1003] bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-brand-bg border border-brand-border animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-brand-bg border-b border-brand-border px-4 py-3 flex items-center justify-between">
              <p className="font-black text-xs uppercase tracking-widest text-brand-primary">End-of-Shift Report</p>
              <button onClick={() => setCheckingOutJobId(null)} className="text-brand-text-muted hover:text-brand-text">✕</button>
            </div>
            <div className="p-4 space-y-4">
              {/* Confirmations */}
              <div className="space-y-2">
                {[
                  { key: 'checkoutCompleteCheck', val: checkoutCompleteCheck, set: setCheckoutCompleteCheck, label: 'Shift duties complete' },
                  { key: 'checkoutNoViolations', val: checkoutNoViolations, set: setCheckoutNoViolations, label: 'No uniform/conduct violations' },
                  { key: 'checkoutNoEquipIssues', val: checkoutNoEquipIssues, set: setCheckoutNoEquipIssues, label: 'No equipment issues' },
                ].map(({ val, set, label }) => (
                  <label key={label} className="flex items-center gap-2 cursor-pointer">
                    <div onClick={() => set(!val)} className={`w-4 h-4 border flex items-center justify-center ${val ? 'bg-brand-primary border-brand-primary' : 'border-brand-border'}`}>
                      {val && <Check className="w-2.5 h-2.5 text-black" />}
                    </div>
                    <span className="text-xs font-mono">{label}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="uber-label block mb-1.5">Daily Activity Report (required)</label>
                <textarea
                  rows={3}
                  placeholder="Describe events, patrol activities, and observations..."
                  value={darNote}
                  onChange={(e) => setDarNote(e.target.value)}
                  className="uber-input resize-none"
                />
              </div>

              <div>
                <label className="uber-label block mb-1.5">Client Notes (optional)</label>
                <textarea
                  rows={2}
                  placeholder="Any notes for the client..."
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  className="uber-input resize-none"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => setHasIncidentReport(!hasIncidentReport)} className={`w-4 h-4 border flex items-center justify-center ${hasIncidentReport ? 'bg-red-500 border-red-500' : 'border-brand-border'}`}>
                  {hasIncidentReport && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className="text-xs font-mono text-brand-text-muted">File incident report</span>
              </label>

              {hasIncidentReport && (
                <div className="space-y-2 border-l-2 border-red-500/30 pl-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="uber-label block mb-1">Type</label>
                      <select value={incidentSelection} onChange={(e) => setIncidentSelection(e.target.value)} className="uber-select">
                        {['Disturbance', 'Trespassing', 'Theft', 'Medical', 'Other'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="uber-label block mb-1">Priority</label>
                      <select value={incidentPriority} onChange={(e) => setIncidentPriority(e.target.value as any)} className="uber-select">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="uber-label block mb-1">Description</label>
                    <textarea rows={2} value={incidentDescription} onChange={(e) => setIncidentDescription(e.target.value)} className="uber-input resize-none" placeholder="Describe what happened..." />
                  </div>
                </div>
              )}

              <div>
                <label className="uber-label block mb-1.5">End-of-Shift Photo (optional)</label>
                {checkoutPhotoEnd ? (
                  <img src={checkoutPhotoEnd} className="w-full h-24 object-cover border border-brand-primary/30" alt="end" />
                ) : (
                  <button onClick={() => triggerCamera('end')} className="w-full h-24 border border-brand-border flex items-center justify-center hover:border-brand-primary transition-colors">
                    <Camera className="w-7 h-7 text-brand-text-muted" />
                  </button>
                )}
              </div>

              <button
                onClick={() => handleCheckOutCompleteSubmit(checkingOutJobId)}
                className="w-full py-3 bg-brand-primary text-black font-black font-mono text-xs uppercase tracking-wider"
              >
                Complete Shift & Release Earnings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
