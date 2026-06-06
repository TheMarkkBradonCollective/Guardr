import React from 'react';
import { Logo } from './Logo';
import { Shield, User, Briefcase, Eye, ShieldCheck, Bell, Lock } from 'lucide-react';
import { SecurityGuard } from '../types';

interface SimulatorHeaderProps {
  currentPersona: 'client' | 'guard' | 'auditor' | 'staff';
  setPersona: (persona: 'client' | 'guard' | 'auditor' | 'staff') => void;
  activeGuard: SecurityGuard;
  guardsList: SecurityGuard[];
  setActiveGuardId: (id: string) => void;
}

export function SimulatorHeader({
  currentPersona,
  setPersona,
  activeGuard,
  guardsList,
  setActiveGuardId,
}: SimulatorHeaderProps) {
  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white shadow-xl sticky top-0 z-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo Brand Group */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-neutral-950 border border-neutral-800 rounded flex items-center justify-center text-uber-green shadow-md">
              <Logo size={18} className="text-uber-green" />
            </div>
            <div>
              <span className="font-mono text-[10px] text-blue-400 uppercase tracking-widest font-bold block">On-Demand Guard Network</span>
              <h1 className="text-md font-bold tracking-tight text-white flex items-center gap-1.5 leading-none">
                SIGNATURE <span className="text-blue-500">SEC</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-mono font-medium">COMPLIANCE HUB</span>
              </h1>
            </div>
          </div>

          {/* Active Persona Selection Panel */}
          <div className="bg-slate-950 border border-slate-800 p-1 rounded-xl flex items-center space-x-1 self-center">
            
            {/* Client Tab button */}
            <button
              id="switch-persona-client"
              onClick={() => setPersona('client')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                currentPersona === 'client'
                  ? 'bg-blue-600 text-white shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>CLIENT DESK</span>
            </button>

            {/* Guard Tab button */}
            <button
              id="switch-persona-guard"
              onClick={() => setPersona('guard')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                currentPersona === 'guard'
                  ? 'bg-blue-600 text-white shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>GUARD BOARD</span>
            </button>

            {/* Auditor Admin Tab button */}
            <button
              id="switch-persona-auditor"
              onClick={() => setPersona('auditor')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                currentPersona === 'auditor'
                  ? 'bg-red-650 text-white shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>COMPLIANCE AUDITOR</span>
            </button>

            {/* Staff operations Tab button */}
            <button
              id="switch-persona-staff"
              onClick={() => setPersona('staff')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                currentPersona === 'staff'
                  ? 'bg-indigo-600 text-white shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>STAFF CONSOLE</span>
            </button>
            
          </div>

          {/* Additional details depending on context */}
          <div className="flex items-center space-x-3 border-l border-slate-800 pl-4 md:border-l">
            {currentPersona === 'client' && (
              <div className="text-right hidden sm:block font-mono text-[11px]">
                <p className="text-slate-500 uppercase tracking-wider text-[9px]">Representing Client</p>
                <p className="font-semibold text-blue-400">Sartorial Vanguard Group</p>
              </div>
            )}
            {currentPersona === 'guard' && (
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400 font-mono">Simulating:</span>
                <select
                  value={activeGuard.id}
                  onChange={(e) => setActiveGuardId(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-slate-200 text-xs focus:ring-1 focus:ring-blue-500 outline-none font-medium"
                >
                  {guardsList.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.verified ? '✓ Verified' : '⧗ Pending'}){g.isStaff ? ' [👑 Operations Staff]' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {currentPersona === 'auditor' && (
              <div className="text-right hidden sm:block font-mono text-[11px]">
                <p className="text-red-400 font-mono font-bold tracking-widest text-[9px] uppercase">INSPECTION LEVEL</p>
                <p className="text-slate-400">Sign-off Officer Privileges</p>
              </div>
            )}
            {currentPersona === 'staff' && (
              <div className="text-right hidden sm:block font-mono text-[11px]">
                <p className="text-indigo-400 font-mono font-bold tracking-widest text-[9px] uppercase">OPERATIONS ROSTER</p>
                <p className="text-slate-400">Primary Administrators</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Compliance / Simulator Notification Strip */}
      <div className="bg-slate-950/60 border-t border-slate-800 text-[11px]">
        <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 bg-blue-500 rounded-full animate-ping h-2"></span>
            <span className="font-sans text-slate-300">
              {currentPersona === 'client' && 'Simulation: Host security postings, run AI specifications optimization, and review deployments.'}
              {currentPersona === 'guard' && `Simulating guard ${activeGuard.name}. ${activeGuard.verified ? '✓ Certified: Fully cleared and compliant to accept live shifts.' : '⚠️ Credentials pending audit. Submit licenses below or switch to compliance auditor to approve.'}`}
              {currentPersona === 'auditor' && 'Audit Workspace: Review federal credentials, verify background registries, and approve dispatch files.' }
              {currentPersona === 'staff' && 'Operations Desk: Control directory access, toggle operator admin status, suspend/block accounts, and approve postings.' }
            </span>
          </div>
          <span className="font-mono text-slate-500 hidden md:block">ISO-27001 Compliance Protocol</span>
        </div>
      </div>
    </div>
  );
}
