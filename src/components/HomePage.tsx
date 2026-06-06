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
    <div className="bg-black text-white min-h-screen font-sans selection:bg-uber-green selection:text-white relative" id="sigsec-landing-root">
      
      {/* Crisp Grid Line Pattern for Uber feel */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#141414_1px,transparent_1px),linear-gradient(to_bottom,#141414_1px,transparent_1px)] bg-[size:5rem_5rem] pointer-events-none" />

      {/* Hero Header Group */}
      <section className="relative pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-start text-left">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-900 border border-neutral-800 text-uber-green text-[10px] font-mono uppercase tracking-widest mb-6"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-uber-green animate-pulse"></span>
          <span>State Guard Card Standards Compliant</span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 w-full items-center">
          <div className="lg:col-span-7 space-y-6">
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="text-5xl sm:text-7xl font-extrabold font-sans tracking-tighter text-white leading-none uppercase"
            >
              Guardr <br />
              <span className="text-neutral-500 font-light">On-Demand</span> Security
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="text-base sm:text-lg text-neutral-400 max-w-xl leading-relaxed font-sans"
            >
              The state-licensed double-sided dispatch network. Instantly secure physical protection or activate your guard card with automatic compliance audits, live background checks, and instantaneous payout routing.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="pt-4 flex flex-col sm:flex-row gap-3 items-stretch w-full max-w-lg"
            >
              <button
                onClick={() => onNavigateToAuth('client')}
                className="px-8 py-4 bg-white hover:bg-neutral-150 text-black font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer group rounded-none"
              >
                <span>Request Dispatch</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              
              <button
                onClick={() => onNavigateToAuth('guard')}
                className="px-8 py-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer rounded-none"
              >
                <span>Register Guard Card</span>
              </button>
            </motion.div>
          </div>

          {/* Quick Dashboard Entry Portal right in the hero list */}
          <div className="lg:col-span-5 bg-neutral-950 border border-neutral-900 p-6 sm:p-8 space-y-6">
            <div className="border-b border-neutral-900 pb-4">
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest font-extrabold block">Base Access</span>
              <h3 className="text-lg font-bold tracking-tight uppercase text-white">Select Your Interface</h3>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => onNavigateToAuth('client')}
                className="w-full flex items-center justify-between p-4 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-left transition-all group"
              >
                <div>
                  <h4 className="font-bold text-sm uppercase text-white group-hover:text-uber-green transition-colors">Corporate Clients</h4>
                  <p className="text-[11px] text-neutral-400">Post Patrol orders, match guards, manage billing</p>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition-colors" />
              </button>

              <button 
                onClick={() => onNavigateToAuth('guard')}
                className="w-full flex items-center justify-between p-4 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-left transition-all group"
              >
                <div>
                  <h4 className="font-bold text-sm uppercase text-white group-hover:text-uber-green transition-colors">Licensed Guards</h4>
                  <p className="text-[11px] text-neutral-400">Claim live shifts, self-audit uniform, get paid</p>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition-colors" />
              </button>

              <button 
                onClick={() => onNavigateToAuth('auditor')}
                className="w-full flex items-center justify-between p-4 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-left transition-all group"
              >
                <div>
                  <h4 className="font-bold text-sm uppercase text-white group-hover:text-uber-green transition-colors">Compliance Auditors</h4>
                  <p className="text-[11px] text-neutral-400">Review platform safety standard certifications and guard credentials</p>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition-colors" />
              </button>

              <button 
                onClick={() => onNavigateToAuth('staff')}
                className="w-full flex items-center justify-between p-4 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-left transition-all group"
              >
                <div>
                  <h4 className="font-bold text-sm uppercase text-white group-hover:text-uber-green transition-colors">Operations Controller</h4>
                  <p className="text-[11px] text-neutral-400">Rosters, safety overrides, reset conduct files</p>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* Live Marketplace Statistics Banner */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mt-16 w-full bg-neutral-950 border border-neutral-900 p-6 sm:p-8 grid grid-cols-2 lg:grid-cols-4 gap-6 items-center"
        >
          <div className="font-mono space-y-1">
            <p className="text-neutral-500 text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-uber-green" /> Active Officers
            </p>
            <p className="text-3xl font-extrabold text-white">{guardsCount}</p>
            <p className="text-[9px] text-uber-green font-bold uppercase tracking-wider">✓ State Licensed</p>
          </div>

          <div className="font-mono space-y-1 lg:border-l lg:border-neutral-900 lg:pl-6">
            <p className="text-neutral-500 text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-uber-green" /> Dispatch Requests
            </p>
            <p className="text-3xl font-extrabold text-white">{requestsCount}</p>
            <p className="text-[9px] text-neutral-450 font-bold uppercase tracking-wider">⚡ Immediate Assignment</p>
          </div>

          <div className="font-mono space-y-1 lg:border-l lg:border-neutral-900 lg:pl-6">
            <p className="text-neutral-500 text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <ClipboardCheck className="w-3.5 h-3.5 text-uber-green" /> Audit Rating
            </p>
            <p className="text-3xl font-extrabold text-white">99.8%</p>
            <p className="text-[9px] text-uber-green font-bold uppercase tracking-wider">🔒 Standard Met</p>
          </div>

          <div className="font-mono space-y-1 lg:border-l lg:border-neutral-900 lg:pl-6">
            <p className="text-neutral-500 text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-uber-green" /> Matching ETA
            </p>
            <p className="text-3xl font-extrabold text-white">2.4m</p>
            <p className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">⚡ Instant Connection</p>
          </div>
        </motion.div>
      </section>

      {/* Live Directory Board & Open Assignments Preview - Uber Split Layout */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-neutral-900 grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
        
        {/* Guard Registry On Display */}
        <div className="space-y-6 bg-neutral-950 border border-neutral-900 p-6 sm:p-8">
          <div className="space-y-2 border-b border-neutral-900 pb-4">
            <span className="text-[10px] text-uber-green font-mono tracking-widest font-extrabold block">LIVE FLEET ROSTER</span>
            <h2 className="text-2xl font-bold tracking-tight uppercase">Professional Officers</h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Vetted physical security operators matching the dispatch requirements.
            </p>
          </div>

          <div className="space-y-3">
            {sampleGuards.map((g) => (
              <div key={g.id} className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 text-xs">
                <div className="flex items-center space-x-3.5">
                  <img src={g.avatar} alt={g.name} className="w-10 h-10 border border-neutral-900 object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <h4 className="font-bold text-white text-sm tracking-tight">{g.name}</h4>
                    <span className="text-[10px] text-neutral-400 font-mono block mt-0.5">{g.badgeNumber} • {g.isArmed ? 'ARMED PATROL' : 'UNARMED COMPLIANT'}</span>
                  </div>
                </div>
                <div>
                  <span className={`text-[9px] font-mono px-2 py-0.5 border ${
                    g.verified 
                      ? 'bg-neutral-950 text-uber-green border-uber-green/40' 
                      : 'bg-neutral-950 text-amber-400 border-amber-400/40'
                  }`}>
                    {g.verified ? 'STATE VERIFIED' : 'PENDING AUDIT'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Marketplace Postings Feed */}
        <div className="space-y-6 bg-neutral-950 border border-neutral-900 p-6 sm:p-8">
          <div className="space-y-2 border-b border-neutral-900 pb-4">
            <span className="text-[10px] text-uber-green font-mono tracking-widest font-extrabold block">LIVE ASSIGNMENT FEED</span>
            <h2 className="text-2xl font-bold tracking-tight uppercase">Open Deployments</h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Real-time security demands currently requested by corporate clients.
            </p>
          </div>

          <div className="space-y-3">
            {activeJobs.slice(0, 3).map((job) => (
              <div key={job.id} className="p-4 bg-neutral-900 border border-neutral-800 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] bg-neutral-950 border border-neutral-700 text-neutral-300 font-mono px-2.5 py-0.5 font-bold uppercase">{job.type}</span>
                  <span className="text-white font-bold text-sm font-mono">${job.hourlyRate}/Hr</span>
                </div>
                <div>
                  <h4 className="font-bold text-white tracking-tight">{job.title}</h4>
                  <p className="text-neutral-400 text-[11px] mt-1 line-clamp-1">{job.description}</p>
                </div>
                <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono pt-2 border-t border-neutral-950">
                  <span>📍 {job.location}</span>
                  <span>⏱ {job.durationHours} Hours</span>
                </div>
              </div>
            ))}

            {activeJobs.length === 0 && (
              <div className="text-center py-12 text-neutral-500 text-xs">
                All assignments are currently filled. Sign of as a client to post a dispatch.
              </div>
            )}
          </div>
        </div>

      </section>

      {/* Regulatory Compliance & Standards Detail Section */}
      <section className="py-16 bg-black border-t border-neutral-950 px-4">
        <div className="max-w-4xl mx-auto bg-neutral-950 p-8 border border-neutral-900 space-y-6">
          <div className="flex items-start gap-4">
            <ClipboardCheck className="w-6 h-6 text-uber-green shrink-0 mt-1" />
            <div className="space-y-2">
              <h3 className="text-sm font-bold tracking-wider uppercase text-white font-mono">Platform Standards & Escrow Dispatch Protocol</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Platform deployment mandates double-verification on every contract. The client deposits the escrow, and the system locks the assignment window. Our compliance auditors crosscheck physical credentials against State license criteria prior to authorizing assignments. Any officer uniform violations or equipment checks are flagged automatically, protecting retail and private facilities from security compliance exposure.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
