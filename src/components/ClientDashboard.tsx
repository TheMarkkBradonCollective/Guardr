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
  Send,
  MessageSquare,
  Activity,
  Award
} from 'lucide-react';

interface ClientDashboardProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  onPostRequest: (req: Partial<SecurityRequest>) => void;
  onHireGuard: (requestId: string, guardId: string) => void;
  onUpdateStatus: (requestId: string, status: SecurityRequest['status']) => void;
  onAddReview: (requestId: string, rating: number, reviewText: string) => void;
  openPostForm?: boolean;
}

export function ClientDashboard({
  requests,
  guards,
  onPostRequest,
  onHireGuard,
  onUpdateStatus,
  onAddReview,
  openPostForm = false,
}: ClientDashboardProps) {
  const [showAddForm, setShowAddForm] = useState(openPostForm);

  React.useEffect(() => {
    setShowAddForm(openPostForm);
  }, [openPostForm]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState<JobType>('event');
  const [armedRequired, setArmedRequired] = useState(false);
  const [startDate, setStartDate] = useState(getDefaultShiftStart);
  const [endDate, setEndDate] = useState(() => getDefaultShiftEnd(getDefaultShiftStart(), 8));
  const [hourlyRate, setHourlyRate] = useState(40);

  const computedDurationHours = computeDurationHours(startDate, endDate);
  const computedPayout = Math.round(computedDurationHours * hourlyRate * 100) / 100;
  const [selectedCerts, setSelectedCerts] = useState<string[]>(['First Aid & CPR / AED']);
  
  // AI Assist State
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiMatchingRequestId, setAiMatchingRequestId] = useState<string | null>(null);
  const [aiMatchResults, setAiMatchResults] = useState<{ [guardId: string]: { score: number; compatibilitySummary: string; tacticalValue: string } }>({});

  const handleCertsToggle = (cert: string) => {
    if (selectedCerts.includes(cert)) {
      setSelectedCerts(selectedCerts.filter(c => c !== cert));
    } else {
      setSelectedCerts([...selectedCerts, cert]);
    }
  };

  const handleAiAssist = async () => {
    if (!title || !description) {
      alert("Please enter a basic title and short description first so the AI can build off your details!");
      return;
    }
    setAiGenerating(true);
    try {
      const response = await fetch('/api/generate-job-reqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          rawDescription: description,
          startDate,
          endDate,
          type
        })
      });
      const data = await response.json();
      
      setDescription(data.refinedDescription || description);
      
      // Auto-checks recommended certifications found in prefab list
      if (data.recommendedCertifications && Array.isArray(data.recommendedCertifications)) {
        const matchingCerts = PREFAB_CERT_LIST.filter(prefab =>
          data.recommendedCertifications.some((rec: string) => 
            rec.toLowerCase().includes(prefab.toLowerCase()) || 
            prefab.toLowerCase().includes(rec.toLowerCase())
          )
        );
        if (matchingCerts.length > 0) {
          setSelectedCerts(matchingCerts);
        }
      }

      // Automatically bump budget hourly rate if risk level is High/Critical
      if (data.riskLevel && (data.riskLevel.toLowerCase().includes('high') || data.riskLevel.toLowerCase().includes('critical') || armedRequired)) {
        setHourlyRate(prev => Math.max(prev, 55));
      }

      alert(`AI Operations Assistant generated tactical plan! Assigned Risk Level: ${data.riskLevel || 'Low-Medium'}`);
    } catch (e) {
      console.error(e);
      alert("Completed with standard local rules.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !location) {
      alert("Please fill in title, base description and deployment location.");
      return;
    }
    if (computedDurationHours <= 0) {
      alert("Shift end must be after shift start.");
      return;
    }
    onPostRequest({
      title,
      description,
      location,
      type,
      armedRequired,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      durationHours: computedDurationHours,
      hourlyRate,
      estimatedPayout: computedPayout,
      requiredCertifications: selectedCerts,
    });
    // Reset Form
    setTitle('');
    setDescription('');
    setLocation('');
    setShowAddForm(false);
  };

  const handleRunAiMatch = async (req: SecurityRequest) => {
    setAiMatchingRequestId(req.id);
    try {
      // Send the request details and only approved/verified guards to review is best, 
      // but let's send all and rank them
      const response = await fetch('/api/ai-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job: req,
          guards: guards
        })
      });
      const data = await response.json();
      
      if (data.matches && Array.isArray(data.matches)) {
        const resultsMap: any = {};
        data.matches.forEach((m: any) => {
          resultsMap[m.guardId] = {
            score: m.score,
            compatibilitySummary: m.compatibilitySummary,
            tacticalValue: m.tacticalValue
          };
        });
        setAiMatchResults(prev => ({ ...prev, ...resultsMap }));
      }
    } catch (e) {
      console.error("AI matchmaking error:", e);
    } finally {
      setAiMatchingRequestId(null);
    }
  };

  // Review states per completed request
  const [reviewRating, setReviewRating] = useState<{ [reqId: string]: number }>({});
  const [reviewNote, setReviewNote] = useState<{ [reqId: string]: string }>({});

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-none shadow-xs border border-slate-200 flex items-center space-x-4">
          <div className="bg-slate-50 p-3 rounded-lg text-blue-605">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Job Requests</span>
            <span className="text-xl font-bold font-mono text-slate-900">{requests.length} Postings</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-none shadow-xs border border-slate-200 flex items-center space-x-4">
          <div className="bg-green-50/40 p-3 rounded-lg text-green-700">
            <Check className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Active Deployments</span>
            <span className="text-xl font-bold font-mono text-slate-900">
              {requests.filter(r => r.status === 'assigned' || r.status === 'in-progress').length} Guards
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-none shadow-xs border border-slate-200 flex items-center space-x-4">
          <div className="bg-blue-50/40 p-3 rounded-lg text-blue-700">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Marketplace Integrity</span>
            <span className="text-xl font-bold font-mono text-slate-900">100% Verified</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-none shadow-xs border border-slate-200 flex items-center space-x-4">
          <div className="bg-blue-50/40 p-3 rounded-lg text-blue-700">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Available Officers</span>
            <span className="text-xl font-bold font-mono text-slate-900">
              {guards.filter(g => g.verified).length} Qualified
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Postings list and creation Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Requests listings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" /> Your Shift Requests
            </h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="uber-button-green text-xs px-4 py-2 h-auto shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>POST NEW SECURITY DEMAND</span>
            </button>
          </div>

          {requests.length === 0 ? (
            <div className="bg-slate-50 rounded-xl py-12 text-center border border-dashed border-slate-200">
              <Shield className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No postings yet. Click above to create one!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map(req => {
                const hiredGuard = guards.find(g => g.id === req.assignedGuardId);
                const hasMatchResults = requests.some(r => r.id === req.id && aiMatchResults[guards[0]?.id]);

                return (
                  <div key={req.id} className="bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                    
                    {/* Header bar of posting */}
                    <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 bg-slate-900 text-slate-100 rounded-md flex items-center justify-center font-bold font-mono text-xs shadow-xs">
                          {req.clientLogo}
                        </div>
                        <div>
                          <span className="text-xs font-mono font-bold text-slate-800 tracking-tight">{req.clientName}</span>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                            <span>Req: <strong className="font-mono">{req.id}</strong></span>
                            <span>•</span>
                            <span className="capitalize">{req.type.replace('-', ' ')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badging */}
                      <span className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-widest font-bold border ${
                        req.status === 'open' ? 'bg-blue-50/55 text-blue-700 border-blue-200' :
                        req.status === 'assigned' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                        req.status === 'in-progress' ? 'bg-purple-100 text-purple-800 animate-pulse border border-purple-300' :
                        'bg-blue-600/10 text-blue-800 border-blue-500/20'
                      }`}>
                        {req.status === 'open' && '⚡ OPEN FOR APPLICATIONS'}
                        {req.status === 'assigned' && '🛡️ OFFICER ASSIGNED'}
                        {req.status === 'in-progress' && '🚨 ON PATROL / ACTIVE'}
                        {req.status === 'completed' && '✓ PATROL COMPLETE'}
                      </span>
                    </div>

                    {/* Content Section */}
                    <div className="p-5 space-y-4">
                      <div>
                        <h3 className="font-bold text-slate-800 text-md">{req.title}</h3>
                        <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed">{req.description}</p>
                      </div>

                      {/* Details row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3.5 bg-slate-50 rounded-lg text-xs font-mono">
                        <div className="flex items-center space-x-2 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{req.location}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-600 col-span-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{formatShiftRange(req.startDate, req.endDate)} ({formatDuration(req.durationHours)})</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-600">
                          <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>${req.hourlyRate}/hr rate</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-900 font-bold">
                          <DollarSign className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>Est: ${req.estimatedPayout} Payout</span>
                        </div>
                      </div>

                      {/* Required Badges */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider font-mono block">VERIFIED CREDENTIAL MATCH REQS:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {req.armedRequired && (
                            <span className="bg-red-50 text-red-700 font-mono text-[10px] uppercase font-bold py-0.5 px-2 rounded-sm border border-red-200">
                              ⚠️ ARMED PERMIT MANDATORY
                            </span>
                          )}
                          {req.requiredCertifications.map(cert => (
                            <span key={cert} className="bg-slate-100 text-slate-700 py-0.5 px-2 rounded-sm font-mono text-[10px]">
                              🔑 {cert}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Open State: AI Match engine & applicants flow */}
                      {req.status === 'open' && (
                        <div className="pt-4 border-t border-slate-100 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold font-mono text-slate-500">QUALIFIED AVAILABLE SYSTEM PERSONNEL:</span>
                            <button
                              onClick={() => handleRunAiMatch(req)}
                              disabled={aiMatchingRequestId === req.id}
                              className="bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-805 font-medium px-3.5 py-1.5 rounded-lg text-xs transition-all flex items-center space-x-1 font-mono disabled:opacity-50 shadow-xs"
                            >
                              {aiMatchingRequestId === req.id ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                                  <span className="text-slate-750">RANKING OFFICERS...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                  <span className="text-slate-750">RUN DYNAMIC MATCH ENGINE</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Render applicants */}
                          <div className="space-y-3">
                            {guards.map(guard => {
                              const aiMatch = aiMatchResults[guard.id];
                              const isApplied = req.applicants.includes(guard.id);

                              return (
                                <div key={guard.id} className="border border-slate-100 rounded-lg p-4 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                  <div className="flex items-center space-x-3">
                                    <img src={guard.avatar} alt={guard.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                                    <div>
                                      <div className="flex items-center space-x-2">
                                        <h4 className="font-bold text-sm text-slate-900">{guard.name}</h4>
                                        {guard.verified ? (
                                          <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-1.5 py-0.5 rounded-sm">✓ AUDITED VERIFIED</span>
                                        ) : (
                                          <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded-sm">⧗ PENDING AUDIT</span>
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-500 line-clamp-1">{guard.bio}</p>
                                      
                                      {/* Render credentials summary */}
                                      <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-400 font-mono">
                                        <span>Badge: {guard.badgeNumber}</span>
                                        <span>•</span>
                                        <span>Armed: {guard.isArmed ? 'YES' : 'NO'}</span>
                                        <span>•</span>
                                        <span>Rating: ★ {guard.rating}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* AI Match Info */}
                                  {aiMatch && (
                                    <div className="bg-blue-50/50 border border-blue-100 p-2.5 rounded-lg text-xs sm:max-w-xs font-mono">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-blue-900 font-bold flex items-center gap-1">
                                          <Sparkles className="w-3 h-3 text-blue-600" /> Compatibility:
                                        </span>
                                        <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">{aiMatch.score}% MATCH</span>
                                      </div>
                                      <p className="text-[11px] text-slate-600 leading-snug">{aiMatch.compatibilitySummary}</p>
                                    </div>
                                  )}

                                  {/* Action button */}
                                  <div className="text-right">
                                    {guard.verified ? (
                                      <button
                                        onClick={() => onHireGuard(req.id, guard.id)}
                                        className="bg-blue-600 text-white font-bold px-4 py-2 rounded-lg text-xs hover:bg-blue-700 transition-all font-mono w-full sm:w-auto shadow-xs"
                                      >
                                        HIRE OFFICER
                                      </button>
                                    ) : (
                                      <span className="text-[10px] font-mono text-slate-600 block bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded">
                                        VERIFICATION STANDBY
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Assigned State: Start Job */}
                      {req.status === 'assigned' && hiredGuard && (
                        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-center space-x-3">
                            <img src={hiredGuard.avatar} alt={hiredGuard.name} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                            <div>
                              <p className="text-xs text-slate-400 font-mono">CONTRACTED SECURITY EXPERT:</p>
                              <h4 className="font-bold text-sm text-slate-900">{hiredGuard.name} (Badge {hiredGuard.badgeNumber})</h4>
                            </div>
                          </div>
                          <div>
                            <button
                              onClick={() => onUpdateStatus(req.id, 'in-progress')}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4.5 py-2.5 rounded-lg text-xs tracking-wider font-mono shadow-md"
                            >
                              COMMENCE ACTIVE DEPLOYMENT
                            </button>
                          </div>
                        </div>
                      )}

                      {/* In-Progress State: See Log & Complete */}
                      {req.status === 'in-progress' && hiredGuard && (
                        <div className="pt-4 border-t border-slate-100 space-y-4">
                          <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs space-y-2 border border-slate-850">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                              <span className="text-blue-405 font-bold tracking-tight text-blue-400">🚨 ACTIVE PATROL TERMINAL RADIO</span>
                              <span className="text-[10px] text-green-500 animate-pulse">● LIVE CHANNEL</span>
                            </div>
                            <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1 text-[11px] text-slate-300">
                              <p><span className="text-slate-500">[18:00]</span> {hiredGuard.name} checked in at primary coordinate {req.location}. Wearing correct standard uniform.</p>
                              <p><span className="text-slate-500">[18:15]</span> Perimeter swept. Secure lines signed. All security entry cards audited.</p>
                              <p><span className="text-slate-500">[18:45]</span> Incident alert: Non-authorized guest approached gate. Politely escorted away without incident. Incident logged.</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
                            <div className="flex items-center space-x-3">
                              <img src={hiredGuard.avatar} alt={hiredGuard.name} className="w-9 h-9 rounded-full object-cover" referrerPolicy="no-referrer" />
                              <span className="text-xs text-slate-500 font-medium">On station: {hiredGuard.name}</span>
                            </div>
                            <button
                              onClick={() => onUpdateStatus(req.id, 'completed')}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg text-xs tracking-wide font-mono shadow-sm"
                            >
                              END SHIFT & RELEASE PAY
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Completed State: Review and finish */}
                      {req.status === 'completed' && hiredGuard && (
                        <div className="pt-4 border-t border-slate-100 bg-slate-50/50 p-4 rounded-xl space-y-4">
                          <div className="flex items-center space-x-2">
                            <Award className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-bold text-slate-700 font-mono">FINALISED PATROL AUDIT SCORECARD:</span>
                          </div>

                          {req.ratingGiven ? (
                            <div className="bg-white p-3 border border-slate-100 rounded-lg text-xs space-y-1">
                              <div className="flex items-center space-x-1.5 text-amber-500">
                                {Array.from({ length: req.ratingGiven }).map((_, i) => (
                                  <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                ))}
                                <span className="font-bold text-slate-800 font-mono font-xs ml-1">{req.ratingGiven}/5 Rating Given</span>
                              </div>
                              <p className="text-slate-600 italic">" {req.reviewText} "</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-slate-500 font-medium font-mono">Assigned Rating:</span>
                                <div className="flex space-x-1.5">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setReviewRating(prev => ({ ...prev, [req.id]: star }))}
                                      className="transition-transform hover:scale-110"
                                    >
                                      <Star className={`w-5 h-5 ${
                                        (reviewRating[req.id] || 0) >= star ? 'fill-amber-500 text-amber-500' : 'text-slate-300'
                                      }`} />
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Review guard professionalism and performance..."
                                  value={reviewNote[req.id] || ''}
                                  onChange={(e) => setReviewNote(prev => ({ ...prev, [req.id]: e.target.value }))}
                                  className="bg-white border border-slate-200 text-xs rounded-lg px-3 py-1.5 flex-1 focus:ring-1 focus:ring-blue-600 outline-none"
                                />
                                <button
                                  onClick={() => {
                                    const rating = reviewRating[req.id] || 5;
                                    const text = reviewNote[req.id] || 'Excellent professional security duty.';
                                    onAddReview(req.id, rating, text);
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors shadow-xs"
                                >
                                  Submit review
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: New job form or information */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-2xl shadow-xl">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold font-mono tracking-wider text-blue-400 uppercase">OFFICE DEPLOYMENT PROTOCOL</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Signature Security is an automated Double-Sided verification marketplace. Post active contracts and find instantly qualified personnel.
            </p>
            <ul className="text-[11px] font-mono text-slate-400 space-y-2">
              <li className="flex items-start gap-1.5">
                <span className="text-blue-500 font-bold shrink-0">✓</span>
                All onboarded guards hold audited active security licenses.
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-500 font-bold shrink-0">✓</span>
                AI verifies and double-matches guard credentials.
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-500 font-bold shrink-0">✓</span>
                Pay escrow remains locked until the patrol logs clear.
              </li>
            </ul>
          </div>

          {/* Posting Creation Form */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="bg-white border border-slate-205 rounded-xl p-5 shadow-lg space-y-4 animate-slide-up">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-950 text-sm flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-blue-600" /> Post Security Req
                </h3>
                <p className="text-[11px] text-slate-500">Provide basic info, then use AI Assist to optimize.</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider block font-mono">SPECIFIC DEPLOYMENT TITLE</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Escort Detail / Luxury Yacht Event Guard"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider block font-mono">CONTRACT TYPE</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as JobType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 outline-none"
                  >
                    <option value="event">Short-term Event</option>
                    <option value="patrol">Long-term Patrol</option>
                    <option value="armed-escort">Armed High Risk Transport</option>
                    <option value="bodyguard">Executive VIP Bodyguard</option>
                    <option value="asset-protection">On-Demand Asset Protection</option>
                    <option value="other">General Watch</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider block font-mono">MANDATORY POST LOCATION</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Downtown Vaults, Sector 4"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider block font-mono">SHIFT START DATE & TIME</label>
                  <input
                    type="datetime-local"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-none px-3 py-1.5 text-xs text-slate-900 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider block font-mono">SHIFT END DATE & TIME</label>
                  <input
                    type="datetime-local"
                    required
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-none px-3 py-1.5 text-xs text-slate-900 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider block font-mono">SHIFT BUDGET RATE ($/HR)</label>
                  <input
                    type="number"
                    min="20"
                    max="200"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-none px-3 py-1.5 text-xs text-slate-900 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider block font-mono">AUTO-CALCULATED DURATION</label>
                  <div className={`w-full bg-slate-50 border border-slate-200 rounded-none px-3 py-1.5 text-xs font-mono ${computedDurationHours <= 0 ? 'text-red-600' : 'text-slate-900'}`}>
                    {computedDurationHours > 0 ? `${formatDuration(computedDurationHours)} • Est. $${computedPayout}` : 'End must be after start'}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 py-1">
                <input
                  type="checkbox"
                  id="armedRequired-checkbox"
                  checked={armedRequired}
                  onChange={(e) => setArmedRequired(e.target.checked)}
                  className="accent-blue-600 rounded"
                />
                <label htmlFor="armedRequired-checkbox" className="text-xs font-bold text-red-650 font-mono tracking-wide">
                  ⚠️ REQUIRES ARMED WEAPON CERTIFICATION
                </label>
              </div>

              {/* Description & AI assist button inline */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider block font-mono">TACTICAL DESCRIPTION & MANPOWER</label>
                  <button
                    type="button"
                    onClick={handleAiAssist}
                    disabled={aiGenerating}
                    className="text-blue-700 bg-blue-50/55 hover:bg-blue-100 border border-blue-200 px-2.5 py-0.5  rounded-lg text-[10px] font-bold flex items-center space-x-1 font-mono transition-colors disabled:opacity-50"
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                        <span>TACTICAL PLAN GENERATION...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        <span>AI SPEC OPTIMIZATION</span>
                      </>
                    )}
                  </button>
              </div>
              <textarea
                required
                rows={3}
                placeholder="Give basic guidelines of who, where and what you need..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none"
              />
            </div>

            {/* Certifications Multiselect */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 tracking-wider block font-mono">MANDATORY AUDITED CERTIFICATIONS</label>
              <div className="grid grid-cols-1 gap-1.5 max-h-32 overflow-y-auto border border-slate-200 p-2 rounded bg-slate-50">
                {PREFAB_CERT_LIST.map(cert => {
                  const isChecked = selectedCerts.includes(cert);
                  return (
                    <label key={cert} className="flex items-center space-x-2 text-[10px] text-slate-705 cursor-pointer hover:bg-slate-100/55 p-1 rounded font-mono">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCertsToggle(cert)}
                        className="accent-blue-600 rounded text-xs"
                      />
                      <span className={isChecked ? 'font-bold text-slate-950' : ''}>{cert}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2 text-xs">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="font-medium text-slate-500 px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="uber-button-green h-auto px-4.5 py-2 text-xs shadow-sm"
              >
                PUBLISH DEMAND REQUEST
              </button>
            </div>
          </form>
          )}
        </div>

      </div>

    </div>
  );
}
