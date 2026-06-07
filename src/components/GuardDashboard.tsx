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
} from 'lucide-react';

// Signature drawing canvas component using mouse/touch events
const SignaturePad = ({ onSave, initialSig }: { onSave: (dataUrl: string) => void; initialSig?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = ('touches' in e) ? e.touches[0].clientX : e.clientX;
    const clientY = ('touches' in e) ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = ('touches' in e) ? e.touches[0].clientX : e.clientX;
    const clientY = ('touches' in e) ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onSave('');
      }
    }
  };

  return (
    <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-300">
      <div className="flex items-center justify-between pointer-events-auto">
        <span className="text-[9px] font-mono font-bold text-slate-500 block uppercase">Certification Signature Pad</span>
        <button type="button" onClick={clearCanvas} className="text-[10px] text-red-500 hover:text-red-700 font-mono tracking-tight font-extrabold cursor-pointer">Clear Canvas Ink</button>
      </div>
      <canvas
        ref={canvasRef}
        width={350}
        height={90}
        style={{ width: '100%', height: '90px' }}
        className="bg-white rounded-md border border-slate-300 cursor-crosshair touch-none text-black"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
    </div>
  );
};

interface GuardDashboardProps {
  guard: SecurityGuard;
  requests: SecurityRequest[];
  onAddCertification: (cert: Partial<Certification>) => void;
  onAcceptJob: (requestId: string) => void;
  onUpdateJobAudit: (requestId: string, auditPayload: { checkInAudit?: any; midShiftAudit?: any; checkOutAudit?: any; status?: SecurityRequest['status'] }) => void;
  onRecordAuditViolation: (guardId: string, reason?: string) => void;
  onSignOut?: () => void;
}

