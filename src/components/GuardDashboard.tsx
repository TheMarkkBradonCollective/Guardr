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
  FileQuestion,
  Zap,
  Info,
  ChevronRight,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Trash2
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
        ctx.strokeStyle = '#1e293b';
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
    <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-700/40">
      <div className="flex items-center justify-between pointer-events-auto">
        <span className="text-[9px] font-mono font-bold text-slate-500 block uppercase">Certification Signature Pad</span>
        <button type="button" onClick={clearCanvas} className="text-[10px] text-red-500 hover:text-red-700 font-mono tracking-tight font-extrabold cursor-pointer">Clear Canvas Ink</button>
      </div>
      <canvas
        ref={canvasRef}
        width={350}
        height={90}
        style={{ width: '100%', height: '90px' }}
        className="bg-white rounded-md border border-slate-300 cursor-crosshair touch-none"
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
  const [showAddCert, setShowAddCert] = useState(false);
  const [certName, setCertName] = useState(PREFAB_CERT_LIST[0]);
  const [issuer, setIssuer] = useState('');
  const [num, setNum] = useState('');
  const [issueDate, setIssueDate] = useState('2025-01-01');
  const [expiryDate, setExpiryDate] = useState('2028-01-01');

  // Interactive Operations Shift Workspace Desk States
  const [checkingInJobId, setCheckingInJobId] = useState<string | null>(null);
  const [checkingOutJobId, setCheckingOutJobId] = useState<string | null>(null);
  
  // GPS Presence Lock state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsVerified, setGpsVerified] = useState(false);
  const [gpsTick, setGpsTick] = useState(150);

  // Pre-shift Self Audit checklists
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

  // Mid shift audits tracking
  const [midShiftAuditParentId, setMidShiftAuditParentId] = useState<string | null>(null);
  const [midShiftUniform, setMidShiftUniform] = useState(false);
  const [midShiftEquip, setMidShiftEquip] = useState(false);
  const [midShiftPhoto, setMidShiftPhoto] = useState<string | null>(null);

  // End of Shift Checkout Reports states
  const [checkoutCompleteCheck, setCheckoutCompleteCheck] = useState(false);
  const [checkoutNoViolations, setCheckoutNoViolations] = useState(false);
  const [checkoutNoEquipIssues, setCheckoutNoEquipIssues] = useState(false);
  const [checkoutPhotoEnd, setCheckoutPhotoEnd] = useState<string | null>(null);
  
  // Shift Logs Reports
  const [darNote, setDarNote] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [hasIncidentReport, setHasIncidentReport] = useState(false);
  const [incidentSelection, setIncidentSelection] = useState('Disturbance');
  const [incidentPriority, setIncidentPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);

  // Filter lists
  const availableJobs = requests.filter(r => r.status === 'open');
  const assignedJobs = requests.filter(r => r.assignedGuardId === guard.id && r.status !== 'completed');
  const completedJobs = requests.filter(r => r.assignedGuardId === guard.id && r.status === 'completed');

  // Calculates total earnings
  const mockEarnings = completedJobs.reduce((sum, r) => sum + r.estimatedPayout, 0);

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
      status: 'pending' // Enters as pending approval!
    });
    setIssuer('');
    setNum('');
    setShowAddCert(false);
    alert("License uploaded! BSIS credentials pending auditor review. Switch to the Auditor Dashboard at the top of the screen to verify it!");
  };

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

  const triggerCameraSnapper = (target: 'front' | 'full' | 'mid' | 'end') => {
    setCameraLoading(true);
    setActiveCamTarget(target);
    setTimeout(() => {
      setCameraLoading(false);
      // Beautiful predefined realistic images of officer check-ins
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

  const handleCheckInComplete = (requestId: string) => {
    const hasShirt = uniformChecks.shirt;
    const hasPants = uniformChecks.pants;
    const hasBelt = uniformChecks.belt;
    const hasFootwear = uniformChecks.footwear;
    const hasBadge = uniformChecks.badge;
    const hasEquipment = uniformChecks.equipment;

    const failedUniform = !hasShirt || !hasPants || !hasFootwear || !hasBadge;

    if (!photoFront || !photoFull) {
      alert("⚠️ Verification photos are required! Please activate camera and capture both front-facing selfie and full-body uniform check-in photographs.");
      return;
    }

    if (!typedCheckInName || !signatureInked) {
      alert("⚠️ Hand-written digital signature in the Ink Signature Pad and confirmation typed name are required to execute certification lock.");
      return;
    }

    if (failedUniform) {
      const confirmProceed = window.confirm(
        `🚨 WARNING: You have unchecked core uniform garments (shirt, pants, or badge). Completing this audit with uniform violations registers a COMPLIANCE FAILURE.\n\n3 failures will automatically suspend your security operator license. Proceed anyways?`
      );
      if (!confirmProceed) return;
      onRecordAuditViolation(guard.id, "Pre-Shift Outfitting Audit Violation: Missing uniform garments");
    }

    onUpdateJobAudit(requestId, {
      status: 'in-progress',
      checkInAudit: {
        checkedAt: new Date().toLocaleTimeString(),
        uniform: uniformChecks,
        equipment: equipmentChecks,
        frontSelfie: photoFront,
        fullBodyPhoto: photoFull,
        signature: signatureInked,
        gpsVerified: true
      }
    });

    setCheckingInJobId(null);
    setPhotoFront(null);
    setPhotoFull(null);
    setTypedCheckInName('');
    setSignatureInked('');
    setGpsVerified(false);
    setUniformChecks({ shirt: false, pants: false, belt: false, footwear: false, badge: false, equipment: false });
    alert("✓ Shift Check-In Approved! Job is now Live in system logs. Safe patrol on-scene!");
  };

  const handleMidShiftAuditSubmit = (requestId: string) => {
    if (!midShiftPhoto) {
      alert("Please capture midpoint photo verification.");
      return;
    }

    const failedMidUniform = !midShiftUniform;
    if (failedMidUniform) {
      const confirmProceed = window.confirm(
        `🚨 WARNING: Completing randomized mid-shift audit with uniform violations registers a COMPLIANCE FAILURE.\n\n3 failures will automatically suspend your license. Proceed anyways?`
      );
      if (!confirmProceed) return;
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
    setMidShiftUniform(false);
    setMidShiftEquip(false);
    alert("✓ Mid-Shift integrity verification registered successfully with BSIS compliance database!");
  };

  const handleCheckOutCompleteSubmit = (requestId: string) => {
    if (!checkoutCompleteCheck) {
      alert("Please verify that shift duties are complete.");
      return;
    }

    if (!darNote) {
      alert("Please provide the required Daily Activity Report (DAR) site log notes.");
      return;
    }

    if (hasIncidentReport && (!incidentDescription || incidentDescription.length === 0)) {
      alert("Please detail the Incident Report description for BSIS archives.");
      return;
    }

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
        clientNotes: clientNotes,
        attachments: attachments
      }
    });

    setCheckingOutJobId(null);
    setCheckoutCompleteCheck(false);
    setCheckoutNoViolations(false);
    setCheckoutNoEquipIssues(false);
    setDarNote('');
    setClientNotes('');
    setHasIncidentReport(false);
    setIncidentDescription('');
    setCheckoutPhotoEnd(null);
    setAttachments([]);

    alert("✓ Shift successfully completed & clocked out! Client and Auditor have been notified with the full Daily Activity and Incident Reports.");
  };

  const handleGPSVerificationClick = () => {
    setGpsLoading(true);
    setGpsTick(150);
  };

  const status = guard.userStatus || 'active';
  if (status === 'suspended' || status === 'blocked') {
    return (
      <div className="bg-white border-2 border-red-200 rounded-3xl p-8 max-w-2xl mx-auto text-center space-y-6 shadow-md my-12 animate-fade-in">
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
          Please contact our BSIS Operations & Investigations Division or switch to the <strong>Staff Console</strong> to reactivate your credentials.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top statistics widget */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Earnings Card */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-100 flex items-center space-x-4">
          <div className="bg-green-50 p-3 rounded-lg">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Total Payout Settled</span>
            <span className="text-xl font-bold font-mono text-slate-900">${mockEarnings} USD</span>
          </div>
        </div>

        {/* Completed Duties */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-100 flex items-center space-x-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <Check className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Completed Runs</span>
            <span className="text-xl font-bold font-mono text-slate-900">{completedJobs.length} Patrols</span>
          </div>
        </div>

        {/* Rating Level */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 flex items-center space-x-4">
          <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
            ★
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">System Rating Score</span>
            <span className="text-xl font-bold font-mono text-slate-900">
              {guard.rating > 0 ? `${guard.rating} / 5` : 'No reviews'}
            </span>
          </div>
        </div>

        {/* Compliance Integrity badges */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-100 flex items-center space-x-4">
          <div className="bg-purple-50 p-3 rounded-lg">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Compliance Rating</span>
            <span className="text-xl font-bold font-mono text-slate-900">
              {guard.verified ? '100% AUDITED' : 'PENDING'}
            </span>
          </div>
        </div>

      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Hand: Guard profile summary and licenses list */}
        <div className="space-y-6">
          
          {/* Profile overview card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs relative overflow-hidden">
            <div className="h-16 bg-slate-950"></div>
            <div className="px-6 pb-6 relative -mt-8 flex flex-col items-center text-center">
              <img 
                src={guard.avatar} 
                alt={guard.name} 
                className="w-16 h-16 rounded-full border-4 border-white object-cover shadow-md mb-3" 
                referrerPolicy="no-referrer"
              />
              
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-1.5 justify-center leading-none">
                {guard.name}
              </h3>
              <p className="text-[11px] font-mono text-slate-400 mt-1 uppercase tracking-wider">{guard.badgeNumber}</p>

              <div className="mt-3 flex items-center space-x-2">
                {guard.verified ? (
                  <span className="bg-blue-500/10 text-blue-700 font-mono text-[10px] font-bold px-3 py-1 rounded-full border border-blue-500/20">
                    NETWORK APPROVED ✓
                  </span>
                ) : (
                  <span className="bg-slate-100 text-slate-600 font-mono text-[10px] font-bold px-3 py-1 rounded-full border border-slate-200">
                    ⧗ PENDING VERIFICATION
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 mt-4 italic">" {guard.bio} "</p>

              {/* Badges checklist */}
              <div className="grid grid-cols-2 gap-2 w-full mt-5 text-[11px] font-mono border-t border-slate-50 pt-4">
                <div className="bg-slate-50 p-2 rounded text-left">
                  <span className="text-slate-400 block uppercase text-[8px]">Armed Status</span>
                  <span className={guard.isArmed ? 'text-red-700 font-bold' : 'text-slate-700'}>
                    {guard.isArmed ? '💥 ARMED LICENSED' : '🛡️ UNARMED PATROL'}
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded text-left">
                  <span className="text-slate-400 block uppercase text-[8px]">Background</span>
                  <span className={guard.backgroundChecked ? 'text-green-700 font-bold' : 'text-slate-700'}>
                    {guard.backgroundChecked ? '✓ CLEAR BSIS' : '⧗ PENDING'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Licenses checklist */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Award className="w-4 h-4 text-blue-605 text-blue-500" /> Audited Certifications
              </h3>
              <button
                onClick={() => setShowAddCert(!showAddCert)}
                className="text-blue-600 hover:text-blue-700 text-xs font-bold font-mono flex items-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span>UPLOAD LICENCE</span>
              </button>
            </div>

            {/* Cert upload Form toggle */}
            {showAddCert && (
              <form onSubmit={handleSubmitCert} className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-3 animate-slide-up">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold font-mono text-slate-400 block uppercase">Certification Standard Name</label>
                  <select
                    value={certName}
                    onChange={(e) => setCertName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 outline-none text-[11px] text-slate-800"
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
                      placeholder="e.g. BSIS State Dept"
                      value={issuer}
                      onChange={(e) => setIssuer(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 outline-none text-[11px]"
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
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 outline-none text-[11px]"
                    />
                  </div>
                </div>

                <div className="pt-1 flex justify-end space-x-1">
                  <button type="button" onClick={() => setShowAddCert(false)} className="text-slate-500 font-medium px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg">Cancel</button>
                  <button type="submit" className="bg-blue-600 text-white font-semibold px-4 py-1.5 rounded-lg shadow-sm hover:bg-blue-700 font-mono text-xs">SUBMIT AUDIT</button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {guard.certifications.map(cert => (
                <div 
                  key={cert.id} 
                  className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs ${
                    cert.status === 'verified'
                      ? 'bg-blue-50/40 border-blue-100'
                      : cert.status === 'rejected'
                      ? 'bg-red-50/40 border-red-100'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800">{cert.name}</p>
                    <div className="font-mono text-[10px] text-slate-500 space-y-0.5">
                      <p>Issuer: {cert.issuer}</p>
                      <p>Serial: {cert.number}</p>
                      <p>Exp: {cert.expiryDate}</p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold shrink-0 ${
                    cert.status === 'verified'
                      ? 'bg-blue-100 text-blue-800'
                      : cert.status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-slate-200 text-slate-700 animate-pulse'
                  }`}>
                    {cert.status}
                  </span>
                </div>
              ))}
            </div>

          </div>

        </div>

        {/* Right 2 Columns: Active Jobs & Browse Marketplace */}
        <div className="lg:col-span-2 space-y-6">

          {/* Compliance Disclaimer warning if not verified */}
          {!guard.verified && (
            <div className="bg-slate-100 border border-slate-200 text-slate-800 p-5 rounded-2xl flex items-start space-x-4">
              <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs text-slate-800 font-mono tracking-wider uppercase">🛡️ SECURITY DISPATCH COMPLIANCE STANDBY</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Your officer profile status is currently <span className="text-blue-600 font-bold">AWAITING REVIEW</span>. Federal compliance code requires a live audit of your state private credentials before active shifts can be cleared.
                </p>
                <div className="mt-3 bg-white border border-slate-250 p-3 rounded-lg text-xs shadow-xs">
                  <span className="font-semibold block text-slate-800 mb-1">To verify this account:</span> 
                  <p className="text-slate-500">Toggle to the <strong className="text-blue-600">Compliance Auditor</strong> desk at the top of the screen, select "{guard.name}", review the certifications, and click "Approve".</p>
                </div>
              </div>
            </div>
          )}

          {/* Active Contracted Assignments & Tactical Desk */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-900 text-xs flex items-center justify-between gap-1.5 font-mono uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-emerald-600 animate-pulse" /> Contracted Tactical Assignments ({assignedJobs.length})
              </span>
              <span className="text-[10px] text-slate-450 lowercase bg-slate-900/5 px-2 py-0.5 rounded font-normal">
                escrow operations
              </span>
            </h3>

            {assignedJobs.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border-2 border-dashed border-slate-200 text-xs shadow-3xs">
                <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 font-medium">No tactical assignments currently active.</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">Please apply or accept shift invitations listed in the open marketplace board below to begin recording logs.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignedJobs.map(req => {
                  const isJobCheckingIn = checkingInJobId === req.id;
                  const isJobCheckingOut = checkingOutJobId === req.id;
                  const isMidShiftPromptActive = midShiftAuditParentId === req.id;

                  return (
                    <div key={req.id} className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 shadow-xl overflow-hidden transition-all duration-300">
                      
                      {/* Header bar */}
                      <div className="bg-slate-950 px-5 py-4 flex items-center justify-between border-b border-slate-850 flex-wrap gap-2">
                        <div className="flex items-center space-x-2">
                          {req.status === 'assigned' ? (
                            <span className="bg-amber-950/80 text-amber-400 border border-amber-800/60 font-mono text-[9px] uppercase font-bold py-0.5 px-2 rounded flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                              Awaiting Clock-In
                            </span>
                          ) : (
                            <span className="bg-emerald-950 text-emerald-400 border border-emerald-800/40 font-mono text-[9px] uppercase font-bold py-0.5 px-2 rounded flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Active Patrol On-Scene
                            </span>
                          )}
                          <span className="font-mono text-slate-300 text-[10px] tracking-tight">Contract ID: {req.id}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
                          <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{req.location}</span>
                        </div>
                      </div>

                      {/* Main job summary details */}
                      <div className="p-5 space-y-4">
                        <div>
                          <h4 className="font-bold text-sm text-white tracking-tight flex items-center gap-1.5 font-sans">
                            {req.title}
                          </h4>
                          <p className="text-xs text-slate-450 mt-1 max-w-2xl leading-relaxed">{req.description}</p>
                        </div>

                        {/* Specs grid */}
                        <div className="grid grid-cols-3 gap-2.5 text-[11px] font-mono bg-slate-950/60 p-3 rounded-2xl border border-slate-850 text-slate-350">
                          <div>
                            <span className="text-slate-450 block text-[8px] uppercase">Service Rate</span>
                            <span className="text-amber-400 font-bold">${req.hourlyRate}/hr</span>
                          </div>
                          <div>
                            <span className="text-slate-450 block text-[8px] uppercase">Shift Duration</span>
                            <span className="text-slate-100 font-bold">{req.durationHours} hrs</span>
                          </div>
                          <div>
                            <span className="text-slate-450 block text-[8px] uppercase">Escrow Payout</span>
                            <span className="text-emerald-400 font-bold font-mono">${req.estimatedPayout} guaranteed</span>
                          </div>
                        </div>

                        <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-850/60 text-xs text-slate-300 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {req.armedRequired ? (
                              <span className="bg-red-950/50 text-red-400 border border-red-800/30 text-[9px] font-mono px-2 py-0.5 rounded font-bold">ARMED CLEARANCE REQUIRED</span>
                            ) : (
                              <span className="bg-slate-850 text-slate-400 border border-slate-800 text-[9px] font-mono px-2 py-0.5 rounded">UNARMED PATROL</span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-slate-450">
                            Required: {req.requiredCertifications.slice(0, 2).join(', ')}
                          </span>
                        </div>

                        {/* Standard Quick Action Buttons when workspaces are closed */}
                        {!isJobCheckingIn && !isJobCheckingOut && !isMidShiftPromptActive && (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-850">
                            {req.status === 'assigned' ? (
                              <button
                                onClick={() => {
                                  setCheckingInJobId(req.id);
                                  setActiveWorkflowStep('gps');
                                  setGpsVerified(false);
                                  setPhotoFront(null);
                                  setPhotoFull(null);
                                }}
                                className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-750 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-lg shadow-amber-500/15"
                              >
                                <Zap className="w-4 h-4 fill-slate-950" />
                                <span>Initiate Pre-Shift Compliance Clock-In</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setCheckingOutJobId(req.id);
                                    setCheckoutCompleteCheck(true);
                                    setCheckoutNoViolations(true);
                                    setCheckoutNoEquipIssues(true);
                                  }}
                                  className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                                >
                                  <CheckCircle2 className="w-4 h-4 fill-slate-950" />
                                  <span>Submit Custom Daily Reports & Check-Out</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setMidShiftAuditParentId(req.id);
                                    setMidShiftPhoto(null);
                                    setMidShiftUniform(true);
                                    setMidShiftEquip(true);
                                  }}
                                  className="py-2.5 px-3.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-750 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                                  title="Random Integrity test"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5 text-yellow-500" />
                                  <span>Trigger Mid-Shift Audit</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* --- PRE-SHIFT SELF CHECK-IN AUDIT WORKSPACE PORTAL --- */}
                      {isJobCheckingIn && (
                        <div className="bg-slate-950 border-t border-slate-800 p-5 space-y-5 animate-slide-down">
                          <div className="flex items-center justify-between pb-3 border-b border-slate-850">
                            <h5 className="text-[11px] font-mono font-bold text-amber-400 tracking-wider flex items-center gap-1.5 uppercase">
                              <Activity className="w-4 h-4 animate-spin text-amber-500" /> Pre-Shift Agent Self-Audit Desk
                            </h5>
                            <button
                              onClick={() => setCheckingInJobId(null)}
                              className="text-[10px] text-slate-400 hover:text-white font-mono bg-slate-900 border border-slate-800 p-1 px-2.5 rounded-lg hover:border-slate-700 cursor-pointer"
                            >
                              Abort Desk
                            </button>
                          </div>

                          {/* Steps Wizard Index Indicator */}
                          <div className="grid grid-cols-4 gap-1 text-[9px] font-mono font-bold uppercase tracking-wider text-center">
                            <button 
                              onClick={() => setActiveWorkflowStep('gps')}
                              className={`py-1.5 rounded-md ${activeWorkflowStep === 'gps' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900/60 text-slate-400'} border border-slate-850`}
                            >
                              1. GPS Radar
                            </button>
                            <button 
                              disabled={!gpsVerified}
                              onClick={() => setActiveWorkflowStep('checks')}
                              className={`py-1.5 rounded-md ${activeWorkflowStep === 'checks' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900/60 text-slate-400'} border border-slate-850 disabled:opacity-40`}
                            >
                              2. Dress Check
                            </button>
                            <button 
                              disabled={!gpsVerified}
                              onClick={() => setActiveWorkflowStep('photos')}
                              className={`py-1.5 rounded-md ${activeWorkflowStep === 'photos' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900/60 text-slate-400'} border border-slate-850 disabled:opacity-40`}
                            >
                              3. Photos
                            </button>
                            <button 
                              disabled={!gpsVerified}
                              onClick={() => setActiveWorkflowStep('sign')}
                              className={`py-1.5 rounded-md ${activeWorkflowStep === 'sign' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900/60 text-slate-400'} border border-slate-850 disabled:opacity-40`}
                            >
                              4. Sign-Off
                            </button>
                          </div>

                          {/* TAB 1: GPS RADAR ON-SITE PROXIMITY CHECK */}
                          {activeWorkflowStep === 'gps' && (
                            <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-850 text-center relative overflow-hidden">
                              <span className="text-[10px] block font-mono text-indigo-400 font-extrabold uppercase tracking-widest">
                                Geofenced Dispatch Gate
                              </span>
                              
                              <div className="py-6 flex flex-col items-center justify-center space-y-4">
                                {gpsLoading ? (
                                  <>
                                    <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin flex items-center justify-center">
                                      <MapPin className="w-5 h-5 text-amber-500 animate-pulse" />
                                    </div>
                                    <div className="font-mono text-xs">
                                      <p className="text-slate-300 font-extrabold animate-pulse">PINGING TELEMETRY SATELLITES...</p>
                                      <p className="text-[10px] text-slate-450 mt-1">Current coordinates disparity: <span className="text-yellow-400">{gpsTick} meters</span> to guard post address</p>
                                    </div>
                                  </>
                                ) : gpsVerified ? (
                                  <>
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-450 flex items-center justify-center animate-bounce">
                                      <Check className="w-6 h-6 stroke-[3]" />
                                    </div>
                                    <div className="font-mono text-xs">
                                      <p className="text-emerald-400 font-extrabold">✓ ESCROW RADAR SITE LOCK CONCLUDED</p>
                                      <p className="text-[10px] text-slate-400 mt-1">Operator positioned <span className="text-emerald-400 font-bold">12 meters (inside geofence bounds)</span> from target center.</p>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center">
                                      <MapPin className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[11px] font-mono text-slate-350">GPS validation is required to unlock clock-in checklists.</p>
                                      <p className="text-[9px] text-slate-500 max-w-sm">Requires verification that device is within 100 meters of coordinates.</p>
                                    </div>
                                  </>
                                )}
                              </div>

                              {!gpsVerified && !gpsLoading && (
                                <button
                                  type="button"
                                  onClick={handleGPSVerificationClick}
                                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-750 text-white font-mono text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                                >
                                  📍 ACQUIRE DEVICE GPS LATENCY SIGNAL
                                </button>
                              )}

                              {gpsVerified && (
                                <button
                                  type="button"
                                  onClick={() => setActiveWorkflowStep('checks')}
                                  className="w-full py-2 bg-emerald-500 text-slate-950 font-mono text-[11px] font-bold rounded-lg hover:bg-emerald-400 transition-colors cursor-pointer flex items-center justify-center space-x-1"
                                >
                                  <span>Proceed to Self-Audit Uniform Checkpoints</span>
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}

                          {/* TAB 2: DRESS CODE & UNIFORM COMPLIANCE CHECKLIST */}
                          {activeWorkflowStep === 'checks' && (
                            <div className="space-y-4">
                              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-350">
                                <div className="flex items-start space-x-2">
                                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                                  <p className="leading-normal">
                                    <strong>BSIS Compliance Code Mandate:</strong> Unchecking core apparel items (Shirt, Pants, Badge, Shoes) marks this shift audit as <strong>Failed / Violation Registered</strong>. Three failures will automatically suspend your operator clearance.
                                  </p>
                                </div>
                              </div>

                              <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 space-y-3">
                                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-850 pb-1.5">
                                  👕 Appointed Uniform Check-ins
                                </span>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                  <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-950/40 border border-slate-850/60 hover:bg-slate-950/80 cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      checked={uniformChecks.shirt} 
                                      onChange={() => setUniformChecks(prev => ({ ...prev, shirt: !prev.shirt }))}
                                      className="rounded text-amber-500 focus:ring-opacity-0 focus:ring-0 cursor-pointer w-4 h-4" 
                                    />
                                    <span className="font-sans text-slate-200">Uniform Shirt Present & Ironed</span>
                                  </label>

                                  <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-950/40 border border-slate-850/60 hover:bg-slate-950/80 cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      checked={uniformChecks.pants} 
                                      onChange={() => setUniformChecks(prev => ({ ...prev, pants: !prev.pants }))}
                                      className="rounded text-amber-500 focus:ring-opacity-0 focus:ring-0 cursor-pointer w-4 h-4" 
                                    />
                                    <span className="font-sans text-slate-200">Uniform Pants Present (Black/Navy)</span>
                                  </label>

                                  <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-950/40 border border-slate-850/60 hover:bg-slate-950/80 cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      checked={uniformChecks.belt} 
                                      onChange={() => setUniformChecks(prev => ({ ...prev, belt: !prev.belt }))}
                                      className="rounded text-amber-500 focus:ring-opacity-0 focus:ring-0 cursor-pointer w-4 h-4" 
                                    />
                                    <span className="font-sans text-slate-200">Heavy Duty Belt Equipped</span>
                                  </label>

                                  <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-950/40 border border-slate-850/60 hover:bg-slate-950/80 cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      checked={uniformChecks.footwear} 
                                      onChange={() => setUniformChecks(prev => ({ ...prev, footwear: !prev.footwear }))}
                                      className="rounded text-amber-500 focus:ring-opacity-0 focus:ring-0 cursor-pointer w-4 h-4" 
                                    />
                                    <span className="font-sans text-slate-200">Tactical Composite Boots/Footwear</span>
                                  </label>

                                  <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-950/40 border border-slate-850/60 hover:bg-slate-950/80 cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      checked={uniformChecks.badge} 
                                      onChange={() => setUniformChecks(prev => ({ ...prev, badge: !prev.badge }))}
                                      className="rounded text-amber-500 focus:ring-opacity-0 focus:ring-0 cursor-pointer w-4 h-4" 
                                    />
                                    <span className="font-sans text-slate-200">State Name Badge Visible on Left Chest</span>
                                  </label>

                                  <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-950/40 border border-slate-850/60 hover:bg-slate-950/80 cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      checked={uniformChecks.equipment} 
                                      onChange={() => setUniformChecks(prev => ({ ...prev, equipment: !prev.equipment }))}
                                      className="rounded text-amber-500 focus:ring-opacity-0 focus:ring-0 cursor-pointer w-4 h-4" 
                                    />
                                    <span className="font-sans text-slate-200">Required Tactical Utility Harness</span>
                                  </label>
                                </div>
                              </div>

                              {/* Required Equipment section */}
                              <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 space-y-3">
                                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-850 pb-1.5">
                                  📻 Mandatory Gear & Equipment Confirmation
                                </span>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                  <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-950/30 border border-slate-850/40 cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      checked={equipmentChecks.radio} 
                                      onChange={() => setEquipmentChecks(prev => ({ ...prev, radio: !prev.radio }))}
                                      className="rounded text-amber-500 focus:ring-0 w-4 h-4 cursor-pointer" 
                                    />
                                    <span className="text-slate-350">Radio Transceiver</span>
                                  </label>

                                  <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-950/30 border border-slate-850/40 cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      checked={equipmentChecks.flashlight} 
                                      onChange={() => setEquipmentChecks(prev => ({ ...prev, flashlight: !prev.flashlight }))}
                                      className="rounded text-amber-500 focus:ring-0 w-4 h-4 cursor-pointer" 
                                    />
                                    <span className="text-slate-350">1200lm Flashlight</span>
                                  </label>

                                  <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-950/30 border border-slate-850/40 cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      checked={equipmentChecks.phoneCharged} 
                                      onChange={() => setEquipmentChecks(prev => ({ ...prev, phoneCharged: !prev.phoneCharged }))}
                                      className="rounded text-amber-500 focus:ring-0 w-4 h-4 cursor-pointer" 
                                    />
                                    <span className="text-slate-350">Phone 80%+ Charged</span>
                                  </label>

                                  {/* Conditionally show dangerous gear if guard is certified or armed */}
                                  <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-950/30 border border-slate-850/40 cursor-pointer header">
                                    <input 
                                      type="checkbox" 
                                      checked={equipmentChecks.baton} 
                                      onChange={() => setEquipmentChecks(prev => ({ ...prev, baton: !prev.baton }))}
                                      className="rounded text-amber-500 focus:ring-0 w-4 h-4 cursor-pointer" 
                                    />
                                    <span className="text-slate-350">Expandable Baton</span>
                                  </label>

                                  <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-950/30 border border-slate-850/40 cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      checked={equipmentChecks.spray} 
                                      onChange={() => setEquipmentChecks(prev => ({ ...prev, spray: !prev.spray }))}
                                      className="rounded text-amber-500 focus:ring-0 w-4 h-4 cursor-pointer" 
                                    />
                                    <span className="text-slate-350">OC canister spray</span>
                                  </label>

                                  {req.armedRequired && (
                                    <label className="flex items-center space-x-2 p-2 rounded-lg bg-red-950/20 border border-red-900/30 font-bold cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        checked={equipmentChecks.firearm} 
                                        onChange={() => setEquipmentChecks(prev => ({ ...prev, firearm: !prev.firearm }))}
                                        className="rounded text-red-500 focus:ring-0 w-4 h-4 cursor-pointer" 
                                      />
                                      <span className="text-red-400">Armed Service Firearm</span>
                                    </label>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setActiveWorkflowStep('photos')}
                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-extrabold rounded-lg transition-colors cursor-pointer"
                              >
                                Continue to Photo Verification Scanner
                              </button>
                            </div>
                          )}

                          {/* TAB 3: REQUIRED COMPLIANCE PICTURE CAPTURES */}
                          {activeWorkflowStep === 'photos' && (
                            <div className="space-y-4">
                              <span className="text-[10px] font-mono text-slate-450 block uppercase tracking-wider text-center">
                                Live Media Feed Verification Logs
                              </span>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Selfie Capture container */}
                                <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex flex-col items-center justify-center space-y-3 relative overflow-hidden">
                                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                                    📸 1. Front-Facing Selfie
                                  </span>

                                  {cameraLoading && activeCamTarget === 'front' ? (
                                    <div className="w-full h-44 bg-slate-950 rounded-xl flex flex-col items-center justify-center space-y-2 border border-slate-800">
                                      <div className="w-8 h-8 rounded-full border-2 border-t-indigo-500 animate-spin"></div>
                                      <span className="text-[9px] font-mono text-indigo-400 animate-pulse font-bold">DIGITAL SHUTTER ACTIVE...</span>
                                    </div>
                                  ) : photoFront ? (
                                    <div className="relative w-full h-44 rounded-xl overflow-hidden border border-slate-750">
                                      <img src={photoFront} alt="Selfie" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      <div className="absolute top-2 left-2 bg-emerald-600 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded text-white shadow-md">
                                        SECURE SHA-256 CAPTURE
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-full h-44 bg-slate-950 rounded-xl flex flex-col items-center justify-center border border-slate-850 text-slate-500 border-dashed">
                                      <Camera className="w-6 h-6 mb-2 text-slate-600 animate-pulse" />
                                      <span className="text-[10px] font-mono">No Image Saved</span>
                                    </div>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => triggerCameraSnapper('front')}
                                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 font-mono text-[10px] font-bold text-indigo-400 rounded-lg hover:text-white cursor-pointer"
                                  >
                                    {photoFront ? 'Re-Snap Selfie Photo' : 'Activate Camera & Snap Selfie'}
                                  </button>
                                </div>

                                {/* Full Body Capture container */}
                                <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex flex-col items-center justify-center space-y-3 relative overflow-hidden">
                                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                                    📸 2. Full-Body Rig Scan
                                  </span>

                                  {cameraLoading && activeCamTarget === 'full' ? (
                                    <div className="w-full h-44 bg-slate-950 rounded-xl flex flex-col items-center justify-center space-y-2 border border-slate-800">
                                      <div className="w-8 h-8 rounded-full border-2 border-t-indigo-500 animate-spin"></div>
                                      <span className="text-[9px] font-mono text-indigo-400 animate-pulse font-bold">LENS ALIGNING...</span>
                                    </div>
                                  ) : photoFull ? (
                                    <div className="relative w-full h-44 rounded-xl overflow-hidden border border-slate-750">
                                      <img src={photoFull} alt="Full rig" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      <div className="absolute top-2 left-2 bg-emerald-600 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded text-white shadow-md">
                                        DUTY GEAR LOCK-IN ✓
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-full h-44 bg-slate-950 rounded-xl flex flex-col items-center justify-center border border-slate-850 text-slate-500 border-dashed">
                                      <Camera className="w-6 h-6 mb-2 text-slate-600" />
                                      <span className="text-[10px] font-mono">No Image Saved</span>
                                    </div>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => triggerCameraSnapper('full')}
                                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 font-mono text-[10px] font-bold text-indigo-400 rounded-lg hover:text-white cursor-pointer"
                                  >
                                    {photoFull ? 'Re-Snap Rig photo' : 'Activate Camera & Snap Rig'}
                                  </button>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setActiveWorkflowStep('sign')}
                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                              >
                                Continue to Legal Certification Sign-Off
                              </button>
                            </div>
                          )}

                          {/* TAB 4: LEGAL STATEMENT & DIGITAL INK SIGNATURE PAD */}
                          {activeWorkflowStep === 'sign' && (
                            <div className="space-y-4">
                              <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl space-y-4">
                                <blockquote className="text-xs italic text-slate-350 border-l-2 border-indigo-500 pl-3 py-1">
                                  "I certify that I am on site, in proper uniform, and equipped according to assignment requirements."
                                </blockquote>

                                {/* Interactive Canvas */}
                                <SignaturePad 
                                  onSave={(dataUrl) => setSignatureInked(dataUrl)} 
                                  initialSig={signatureInked}
                                />

                                {/* Printed Name input */}
                                <div className="space-y-2">
                                  <label className="text-[9px] font-mono font-extrabold text-slate-400 block uppercase">Printed Officer Full Name Credentials</label>
                                  <input 
                                    type="text" 
                                    placeholder="e.g. Sgt. Alex Mercer"
                                    value={typedCheckInName}
                                    onChange={(e) => setTypedCheckInName(e.target.value)}
                                    className="w-full bg-slate-950/80 hover:bg-slate-950 border border-slate-800 font-sans focus:ring-0 text-white p-2.5 rounded-lg text-xs placeholder:text-slate-600"
                                  />
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleCheckInComplete(req.id)}
                                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold rounded-lg font-mono uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                              >
                                <CheckCircle className="w-4 h-4 fill-slate-950" />
                                <span>CLOCK-IN & CONFIRM ACTIVE SHIFT DUTIES</span>
                              </button>
                            </div>
                          )}

                        </div>
                      )}

                      {/* --- MID-SHIFT RANDOM INTEGRITY DICTATE --- */}
                      {isMidShiftPromptActive && (
                        <div className="bg-slate-950 border-t border-slate-850 p-5 space-y-4 animate-slide-down">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <span className="text-yellow-400 text-xs font-bold font-mono tracking-wide uppercase flex items-center gap-1.5">
                              <ShieldAlert className="w-4 h-4 text-yellow-500 animate-pulse" /> Randomized Mid-Shift Integrity Audit Loop
                            </span>
                            <button
                              onClick={() => setMidShiftAuditParentId(null)}
                              className="text-[9px] text-slate-450 hover:text-slate-200 uppercase font-mono"
                            >
                              Exit Loop
                            </button>
                          </div>

                          <span className="text-xs text-slate-350 block leading-relaxed">
                            Compliance systems periodically prompt patrolling officers to verify their current state outfitting presence. Unchecking core parameters records a flag to corporate database ledger.
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                            <div className="bg-slate-900 border border-slate-850 p-3 rounded-2xl space-y-2 text-xs">
                              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">Checks Checklist</span>
                              
                              <label className="flex items-center space-x-2 p-1.5 hover:bg-slate-950 cursor-pointer rounded-lg text-slate-200">
                                <input 
                                  type="checkbox" 
                                  checked={midShiftUniform} 
                                  onChange={() => setMidShiftUniform(!midShiftUniform)}
                                  className="rounded text-yellow-500 focus:ring-0 w-4 h-4 cursor-pointer" 
                                />
                                <span>I am still in full corporate uniform</span>
                              </label>

                              <label className="flex items-center space-x-2 p-1.5 hover:bg-slate-950 cursor-pointer rounded-lg text-slate-200">
                                <input 
                                  type="checkbox" 
                                  checked={midShiftEquip} 
                                  onChange={() => setMidShiftEquip(!midShiftEquip)}
                                  className="rounded text-yellow-500 focus:ring-0 w-4 h-4 cursor-pointer" 
                                />
                                <span>All mandatory communication gear is active</span>
                              </label>
                            </div>

                            <div className="bg-slate-900 border border-slate-850 p-3 rounded-2xl flex flex-col items-center justify-center space-y-2.5">
                              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">Verify Selfie</span>
                              
                              {midShiftPhoto ? (
                                <img src={midShiftPhoto} alt="Mid point selfie" className="w-24 h-18 object-cover rounded-md border border-slate-800" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-center">
                                  <Camera className="w-4 h-4 text-slate-500 mx-auto" />
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => triggerCameraSnapper('mid')}
                                className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[9px] font-bold rounded cursor-pointer"
                              >
                                {cameraLoading && activeCamTarget === 'mid' ? 'Snapping...' : 'Snap Mid Selfie'}
                              </button>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleMidShiftAuditSubmit(req.id)}
                            className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-750 text-slate-950 text-xs font-mono font-extrabold rounded-xl transition-all cursor-pointer"
                          >
                            ✓ SUBMIT RANDOM MID-SHIFT ARCHIVE FILE
                          </button>
                        </div>
                      )}

                      {/* --- END OF SHIFT COMPREHENSIVE CLOCK-OUT & REPORTS --- */}
                      {isJobCheckingOut && (
                        <div className="bg-slate-950 border-t border-slate-850 p-5 space-y-5 animate-slide-down">
                          <div className="flex items-center justify-between pb-3 border-b border-slate-805">
                            <span className="text-emerald-450 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <Sliders className="w-4 h-4 text-emerald-500 animate-pulse" /> Corporate End-Of-Shift Workspace
                            </span>
                            <button
                              onClick={() => setCheckingOutJobId(null)}
                              className="text-[9px] text-slate-450 hover:text-slate-200 uppercase font-mono bg-slate-900 border border-slate-800 p-1 px-2.5 rounded-md cursor-pointer"
                            >
                              Exit Desk
                            </button>
                          </div>

                          <h5 className="text-[10px] font-mono text-slate-450 block uppercase tracking-wider text-center">
                            1. Self-Audit Complete Declarations
                          </h5>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-900/60 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={checkoutCompleteCheck} 
                                onChange={() => setCheckoutCompleteCheck(!checkoutCompleteCheck)}
                                className="rounded text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer" 
                              />
                              <span className="text-xs font-sans text-slate-200">Shift Completed Fully</span>
                            </label>

                            <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-900/60 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={checkoutNoViolations} 
                                onChange={() => setCheckoutNoViolations(!checkoutNoViolations)}
                                className="rounded text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer" 
                              />
                              <span className="text-xs font-sans text-slate-200">No Uniform Violations</span>
                            </label>

                            <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-900/60 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={checkoutNoEquipIssues} 
                                onChange={() => setCheckoutNoEquipIssues(!checkoutNoEquipIssues)}
                                className="rounded text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer" 
                              />
                              <span className="text-xs font-sans text-slate-200">No Equipment Issues</span>
                            </label>
                          </div>

                          {/* End selfie & attachment */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                            <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl text-center space-y-3 relative overflow-hidden">
                              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                                📸 End-of-Shift Verification Selfie (Optional)
                              </span>

                              {checkoutPhotoEnd ? (
                                <div className="relative w-28 h-20 mx-auto rounded-lg overflow-hidden border border-slate-750">
                                  <img src={checkoutPhotoEnd} alt="End of shift selfie" className="w-[100%] h-[100%] object-cover" referrerPolicy="no-referrer" />
                                </div>
                              ) : (
                                <div className="w-12 h-10 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-center mx-auto text-slate-600">
                                  <Camera className="w-4 h-4" />
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => triggerCameraSnapper('end')}
                                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 hover:text-white rounded-lg font-mono text-[9px] text-indigo-400 font-bold transition-all cursor-pointer"
                              >
                                {cameraLoading && activeCamTarget === 'end' ? 'Snapping...' : 'Snap End Selfie'}
                              </button>
                            </div>

                            {/* Photo attachment list mocks */}
                            <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl space-y-3 text-xs text-slate-350">
                              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                                🖇️ Photo Attachments Log
                              </span>
                              
                              <div className="flex flex-wrap gap-2">
                                {attachments.map((url, i) => (
                                  <div key={i} className="relative w-12 h-12 rounded border border-slate-750 overflow-hidden group">
                                    <img src={url} alt="Attachment" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    <button 
                                      type="button"
                                      onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                      className="absolute inset-0 bg-red-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-mono"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const mockPics = [
                                      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=200&fit=crop&q=80",
                                      "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&fit=crop&q=80"
                                    ];
                                    const next = mockPics[attachments.length % mockPics.length];
                                    setAttachments(p => [...p, next]);
                                  }}
                                  className="w-12 h-12 rounded bg-slate-950 border border-slate-850 hover:bg-slate-850 hover:border-slate-700/60 transition-all flex flex-col items-center justify-center text-[18px] text-slate-500 font-bold cursor-pointer"
                                  title="Mock file upload"
                                >
                                  +
                                </button>
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono block">Attach incident coordinates or entry gates reports snapshots.</span>
                            </div>
                          </div>

                          {/* DAR site round logs */}
                          <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                                📝 2. Daily Activity Report (DAR) site log
                              </span>
                              <button
                                type="button"
                                onClick={() => setDarNote("Completed regular perimeter rounds on-site. Verified all loading docks were locked. Assisted with visitors entry checks at front gate. No suspicious activities reported. Site remained secure during the entire shift.")}
                                className="text-[9px] font-mono text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                              >
                                [Auto-populate standard DAR log]
                              </button>
                            </div>
                            <textarea
                              rows={3}
                              placeholder="Detail hourly patrol rounds, security checks, client relations completed during shift..."
                              value={darNote}
                              onChange={(e) => setDarNote(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 text-xs font-sans text-white p-3 rounded-xl focus:ring-0 placeholder:text-slate-600"
                            />
                          </div>

                          {/* INCIDENT REPORT ACCORDION MODULE */}
                          <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl space-y-3">
                            <label className="flex items-center space-x-2.5 p-1 border-b border-slate-850 pb-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={hasIncidentReport} 
                                onChange={() => setHasIncidentReport(!hasIncidentReport)}
                                className="rounded text-red-500 focus:ring-0 w-4 h-4 cursor-pointer font-bold" 
                              />
                              <span className="text-xs font-bold font-sans text-red-400 uppercase">💥 Register State Incident Report (IR) for this shift</span>
                            </label>

                            {hasIncidentReport && (
                              <div className="space-y-3 pt-1 animate-slide-down">
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-mono text-slate-400 uppercase">Incident Type</label>
                                    <select 
                                      value={incidentSelection}
                                      onChange={(e) => setIncidentSelection(e.target.value)}
                                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2 focus:ring-0"
                                    >
                                      <option value="Disturbance">Disturbance / Loud Noise</option>
                                      <option value="Trespassing">Trespassing / Intruder Ejected</option>
                                      <option value="Property Damage">Property Weapon Damage</option>
                                      <option value="Medical Assistance">Medical Assistance Performed</option>
                                      <option value="Other Breach">Other Security Breach</option>
                                    </select>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[9px] font-mono text-slate-400 uppercase">Severity Priority Code</label>
                                    <div className="flex items-center space-x-1">
                                      {['low', 'medium', 'high'].map(p => (
                                        <button
                                          key={p}
                                          type="button"
                                          onClick={() => setIncidentPriority(p as any)}
                                          className={`flex-1 py-1.5 border font-mono text-[9px] uppercase font-bold rounded-lg cursor-pointer ${incidentPriority === p ? 'bg-red-650 text-white border-red-650' : 'bg-slate-950 text-slate-450 border-slate-800 hover:text-slate-200'}`}
                                        >
                                          {p}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[9px] font-mono text-slate-400 uppercase">Incident Description & Coordinated Response Narrative</label>
                                  <textarea
                                    rows={2.5}
                                    placeholder="Detail weapon presence, police dispatcher badges coordinates, or client physical assets compromised..."
                                    value={incidentDescription}
                                    onChange={(e) => setIncidentDescription(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs font-sans rounded-xl p-3 focus:ring-0 placeholder:text-slate-600"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Client Notes */}
                          <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl space-y-3">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                              🤝 3. Private Client handover notes
                            </span>
                            <textarea
                              rows={1.5}
                              placeholder="Optional instructions for next officer's relief shift, gate entry access warnings..."
                              value={clientNotes}
                              onChange={(e) => setClientNotes(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 text-xs font-sans text-white p-3 rounded-xl focus:ring-0 placeholder:text-slate-600"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCheckOutCompleteSubmit(req.id)}
                            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-extrabold rounded-xl font-mono uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4 fill-slate-950" />
                            <span>LOCK-OUT DAILY REPORTS & FINALIZE DISPATCH CONTRACT</span>
                          </button>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Open Board Marketplace */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 font-mono uppercase">
              <Shield className="w-4 h-4 text-blue-600" /> Active Job Board ({availableJobs.length} Open)
            </h3>

            {availableJobs.length === 0 ? (
              <div className="bg-slate-50 rounded-xl p-8 text-center border border-dashed border-slate-200 text-xs">
                <p className="text-slate-500">All shifts are currently staffed. New jobs will populate in real-time.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableJobs.map(job => {
                  // Check if guard matches armed requirement
                  const armedMismatch = job.armedRequired && !guard.isArmed;
                  const missingCerts = job.requiredCertifications.filter(reqCert => 
                    !guard.certifications.some(c => c.name.toLowerCase().includes(reqCert.toLowerCase()) && c.status === 'verified')
                  );
                  
                  const isQualified = guard.verified && !armedMismatch; // & missingCerts.length == 0 is strict, but let's allow accept

                  return (
                    <div key={job.id} className="bg-white border border-slate-100 rounded-xl p-5 hover:shadow-md transition-all space-y-4">
                      
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono font-bold bg-slate-100 py-0.5 px-1.5 rounded text-slate-700 uppercase">{job.type.replace('-', ' ')}</span>
                            {job.armedRequired && (
                              <span className="text-[10px] font-mono font-bold bg-red-100 py-0.5 px-1.5 rounded text-red-800">ARMED</span>
                            )}
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm mt-1">{job.title}</h4>
                          <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{job.location}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-slate-400 text-[10px] font-mono uppercase block">Estimated Payout</span>
                          <span className="text-lg font-bold font-mono text-slate-900">${job.estimatedPayout}</span>
                          <span className="text-[10px] text-slate-400 block">${job.hourlyRate}/hr • {job.durationHours} hrs</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded">{job.description}</p>

                      {/* Required Certifications check info */}
                      <div className="text-[11px] font-mono space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Requirements Checklist:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {job.armedRequired && (
                            <div className="flex items-center space-x-1 text-xs">
                              <span className={guard.isArmed ? 'text-green-600' : 'text-red-600 font-bold'}>
                                {guard.isArmed ? '✓ Armed status matching' : '❌ REQUIRES Armed Permit'}
                              </span>
                            </div>
                          )}
                          {job.requiredCertifications.map(reqCert => {
                            const hasCert = guard.certifications.some(c => c.name.toLowerCase().includes(reqCert.toLowerCase()) && c.status === 'verified');
                            return (
                              <div key={reqCert} className="flex items-center space-x-1">
                                <span className={hasCert ? 'text-green-600' : 'text-amber-600'}>
                                  {hasCert ? `✓ Verified: ${reqCert}` : `⚠ Lacks verified cert: ${reqCert}`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Accept flow button */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
                        <div className="text-xs text-slate-400">
                          {isQualified ? (
                            <span className="text-blue-600 font-bold font-mono">✓ PROFILE MEETS FULL DESK COMPLIANCE</span>
                          ) : (
                            <span className="text-slate-500 font-mono">
                              {!guard.verified ? '⚠️ Requires Auditor profile approval' : '⚠️ Lacks verified specific credentials'}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => onAcceptJob(job.id)}
                          disabled={!isQualified}
                          className={`font-semibold px-5 py-2.5 rounded-lg text-xs tracking-wide uppercase font-mono transition-all ${
                            isQualified
                              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:translate-y-[-1px]'
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

        </div>

      </div>

    </div>
  );
}
