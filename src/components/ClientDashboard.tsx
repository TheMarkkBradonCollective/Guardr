import React, { useState } from 'react';
import { SecurityRequest, SecurityGuard, JobType } from '../types';
import { PREFAB_CERT_LIST } from '../initialData';
import {
  computeDurationHours,
  formatDuration,
  formatShiftRange,
  getDefaultShiftEnd,
  getDefaultShiftStart,
} from '../lib/dates';
import { computeGuardPay, PLATFORM_FEE_PER_HOUR } from '../lib/payments';
import { JOB_STATUS_LABELS } from '../lib/jobStatus';
import { JobStatus } from '../types';
import {
  Plus,
  MapPin,
  Shield,
  Clock,
  DollarSign,
  Check,
  Sparkles,
  Loader2,
  User,
  AlertTriangle,
  Star,
  ChevronRight,
  Calendar,
  Activity,
  Award,
  X,
  CheckCircle2,
} from 'lucide-react';

interface ClientDashboardProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  isClientApproved?: boolean;
  onPostRequest: (req: Partial<SecurityRequest>) => void;
  onHireGuard: (requestId: string, guardId: string) => void;
  onUpdateStatus: (requestId: string, status: SecurityRequest['status']) => void;
  onAddReview: (requestId: string, rating: number, reviewText: string) => void;
  openPostForm?: boolean;
}

function statusBadgeClass(status: JobStatus): string {
  switch (status) {
    case 'open': return 'badge-open';
    case 'pending-review': return 'badge-assigned';
    case 'accepted': return 'badge-assigned';
    case 'in-progress': return 'badge-active';
    case 'completed': return 'badge-done';
    case 'closed': return 'badge-done';
    default: return 'badge-assigned';
  }
}

