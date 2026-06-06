import React, { useState, useEffect, useRef } from 'react';
import { SecurityRequest, SecurityGuard, Certification } from '../types';
import { PREFAB_CERT_LIST } from '../initialData';
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
  ChevronLeft
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
}

export function GuardDashboard({
  guard,
  requests,
  onAddCertification,
  onAcceptJob,
  onUpdateJobAudit,
  onRecordAuditViolation
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

  // Get filtered lists of requests
  const availableJobs = requests.filter(r => r.status === 'open');
  const assignedJobs = requests.filter(r => r.assignedGuardId === guard.id && r.status !== 'completed');
  const activeJobOnDuty = assignedJobs.find(r => r.status === 'in-progress');
  const assignedNotClockedIn = assignedJobs.find(r => r.status === 'assigned');
  const completedJobs = requests.filter(r => r.assignedGuardId === guard.id && r.status === 'completed');

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
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* 1. Uber style top controller & radar status panel */}
      <div className="bg-neutral-950 border border-neutral-900 p-6 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-5 rounded-none shadow-none">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className={`w-12 h-12 flex items-center justify-center border transition-all ${
              isOnline ? 'bg-neutral-900 border-white text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-400'
            }`}>
              <Compass className={`w-6 h-6 ${isOnline ? 'animate-spin' : ''}`} style={{ animationDuration: '10s' }} />
            </div>
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-white border border-neutral-950"></span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm uppercase tracking-wider font-mono">Uber Escrow Dispatch</span>
              <span className={`text-[9px] font-mono font-black py-0.5 px-2 ${
                isOnline ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
              }`}>{isOnline ? 'LIVE' : 'STANDBY'}</span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5 font-mono">
              {isOnline 
                ? `Active Matchmaker • Online Session Duration: ${formatOnlineDuration(onlineSeconds)}` 
                : 'Offline State • Go active to match security contracts.'}
            </p>
          </div>
        </div>

        {/* Uber segment tabs controller */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Go Online Slider */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 p-1 rounded-none mr-2">
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`px-3 py-1.5 text-xs font-bold font-mono uppercase tracking-widest transition-all cursor-pointer rounded-none border ${
                isOnline 
                  ? 'bg-white text-black border-white font-black' 
                  : 'bg-neutral-950 text-neutral-400 border-transparent'
              }`}
            >
              {isOnline ? 'ON-DUTY ACTIVE' : 'GO ONLINE'}
            </button>
          </div>

          <div className="bg-neutral-900 p-1 border border-neutral-800 flex text-xs font-mono rounded-none">
            <button 
              onClick={() => setActiveTab('dispatch')}
              className={`px-3 py-1.5 font-bold uppercase tracking-wider transition-all cursor-pointer rounded-none ${activeTab === 'dispatch' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}
            >
              ⚡ DISPATCH
            </button>
            <button 
              onClick={() => setActiveTab('marketplace')}
              className={`px-3 py-1.5 font-bold uppercase tracking-wider transition-all cursor-pointer rounded-none ${activeTab === 'marketplace' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}
            >
              💼 CONTRACTS ({availableJobs.length})
            </button>
            <button 
              onClick={() => setActiveTab('earnings')}
              className={`px-3 py-1.5 font-bold uppercase tracking-wider transition-all cursor-pointer rounded-none ${activeTab === 'earnings' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}
            >
              💳 WALLET
            </button>
            <button 
              onClick={() => setActiveTab('credentials')}
              className={`px-3 py-1.5 font-bold uppercase tracking-wider transition-all cursor-pointer rounded-none ${activeTab === 'credentials' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}
            >
              🪪 STATE LICENSES
            </button>
          </div>
        </div>
      </div>

      {/* Main viewport displays */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left column: Quick mini metrics and badges always visible */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Main quick stats widget */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-3xs text-slate-800">
            <div className="flex items-center space-x-3 pb-3 border-b">
              {guard.avatar ? (
                <img src={guard.avatar} alt={guard.name} className="w-11 h-11 rounded-full object-cover border border-slate-300 shadow-sm" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                  {guard.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h4 className="font-extrabold text-[13px] leading-tight text-slate-900">{guard.name}</h4>
                <div className="flex items-center gap-1.5 font-mono text-[9px] text-slate-500 mt-0.5">
                  <span>{guard.badgeNumber}</span>
                  <span>•</span>
                  <span className={guard.isArmed ? 'text-red-600 font-bold' : 'text-slate-600'}>
                    {guard.isArmed ? 'ARMED CERTIFIED' : 'UNARMED COMPLIANT'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">WALLET BALANCE</span>
                <span className="text-sm font-black font-mono text-slate-900">${digitalWalletBalance}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">SECURITY RATING</span>
                <span className="text-sm font-black font-mono text-slate-900">★ {guard.rating > 0 ? guard.rating : '5.0'}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-[10px] font-mono text-slate-500">
              <div className="flex justify-between items-center bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                <span>AUDIT STATUS:</span>
                <span className={`font-bold ${guard.verified ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {guard.verified ? 'APPROVED CARDR' : 'PENDING AUDIT'}
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                <span>VIOLATIONS PENALTY:</span>
                <span className={`font-bold ${(guard.failedAudits || 0) > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                  {guard.failedAudits || 0} / 3 FAILURES
                </span>
              </div>
            </div>
          </div>

          {/* Compliance Info Banner if profile is not approved yet */}
          {!guard.verified && (
            <div className="bg-amber-50 border border-amber-200 text-slate-800 p-4 rounded-xl animate-pulse text-xs space-y-2">
              <div className="flex gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                   <h4 className="font-bold text-amber-800 font-mono text-[10px] uppercase">Awaiting Compliance Review</h4>
                  <p className="text-slate-600 leading-normal mt-0.5">
                    Your state-licensed guard card certifications must be audited before active dispatches can be scheduled.
                  </p>
                </div>
              </div>
              <div className="bg-white border border-amber-100 p-2.5 rounded text-[10px] text-slate-500 leading-normal">
                💡 <strong>Evaluation Shortcut:</strong> Switch role to <strong className="text-blue-600">Compliance Auditor</strong> using the top simulator header, approve "{guard.name}" profile, then switch back to instantly unlock dispatch!
              </div>
            </div>
          )}
        </div>

        {/* Right column: Main dynamic container depends on active page tab selection */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tab 1:⚡ DISPATCH (Uber Cockpit Map and En Route compliance checkpoints) */}
          {activeTab === 'dispatch' && (
            <div className="space-y-6">
              
              {/* If operator is offline, prompt them to go online */}
              {!isOnline ? (
                <div className="bg-white border border-slate-200 p-12 text-center rounded-2xl shadow-sm text-slate-500 max-w-lg mx-auto">
                  <Compass className="w-12 h-12 text-slate-300 mx-auto mb-4 stroke-1 animate-pulse" />
                  <h4 className="font-bold text-slate-800 text-sm uppercase">You are currently Off-Duty</h4>
                  <p className="text-xs text-slate-450 mt-1 max-w-sm mx-auto">Toggle the active slider in the top right controller bar to go online, accept high-payout dispatches, and commence compliance checkpoints.</p>
                </div>
              ) : (
                <>
                  {/* Uber style SVG Street Navigation GPS Map */}
                  <div className="bg-slate-950 text-white rounded-3xl border border-slate-800 outline-none overflow-hidden relative shadow-2xl">
                    
                    {/* SVG Map grids */}
                    <div className="relative h-64 bg-[#0a0f09] overflow-hidden">
                      <svg className="absolute inset-0 w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <pattern id="street-grid animate" width="40" height="40" patternUnits="userSpaceOnUse">
                            <rect width="40" height="40" fill="none" />
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#223e1e" strokeWidth="0.75" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#street-grid animate)" />
                        
                        {/* Street layout lines */}
                        <path d="M -50,60 L 600,60" fill="none" stroke="#162e15" strokeWidth="6" />
                        <path d="M -50,190 L 600,190" fill="none" stroke="#162e15" strokeWidth="6" />
                        <path d="M 110,-20 L 110,400" fill="none" stroke="#162e15" strokeWidth="6" />
                        <path d="M 320,-20 L 320,400" fill="none" stroke="#162e15" strokeWidth="6" strokeDasharray="3,3" />
                        
                        {/* Connecting navigation route if en-route is active */}
                        {isNavigating && (
                          <path d="M 40,70 L 112,70 L 112,192 L 318,192 L 318,212" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="5,3" className="animate-pulse" />
                        )}
                      </svg>

                      {/* Pulsing Target marker pin */}
                      {isNavigating ? (
                        <div className="absolute" style={{ left: '318px', top: '212px', transform: 'translate(-50%, -100%)' }}>
                          <span className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-amber-500/30 animate-ping"></span>
                          <MapPin className="w-6 h-6 text-amber-500 fill-amber-950 animate-bounce cursor-pointer" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-32 h-32 rounded-full border border-emerald-500/10 animate-ping pointer-events-none absolute"></div>
                          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 animate-pulse flex items-center justify-center">
                            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                          </div>
                        </div>
                      )}

                      {/* Moving driver guard dispatch vehicle dot on map */}
                      {isNavigating && (
                        <div className="absolute transition-all duration-1000" style={{ left: `${vehicleCoo.x}px`, top: `${vehicleCoo.y}px`, transform: 'translate(-50%, -50%)' }}>
                          <span className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-emerald-400/20 animate-ping"></span>
                          <div className="p-1 px-1.5 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center border border-white font-black text-[8px] tracking-tighter">
                            🚓 PATROL
                          </div>
                        </div>
                      )}

                      {/* Floating status details */}
                      <div className="absolute top-3 left-3 bg-slate-950/95 border border-[#1d351a] p-2 px-3 rounded-lg text-[9px] font-mono tracking-wider space-y-0.5 shadow-xl">
                        <p className="text-slate-400 uppercase">TELEMETRY SYSTEM</p>
                        <p className="text-emerald-400 font-extrabold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          GPS LOCK {isOnline ? 'ACTIVE • 4.2M' : 'STANDBY'}
                        </p>
                      </div>

                      {/* Simulation HUD if en-route */}
                      {isNavigating && (
                        <div className="absolute top-3 right-3 bg-slate-950/95 border border-amber-500/30 p-2 px-3 rounded-lg text-[9px] font-mono tracking-wider space-y-0.5 shadow-xl">
                          <span className="text-yellow-400 block uppercase">EN-ROUTE TELEMETRY</span>
                          <p className="text-slate-300">ETA: {simulatedEta} mins • {simulatedMiles} miles</p>
                        </div>
                      )}
                    </div>

                    {/* Navigation control overlay footer panel */}
                    <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                      <div className="flex items-center space-x-2">
                        {isNavigating ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                            <span className="font-mono text-slate-400">Heading to patrol facility...</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="font-mono text-emerald-400">Listening to active geofenced dispatches...</span>
                          </>
                        )}
                      </div>

                      {isNavigating && simulatedMiles > 0.1 && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSimulatedMiles(0.02);
                              setSimulatedEta(0);
                              setVehicleCoo({ x: 320, y: 210 });
                            }}
                            className="bg-amber-500/10 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 p-1.5 px-3 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-colors"
                          >
                            ⏩ FAST-FORWARD NAVIGATION (SIMULATE ARRIVAL)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Incoming Uber Alert Ping Overlay (if online but no active trip) */}
                  {availableJobs.length > 0 && !isNavigating && !activeJobOnDuty && (
                    <div className="bg-[#111812] border-2 border-emerald-500 text-slate-100 p-5 rounded-3xl space-y-4 animate-bounce relative shadow-2xl">
                      <div className="absolute top-2 right-2 flex items-center space-x-1 font-mono text-[8px] bg-emerald-950 text-emerald-400 py-0.5 px-1.5 rounded border border-emerald-800">
                        <Activity className="w-3 h-3 text-emerald-400 animate-spin" />
                        <span>RADAR MATCH!</span>
                      </div>
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-extrabold uppercase">
                            {availableJobs[0].type.replace('-', ' ')}
                          </span>
                          <h4 className="font-black text-white text-base mt-2">{availableJobs[0].title}</h4>
                          <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-1">
                            <MapPin className="w-4 h-4 text-emerald-500" />
                            <span>{availableJobs[0].location}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] uppercase font-mono block text-slate-400">Guaranteed pay</span>
                          <span className="text-2xl font-mono text-emerald-400 font-extrabold">${availableJobs[0].estimatedPayout}</span>
                          <span className="text-[10px] text-slate-450 block font-mono">${availableJobs[0].hourlyRate}/hr • {availableJobs[0].durationHours} hrs</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-2 bg-slate-950 p-3 rounded-xl border border-slate-850">
                        {availableJobs[0].description}
                      </p>

                      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 text-[10px] font-mono">
                        <span className="text-emerald-500 font-extrabold flex items-center gap-1.5">
                          ✓ Match score: 100% credential compliant
                        </span>
                        
                        <button
                          onClick={() => {
                            if (!guard.verified) {
                              alert("⚠️ Cannot accept dispatch. Audit is required first! Please verify credentials under the Auditor tab.");
                              return;
                            }
                            onAcceptJob(availableJobs[0].id);
                            setIsNavigating(availableJobs[0].id);
                            setSimulatedMiles(1.2);
                            setSimulatedEta(4);
                            setVehicleCoo({ x: 40, y: 70 });
                            setGpsVerified(false);
                          }}
                          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-1"
                        >
                          <span>SLIDE TO ACCEPT DISPATCH</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 2. Active Trip En Route Section */}
                  {isNavigating && (
                    <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 p-5 space-y-4 shadow-xl">
                      {(() => {
                        const activeNavJob = requests.find(r => r.id === isNavigating);
                        if (!activeNavJob) return null;

                        const arrivedOnScene = simulatedMiles <= 0.05;

                        return (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                              <div className="flex items-center space-x-2">
                                <span className="bg-amber-500 text-slate-950 font-mono text-[9px] uppercase font-bold py-0.5 px-2 rounded-md">
                                  EN ROUTE
                                </span>
                                <h4 className="font-extrabold text-sm">{activeNavJob.title}</h4>
                              </div>
                              <span className="text-xs font-mono text-slate-400">{activeNavJob.location}</span>
                            </div>

                            <p className="text-xs text-slate-350">{activeNavJob.description}</p>

                            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex items-center justify-between">
                              <div className="font-mono text-xs">
                                <span className="text-slate-500 uppercase block text-[8px]">PROXIMITY LOCK</span>
                                <p className="text-slate-200 mt-0.5 font-bold">
                                  GPS: {simulatedMiles} miles remaining
                                </p>
                              </div>
                              <div className="font-mono text-right text-xs">
                                <span className="text-slate-500 uppercase block text-[8px]">SHUTTLE ETA</span>
                                <p className="text-amber-400 font-bold">
                                  {simulatedEta} mins to destination
                                </p>
                              </div>
                            </div>

                            {/* Trigger pre-shift compliance (Phase 7) */}
                            {arrivedOnScene ? (
                              <div className="space-y-4 animate-fade-in pt-2">
                                <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-400 rounded-xl flex items-start gap-2">
                                  <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                  <p>
                                    📍 <strong>On-Scene Proximity Lock Acclaimed!</strong> Geofence unlocked. Please execute the following <strong>Pre-Shift Self Compliance Audit</strong> to clock-in.
                                  </p>
                                </div>

                                <div className="pt-2">
                                  <button
                                    onClick={() => {
                                      setCheckingInJobId(activeNavJob.id);
                                      setActiveWorkflowStep('checks');
                                      setGpsVerified(true);
                                    }}
                                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 font-bold font-mono text-slate-950 rounded-2xl text-xs uppercase cursor-pointer shadow-lg tracking-wider"
                                  >
                                    🚨 COMMENCE COMPLIANCE SELF-AUDIT DESK
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex items-center justify-between text-xs text-slate-400">
                                <span>You must get within geofenced site radius to execute Check-In self audits.</span>
                                <button 
                                  onClick={() => {
                                    setSimulatedMiles(0.02);
                                    setSimulatedEta(0);
                                    setVehicleCoo({ x: 320, y: 210 });
                                  }}
                                  className="text-amber-400 text-[10px] font-mono hover:underline font-bold"
                                >
                                  [Simulate Driving Site]
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* 3. Pre Shift Self-Audit Desk Workspace Tray (Phase 7) */}
                  {checkingInJobId && (
                    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl text-white">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-850">
                        <h5 className="text-[11px] font-mono font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Activity className="w-4 h-4 animate-spin text-amber-500" />
                          Pre-Shift Outfitting Compliance Audit
                        </h5>
                        <button
                          onClick={() => setCheckingInJobId(null)}
                          className="text-[9px] px-2.5 py-1 text-slate-400 font-mono bg-slate-900 border border-slate-800 rounded-lg hover:text-white hover:border-slate-700 cursor-pointer"
                        >
                          Abort
                        </button>
                      </div>

                      {/* step indices */}
                      <div className="grid grid-cols-4 gap-1 text-[8px] font-mono font-bold text-center">
                        <button onClick={() => setActiveWorkflowStep('gps')} className={`py-1.5 rounded ${activeWorkflowStep === 'gps' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>1. GPS radar</button>
                        <button onClick={() => setActiveWorkflowStep('checks')} className={`py-1.5 rounded ${activeWorkflowStep === 'checks' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>2. Apparel Checks</button>
                        <button onClick={() => setActiveWorkflowStep('photos')} className={`py-1.5 rounded ${activeWorkflowStep === 'photos' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>3. Selfies</button>
                        <button onClick={() => setActiveWorkflowStep('sign')} className={`py-1.5 rounded ${activeWorkflowStep === 'sign' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>4. Certified Sign</button>
                      </div>

                      {/* SUBSTEP 1: GPS GEOLOCATION CHECK */}
                      {activeWorkflowStep === 'gps' && (
                        <div className="p-4 bg-slate-900 rounded-2xl border border-slate-850 text-center space-y-3">
                          <span className="text-[9px] font-mono block text-slate-400 uppercase">GEOFENCED DISPATCH BOUNDS</span>
                          <div className="py-4 flex flex-col items-center">
                            {gpsLoading ? (
                              <div className="space-y-2">
                                <div className="w-10 h-10 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto flex items-center justify-center">
                                  <MapPin className="w-4 h-4 text-amber-500 animate-pulse" />
                                </div>
                                <p className="text-[10px] font-mono text-amber-400 animate-pulse">PINGING TELEMETRY TOWERS...</p>
                              </div>
                            ) : gpsVerified ? (
                              <div className="space-y-2">
                                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto animate-bounce" />
                                <p className="text-[10px] font-mono text-emerald-400 font-extrabold">✓ ESCROW SITE LOCATION LOCKED</p>
                                <p className="text-[9px] text-slate-400">Positioned inside geofence bounds (12 meters to center)</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <MapPin className="w-8 h-8 text-slate-500 mx-auto" />
                                <p className="text-[10px] font-mono text-slate-350">GPS Verification required to lock clock-in checks</p>
                              </div>
                            )}
                          </div>
                          {!gpsVerified && !gpsLoading && (
                            <button onClick={handleGPSVerificationClick} className="w-full py-2 bg-sage-600 hover:bg-slate-750 font-mono text-[10px] font-bold rounded-lg cursor-pointer">📍 ACQUIRE DEVICE GPS LATENCY SIGNAL</button>
                          )}
                          {gpsVerified && (
                            <button onClick={() => setActiveWorkflowStep('checks')} className="w-full py-2 bg-emerald-500 text-slate-950 font-mono text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 hover:bg-emerald-400 cursor-pointer">
                              <span>Proceed to Dress-Check Checklists</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* SUBSTEP 2: OUT-FITTING COMPLIANCE CHECKS */}
                      {activeWorkflowStep === 'checks' && (
                        <div className="space-y-3">
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[10px] text-amber-350 flex gap-1.5 leading-normal">
                            <Info className="w-4 h-4 text-amber-500 shrink-0" />
                            <p><strong>Compliance Code Mandate:</strong> Unchecking clothing items triggers violation failures. Three compliance failures cause automatic system suspension.</p>
                          </div>

                          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-3 space-y-2 text-xs">
                            <span className="text-[9px] font-mono font-bold uppercase text-slate-400 border-b border-slate-850 pb-1 block">👚 Uniform Garments Checklist</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {Object.keys(uniformChecks).map(key => (
                                <label key={key} className="flex items-center space-x-2 p-2 bg-slate-950/60 border border-slate-850 rounded-lg cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={(uniformChecks as any)[key]} 
                                    onChange={() => setUniformChecks(prev => ({ ...prev, [key]: !(prev as any)[key] }))}
                                    className="rounded text-amber-500 focus:ring-0 w-4 h-4 cursor-pointer" 
                                  />
                                  <span className="font-sans text-[11px] text-slate-200 capitalize">{key.replace('belt', 'duty belt').replace('footwear', 'composite shoes')} present</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-3 space-y-2 text-xs">
                            <span className="text-[9px] font-mono font-bold uppercase text-slate-400 border-b border-slate-850 pb-1 block">📻 Operational Tactical Equipment</span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {Object.keys(equipmentChecks).map(key => (
                                <label key={key} className="flex items-center space-x-2 p-2 bg-slate-950/60 border border-slate-850 rounded-lg cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={(equipmentChecks as any)[key]} 
                                    onChange={() => setEquipmentChecks(prev => ({ ...prev, [key]: !(prev as any)[key] }))}
                                    className="rounded text-amber-500 focus:ring-0 w-4 h-4 cursor-pointer" 
                                  />
                                  <span className="font-mono text-[9px] text-slate-350 capitalize">{key.replace('radio', 'Transceiver radio').replace('phoneCharged', 'Phone 80% charged')}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <button onClick={() => setActiveWorkflowStep('photos')} className="w-full py-2 bg-sage-600 hover:bg-sage-700 font-mono text-[10px] font-bold rounded-lg cursor-pointer">Proceed to Photo Verification Scanner</button>
                        </div>
                      )}

                      {/* SUBSTEP 3: COMPLIANCE PICTURE SNAPSHOTS */}
                      {activeWorkflowStep === 'photos' && (
                        <div className="space-y-3">
                          <span className="text-[9px] font-mono text-slate-450 block text-center uppercase">Live Camera Feed snaps (Mandatory)</span>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-center">
                            <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex flex-col items-center justify-center space-y-2">
                              <span className="text-[9px] font-mono text-slate-400 block uppercase">1. Front-Facing Selfie</span>
                              {photoFront ? (
                                <img src={photoFront} alt="selfie" className="w-20 h-20 rounded-full border border-slate-700 object-cover" />
                              ) : (
                                <div className="w-20 h-20 bg-slate-950 rounded-full border border-slate-800 flex items-center justify-center text-slate-500">
                                  <Camera className="w-6 h-6" />
                                </div>
                              )}
                              <button
                                type="button"
                                disabled={cameraLoading}
                                onClick={() => triggerCameraSnapper('front')}
                                className="px-2.5 py-1 bg-slate-900 border border-slate-700 font-bold font-mono text-[9px] rounded-lg hover:bg-slate-850 text-slate-400 hover:text-white shrink-0 cursor-pointer"
                              >
                                {cameraLoading && activeCamTarget === 'front' ? 'Capturing...' : '📷 Snap Selfie'}
                              </button>
                            </div>

                            <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex flex-col items-center justify-center space-y-2">
                              <span className="text-[9px] font-mono text-slate-400 block uppercase">2. Full-Body check picture</span>
                              {photoFull ? (
                                <img src={photoFull} alt="full body" className="w-20 h-20 rounded-md border border-slate-700 object-cover" />
                              ) : (
                                <div className="w-20 h-20 bg-slate-950 rounded-md border border-slate-800 flex items-center justify-center text-slate-500">
                                  <Camera className="w-6 h-6" />
                                </div>
                              )}
                              <button
                                type="button"
                                disabled={cameraLoading}
                                onClick={() => triggerCameraSnapper('full')}
                                className="px-2.5 py-1 bg-slate-900 border border-slate-700 font-bold font-mono text-[9px] rounded-lg hover:bg-slate-850 text-slate-400 hover:text-white shrink-0 cursor-pointer"
                              >
                                {cameraLoading && activeCamTarget === 'full' ? 'Capturing...' : '📷 Snap Full-Body'}
                              </button>
                            </div>
                          </div>

                          <button onClick={() => setActiveWorkflowStep('sign')} className="w-full py-2 bg-sage-600 hover:bg-sage-700 font-mono text-[10px] font-bold rounded-lg cursor-pointer">Proceed to Digital Sign-Off lock</button>
                        </div>
                      )}

                      {/* SUBSTEP 4: HAND-SIGNED CERTIFICATION LEGAL OFF */}
                      {activeWorkflowStep === 'sign' && (
                        <div className="space-y-4">
                          <blockquote className="bg-slate-900/60 p-3 rounded-lg border-l-2 border-amber-500 text-[10px] text-slate-300 italic">
                            "I certify under penalty of state regulatory compliance operational code that I am on scene at the designated coordinates, dressed in complete uniform outfit matching specifications, and fully equipped with compliance transceivers."
                          </blockquote>

                          <div className="space-y-3">
                            <SignaturePad 
                              onSave={(val) => setSignatureInked(val)} 
                              initialSig={signatureInked} 
                            />

                            <div className="space-y-1">
                              <label className="text-[9px] font-mono text-slate-400 uppercase">Print Legal Full Name</label>
                              <input 
                                type="text"
                                required
                                placeholder="State Approved Legal Legal Name"
                                value={typedCheckInName}
                                onChange={(e) => setTypedCheckInName(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 text-xs font-sans text-white p-2.5 rounded-lg focus:ring-0 text-black shadow-inner"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCheckInComplete(checkingInJobId)}
                            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-extrabold uppercase font-mono rounded-lg tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>LOCK AUDIT & CLOCK-IN SHIFT</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. Active Shift On Scene Patrol Ticker Controls */}
                  {activeJobOnDuty && (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white space-y-4 shadow-xl">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800 flex-wrap gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="bg-emerald-950 text-emerald-400 border border-emerald-900 text-[8px] font-mono px-2 py-0.5 rounded font-bold uppercase">Patrolling</span>
                          <h4 className="font-extrabold text-xs">{activeJobOnDuty.title}</h4>
                        </div>
                        <span className="text-[10px] font-mono text-slate-450">Active on site: {activeJobOnDuty.location}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-center text-xs">
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                          <span className="text-[8px] font-mono text-slate-500 block uppercase">GUARANTEED INCOME</span>
                          <p className="text-emerald-400 font-bold text-sm">${activeJobOnDuty.estimatedPayout} Payout</p>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                          <span className="text-[8px] font-mono text-slate-500 block uppercase">HOURLY SERVICE PAY</span>
                          <p className="text-slate-200 font-bold text-sm">${activeJobOnDuty.hourlyRate} / hr</p>
                        </div>
                      </div>

                      {/* Phase 7 Quick action triggers */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        
                        <button
                          onClick={() => {
                            setMidShiftAuditParentId(activeJobOnDuty.id);
                            setMidShiftPhoto(null);
                            setMidShiftUniform(true);
                            setMidShiftEquip(true);
                          }}
                          className="p-3 bg-slate-950 hover:bg-slate-850 text-amber-400 rounded-xl border border-slate-800 font-bold transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ShieldAlert className="w-4 h-4 text-amber-500 animate-pulse" />
                          <span>Trigger Randomized Integrity Test</span>
                        </button>

                        <button
                          onClick={() => {
                            setCheckingOutJobId(activeJobOnDuty.id);
                            setCheckoutCompleteCheck(true);
                            setCheckoutNoViolations(true);
                            setCheckoutNoEquipIssues(true);
                          }}
                          className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl font-mono text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10 uppercase"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Finalize shift duties & clock-out</span>
                        </button>
                      </div>

                      {/* Embedded randomized integrity check module */}
                      {midShiftAuditParentId === activeJobOnDuty.id && (
                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 animate-slide-up text-xs">
                          <span className="text-[9px] font-mono text-amber-500 block uppercase tracking-wider font-extrabold pb-1 border-b border-slate-850">⚠️ RANDOM SITE INTEGRITY AUDIT DISPATCH</span>
                          <p className="text-slate-400 leading-normal">Compliance Operations requires verified outfitting check-in right now to retain shift eligibility.</p>
                          
                          <div className="space-y-3">
                            <label className="flex items-center space-x-2 p-2 bg-slate-900 border border-slate-850 rounded-lg cursor-pointer">
                              <input type="checkbox" checked={midShiftUniform} onChange={() => setMidShiftUniform(!midShiftUniform)} className="rounded text-amber-500 focus:ring-0" />
                              <span>Verify Apparel Shirt & Credentials visible</span>
                            </label>
                            
                            <label className="flex items-center space-x-2 p-2 bg-slate-900 border border-slate-850 rounded-lg cursor-pointer">
                              <input type="checkbox" checked={midShiftEquip} onChange={() => setMidShiftEquip(!midShiftEquip)} className="rounded text-amber-500 focus:ring-0" />
                              <span>Verify heavy-duty Belt equipped with Transceiver</span>
                            </label>

                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-850 flex flex-col items-center justify-center space-y-2">
                              <span className="text-[9px] font-mono text-slate-400 block uppercase">Verify Selfie Snaps</span>
                              {midShiftPhoto ? (
                                <img src={midShiftPhoto} alt="mid check selfie" className="w-16 h-16 rounded-full border border-slate-700 object-cover" />
                              ) : (
                                <div className="w-16 h-16 bg-slate-950 rounded-full border border-slate-800 flex items-center justify-center text-slate-500">
                                  <Camera className="w-5 h-5" />
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => triggerCameraSnapper('mid')}
                                className="px-2 py-1 bg-slate-950 border border-slate-800 text-[9px] font-mono text-slate-350 hover:text-white rounded hover:border-slate-600 shrink-0 cursor-pointer"
                              >
                                {cameraLoading && activeCamTarget === 'mid' ? 'Snapping...' : '📷 Snapshot verification selfie'}
                              </button>
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end text-[10px]">
                            <button onClick={() => setMidShiftAuditParentId(null)} className="px-3 py-1 bg-slate-900 text-slate-400 rounded-lg">Dismiss</button>
                            <button onClick={() => handleMidShiftAuditSubmit(activeJobOnDuty.id)} className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold font-mono uppercase rounded-lg shadow cursor-pointer">🔒 LOCK MID-SHIFT COMPLIANCE</button>
                          </div>
                        </div>
                      )}

                      {/* Embedded Shift checkout module (Phase 7 Daily Activity / Incidents Reports) */}
                      {checkingOutJobId === activeJobOnDuty.id && (
                        <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-4 animate-slide-up text-xs">
                          <span className="text-[9px] font-mono text-emerald-400 uppercase font-black tracking-wider block border-b border-slate-850 pb-1">🔒 Daily Activity & incident reporting Desk</span>
                          
                          <div className="space-y-3">
                            <label className="flex items-center space-x-2 p-2 bg-slate-900 border border-slate-850 rounded-lg cursor-pointer select-none">
                              <input type="checkbox" checked={checkoutCompleteCheck} onChange={() => setCheckoutCompleteCheck(!checkoutCompleteCheck)} className="rounded text-emerald-500 focus:ring-0" />
                              <span>Verify Shift Duties Completed entirely</span>
                            </label>

                            {/* Unsplash end selfie snapper */}
                            <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg flex flex-col items-center justify-center space-y-1">
                              <span className="text-[8px] font-mono text-slate-400 block uppercase">3. End-Shift Handover Selfie</span>
                              {checkoutPhotoEnd ? (
                                <img src={checkoutPhotoEnd} alt="checkout selfie" className="w-16 h-16 rounded-full border border-slate-700 object-cover" />
                              ) : (
                                <div className="w-16 h-16 bg-slate-950 rounded-full border border-slate-800 flex items-center justify-center text-slate-500">
                                  <Camera className="w-5 h-5" />
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => triggerCameraSnapper('end')}
                                className="px-2.5 py-1 bg-slate-950 border border-slate-800 text-[9px] font-mono text-slate-350 hover:text-white rounded shrink-0 cursor-pointer"
                              >
                                {cameraLoading && activeCamTarget === 'end' ? 'Snapping...' : '📷 Capture Out selfie'}
                              </button>
                            </div>

                            {/* DAR note log */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-mono text-slate-450 block uppercase">Daily Activity Report (DAR) Log *</span>
                                <button
                                  type="button"
                                  onClick={() => setDarNote("Executed routine perimeter sweeps. Verified secure padlocks on all loading docks. No unauthorized personnel encountered. Facility secure during shift duration.")}
                                  className="text-[8px] font-mono text-emerald-400 hover:underline font-bold"
                                >
                                  [Populate Standard DAR]
                                </button>
                              </div>
                              <textarea
                                rows={3}
                                placeholder="Detail hourly patrols, site findings..."
                                value={darNote}
                                onChange={(e) => setDarNote(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs focus:ring-0 text-white placeholder:text-slate-600"
                              />
                            </div>

                            {/* Incident report checkbox toggler */}
                            <div className="bg-slate-905 border border-slate-850 p-3 rounded-xl space-y-2">
                              <label className="flex items-center space-x-2.5 cursor-pointer text-red-400 font-extrabold">
                                <input type="checkbox" checked={hasIncidentReport} onChange={() => setHasIncidentReport(!hasIncidentReport)} className="rounded text-red-500 focus:ring-0" />
                                <span className="text-[10px] uppercase font-mono tracking-wider">💥 REGISTER STATE INCIDENT REPORT (IR)</span>
                              </label>

                              {hasIncidentReport && (
                                <div className="space-y-3 pt-2">
                                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                                    <div>
                                      <span className="text-slate-400 uppercase block font-mono text-[8px]">IR Type</span>
                                      <select value={incidentSelection} onChange={(e) => setIncidentSelection(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white">
                                        <option value="Disturbance">Disturbance / Loud Noise</option>
                                        <option value="Trespassing">Trespassing / Burglar Ejected</option>
                                        <option value="Medical Assistance">Medical dispatcher performed</option>
                                        <option value="Property Damage">Vandalism / Weapon damage</option>
                                      </select>
                                    </div>
                                    <div>
                                      <span className="text-slate-450 uppercase block font-mono text-[8px]">Priority Severity</span>
                                      <div className="flex gap-1">
                                        {['low', 'medium', 'high'].map(p => (
                                          <button key={p} type="button" onClick={() => setIncidentPriority(p as any)} className={`flex-1 py-1 rounded font-mono text-[9px] uppercase border font-extrabold cursor-pointer ${incidentPriority === p ? 'bg-red-600 border-red-650 text-white font-black' : 'bg-slate-900 text-slate-450 border-slate-800'}`}>
                                            {p}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <span className="text-[8px] font-mono text-slate-450 block uppercase">Coordinated response narrative</span>
                                    <textarea value={incidentDescription} onChange={(e) => setIncidentDescription(e.target.value)} rows={2} placeholder="Detail intruder presence, client assets compromised..." className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder:text-slate-600" />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <button onClick={() => handleCheckOutCompleteSubmit(activeJobOnDuty.id)} className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-mono text-xs font-black uppercase rounded-lg tracking-wider cursor-pointer">
                            🔒 Submit Daily activity logs & Check-Out
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

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
                            <span className="text-[10px] text-slate-450 block font-mono">${job.hourlyRate}/hr • {job.durationHours} hrs</span>
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

    </div>
  );
}
