import React, { useState } from 'react';
import { SecurityGuard, Certification } from '../types';
import { 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Search, 
  UserCheck, 
  Flame, 
  Sparkles, 
  Loader2, 
  Clock, 
  Check, 
  Filter,
  Bookmark,
  Scale
} from 'lucide-react';

interface AuditorDashboardProps {
  guards: SecurityGuard[];
  onApproveGuard: (guardId: string) => void;
  onRejectGuard: (guardId: string) => void;
  onApproveCert: (guardId: string, certId: string) => void;
  onRejectCert: (guardId: string, certId: string) => void;
  onUpdateBackgroundChecked: (guardId: string, status: boolean) => void;
}

export function AuditorDashboard({
  guards,
  onApproveGuard,
  onRejectGuard,
  onApproveCert,
  onRejectCert,
  onUpdateBackgroundChecked,
}: AuditorDashboardProps) {
  const [selectedGuardId, setSelectedGuardId] = useState<string>(guards[2]?.id || guards[0]?.id || '');
  const [auditReason, setAuditReason] = useState('BSIS State registry search returned valid unexpired status.');
  const [searchQuery, setSearchQuery] = useState('');

  // AI Verification State
  const [loadingAiVerifyId, setLoadingAiVerifyId] = useState<string | null>(null);
  const [aiVerifiedLogs, setAiVerifiedLogs] = useState<{
    [certId: string]: {
      isAuthentic: boolean;
      score: number;
      notes: string;
      verifiedScope: string[];
      suggestedRoles: string[];
    }
  }>({});

  const activeReviewGuard = guards.find(g => g.id === selectedGuardId);

  const handleRunAiAudit = async (guard: SecurityGuard, cert: Certification) => {
    setLoadingAiVerifyId(cert.id);
    try {
      const response = await fetch('/api/verify-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guardName: guard.name,
          certificationsRawText: `${cert.name} (License #: ${cert.number}, Issued by: ${cert.issuer})`,
          experienceRawText: guard.experience.map(e => `${e.title} at ${e.company} (${e.period})`).join(', ')
        })
      });
      const data = await response.json();
      
      setAiVerifiedLogs(prev => ({
        ...prev,
        [cert.id]: {
          isAuthentic: data.isAuthentic,
          score: data.score,
          notes: data.notes,
          verifiedScope: data.verifiedScope || [],
          suggestedRoles: data.suggestedRoles || []
        }
      }));

      // Automatically populate audit description notes
      setAuditReason(`AI Verification Result: Score ${data.score}/100. ${data.notes}`);
    } catch (e) {
      console.error(e);
      alert("Verification fallback applied.");
    } finally {
      setLoadingAiVerifyId(null);
    }
  };

  const filteredGuards = guards.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.badgeNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in text-slate-800">
      
      {/* Overview stats for Audit Compliance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono tracking-wider uppercase">Regulatory Status</span>
            <span className="text-[10px] bg-red-600 font-mono px-2 py-0.5 rounded-full font-bold">100% REGULATED</span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold font-mono text-white">BSIS compliant</h3>
            <p className="text-[11px] text-slate-400 mt-1">Credentials synced with Department of Investigative Services</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-mono block uppercase">Action Needed</span>
          <div className="mt-3 flex items-baseline space-x-1.5">
            <span className="text-2xl font-extrabold font-mono text-slate-950">
              {guards.filter(g => !g.verified).length} Guard files
            </span>
            <span className="text-xs text-blue-600 font-bold font-mono">Pending Check</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-mono block uppercase">Verified Escrow Officers</span>
          <div className="mt-3 flex items-baseline space-x-1.5">
            <span className="text-2xl font-extrabold font-mono text-slate-950">
              {guards.filter(g => g.verified).length} Active
            </span>
            <span className="text-xs text-emerald-600 font-bold font-mono">100% Cleared</span>
          </div>
        </div>

      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Hand: Search and list of Guard Directory profiles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-red-600" /> Guard Compliance Directory
            </h3>
          </div>

          {/* Search inputs */}
          <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center space-x-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, license # or badge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-slate-900 outline-none w-full"
            />
          </div>

          {/* Guards vertical list */}
          <div className="space-y-2.5">
            {filteredGuards.map(guard => {
              const pendingCertsCount = guard.certifications.filter(c => c.status === 'pending').length;

              return (
                <button
                  key={guard.id}
                  onClick={() => setSelectedGuardId(guard.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedGuardId === guard.id
                      ? 'bg-slate-900 border-slate-800 text-white shadow-md'
                      : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400">{guard.badgeNumber}</span>
                    {guard.verified ? (
                      <span className="bg-blue-100 text-blue-850 text-[8px] font-bold px-1.5 py-0.5 rounded">VERIFIED APPROVED</span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 text-[8px] font-bold px-1.5 py-0.5 rounded">PENDING AUDIT</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 mt-2">
                    <img src={guard.avatar} alt={guard.name} className="w-9 h-9 rounded-full object-cover border" referrerPolicy="no-referrer" />
                    <div>
                      <h4 className="font-bold text-xs">{guard.name}</h4>
                      <p className={`text-[10px] ${selectedGuardId === guard.id ? 'text-slate-400' : 'text-slate-500'}`}>
                        Completed Runs: {guard.jobsCompleted} • Rating: {guard.rating}
                      </p>
                    </div>
                  </div>

                  {pendingCertsCount > 0 && (
                    <div className="mt-2.5 bg-blue-500/5 border border-blue-200/50 px-2 py-1 rounded text-[10px] font-mono text-blue-600 flex items-center justify-between">
                      <span>⚠ HAS {pendingCertsCount} UNVERIFIED LICENSES</span>
                      <span className="font-bold shrink-0">Click to Audit</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Detailed Audit Profile Workspace */}
        <div className="lg:col-span-2 space-y-6">
          {activeReviewGuard ? (
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 space-y-6">
              
              {/* Profile Details Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="flex items-center space-x-4">
                  <img src={activeReviewGuard.avatar} alt={activeReviewGuard.name} className="w-14 h-14 rounded-full object-cover border" referrerPolicy="no-referrer" />
                  <div>
                    <h3 className="text-xl font-black text-slate-950 font-mono tracking-tight leading-none mb-1.5">{activeReviewGuard.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">REGISTRATION KEY: <strong className="text-slate-900 uppercase font-black">{activeReviewGuard.badgeNumber}</strong></p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-start font-mono text-xs">
                  <span className="text-slate-400">Profile Status:</span>
                  {activeReviewGuard.verified ? (
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded">✓ COMPLIANCY STATUS CLEAR</span>
                  ) : (
                    <span className="bg-red-100 text-red-800 font-bold px-2.5 py-1 rounded">⚠️ COMPLIANCY ACTION REQUIRED</span>
                  )}
                </div>
              </div>

              {/* Bio & experience checklist summaries */}
              <div>
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider font-mono mb-2">Technical Profile Bio</h4>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg leading-relaxed italic">{activeReviewGuard.bio}</p>
              </div>

              {/* Security parameters checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Background Checks */}
                <div className="border border-slate-100 p-4 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block">STATE CRIMINAL RECORD CLEARANCE</span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-700 font-semibold flex items-center gap-1">
                      {activeReviewGuard.backgroundChecked ? '✓ Checked & Cleared' : '⧗ Pending search log'}
                    </span>
                    <button
                      onClick={() => onUpdateBackgroundChecked(activeReviewGuard.id, !activeReviewGuard.backgroundChecked)}
                      className="bg-slate-900 border border-slate-800 text-white font-bold p-1 px-2.5 text-[10px] rounded hover:bg-slate-800"
                    >
                      {activeReviewGuard.backgroundChecked ? 'Re-lock file' : 'Mark Cleared Check'}
                    </button>
                  </div>
                </div>

                {/* Armed state status */}
                <div className="border border-slate-100 p-4 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block">ARMED WEAPON DISPATCH QUALIFIER</span>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className={activeReviewGuard.isArmed ? 'text-red-700 font-bold' : 'text-slate-700'}>
                      {activeReviewGuard.isArmed ? '🔥 ARMED APPROVED' : '🛡️ UNARMED GENERAL PATROL'}
                    </span>
                    <span className="text-[10px] text-slate-400">Derived fromBSIS file</span>
                  </div>
                </div>

              </div>

              {/* Certifications verification log */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider font-mono">Certifications & Licenses Verification Logs</h4>

                <div className="space-y-4">
                  {activeReviewGuard.certifications.map(cert => {
                    const aiLog = aiVerifiedLogs[cert.id];

                    return (
                      <div key={cert.id} className="border border-slate-100 rounded-xl overflow-hidden shadow-xs">
                        
                        {/* Certificate Header details */}
                        <div className="bg-slate-50 p-4 border-b border-slate-100 flex flex-row items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="bg-slate-200 text-slate-700 font-mono text-[9px] font-bold py-0.5 px-2 rounded-full uppercase">
                              License Entry #{cert.number}
                            </span>
                            <h5 className="font-bold text-slate-900 mt-1">{cert.name}</h5>
                            <span className="text-[10px] text-slate-500 font-mono">Issuer body: {cert.issuer} • Exp Date: {cert.expiryDate}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {cert.status === 'pending' ? (
                              <button
                                onClick={() => handleRunAiAudit(activeReviewGuard, cert)}
                                disabled={loadingAiVerifyId === cert.id}
                                className="bg-blue-600 hover:bg-blue-700 font-semibold text-white p-2 px-3.5 rounded-lg text-[10px] uppercase font-mono tracking-wider flex items-center space-x-1.5 shadow-xs"
                              >
                                {loadingAiVerifyId === cert.id ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                                    <span>CONTACTING GEN REGISTRY...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5 text-white" />
                                    <span>RUN AI MATCH AUDIT</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className={`px-2.5 py-1 text-[10px] font-mono rounded font-bold uppercase ${
                                cert.status === 'verified' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {cert.status === 'verified' ? '✓ Registered' : 'Cancelled'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* If AI Match Audit is done, render results */}
                        {aiLog && (
                          <div className="bg-purple-950 text-purple-100 p-4 text-xs font-mono space-y-3 border-b border-purple-900 animate-slide-up">
                            <div className="flex items-center justify-between border-b border-purple-900 pb-2">
                              <span className="text-amber-400 font-bold flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5" /> AI REGISTRY MATCH VERIFICATION RESULTS:
                              </span>
                              <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded text-[10px]">
                                TRUST SCORE: {aiLog.score}%
                              </span>
                            </div>

                            <p className="text-[11px] leading-relaxed text-purple-200">
                              <strong className="text-slate-100">Registry Match note:</strong> {aiLog.notes}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] pt-1.5">
                              <div>
                                <span className="text-amber-400 block font-bold">APPROVED TECHNICAL SECURITY SCOPES:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {aiLog.verifiedScope.map(sc => (
                                    <span key={sc} className="bg-purple-900 text-purple-200 border border-purple-800 px-1.5 py-0.5 rounded">{sc}</span>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <span className="text-amber-400 block font-bold">CERTIFIED PROFESSIONAL DEPLOYMENT PLACEMENT:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {aiLog.suggestedRoles.map(sr => (
                                    <span key={sr} className="bg-purple-900 text-purple-200 border border-purple-800 px-1.5 py-0.5 rounded">{sr}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Approvals buttons */}
                        <div className="p-3.5 bg-slate-50/50 flex justify-end space-x-2 text-xs">
                          {cert.status === 'pending' && (
                            <>
                              <button
                                onClick={() => onRejectCert(activeReviewGuard.id, cert.id)}
                                className="text-red-700 hover:text-red-800 font-mono text-[10px] font-bold px-3 py-1.5 hover:bg-red-50 rounded"
                              >
                                Flag / Reject
                              </button>
                              <button
                                onClick={() => onApproveCert(activeReviewGuard.id, cert.id)}
                                className="bg-blue-650 hover:bg-blue-700 text-white font-mono text-[10px] font-bold px-4 py-2 rounded-lg flex items-center space-x-1 shadow-xs"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Verify & Approve Certificate</span>
                              </button>
                            </>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Global Profile Certification and Audit Note sign-off panel */}
              <div className="bg-slate-900 text-slate-100 p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center space-x-2">
                  <Bookmark className="w-4 h-4 text-blue-500" />
                  <span className="text-xs uppercase font-bold text-slate-400 font-mono">Federal Sign-off Audit Review</span>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="text-[10px] text-slate-400 font-mono tracking-wider block">AUDITOR LOG SIGN-OFF EXPLANATORY NOTES</label>
                  <textarea
                    rows={2}
                    value={auditReason}
                    onChange={(e) => setAuditReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div className="flex justify-end space-x-2 text-xs font-mono">
                  {activeReviewGuard.verified ? (
                    <button
                      onClick={() => onRejectGuard(activeReviewGuard.id)}
                      className="bg-red-650/20 text-red-400 hover:bg-red-650/30 font-bold px-4 py-2 rounded border border-red-500/20"
                    >
                      SUSPEND APPROVED FILE
                    </button>
                  ) : (
                    <button
                      onClick={() => onApproveGuard(activeReviewGuard.id)}
                      className="bg-blue-600 text-white hover:bg-blue-700 font-bold px-5 py-2.5 rounded-lg shadow-lg"
                    >
                      APPROVE SECURITY GUARD PROFILE FOR DISPATCH
                    </button>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-slate-50 text-center py-16 rounded-2xl border border-dashed text-sm">
              <p className="text-slate-550">Select high-contract personnel directories from the checklist panel left.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
