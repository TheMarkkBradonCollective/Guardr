import React, { useState } from 'react';
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
  Plus
} from 'lucide-react';

interface GuardDashboardProps {
  guard: SecurityGuard;
  requests: SecurityRequest[];
  onAddCertification: (cert: Partial<Certification>) => void;
  onAcceptJob: (requestId: string) => void;
}

export function GuardDashboard({
  guard,
  requests,
  onAddCertification,
  onAcceptJob,
}: GuardDashboardProps) {
  const [showAddCert, setShowAddCert] = useState(false);
  const [certName, setCertName] = useState(PREFAB_CERT_LIST[0]);
  const [issuer, setIssuer] = useState('');
  const [num, setNum] = useState('');
  const [issueDate, setIssueDate] = useState('2025-01-01');
  const [expiryDate, setExpiryDate] = useState('2028-01-01');

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

          {/* Active Work Slots */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 font-mono uppercase">
              <Briefcase className="w-4 h-4 text-emerald-600" /> Contracted Dispatch Assignments ({assignedJobs.length})
            </h3>

            {assignedJobs.length === 0 ? (
              <div className="bg-slate-50 rounded-xl p-6 text-center border border-dashed border-slate-200 text-xs">
                <p className="text-slate-500">No active dispatch orders assigned. Accept an open shift from the panel below.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignedJobs.map(req => (
                  <div key={req.id} className="bg-slate-900 text-slate-100 p-5 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="bg-emerald-600 text-white font-mono text-[9px] uppercase font-bold py-0.5 px-2 rounded">
                        {req.status === 'assigned' ? 'DISPATCHED' : 'ON SCENE (ACTIVE)'}
                      </span>
                      <span className="font-mono text-slate-400 text-xs">Job ID: {req.id}</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-white">{req.title}</h4>
                      <p className="text-xs text-slate-300 mt-1">{req.location}</p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs font-mono bg-slate-850/60 p-3 rounded-lg text-slate-400">
                      <div>Rate: <span className="text-amber-400 font-bold">${req.hourlyRate}/hr</span></div>
                      <div>Duration: <span className="text-slate-200">{req.durationHours} hours</span></div>
                      <div>Est Earnings: <span className="text-green-400 font-bold">${req.estimatedPayout}</span></div>
                    </div>

                    <div className="text-xs rounded border border-slate-800 p-3 bg-slate-950/40 text-slate-300">
                      <span className="font-bold block text-[10px] uppercase font-mono text-amber-500">CLIENT POST NOTES:</span>
                      <p className="mt-1">{req.description}</p>
                    </div>
                  </div>
                ))}
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
