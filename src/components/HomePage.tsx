import React from 'react';
import { 
  Shield, 
  Users, 
  CheckCircle, 
  Lock, 
  Briefcase, 
  ClipboardCheck, 
  Award, 
  TrendingUp, 
  Activity, 
  Zap, 
  Clock,
  ArrowRight,
  ShieldCheck,
  Search,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';
import { SecurityRequest, SecurityGuard } from '../types';

interface HomePageProps {
  onNavigateToAuth: (initialRole?: 'guard' | 'client' | 'auditor' | 'staff') => void;
  guardsCount: number;
  requestsCount: number;
  availableRequests: SecurityRequest[];
  sampleGuards: SecurityGuard[];
}

export function HomePage({ 
  onNavigateToAuth, 
  guardsCount, 
  requestsCount,
  availableRequests,
  sampleGuards
}: HomePageProps) {
  const activeJobs = availableRequests.filter(r => r.status === 'open');

  return (
    <div className="bg-slate-950 text-white min-h-screen font-sans selection:bg-indigo-500 selection:text-white" id="sigsec-landing-root">
      
      {/* Decorative Grid Background Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-full font-mono text-[10px] uppercase tracking-wider mb-6"
        >
          <Shield className="w-3 h-3 text-indigo-400" />
          <span>BSIS California Oversight Certified</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-black font-sans tracking-tight text-white max-w-4xl leading-tight"
        >
          Signature Security <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent">Vetting Platform</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed font-sans"
        >
          The elite double-sided dispatch network for credentialed physical security. 
          Real-time BSIS license verification, background check validation, automated operator controls, and transparent escrowed payouts.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-md"
        >
          <button
            onClick={() => onNavigateToAuth('client')}
            className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm tracking-wide rounded-xl transition-all shadow-lg hover:shadow-indigo-500/10 flex items-center justify-center gap-2 cursor-pointer group"
          >
            <span>Request Patrol Dispatch</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
          
          <button
            onClick={() => onNavigateToAuth('guard')}
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Register Guard Card</span>
          </button>
        </motion.div>

        {/* Live Marketplace Statistics Banner */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 w-full max-w-5xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 hover:border-indigo-500/20 transition-all shadow-xl"
        >
          <div className="text-center font-mono space-y-1">
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-semibold flex items-center justify-center gap-1">
              <Users className="w-3 h-3 text-indigo-400" /> Active Guards
            </p>
            <p className="text-2xl sm:text-3xl font-black text-white">{guardsCount}</p>
            <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">✓ 100% Background Screened</p>
          </div>

          <div className="text-center font-mono space-y-1 md:border-l md:border-slate-800/80">
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-semibold flex items-center justify-center gap-1">
              <Briefcase className="w-3 h-3 text-indigo-400" /> Active Job Orders
            </p>
            <p className="text-2xl sm:text-3xl font-black text-white">{requestsCount}</p>
            <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider">⚡ Immediate Dispatch</p>
          </div>

          <div className="text-center font-mono space-y-1 md:border-l md:border-slate-800/80">
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-semibold flex items-center justify-center gap-1">
              <ClipboardCheck className="w-3 h-3 text-indigo-400" /> BSIS Audit Integrity
            </p>
            <p className="text-2xl sm:text-3xl font-black text-white">99.8%</p>
            <p className="text-[9px] text-blue-400 font-bold uppercase tracking-wider">🔒 Escrow Protected</p>
          </div>

          <div className="text-center font-mono space-y-1 md:border-l md:border-slate-800/80">
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-semibold flex items-center justify-center gap-1">
              <Activity className="w-3 h-3 text-indigo-400" /> Staff Dispatch
            </p>
            <p className="text-2xl sm:text-3xl font-black text-white">2.4m</p>
            <p className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">⏰ Average Response Time</p>
          </div>
        </motion.div>
      </section>

      {/* Role Categories Panel (Saves User confusion) */}
      <section className="bg-slate-900/30 border-y border-slate-900 py-16 px-4">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-[10px] bg-indigo-500/25 border border-indigo-500/40 text-indigo-300 font-mono px-3 py-1 rounded-full uppercase font-semibold">
              ROLE RELEVANCE
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Four Independent Operational Nodes</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
              Our platform orchestrates security connections by matching guards, clients, compliance auditors, and system operators securely.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Guard Portal Node */}
            <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-6 transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-white">For Licensed Guards</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Register with your official state license badge. Upload certifications, browse live shifts, instant draft, and receive lightning payout.
                </p>
              </div>
              <button 
                onClick={() => onNavigateToAuth('guard')}
                className="w-full py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Onboard Guard License
              </button>
            </div>

            {/* Clients Node */}
            <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-6 transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-white">For Private Clients</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Post high-profile crowd control, critical assets, or VIP escort requests. Instantly review matched verified applicant profiles.
                </p>
              </div>
              <button 
                onClick={() => onNavigateToAuth('client')}
                className="w-full py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Hire Certified Detail
              </button>
            </div>

            {/* Compliance Auditors */}
            <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-6 transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-white">For Compliance Auditors</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Audit BSIS legal licenses, approve background status flags, and ensure all security deployments meet local state regulations.
                </p>
              </div>
              <button 
                onClick={() => onNavigateToAuth('auditor')}
                className="w-full py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Audit Panel Login
              </button>
            </div>

            {/* Operations Staff */}
            <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-6 transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-white">Administrative Staff</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Direct management over user registries. Toggle operator administrative powers, suspend of block violating accounts, and review disputes.
                </p>
              </div>
              <button 
                onClick={() => onNavigateToAuth('staff')}
                className="w-full py-2 bg-red-650/10 hover:bg-red-650/20 text-red-400 border border-red-505/20 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Operations Desk
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Live Directory Board & Open Assignments Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Guard Registry On Display */}
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] text-indigo-400 font-mono tracking-widest font-extrabold block">SIGSEC ROSTER</span>
            <h2 className="text-2xl font-black font-sans tracking-tight">Vetted Security Officers</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time feed showing active, verified officers in the state database. Registered with physical background validations.
            </p>
          </div>

          <div className="space-y-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 backdrop-blur-xs">
            {sampleGuards.map((g) => (
              <div key={g.id} className="flex items-center justify-between p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-lg text-xs">
                <div className="flex items-center space-x-3">
                  <img src={g.avatar} alt={g.name} className="w-10 h-10 rounded-full border border-slate-800 object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <h4 className="font-extrabold text-slate-100">{g.name}</h4>
                    <span className="text-[10px] text-slate-500 font-mono tracking-wider">{g.badgeNumber} • {g.isArmed ? 'ARMED CERTIFIED' : 'UNARMED COMPLIANT'}</span>
                  </div>
                </div>
                <div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    g.verified 
                      ? 'bg-blue-950 text-blue-300 border border-blue-800/50' 
                      : 'bg-amber-950 text-amber-300 border border-amber-800/50'
                  }`}>
                    {g.verified ? '✓ BSIS VETTED' : '⧗ PENDING AUDIT'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Marketplace Postings Feed */}
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] text-emerald-400 font-mono tracking-widest font-extrabold block">LIVE ASSIGNMENT FEED</span>
            <h2 className="text-2xl font-black font-sans tracking-tight">Open Security Deployments</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Available high-profile shifts requiring legal clearance and verified guard cards.
            </p>
          </div>

          <div className="space-y-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 backdrop-blur-xs">
            {activeJobs.slice(0, 3).map((job) => (
              <div key={job.id} className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-lg text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-400/20 font-mono px-2 py-0.5 rounded font-bold uppercase">{job.type}</span>
                  <span className="text-slate-200 font-extrabold text-sm font-mono">${job.hourlyRate}/hr</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-100">{job.title}</h4>
                  <p className="text-slate-450 line-clamp-1 text-[11px] mt-0.5">{job.description}</p>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono border-t border-slate-900 pt-2 mt-2">
                  <span>📍 {job.location}</span>
                  <span>⏱ {job.durationHours} hours</span>
                </div>
              </div>
            ))}

            {activeJobs.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-xs">
                All assignments are currently filled. Sign as a client to post a dispatch.
              </div>
            )}
          </div>
        </div>

      </section>

      {/* BSIS Registry Framework Detail Section */}
      <section className="py-16 bg-slate-950 border-t border-slate-900 px-4">
        <div className="max-w-4xl mx-auto bg-slate-900/50 p-8 rounded-2xl border border-slate-800/50 space-y-6">
          <div className="flex items-start gap-3">
            <ClipboardCheck className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-white">Double-Sided Vetting Protocol Requirements</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Platform deployment mandates double verification on every contract. The client deposits the estimated payout, 
                and the system locks the assignment page. Concurrently, state-auditors must crosscheck the guard's physical guard card 
                license number against real BSIS records. Violating guard records are instantly locked, suspended, or blocked by 
                administrative personnel to safeguard retail facilities.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