export function ClientDashboard({
  requests,
  guards,
  isClientApproved = true,
  onPostRequest,
  onHireGuard,
  onUpdateStatus,
  onAddReview,
  openPostForm = false,
}: ClientDashboardProps) {
  const [showAddForm, setShowAddForm] = useState(openPostForm);
  React.useEffect(() => { setShowAddForm(openPostForm); }, [openPostForm]);

  const [title, setTitle]           = useState('');
  const [siteName, setSiteName]     = useState('');
  const [address, setAddress]       = useState('');
  const [siteInstructions, setSiteInstructions] = useState('');
  const [uniformRequirements, setUniformRequirements] = useState('');
  const [equipmentRequirements, setEquipmentRequirements] = useState('');
  const [guardsNeeded, setGuardsNeeded] = useState(1);
  const [type, setType]             = useState<JobType>('event');
  const [armedRequired, setArmedRequired] = useState(false);
  const [startDate, setStartDate]   = useState(getDefaultShiftStart);
  const [endDate, setEndDate]       = useState(() => getDefaultShiftEnd(getDefaultShiftStart(), 8));
  const [hourlyRate, setHourlyRate] = useState(40);
  const [selectedCerts, setSelectedCerts] = useState<string[]>(['First Aid & CPR / AED']);

  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiMatchingRequestId, setAiMatchingRequestId] = useState<string | null>(null);
  const [aiMatchResults, setAiMatchResults] = useState<{ [guardId: string]: { score: number; compatibilitySummary: string } }>({});

  const [reviewRating, setReviewRating] = useState<{ [reqId: string]: number }>({});
  const [reviewNote, setReviewNote]     = useState<{ [reqId: string]: string }>({});

  const computedDurationHours = computeDurationHours(startDate, endDate);
  const computedPayout = Math.round(computedDurationHours * hourlyRate * 100) / 100;
  const computedGuardPay = computeGuardPay(hourlyRate);

  const handleCertsToggle = (cert: string) => {
    setSelectedCerts(prev =>
      prev.includes(cert) ? prev.filter(c => c !== cert) : [...prev, cert]
    );
  };

  const handleAiAssist = async () => {
    if (!title || !siteInstructions) {
      alert('Please enter a job title and site instructions first.');
      return;
    }
    setAiGenerating(true);
    try {
      const response = await fetch('/api/generate-job-reqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, rawDescription: siteInstructions, startDate, endDate, type }),
      });
      const data = await response.json();
      setSiteInstructions(data.refinedDescription || siteInstructions);
      if (data.recommendedCertifications?.length) {
        const matching = PREFAB_CERT_LIST.filter(p =>
          data.recommendedCertifications.some((r: string) =>
            r.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(r.toLowerCase())
          )
        );
        if (matching.length) setSelectedCerts(matching);
      }
      if (data.riskLevel && (data.riskLevel.toLowerCase().includes('high') || data.riskLevel.toLowerCase().includes('critical') || armedRequired)) {
        setHourlyRate(prev => Math.max(prev, 55));
      }
      alert(`AI generated tactical plan. Risk level: ${data.riskLevel || 'Standard'}`);
    } catch {
      alert('Using standard local rules.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !siteName || !address) { alert('Please fill in job title, site name, and address.'); return; }
    if (computedDurationHours <= 0) { alert('End date/time must be after start date/time.'); return; }
    onPostRequest({
      title, siteName, address,
      siteInstructions,
      uniformRequirements, equipmentRequirements,
      guardsNeeded, type, armedRequired,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      durationHours: computedDurationHours,
      hourlyRate,
      guardPay: computedGuardPay,
      estimatedPayout: computedPayout,
      requiredCertifications: selectedCerts,
      description: siteInstructions,
      location: `${siteName} — ${address}`,
    });
    setTitle(''); setSiteName(''); setAddress(''); setSiteInstructions('');
    setUniformRequirements(''); setEquipmentRequirements('');
    setGuardsNeeded(1); setShowAddForm(false);
    alert('Security request submitted for staff review.');
  };

  const handleRunAiMatch = async (req: SecurityRequest) => {
    setAiMatchingRequestId(req.id);
    try {
      const response = await fetch('/api/ai-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job: req, guards }),
      });
      const data = await response.json();
      if (data.matches?.length) {
        const map: any = {};
        data.matches.forEach((m: any) => { map[m.guardId] = { score: m.score, compatibilitySummary: m.compatibilitySummary }; });
        setAiMatchResults(prev => ({ ...prev, ...map }));
      }
    } catch {
      console.error('AI match error');
    } finally {
      setAiMatchingRequestId(null);
    }
  };

  const statCards = [
    { icon: Shield,       label: 'Total Requests',    value: `${requests.length}` },
    { icon: Activity,     label: 'Active Deployments', value: `${requests.filter(r => r.status === 'accepted' || r.status === 'in-progress').length}` },
    { icon: CheckCircle2, label: 'Completed Shifts',  value: `${requests.filter(r => r.status === 'completed').length}` },
    { icon: User,         label: 'Available Guards',  value: `${guards.filter(g => g.verified).length} Verified` },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {!isClientApproved && (
        <div className="uber-card border-amber-500/30 bg-amber-500/8 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-black text-sm uppercase tracking-tight">Account Pending Approval</p>
            <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
              Submit your company information and await staff approval before posting security requests.
            </p>
          </div>
        </div>
      )}
      {/* ── STATS ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(({ icon: Icon, label, value }) => (
          <div key={label} className="uber-card flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-primary/15 border border-brand-primary/25 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-brand-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-wide text-brand-text-muted truncate">{label}</p>
              <p className="font-black text-sm font-mono">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── MAIN CONTENT ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: requests list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-base uppercase tracking-tight flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-primary" />
              Your Shift Requests
            </h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              disabled={!isClientApproved}
              className="uber-button-sage h-9 px-4 text-[11px] font-black uppercase tracking-wider gap-1.5 disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" />
              Post Request
            </button>
          </div>

          {requests.length === 0 ? (
            <div className="uber-card py-16 text-center">
              <Shield className="w-10 h-10 text-brand-primary/30 mx-auto mb-3" />
              <p className="text-brand-text-muted text-sm font-mono">No shift requests yet.</p>
              <p className="text-brand-text-muted/60 text-xs mt-1">Click "Post Shift" to create your first request.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map(req => {
                const hiredGuard = guards.find(g => g.id === req.assignedGuardId);
                return (
                  <div key={req.id} className="uber-card space-y-4">
                    {/* Card header */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-brand-primary flex items-center justify-center text-black text-[10px] font-black font-mono shrink-0">
                          {req.type === 'event' ? 'EV' : req.type === 'patrol' ? 'PT' : req.type === 'bodyguard' ? 'VIP' : req.type === 'armed-escort' ? 'ARM' : 'GD'}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-black text-sm truncate">{req.title}</h3>
                          <p className="text-[10px] font-mono text-brand-text-muted capitalize">{req.type.replace('-', ' ')} · {req.clientName}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 px-2.5 py-1 text-[10px] font-mono font-black uppercase tracking-wider ${statusBadgeClass(req.status)}`}>
                        {JOB_STATUS_LABELS[req.status]}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-brand-text-muted leading-relaxed border-l-2 border-brand-border pl-3">
                      {req.description}
                    </p>

                    {/* Details strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-brand-surface border border-brand-border p-3 text-[11px] font-mono">
                      <div className="flex items-center gap-1.5 text-brand-text-muted col-span-2">
                        <Calendar className="w-3 h-3 text-brand-primary shrink-0" />
                        <span className="truncate">{formatShiftRange(req.startDate, req.endDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-brand-text-muted">
                        <Clock className="w-3 h-3 text-brand-primary shrink-0" />
                        <span>{formatDuration(req.durationHours)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-brand-text-muted">
                        <MapPin className="w-3 h-3 text-brand-primary shrink-0" />
                        <span className="truncate">{req.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-brand-text-muted">
                        <DollarSign className="w-3 h-3 text-brand-primary shrink-0" />
                        <span>${req.hourlyRate}/hr</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-black">
                        <DollarSign className="w-3 h-3 text-brand-primary shrink-0" />
                        <span className="text-brand-primary">${req.estimatedPayout} est.</span>
                      </div>
                    </div>

                    {/* Cert requirements */}
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {req.armedRequired && (
                        <span className="text-[9px] font-mono font-black border border-red-500/40 text-red-400 bg-red-500/8 px-2 py-0.5 uppercase">⚠ Armed</span>
                      )}
                      {req.requiredCertifications.map(cert => (
                        <span key={cert} className="text-[9px] font-mono bg-brand-primary/8 border border-brand-primary/25 text-brand-primary px-2 py-0.5 uppercase">{cert}</span>
                      ))}
                    </div>

                    {/* ── OPEN: show guards ─────────── */}
                    {req.status === 'open' && (
                      <div className="pt-3 border-t border-brand-border space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="uber-label">Qualified Guards</p>
                          <button
                            onClick={() => handleRunAiMatch(req)}
                            disabled={aiMatchingRequestId === req.id}
                            className="uber-button-outline h-7 px-3 text-[10px] font-black uppercase gap-1 disabled:opacity-50"
                          >
                            {aiMatchingRequestId === req.id ? (
                              <><Loader2 className="w-3 h-3 animate-spin" /> Ranking...</>
                            ) : (
                              <><Sparkles className="w-3 h-3" /> AI Match</>
                            )}
                          </button>
                        </div>
                        <div className="space-y-2">
                          {guards.map(guard => {
                            const aiMatch = aiMatchResults[guard.id];
                            return (
                              <div key={guard.id} className="flex flex-col sm:flex-row sm:items-center gap-3 border border-brand-border p-3 hover:border-brand-primary transition-colors">
                                <img src={guard.avatar} alt={guard.name} className="w-9 h-9 rounded-full object-cover border border-brand-border shrink-0" referrerPolicy="no-referrer" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-xs">{guard.name}</span>
                                    {guard.verified ? (
                                      <span className="text-[9px] font-mono font-black bg-brand-primary/10 border border-brand-primary/30 text-brand-primary px-1.5 py-0.5">✓ Verified</span>
                                    ) : (
                                      <span className="text-[9px] font-mono bg-brand-border/50 text-brand-text-muted px-1.5 py-0.5">⧗ Pending</span>
                                    )}
                                    {guard.isArmed && <span className="text-[9px] font-mono bg-red-500/10 border border-red-500/25 text-red-400 px-1.5 py-0.5">Armed</span>}
                                  </div>
                                  <p className="text-[10px] text-brand-text-muted font-mono mt-0.5">
                                    ★ {guard.rating} · {guard.jobsCompleted} jobs · ${guard.hourlyRateRequirement}/hr
                                  </p>
                                  {aiMatch && (
                                    <p className="text-[10px] text-brand-primary font-mono mt-1">
                                      {aiMatch.score}% match — {aiMatch.compatibilitySummary}
                                    </p>
                                  )}
                                </div>
                                {guard.verified ? (
                                  <button
                                    onClick={() => onHireGuard(req.id, guard.id)}
                                    className="uber-button-sage shrink-0 h-8 px-4 text-[10px] font-black uppercase gap-1"
                                  >
                                    Hire <ChevronRight className="w-3 h-3" />
                                  </button>
                                ) : (
                                  <span className="shrink-0 text-[9px] font-mono text-brand-text-muted border border-brand-border px-2 py-1">Pending Approval</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ── ASSIGNED: start deployment ─ */}
                    {req.status === 'accepted' && hiredGuard && (
                      <div className="pt-3 border-t border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <img src={hiredGuard.avatar} alt={hiredGuard.name} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                          <div>
                            <p className="uber-label">Contracted Guard</p>
                            <p className="font-bold text-xs">{hiredGuard.name} · Badge {hiredGuard.badgeNumber}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => onUpdateStatus(req.id, 'in-progress')}
                          className="uber-button-sage h-9 px-5 text-xs font-black uppercase gap-1.5"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          Start Deployment
                        </button>
                      </div>
                    )}

                    {/* ── IN-PROGRESS: live feed + end ─ */}
                    {req.status === 'in-progress' && hiredGuard && (
                      <div className="pt-3 border-t border-brand-border space-y-3">
                        <div className="bg-brand-bg border border-brand-border p-3 font-mono text-xs space-y-1.5">
                          <div className="flex items-center justify-between border-b border-brand-border pb-1.5 mb-1.5">
                            <span className="text-brand-primary font-black text-[10px] uppercase tracking-widest">🚨 Live Activity Log</span>
                            <span className="text-[10px] text-brand-primary animate-pulse">● Live</span>
                          </div>
                          <div className="space-y-1 max-h-28 overflow-y-auto text-[11px] text-brand-text-muted">
                            <p><span className="text-brand-border">[18:00]</span> {hiredGuard.name} checked in at {req.location}. Uniform verified.</p>
                            <p><span className="text-brand-border">[18:15]</span> Perimeter sweep complete. Entry cards audited.</p>
                            <p><span className="text-brand-border">[18:45]</span> Minor incident logged — resolved without escalation.</p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <img src={hiredGuard.avatar} alt={hiredGuard.name} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                            <span className="text-xs text-brand-text-muted font-mono">On station: {hiredGuard.name}</span>
                          </div>
                          <button
                            onClick={() => onUpdateStatus(req.id, 'completed')}
                            className="uber-button-sage h-9 px-5 text-xs font-black uppercase gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            End Shift & Release Pay
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── COMPLETED: review ────────── */}
                    {req.status === 'completed' && hiredGuard && (
                      <div className="pt-3 border-t border-brand-border space-y-3">
                        <p className="uber-label flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-brand-primary" />
                          Rate This Guard
                        </p>
                        {req.ratingGiven ? (
                          <div className="flex items-center gap-2">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={`w-4 h-4 ${s <= req.ratingGiven! ? 'fill-brand-primary text-brand-primary' : 'text-brand-border'}`} />
                            ))}
                            <span className="text-xs text-brand-text-muted font-mono italic">"{req.reviewText}"</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex gap-1">
                              {[1,2,3,4,5].map(s => (
                                <button key={s} type="button" onClick={() => setReviewRating(p => ({ ...p, [req.id]: s }))}>
                                  <Star className={`w-5 h-5 transition-colors ${(reviewRating[req.id] || 0) >= s ? 'fill-brand-primary text-brand-primary' : 'text-brand-border hover:text-brand-primary'}`} />
                                </button>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Leave a review..."
                                value={reviewNote[req.id] || ''}
                                onChange={(e) => setReviewNote(p => ({ ...p, [req.id]: e.target.value }))}
                                className="uber-input flex-1"
                              />
                              <button
                                onClick={() => onAddReview(req.id, reviewRating[req.id] || 5, reviewNote[req.id] || 'Good work.')}
                                className="uber-button-sage h-9 px-4 text-xs font-black uppercase"
                              >
                                Submit
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: info panel + form */}
        <div className="space-y-4">
          {/* Info card */}
          <div className="uber-card border-brand-primary/30 bg-brand-primary/5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-brand-primary" />
              <p className="uber-label text-brand-primary">Marketplace Overview</p>
            </div>
            <p className="text-xs text-brand-text-muted leading-relaxed mb-4">
              Post shift requests with exact start & end times. Guards with matching credentials can browse and accept your job. Duration and estimated payout are calculated automatically.
            </p>
            <ul className="space-y-2 text-xs font-mono text-brand-text-muted">
              {[
                'Guards must hold verified credentials',
                'Dates & times set by you — hours auto-tallied',
                'Direct marketplace — no agency overhead',
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Post form */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="uber-card space-y-4 animate-slide-up">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm uppercase tracking-tight flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-brand-primary" />
                  New Shift Request
                </h3>
                <button type="button" onClick={() => setShowAddForm(false)} className="text-brand-text-muted hover:text-brand-text">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="uber-label block mb-1.5">Job Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Event Security, Corporate Patrol"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="uber-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="uber-label block mb-1.5">Site Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Riverside Amphitheater"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="uber-input"
                  />
                </div>
                <div>
                  <label className="uber-label block mb-1.5">Address</label>
                  <input
                    type="text"
                    required
                    placeholder="Street address, city, state"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="uber-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="uber-label block mb-1.5">Job Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value as JobType)} className="uber-select">
                    <option value="event">Event Security</option>
                    <option value="patrol">Long-term Patrol</option>
                    <option value="armed-escort">Armed Transport</option>
                    <option value="bodyguard">VIP Bodyguard</option>
                    <option value="asset-protection">Asset Protection</option>
                    <option value="long-term">Long-term Contract</option>
                    <option value="other">General Guard</option>
                  </select>
                </div>
                <div>
                  <label className="uber-label block mb-1.5">Guards Needed</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={guardsNeeded}
                    onChange={(e) => setGuardsNeeded(Number(e.target.value))}
                    className="uber-input"
                  />
                </div>
              </div>

              {/* Date/Time pickers */}
              <div className="space-y-1">
                <p className="uber-label">Schedule — Enter exact dates & times</p>
                <p className="text-[10px] font-mono text-brand-text-muted mb-2">Duration and total payout are calculated automatically from your selections.</p>
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <label className="text-[10px] font-mono text-brand-text-muted block mb-1">Shift Start</label>
                    <input
                      type="datetime-local"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="uber-input"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-brand-text-muted block mb-1">Shift End</label>
                    <input
                      type="datetime-local"
                      required
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="uber-input"
                    />
                  </div>
                </div>
                {/* Auto-calculated summary */}
                <div className={`flex items-center gap-2 px-3 py-2 border text-[11px] font-mono mt-1 ${
                  computedDurationHours > 0
                    ? 'border-brand-primary/30 bg-brand-primary/5 text-brand-primary'
                    : 'border-red-500/30 bg-red-500/5 text-red-400'
                }`}>
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  {computedDurationHours > 0
                    ? `${formatDuration(computedDurationHours)} · Est. $${computedPayout} total payout`
                    : 'End time must be after start time'}
                </div>
              </div>

              <div>
                <label className="uber-label block mb-1.5">Client Rate ($/hr)</label>
                <input
                  type="number"
                  min="20" max="300"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="uber-input"
                />
                <p className="text-[10px] font-mono text-brand-text-muted mt-1.5">
                  Guard pay: ${computedGuardPay}/hr · Platform fee: ${PLATFORM_FEE_PER_HOUR}/hr
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="uber-label block mb-1.5">Uniform Requirements</label>
                  <input
                    type="text"
                    placeholder="e.g. Black polo, black pants, black shoes"
                    value={uniformRequirements}
                    onChange={(e) => setUniformRequirements(e.target.value)}
                    className="uber-input"
                  />
                </div>
                <div>
                  <label className="uber-label block mb-1.5">Equipment Requirements</label>
                  <input
                    type="text"
                    placeholder="e.g. Radio, flashlight, duty belt"
                    value={equipmentRequirements}
                    onChange={(e) => setEquipmentRequirements(e.target.value)}
                    className="uber-input"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <div className={`w-4 h-4 border flex items-center justify-center shrink-0 ${armedRequired ? 'bg-red-500 border-red-500' : 'border-brand-border'}`}>
                  {armedRequired && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <input type="checkbox" className="sr-only" checked={armedRequired} onChange={(e) => setArmedRequired(e.target.checked)} />
                <span className="text-xs font-mono text-brand-text-muted">⚠ Requires Armed Weapon Certification</span>
              </label>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="uber-label">Site Instructions</label>
                  <button
                    type="button"
                    onClick={handleAiAssist}
                    disabled={aiGenerating}
                    className="uber-button-outline h-6 px-2.5 text-[9px] font-black uppercase gap-1 disabled:opacity-50"
                  >
                    {aiGenerating ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating...</> : <><Sparkles className="w-3 h-3" /> AI Assist</>}
                  </button>
                </div>
                <textarea
                  required
                  rows={3}
                  placeholder="Post orders, access details, and site-specific instructions..."
                  value={siteInstructions}
                  onChange={(e) => setSiteInstructions(e.target.value)}
                  className="uber-input resize-none"
                />
              </div>

              {/* Certifications */}
              <div>
                <label className="uber-label block mb-1.5">Required Certifications</label>
                <div className="border border-brand-border bg-brand-bg max-h-36 overflow-y-auto p-2 space-y-1">
                  {PREFAB_CERT_LIST.map(cert => (
                    <label key={cert} className="flex items-center gap-2 cursor-pointer group p-1 hover:bg-brand-bg-sec">
                      <div className={`w-3.5 h-3.5 border flex items-center justify-center shrink-0 ${selectedCerts.includes(cert) ? 'bg-brand-primary border-brand-primary' : 'border-brand-border'}`}>
                        {selectedCerts.includes(cert) && <Check className="w-2 h-2 text-black" />}
                      </div>
                      <input type="checkbox" className="sr-only" checked={selectedCerts.includes(cert)} onChange={() => handleCertsToggle(cert)} />
                      <span className={`text-[10px] font-mono ${selectedCerts.includes(cert) ? 'text-brand-primary font-bold' : 'text-brand-text-muted'}`}>{cert}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowAddForm(false)} className="uber-button-outline h-10 px-4 text-xs font-black uppercase flex-1">Cancel</button>
                <button type="submit" className="uber-button-sage h-10 px-4 text-xs font-black uppercase flex-1 gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Publish Request
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
