import React, { useEffect, useState } from 'react';
import { GuardJobView } from '../../lib/guardJobView';
import { ShiftPhase } from '../../lib/guardJobs';
import { formatDuration } from '../../lib/dates';
import {
  canGuardClockIn,
  canGuardClockOut,
  guardClockInBlockedMessage,
  guardClockOutBlockedMessage,
  shiftClockInOpensAt,
  shiftClockOutClosesAt,
  shiftClockOutOpensAt,
} from '../../lib/shiftWindow';
import { JobSelfAuditPhotosSection } from '../jobs/JobSelfAuditPhotosSection';
import { SlideToConfirm } from '../ui/SlideToConfirm';
import { MapPin, Phone, FileText, AlertTriangle, Activity, Clock } from 'lucide-react';

interface GuardActiveShiftProps {
  job: GuardJobView;
  phase: ShiftPhase;
  dutySeconds: number;
  onArrived: () => void;
  onBeginAudit: () => void;
  onSkipAudit: () => void;
  onIncidentReport: () => void;
  onActivityReport: () => void;
  onEndShift: () => void;
  onOpenJobChat?: () => void;
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

function formatClockWindowTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function GuardActiveShift({
  job,
  phase,
  dutySeconds,
  onArrived,
  onBeginAudit,
  onSkipAudit,
  onIncidentReport,
  onActivityReport,
  onEndShift,
  onOpenJobChat,
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
  const clockInOpensLabel = formatClockWindowTime(shiftClockInOpensAt(job.startDate));
  const clockOutOpensLabel = formatClockWindowTime(shiftClockOutOpensAt(job.endDate));
  const clockOutClosesLabel = formatClockWindowTime(shiftClockOutClosesAt(job.endDate));

  return (
    <div className="absolute inset-x-0 bottom-0 z-[1001] guardr-bottom-sheet guardr-active-shift rounded-t-2xl flex flex-col overflow-hidden">
      <div className="w-10 h-1 rounded-full sheet-handle mx-auto mt-3 mb-4" />

      <div className="guard-scroll-panel px-5 pb-8 space-y-5">
        <div>
          <p className="text-sm font-medium text-brand-primary mb-1">Active job</p>
          <h2 className="text-xl font-bold">{job.title}</h2>
        </div>

        <div className="segmented-control segmented-control-full">
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

        {(phase === 'on-duty' || phase === 'complete') && (
          <JobSelfAuditPhotosSection request={job} hideStaffAttribution />
        )}

        {phase === 'upcoming' && (
          <SlideToConfirm
            label="Slide to arrive on site"
            confirmedLabel="Arrived"
            onConfirm={onArrived}
            disabled={!clockInOpen}
            disabledHint={clockInMsg ?? `Clock-in opens at ${clockInOpensLabel} (15 min before start).`}
          />
        )}

        {phase === 'arrived' && (
          <div className="space-y-3">
            <SlideToConfirm
              label="Slide to start shift"
              confirmedLabel="Starting…"
              onConfirm={onBeginAudit}
              disabled={!clockInOpen}
              disabledHint={clockInMsg ?? `Clock-in opens at ${clockInOpensLabel} (15 min before start).`}
            />
            <button
              type="button"
              onClick={onSkipAudit}
              disabled={!clockInOpen}
              className="app-button-outline disabled:opacity-40 text-amber-700 dark:text-amber-400 border-amber-500/40 !h-11 !text-sm"
            >
              Skip self audit · clock in
            </button>
            <p className="text-xs text-brand-text-muted text-center">
              Skipping flags this job as No Self Audit until staff add photos after the job.
            </p>
          </div>
        )}

        {phase === 'upcoming' && clockInOpen && (
          <p className="text-xs text-brand-text-muted text-center">
            Clock-in open from {clockInOpensLabel} until job ends
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
              <button
                type="button"
                onClick={onOpenJobChat}
                disabled={!onOpenJobChat}
                className="app-button-outline !h-12 !text-sm gap-2 col-span-2 disabled:opacity-40"
              >
                <Phone className="w-4 h-4" /> Message client
              </button>
            </div>
            <SlideToConfirm
              label="Slide to end shift"
              confirmedLabel="Ending…"
              tone="success"
              onConfirm={onEndShift}
              disabled={!clockOutOpen}
              disabledHint={
                clockOutMsg ??
                `Clock-out opens at ${clockOutOpensLabel} and closes at ${clockOutClosesLabel}.`
              }
            />
            {clockOutOpen && (
              <p className="text-xs text-brand-text-muted text-center flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                End window: {clockOutOpensLabel} – {clockOutClosesLabel}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
