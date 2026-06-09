import React, { useEffect, useState } from 'react';
import { GuardJobView } from '../../lib/guardJobView';
import { ShiftPhase } from '../../lib/guardJobs';
import { formatDuration } from '../../lib/dates';
import {
  canGuardClockIn,
  canGuardClockOut,
  guardClockInBlockedMessage,
  guardClockOutBlockedMessage,
  shiftClockOutOpensAt,
} from '../../lib/shiftWindow';
import { MapPin, Phone, FileText, AlertTriangle, Activity, Clock } from 'lucide-react';

interface GuardActiveShiftProps {
  job: GuardJobView;
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
  arrived: 'Arrived',
  'on-duty': 'On duty',
  complete: 'Complete',
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
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const address = job.address || job.location;
  const statusSteps: ShiftPhase[] = ['upcoming', 'arrived', 'on-duty', 'complete'];
  const currentIdx = statusSteps.indexOf(phase);
  const clockInOpen = canGuardClockIn(job, now);
  const clockOutOpen = canGuardClockOut(job, now);
  const clockInMsg = guardClockInBlockedMessage(job, now);
  const clockOutMsg = guardClockOutBlockedMessage(job, now);

  return (
    <div className="absolute inset-x-0 bottom-0 z-[1001] guardr-bottom-sheet guardr-active-shift rounded-t-2xl flex flex-col overflow-hidden">
      <div className="w-10 h-1 rounded-full sheet-handle mx-auto mt-3 mb-4" />

      <div className="guard-scroll-panel px-5 pb-8 space-y-5">
        <div>
          <p className="text-sm font-medium text-brand-primary mb-1">Active job</p>
          <h2 className="text-xl font-bold">{job.title}</h2>
        </div>

        <div className="segmented-control">
          {statusSteps.slice(0, 3).map((step) => (
            <span
              key={step}
              className={`segmented-control-btn flex-1 text-center py-2 ${
                statusSteps.indexOf(step) <= currentIdx ? 'segmented-control-btn-active' : ''
              }`}
            >
              {PHASE_LABELS[step]}
            </span>
          ))}
        </div>

        <div className="space-y-4 py-2 border-t border-b border-brand-border">
          <div className="flex items-start gap-3 w-full">
            <MapPin className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <p className="text-sm text-brand-text-muted">Location</p>
              <p className="font-medium mt-0.5">{address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 w-full">
            <Phone className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <p className="text-sm text-brand-text-muted">Client</p>
              <p className="font-medium mt-0.5">{job.clientName}</p>
            </div>
          </div>
        </div>

        {phase === 'on-duty' && (
          <div className="text-center py-5 border-b border-brand-border">
            <p className="text-xs text-brand-text-muted mb-1">Time on site</p>
            <p className="text-3xl font-bold tracking-tight">{formatTimer(dutySeconds)}</p>
            <p className="text-sm text-brand-text-muted mt-2">{formatDuration(job.durationHours)} scheduled</p>
          </div>
        )}

        {job.siteInstructions && (
          <div className="py-2 border-b border-brand-border">
            <p className="text-sm text-brand-text-muted flex items-center gap-1.5 mb-2">
              <FileText className="w-4 h-4" strokeWidth={1.5} /> Site instructions
            </p>
            <p className="text-sm leading-relaxed">{job.siteInstructions}</p>
          </div>
        )}

        {(phase === 'upcoming' || phase === 'arrived') && !clockInOpen && clockInMsg && (
          <p className="text-xs text-amber-400/90 border border-amber-500/30 bg-amber-500/5 rounded-xl p-3 flex gap-2">
            <Clock className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{clockInMsg}</span>
          </p>
        )}

        {phase === 'upcoming' && (
          <button
            type="button"
            onClick={onArrived}
            disabled={!clockInOpen}
            className="app-button-primary disabled:opacity-40"
          >
            I've arrived
          </button>
        )}

        {phase === 'arrived' && (
          <button
            type="button"
            onClick={onBeginAudit}
            disabled={!clockInOpen}
            className="app-button-primary disabled:opacity-40"
          >
            Begin self audit · clock in
          </button>
        )}

        {phase === 'upcoming' && clockInOpen && (
          <p className="text-xs text-brand-text-muted text-center">
            Clock-in open until job ends
          </p>
        )}

        {phase === 'on-duty' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={onIncidentReport} className="app-button-outline !h-12 !text-sm gap-2">
                <AlertTriangle className="w-4 h-4" /> Report incident
              </button>
              <button type="button" onClick={onActivityReport} className="app-button-outline !h-12 !text-sm gap-2">
                <Activity className="w-4 h-4" /> Activity report
              </button>
              <button type="button" className="app-button-outline !h-12 !text-sm gap-2 col-span-2">
                <Phone className="w-4 h-4" /> Contact client
              </button>
            </div>
            {!clockOutOpen && clockOutMsg && (
              <p className="text-xs text-amber-400/90 border border-amber-500/30 bg-amber-500/5 rounded-xl p-3 flex gap-2">
                <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{clockOutMsg}</span>
              </p>
            )}
            {clockOutOpen && (
              <p className="text-xs text-brand-text-muted text-center">
                Clock-out window: {shiftClockOutOpensAt(job.endDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                {' – '}
                {new Date(shiftClockOutOpensAt(job.endDate).getTime() + 15 * 60_000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </p>
            )}
            <button
              type="button"
              onClick={onEndShift}
              disabled={!clockOutOpen}
              className="app-button-primary disabled:opacity-40"
            >
              Complete job · clock out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
