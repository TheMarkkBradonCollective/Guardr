import React, { useRef, useState } from 'react';
import { SecurityRequest } from '../../types';
import { ShiftPhase } from '../../lib/guardJobs';
import { formatDuration } from '../../lib/dates';
import { MapPin, Phone, FileText, AlertTriangle, Activity, Shield } from 'lucide-react';

interface GuardActiveShiftProps {
  job: SecurityRequest;
  phase: ShiftPhase;
  dutySeconds: number;
  onArrived: () => void;
  onBeginAudit: () => void;
  onIncidentReport: () => void;
  onActivityReport: () => void;
  onEndShift: () => void;
}

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const PHASE_LABELS: Record<ShiftPhase, string> = {
  upcoming: 'Upcoming',
  arrived: 'Arrive',
  'on-duty': 'On Duty',
  complete: 'Shift Complete',
};

export function GuardActiveShift({
  job,
  phase,
  dutySeconds,
  onArrived,
  onBeginAudit,
  onIncidentReport,
  onActivityReport,
  onEndShift,
}: GuardActiveShiftProps) {
  const address = job.address || job.location;
  const statusSteps: ShiftPhase[] = ['upcoming', 'arrived', 'on-duty', 'complete'];
  const currentIdx = statusSteps.indexOf(phase);

  return (
    <div className="absolute inset-x-0 bottom-0 z-[1001] max-h-[85vh] overflow-y-auto rounded-t-2xl bg-[#0a0a0a]/98 backdrop-blur-xl border-t border-white/10">
      <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mt-3 mb-4" />

      <div className="px-5 pb-8 space-y-5">
        <div>
          <p className="text-[10px] font-mono uppercase text-brand-primary tracking-widest mb-1">My Shift</p>
          <h2 className="text-xl font-black tracking-tight">{job.title}</h2>
        </div>

        {/* Status stepper */}
        <div className="flex items-center gap-1">
          {statusSteps.slice(0, 3).map((step, i) => (
            <React.Fragment key={step}>
              <div className={`flex-1 text-center py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase ${
                i <= currentIdx ? 'bg-brand-primary/20 text-brand-primary' : 'bg-white/5 text-white/30'
              }`}>
                {PHASE_LABELS[step]}
              </div>
              {i < 2 && <div className={`w-3 h-0.5 ${i < currentIdx ? 'bg-brand-primary' : 'bg-white/10'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-mono uppercase text-white/40">Job Address</p>
              <p className="text-sm font-bold mt-0.5">{address}</p>
              {job.siteName && <p className="text-xs text-white/50 mt-0.5">{job.siteName}</p>}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-mono uppercase text-white/40">Client Contact</p>
              <p className="text-sm font-mono mt-0.5">{job.clientName}</p>
            </div>
          </div>
        </div>

        {phase === 'on-duty' && (
          <div className="text-center py-6 rounded-xl bg-brand-primary/10 border border-brand-primary/25">
            <p className="text-[10px] font-mono uppercase text-brand-primary/80 mb-2">Time On Site</p>
            <p className="text-5xl font-black font-mono tracking-tight text-white">{formatTimer(dutySeconds)}</p>
            <p className="text-xs text-white/40 font-mono mt-2">{formatDuration(job.durationHours)} scheduled</p>
          </div>
        )}

        {job.siteInstructions && (
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <p className="text-[10px] font-mono uppercase text-white/40 flex items-center gap-1.5 mb-2">
              <FileText className="w-3.5 h-3.5" /> Site Instructions
            </p>
            <p className="text-sm text-white/70 leading-relaxed">{job.siteInstructions}</p>
          </div>
        )}

        <div className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-400" />
            <span className="text-xs font-mono text-white/60">Emergency: 911</span>
          </div>
          <span className="text-[10px] font-mono text-white/40">Guardr Dispatch: (555) 0199</span>
        </div>

        {phase === 'upcoming' && (
          <button
            type="button"
            onClick={onArrived}
            className="w-full py-4 rounded-xl bg-brand-primary text-black font-black text-sm uppercase tracking-wider"
          >
            Arrived
          </button>
        )}

        {phase === 'arrived' && (
          <button
            type="button"
            onClick={onBeginAudit}
            className="w-full py-4 rounded-xl bg-brand-primary text-black font-black text-sm uppercase tracking-wider"
          >
            Begin Self Audit
          </button>
        )}

        {phase === 'on-duty' && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onIncidentReport}
              className="py-3 rounded-xl border border-white/15 text-xs font-black uppercase tracking-wide hover:border-brand-primary transition-colors flex items-center justify-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4" /> Incident
            </button>
            <button
              type="button"
              onClick={onActivityReport}
              className="py-3 rounded-xl border border-white/15 text-xs font-black uppercase tracking-wide hover:border-brand-primary transition-colors flex items-center justify-center gap-1.5"
            >
              <Activity className="w-4 h-4" /> Activity
            </button>
            <button
              type="button"
              className="py-3 rounded-xl border border-white/15 text-xs font-black uppercase tracking-wide hover:border-brand-primary transition-colors flex items-center justify-center gap-1.5"
            >
              <Phone className="w-4 h-4" /> Contact Client
            </button>
            <button
              type="button"
              className="py-3 rounded-xl border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-wide flex items-center justify-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4" /> Emergency
            </button>
            <button
              type="button"
              onClick={onEndShift}
              className="col-span-2 py-4 rounded-xl bg-brand-primary text-black font-black text-sm uppercase tracking-wider"
            >
              End Shift
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
