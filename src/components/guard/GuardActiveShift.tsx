import React from 'react';
import { SecurityRequest } from '../../types';
import { ShiftPhase } from '../../lib/guardJobs';
import { formatDuration } from '../../lib/dates';
import { MapPin, Phone, FileText, AlertTriangle, Activity } from 'lucide-react';

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
  const address = job.address || job.location;
  const statusSteps: ShiftPhase[] = ['upcoming', 'arrived', 'on-duty', 'complete'];
  const currentIdx = statusSteps.indexOf(phase);

  return (
    <div className="absolute inset-x-0 z-[1001] max-h-[calc(100dvh-5.5rem-env(safe-area-inset-bottom))] guardr-bottom-sheet guardr-active-shift rounded-t-2xl flex flex-col overflow-hidden">
      <div className="w-10 h-1 rounded-full sheet-handle mx-auto mt-3 mb-4" />

      <div className="guard-scroll-panel px-5 pb-8 space-y-5">
        <div>
          <p className="text-sm font-medium text-brand-primary mb-1">Active shift</p>
          <h2 className="text-xl font-bold">{job.title}</h2>
        </div>

        <div className="flex items-center gap-1">
          {statusSteps.slice(0, 3).map((step, i) => (
            <React.Fragment key={step}>
              <div className={`flex-1 text-center py-2 rounded-xl text-xs font-semibold ${
                i <= currentIdx ? 'bg-brand-primary/15 text-brand-primary' : 'surface-muted text-brand-text-muted'
              }`}>
                {PHASE_LABELS[step]}
              </div>
              {i < 2 && <div className={`w-3 h-0.5 ${i < currentIdx ? 'bg-brand-primary' : 'bg-brand-border'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="surface-muted rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-brand-text-muted">Location</p>
              <p className="font-medium mt-0.5">{address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-brand-text-muted">Client</p>
              <p className="font-medium mt-0.5">{job.clientName}</p>
            </div>
          </div>
        </div>

        {phase === 'on-duty' && (
          <div className="text-center py-8 rounded-2xl bg-brand-primary/10 border border-brand-primary/20">
            <p className="text-sm text-brand-text-muted mb-2">Time on site</p>
            <p className="text-5xl font-bold tracking-tight">{formatTimer(dutySeconds)}</p>
            <p className="text-sm text-brand-text-muted mt-2">{formatDuration(job.durationHours)} scheduled</p>
          </div>
        )}

        {job.siteInstructions && (
          <div className="surface-muted rounded-2xl p-4">
            <p className="text-sm text-brand-text-muted flex items-center gap-1.5 mb-2">
              <FileText className="w-4 h-4" /> Site instructions
            </p>
            <p className="text-sm leading-relaxed">{job.siteInstructions}</p>
          </div>
        )}

        {phase === 'upcoming' && (
          <button type="button" onClick={onArrived} className="w-full uber-button-sage">
            I've arrived
          </button>
        )}

        {phase === 'arrived' && (
          <button type="button" onClick={onBeginAudit} className="w-full uber-button-sage">
            Begin self audit
          </button>
        )}

        {phase === 'on-duty' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={onIncidentReport} className="uber-button-outline h-12 text-sm gap-2">
                <AlertTriangle className="w-4 h-4" /> Report incident
              </button>
              <button type="button" onClick={onActivityReport} className="uber-button-outline h-12 text-sm gap-2">
                <Activity className="w-4 h-4" /> Activity report
              </button>
              <button type="button" className="uber-button-outline h-12 text-sm gap-2 col-span-2">
                <Phone className="w-4 h-4" /> Contact client
              </button>
            </div>
            <button type="button" onClick={onEndShift} className="w-full uber-button-sage">
              End shift
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