export function GuardDashboard({
  guard,
  requests,
  onAddCertification,
  onAcceptJob,
  onUpdateJobAudit,
  onRecordAuditViolation,
  onSignOut,
}: GuardDashboardProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'dispatch' | 'marketplace' | 'earnings' | 'credentials'>('dispatch');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [onlineSeconds, setOnlineSeconds] = useState<number>(3725); // Stopwatch simulation

  // Uber Driver Simulation Navigation
  const [isNavigating, setIsNavigating] = useState<string | null>(null);
  const [simulatedMiles, setSimulatedMiles] = useState<number>(1.2);
  const [simulatedEta, setSimulatedEta] = useState<number>(4);
  const [vehicleCoo, setVehicleCoo] = useState<{ x: number; y: number }>({ x: 40, y: 70 });

  // Add License Form states
  const [showAddCert, setShowAddCert] = useState(false);
  const [certName, setCertName] = useState(PREFAB_CERT_LIST[0]);
  const [issuer, setIssuer] = useState('');
  const [num, setNum] = useState('');
  const [issueDate, setIssueDate] = useState('2025-01-01');
  const [expiryDate, setExpiryDate] = useState('2028-01-01');

  // Pre-shift Self Audit checklists (Phase 7)
  const [checkingInJobId, setCheckingInJobId] = useState<string | null>(null);
  const [uniformChecks, setUniformChecks] = useState({
    shirt: false,
    pants: false,
    belt: false,
    footwear: false,
    badge: false,
    equipment: false,
  });

  const [equipmentChecks, setEquipmentChecks] = useState({
    radio: false,
    flashlight: false,
    phoneCharged: false,
    baton: false,
    spray: false,
    firearm: false,
  });

  const [photoFront, setPhotoFront] = useState<string | null>(null);
  const [photoFull, setPhotoFull] = useState<string | null>(null);
  const [typedCheckInName, setTypedCheckInName] = useState('');
  const [signatureInked, setSignatureInked] = useState('');
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<'gps' | 'checks' | 'photos' | 'sign'>('gps');

  // Simulated Camera trigger
  const [cameraLoading, setCameraLoading] = useState(false);
  const [activeCamTarget, setActiveCamTarget] = useState<'front' | 'full' | 'mid' | 'end' | null>(null);

  // GPS verification loaded simulation
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsVerified, setGpsVerified] = useState(false);
  const [gpsTick, setGpsTick] = useState(150);

  // Mid shift audits tracking
  const [midShiftAuditParentId, setMidShiftAuditParentId] = useState<string | null>(null);
  const [midShiftUniform, setMidShiftUniform] = useState(false);
  const [midShiftEquip, setMidShiftEquip] = useState(false);
  const [midShiftPhoto, setMidShiftPhoto] = useState<string | null>(null);

  // End of Shift Checkout Reports states
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

  // Cashout flow states
  const [cashoutAmount, setCashoutAmount] = useState<number | null>(null);
  const [cashoutTimer, setCashoutTimer] = useState<boolean>(false);
  const [isSearchingJobs, setIsSearchingJobs] = useState<boolean>(true);
  const [selectedMapJobId, setSelectedMapJobId] = useState<string | null>(null);
  const [guardPosition, setGuardPosition] = useState<{ lat: number; lng: number } | null>(null);

  // Get filtered lists of requests
  const availableJobs = requests.filter(r => r.status === 'open');
  const assignedJobs = requests.filter(r => r.assignedGuardId === guard.id && r.status !== 'completed');
  const activeJobOnDuty = assignedJobs.find(r => r.status === 'in-progress');
  const assignedNotClockedIn = assignedJobs.find(r => r.status === 'assigned');
  const completedJobs = requests.filter(r => r.assignedGuardId === guard.id && r.status === 'completed');
  const mapJobs = [...availableJobs, ...assignedJobs];
  const selectedMapJob = mapJobs.find((j) => j.id === selectedMapJobId) ?? null;

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGuardPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGuardPosition(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Calculates total of completed job payouts (mock wallet balance)
  const [digitalWalletBalance, setDigitalWalletBalance] = useState<number>(() => {
    const saved = localStorage.getItem(`guard_wallet_bal_${guard.id}`);
    return saved ? parseFloat(saved) : completedJobs.reduce((sum, r) => sum + r.estimatedPayout, 0);
  });

  useEffect(() => {
    localStorage.setItem(`guard_wallet_bal_${guard.id}`, digitalWalletBalance.toString());
  }, [digitalWalletBalance, guard.id]);

  // Online stopwatch simulation
  useEffect(() => {
    const clock = setInterval(() => {
      if (isOnline) {
        setOnlineSeconds(prev => prev + 1);
      }

      if (isOnline && isNavigating) {
        setSimulatedMiles(miles => {
          if (miles <= 0.05) return 0.02;
          return Math.round((miles - 0.05) * 100) / 100;
        });

        setSimulatedEta(eta => {
          if (eta <= 1) return 0;
          return eta - 1;
        });

        setVehicleCoo(pos => {
          // move vehicle slowly diagonally towards destination at (320, 210)
          const stepX = (320 - pos.x) / 12;
          const stepY = (210 - pos.y) / 12;
          return {
            x: Math.round(pos.x + stepX),
            y: Math.round(pos.y + stepY)
          };
        });
      }
    }, 1000);
    return () => clearInterval(clock);
  }, [isOnline, isNavigating]);

  // Track Simulated GPS scanning countdown
  useEffect(() => {
    let interval: any;
    if (gpsLoading) {
      interval = setInterval(() => {
        setGpsTick(tick => {
          if (tick <= 12) {
            setGpsLoading(false);
            setGpsVerified(true);
            setActiveWorkflowStep('checks');
            clearInterval(interval);
            return 12;
          }
          return Math.max(12, tick - Math.floor(Math.random() * 34 + 12));
        });
      }, 550);
    }
    return () => clearInterval(interval);
  }, [gpsLoading]);

  // Format stopwatch clock
  const formatOnlineDuration = (totSeconds: number) => {
    const h = Math.floor(totSeconds / 3600);
    const m = Math.floor((totSeconds % 3600) / 60);
    const s = totSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleGPSVerificationClick = () => {
    setGpsLoading(true);
    setGpsTick(150);
  };

  const triggerCameraSnapper = (target: 'front' | 'full' | 'mid' | 'end') => {
    setCameraLoading(true);
    setActiveCamTarget(target);
    setTimeout(() => {
      setCameraLoading(false);
      const images: Record<string, string> = {
        front: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&fit=crop&q=80",
        full: "https://images.unsplash.com/photo-1600486913747-55e5470d6f40?w=400&fit=crop&q=80",
        mid: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&fit=crop&q=80",
        end: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&fit=crop&q=80"
      };
      if (target === 'front') setPhotoFront(images.front);
      if (target === 'full') setPhotoFull(images.full);
      if (target === 'mid') setMidShiftPhoto(images.mid);
      if (target === 'end') setCheckoutPhotoEnd(images.end);
      setActiveCamTarget(null);
    }, 1200);
  };

  // Pre-shift Self-Audit submit (Phase 7)
  const handleCheckInComplete = (requestId: string) => {
    const hasShirt = uniformChecks.shirt;
    const hasPants = uniformChecks.pants;
    const hasFootwear = uniformChecks.footwear;
    const hasBadge = uniformChecks.badge;

    const failedUniform = !hasShirt || !hasPants || !hasFootwear || !hasBadge;

    if (!photoFront || !photoFull) {
      alert("⚠️ Verification photos are required! Please activate camera and capture both front-facing selfie and full body uniform check-in photos.");
      return;
    }

    if (!typedCheckInName || !signatureInked) {
      alert("⚠️ Hand-written digital signature in Signature Pad and typed name certification are required.");
      return;
    }

    if (failedUniform) {
      const confirmProceed = window.confirm(
         `🚨 WARNING: You have unchecked core uniform items. Completing this audit now will log a COMPLIANCE FAILURE.\n\n3 failures will automatically suspend your operator license. Proceed anyways?`
      );
      if (!confirmProceed) return;

      // Register compliance violation
      onRecordAuditViolation(guard.id, "Pre-Shift Outfitting Violation: Clothing deviation logged on automated audit");
    }

    onUpdateJobAudit(requestId, {
      status: 'in-progress',
      checkInAudit: {
        checkedAt: new Date().toLocaleTimeString(),
        gpsVerified: true,
        uniformChecks: uniformChecks,
        equipmentChecks: equipmentChecks,
        selfieUrl: photoFront,
        fullBodyUrl: photoFull,
        officerSignature: signatureInked,
        officerCertifiedName: typedCheckInName,
        compliant: !failedUniform
      }
    });

    setCheckingInJobId(null);
    setIsNavigating(null);
    setGpsVerified(false);
    setPhotoFront(null);
    setPhotoFull(null);
    setTypedCheckInName('');
    setSignatureInked('');
    alert("✓ Pre-Shift compliance audit approved. Shift started on-site! Remain active or monitor dispatch console.");
  };

  // Submit mid-shift randomized integrity audit (Phase 7)
  const handleMidShiftAuditSubmit = (requestId: string) => {
    if (!midShiftPhoto) {
      alert("⚠️ Compliance photo selfie is required to unlock mid-shift audit lock.");
      return;
    }

    const failedMid = !midShiftUniform || !midShiftEquip;
    if (failedMid) {
      onRecordAuditViolation(guard.id, "Mid-Shift Randomized Audit Violation: Dress Code Deviation");
    }

    onUpdateJobAudit(requestId, {
      midShiftAudit: {
        checkedAt: new Date().toLocaleTimeString(),
        selfie: midShiftPhoto,
        uniformVerified: midShiftUniform,
        equipmentVerified: midShiftEquip
      }
    });

    setMidShiftAuditParentId(null);
    setMidShiftPhoto(null);
    alert("✓ Mid-Shift integrity verification registered successfully with platform compliance database!");
  };

  // Submit Shift Checkout (Phase 7)
  const handleCheckOutCompleteSubmit = (requestId: string) => {
    if (!checkoutCompleteCheck) {
      alert("Please verify that shift duties are complete.");
      return;
    }

    if (!darNote) {
      alert("Please provide the required Daily Activity Report (DAR) site log notes.");
      return;
    }

    const selectedRequest = requests.find(r => r.id === requestId);
    const payoutPrice = selectedRequest ? selectedRequest.estimatedPayout : 0;

    onUpdateJobAudit(requestId, {
      status: 'completed',
      checkOutAudit: {
        checkedAt: new Date().toLocaleTimeString(),
        completed: checkoutCompleteCheck,
        noViolations: checkoutNoViolations,
        noEquipmentIssues: checkoutNoEquipIssues,
        endSelfie: checkoutPhotoEnd || undefined,
        dailyActivityReport: darNote,
        incidentReport: {
          hasIncident: hasIncidentReport,
          incidentType: hasIncidentReport ? incidentSelection : undefined,
          priority: hasIncidentReport ? incidentPriority : undefined,
          description: hasIncidentReport ? incidentDescription : undefined
        },
        clientNotes: clientNotes
      }
    });

    // Credit earnings to dynamic balance
    setDigitalWalletBalance(prev => prev + payoutPrice);

    setCheckingOutJobId(null);
    setCheckoutCompleteCheck(false);
    setCheckoutNoViolations(false);
    setCheckoutNoEquipIssues(false);
    setDarNote('');
    setClientNotes('');
    setHasIncidentReport(false);
    setIncidentDescription('');
    setCheckoutPhotoEnd(null);

    alert(`✓ Shift successfully completed & clocked out! Earnings of $${payoutPrice} added to your immediate Guardr Wallet. Payout is ready for instant cash-out ledger.`);
  };

  const handleInstantCashoutSubmit = () => {
    if (digitalWalletBalance <= 0) {
      alert("You have $0 USD. Collect active shift payouts to process cash-out transfer.");
      return;
    }
    setCashoutAmount(digitalWalletBalance);
    setCashoutTimer(true);
    setTimeout(() => {
      setDigitalWalletBalance(0);
      setCashoutTimer(false);
    }, 1500);
  };

  const handleSubmitCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issuer || !num) {
      alert("Please provide the license issuer and registration serial key.");
      return;
    }
    onAddCertification({
      name: certName,
      issuer,
      number: num,
      issueDate,
      expiryDate,
      status: 'pending'
    });
    setIssuer('');
    setNum('');
    setShowAddCert(false);
    alert("License uploaded! Credentials pending compliance review. Switch to the Compliance Auditor Dashboard at the top of the screen to verify it!");
  };

  const status = guard.userStatus || 'active';
  if (status === 'suspended' || status === 'blocked') {
    return (
      <div className="bg-white border-2 border-red-200 rounded-3xl p-8 max-w-2xl mx-auto text-center space-y-6 shadow-md my-12 animate-fade-in text-slate-850">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
            Account {status === 'suspended' ? 'Suspended' : 'Blocked / Terminated'}
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Your security personnel authorization file is currently restricted by platform operations staff. 
            You are blocked from accepting new shift assignments, checking credentials, or collecting payments.
          </p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl text-xs text-left font-mono border text-slate-500">
          <div className="flex justify-between border-b pb-2 mb-2">
            <span>OPERATOR BADGE:</span>
            <span className="font-bold text-slate-800">{guard.badgeNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>STATUS RESTRAINT:</span>
            <span className="font-bold text-red-700 uppercase">{status}</span>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Please contact our Compliance Operations Division or switch to the <strong>Staff Console</strong> to reactivate your credentials.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <ShiftMap
        jobs={isOnline ? mapJobs : assignedJobs}
        selectedJobId={selectedMapJobId}
        onSelectJob={setSelectedMapJobId}
        guardPosition={guardPosition}
      />

      {/* Floating guard driver header — Uber style */}
      <div className="absolute top-0 left-0 right-0 z-[1001] p-3 sm:p-4 pointer-events-none">
        <div className="flex items-start justify-between gap-3 pointer-events-auto">
          <div className="bg-neutral-950/95 border border-neutral-800 px-3 py-2 flex items-center gap-2 backdrop-blur-sm">
            <Logo className="text-brand-primary shrink-0" size={22} />
            <div>
              <p className="text-[8px] font-mono uppercase text-neutral-500 leading-none">Guardr Driver</p>
              <p className="text-xs font-black uppercase tracking-wide">{guard.name.split(' ')[0]}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsOnline(!isOnline)}
              className={`px-3 py-2 text-[10px] font-black font-mono uppercase tracking-widest border backdrop-blur-sm ${
                isOnline ? 'bg-white text-black border-white' : 'bg-neutral-950/95 text-neutral-400 border-neutral-800'
              }`}
            >
              {isOnline ? 'ON-DUTY' : 'GO ONLINE'}
            </button>
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="p-2 bg-neutral-950/95 border border-neutral-800 text-white backdrop-blur-sm"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-2 flex gap-1 pointer-events-auto overflow-x-auto pb-1">
          {(['dispatch', 'marketplace', 'earnings', 'credentials'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider border backdrop-blur-sm ${
                activeTab === tab
                  ? 'bg-brand-primary text-black border-brand-primary'
                  : 'bg-neutral-950/90 text-neutral-400 border-neutral-800'
              }`}
            >
              {tab === 'dispatch' && 'Map'}
              {tab === 'marketplace' && `Shifts (${availableJobs.length})`}
              {tab === 'earnings' && 'Wallet'}
              {tab === 'credentials' && 'Licenses'}
            </button>
          ))}
        </div>
      </div>

      {/* Dispatch bottom sheet over full-screen map */}
      {activeTab === 'dispatch' && (
        <div className="guardr-bottom-sheet p-4 space-y-3">
          {!isOnline ? (
            <div className="text-center py-6">
              <Compass className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
              <p className="text-sm font-bold uppercase">You are off-duty</p>
              <p className="text-xs text-neutral-400 mt-1 font-mono">Go online to see shift locations on the map and accept contracts.</p>
            </div>
          ) : selectedMapJob ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-mono text-brand-primary uppercase font-black">{selectedMapJob.type.replace('-', ' ')}</p>
                  <h3 className="font-bold text-sm">{selectedMapJob.title}</h3>
                  <p className="text-xs text-neutral-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {selectedMapJob.location}
                  </p>
                  <p className="text-[10px] font-mono text-neutral-500 mt-1">{formatShiftRange(selectedMapJob.startDate, selectedMapJob.endDate)}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black font-mono text-brand-primary">${selectedMapJob.estimatedPayout}</p>
                  <p className="text-[10px] font-mono text-neutral-500">${selectedMapJob.hourlyRate}/hr • {formatDuration(selectedMapJob.durationHours)}</p>
                </div>
              </div>
              {selectedMapJob.status === 'open' && (
                <button
                  type="button"
                  onClick={() => {
                    onAcceptJob(selectedMapJob.id);
                    setIsNavigating(selectedMapJob.id);
                    setSimulatedMiles(1.2);
                    setSimulatedEta(4);
                    alert('Shift accepted. Navigate to the pin and complete check-in when you arrive.');
                  }}
                  disabled={!guard.verified || (selectedMapJob.armedRequired && !guard.isArmed)}
                  className="w-full py-3 bg-brand-primary text-black font-black font-mono text-xs uppercase tracking-wider disabled:opacity-40"
                >
                  Accept Shift
                </button>
              )}
              <button type="button" onClick={() => setSelectedMapJobId(null)} className="w-full py-2 border border-neutral-700 text-[10px] font-mono uppercase text-neutral-400">
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] font-mono uppercase text-neutral-500">
                {availableJobs.length} open shifts on map • Session {formatOnlineDuration(onlineSeconds)}
              </p>
              <p className="text-xs text-neutral-400">Tap a sage pin to view shift details and accept.</p>
              {availableJobs.slice(0, 3).map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => setSelectedMapJobId(job.id)}
                  className="w-full text-left border border-neutral-800 p-3 hover:border-brand-primary transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold truncate pr-2">{job.title}</span>
                    <span className="text-sm font-black font-mono text-brand-primary">${job.estimatedPayout}</span>
                  </div>
                  <p className="text-[10px] text-neutral-500 font-mono mt-1">{job.location}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Non-map panels slide over full screen */}
      {activeTab !== 'dispatch' && (
        <div className="absolute inset-0 z-[1002] bg-brand-bg overflow-y-auto pt-28 pb-8 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
          {/* Tab 2:💼 BOARD (Available assignments marketplace) */}
          {activeTab === 'marketplace' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 font-mono text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-slate-700" />
                  Active Shifts Pool ({availableJobs.length} Open)
                </h3>
              </div>

              {availableJobs.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs">
                  All security dispatches are currently filled. New jobs will propagate in real-time.
                </div>
              ) : (
                <div className="space-y-4 text-slate-800">
                  {availableJobs.map(job => {
                    const armedMismatch = job.armedRequired && !guard.isArmed;
                    const isQualified = guard.verified && !armedMismatch;

                    return (
                      <div key={job.id} className="bg-white border rounded-xl p-5 hover:shadow-md transition-all space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-[9px] font-mono font-bold bg-slate-100 py-0.5 px-1.5 rounded text-slate-700 uppercase">
                                {job.type.replace('-', ' ')}
                              </span>
                              {job.armedRequired && (
                                <span className="text-[8px] font-mono font-black bg-red-100 text-red-800 py-0.5 px-1.5 rounded">ARMED</span>
                              )}
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm mt-1.5">{job.title}</h4>
                            <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-1">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{job.location}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-slate-400 text-[10px] block font-mono uppercase">ESTIMATED PAYOUT</span>
                            <span className="text-lg font-bold font-mono text-slate-900">${job.estimatedPayout}</span>
                            <span className="text-[10px] text-slate-450 block font-mono">${job.hourlyRate}/hr • {formatDuration(job.durationHours)}</span>
                            <span className="text-[9px] text-brand-text-muted block font-mono mt-0.5">{formatShiftRange(job.startDate, job.endDate)}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                          {job.description}
                        </p>

                        <div className="text-[11px] font-mono space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Job Requirements Checklist:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                            {job.armedRequired && (
                              <span className={guard.isArmed ? 'text-green-600' : 'text-red-600 font-bold'}>
                                {guard.isArmed ? '✓ Armed permit approved' : '❌ LACKS Armed certification'}
                              </span>
                            )}
                            {job.requiredCertifications.map(reqCert => {
                              const hasCert = guard.certifications.some(c => c.name.toLowerCase().includes(reqCert.toLowerCase()) && c.status === 'verified');
                              return (
                                <span key={reqCert} className={hasCert ? 'text-green-600' : 'text-amber-600'}>
                                  {hasCert ? `✓ Verified: ${reqCert}` : `⚠ Lacks verified cert: ${reqCert}`}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* Accept flow button */}
                        <div className="pt-3 border-t flex items-center justify-between flex-wrap gap-3">
                          <span className="text-[11px] font-mono text-slate-500">
                            {isQualified ? '✓ Match score 100%' : '⚠️ Credentials restricted'}
                          </span>

                          <button
                            onClick={() => {
                              onAcceptJob(job.id);
                              setIsNavigating(job.id);
                              setSimulatedMiles(1.2);
                              setSimulatedEta(4);
                              setVehicleCoo({ x: 40, y: 70 });
                              setGpsVerified(false);
                              setActiveTab('dispatch');
                              alert("✓ Dispatch Accepted! Navigating to site facility automatically. Check en-route status under the Dispatch tab.");
                            }}
                            disabled={!isQualified}
                            className={`font-semibold px-5 py-2.5 rounded-lg text-xs tracking-wide uppercase font-mono transition-all cursor-pointer ${
                              isQualified
                                ? 'bg-sage-600 text-white hover:bg-sage-700 shadow shadow-sage-500/10'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            }`}
                          >
                            Accept Assignment
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 3:💳 EARNINGS (Driver immediate Cashout balance list) */}
          {activeTab === 'earnings' && (
            <div className="space-y-6 text-slate-800">
              
              {/* Earnings Cashout Hero Panel */}
              <div className="bg-gradient-to-br from-sage-750 to-sage-950 bg-[#162514] text-white p-6 rounded-3xl space-y-4 shadow-xl border border-sage-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-sage-300 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-sage-400 animate-pulse" />
                    Secure Guardr Ledger Wallet
                  </span>
                  <span className="text-[8px] bg-emerald-500 text-slate-950 font-mono py-0.5 px-2 rounded-md font-bold uppercase">
                    INSTANT PAYOUT ENABLED
                  </span>
                </div>

                <div className="py-4">
                  <span className="text-[11px] font-mono text-slate-400 uppercase">Immediate Cashable balance</span>
                  <h2 className="text-4xl font-mono font-black text-white mt-1">
                    ${digitalWalletBalance} <span className="text-lg text-sage-400 font-bold">USD</span>
                  </h2>
                </div>

                {cashoutTimer ? (
                  <div className="p-3 bg-slate-950/40 rounded-xl border border-sage-800 text-center animate-pulse text-xs text-sage-400">
                    🔄 CONNECTING TO FEDERAL ESCROW DEBIT DISPATCH GATES...
                  </div>
                ) : (
                  <button
                    onClick={handleInstantCashoutSubmit}
                    disabled={digitalWalletBalance <= 0}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-mono text-xs font-black uppercase rounded-2xl shadow-lg shadow-emerald-500/10 tracking-widest transition-transform hover:scale-[1.01] cursor-pointer"
                  >
                    💸 Cash Out instantly to Registered Card
                  </button>
                )}
              </div>

              {/* Cashout Success Confirmation alert */}
              {cashoutAmount !== null && !cashoutTimer && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl animate-bounce text-xs flex justify-between items-center">
                  <span>💵 <strong>Instant cash-out completed!</strong> ${cashoutAmount} USD successfully deposited into registered Debit Card ****9012. Balance is cleared.</span>
                  <button onClick={() => setCashoutAmount(null)} className="font-black text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded hover:bg-emerald-100">Dismiss</button>
                </div>
              )}

              {/* Completed Jobs historical list */}
              <div className="space-y-4">
                <h4 className="font-extrabold font-mono text-xs text-slate-900 uppercase tracking-wider">Historical Patrol earnings ({completedJobs.length})</h4>
                
                {completedJobs.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 border border-dashed rounded-xl text-xs bg-slate-50">
                    No historical completions logged. Finalize active shifts on duty to register earnings.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedJobs.map(job => (
                      <div key={job.id} className="p-4 bg-white border rounded-xl text-xs flex justify-between items-center gap-3 hover:border-slate-300">
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono text-[10px] bg-slate-100 py-0.5 px-2 rounded font-bold uppercase">{job.type}</span>
                            <span className="text-[10px] text-slate-400 font-mono font-medium">Duty Completed ✓</span>
                          </div>
                          <h4 className="font-bold text-slate-900 mt-1">{job.title}</h4>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">site: {job.location}</span>
                        </div>
                        <div className="text-right font-mono font-extrabold text-[#1c2e19] text-sm bg-sage-50 border border-sage-100 p-2 rounded-xl">
                          +${job.estimatedPayout}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 4:🪪 CREDENTIALS (Certifications licenses checklist) */}
          {activeTab === 'credentials' && (
            <div className="space-y-4 text-slate-800">
              
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold font-mono text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-slate-700" />
                  Verified State Certifications Cardr
                </h3>
                <button
                  onClick={() => setShowAddCert(!showAddCert)}
                  className="bg-sage-600 hover:bg-sage-700 text-white text-[11px] font-black font-mono flex items-center gap-1 p-2 px-3 rounded-lg cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>UPLOAD LICENSE SERIAL</span>
                </button>
              </div>

              {/* Add Certificate form */}
              {showAddCert && (
                <form onSubmit={handleSubmitCert} className="bg-slate-50 p-4 rounded-xl border space-y-3 text-xs animate-slide-up">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold font-mono text-slate-400 block uppercase">Certification Standard Name</label>
                    <select
                      value={certName}
                      onChange={(e) => setCertName(e.target.value)}
                      className="w-full bg-white border rounded p-1 text-[11px] outline-none text-slate-800"
                    >
                      {PREFAB_CERT_LIST.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold font-mono text-slate-400 block uppercase">Issuer Body</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. State Licensing Dept"
                        value={issuer}
                        onChange={(e) => setIssuer(e.target.value)}
                        className="w-full bg-white border rounded px-2 py-1 outline-none text-[11px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold font-mono text-slate-400 block uppercase">Serial / License #</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. BS-28192A"
                        value={num}
                        onChange={(e) => setNum(e.target.value)}
                        className="w-full bg-white border rounded px-2 py-1 outline-none text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="pt-1 flex justify-end space-x-1.5">
                    <button type="button" onClick={() => setShowAddCert(false)} className="text-slate-500 font-medium px-3 py-1 bg-white border rounded-lg">Cancel</button>
                    <button type="submit" className="bg-sage-600 text-white font-semibold px-4 py-1.5 rounded-lg hover:bg-sage-700 font-mono text-xs">SUBMIT AUDIT</button>
                  </div>
                </form>
              )}

              {/* Certifications list */}
              <div className="space-y-3">
                {guard.certifications.map(cert => (
                  <div 
                    key={cert.id} 
                    className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-xs ${
                      cert.status === 'verified'
                        ? 'bg-emerald-50/25 border-emerald-100'
                        : cert.status === 'rejected'
                        ? 'bg-red-50/25 border-red-100'
                        : 'bg-slate-50 border-slate-205'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="font-extrabold text-slate-900">{cert.name}</p>
                      <div className="font-mono text-[10px] text-slate-500 space-y-0.5 mt-1">
                        <p>Issuer Body: {cert.issuer}</p>
                        <p>Registration Serial Number: {cert.number}</p>
                        <p>Expiration Date: {cert.expiryDate}</p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded text-[8px] font-mono uppercase font-black shrink-0 ${
                      cert.status === 'verified'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        : cert.status === 'rejected'
                        ? 'bg-red-50 text-red-800 border border-red-300'
                        : 'bg-slate-100 text-slate-600 border animate-pulse'
                    }`}>
                      {cert.status}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

      </div>
      )}

    </div>
  );
}
