import React, { useEffect, useMemo, useState } from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';
import {
  CLIENT_SHIFT_PHASE_LABELS,
  CLIENT_SHIFT_STEPS,
  clientShiftScheduleLabel,
  clientShiftStepIndex,
  clientShiftTimerLabel,
  inferClientShiftPhase,
} from '../../lib/clientShift';
import { computeSiteStatus } from '../../lib/clientCoverage';
import { JobSelfAuditPhotosSection } from '../jobs/JobSelfAuditPhotosSection';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import {
  Activity,
  AlertTriangle,
  Clock,
  MapPin,
  MessageCircle,
  Radio,
  Shield,
  Star,
} from 'lucide-react';

interface ClientActiveShiftProps {
  request: SecurityRequest;
  guard: SecurityGuard;
  allLiveRequests: SecurityRequest[];
  onOpenJobChat?: () => void;
  onOpenCoverage?: () => void;
  onSwitchJob?: (requestId: string) => void;
}

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const SITE_STATUS_COPY = {
  secured: { label: 'Site secured', tone: 'text-emerald-500' },
  attention: { label: 'Needs attention', tone: 'text-amber-500' },
  incident: { label: 'Incident reported', tone: 'text-red-500' },
} as const;

export function ClientActiveShift({
  request,
  guard,
  allLiveRequests,
  onOpenJobChat,
  onOpenCoverage,
  onSwitchJob,
}: ClientActiveShiftProps) {
  const phase = inferClientShiftPhase(request);
  const stepIdx = clientShiftStepIndex(phase);
  const siteStatus = computeSiteStatus([request]);
  const statusCopy = SITE_STATUS_COPY[siteStatus];
  const address = request.address || request.location;
  const timerLabel = clientShiftTimerLabel(request);
  const [dutySeconds, setDutySeconds] = useState(0);

  useEffect(() => {
    if (request.status !== 'in-progress') {
      setDutySeconds(0);
      return;
    }
    const startedAt = new Date(request.checkInAudit?.checkedAt ?? request.startDate).getTime();
    const tick = () => setDutySeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [request.id, request.status, request.checkInAudit?.checkedAt, request.startDate]);

  const otherJobs = useMemo(
    () => allLiveRequests.filter((r) => r.id !== request.id),
    [allLiveRequests, request.id]
  );

  return (
    <div className="absolute inset-x-0 bottom-0 z-[1001] guardr-bottom-sheet guardr-active-shift client-active-shift rounded-t-2xl flex flex-col overflow-hidden">
      <div className="w-10 h-1 rounded-full sheet-handle mx-auto mt-3 mb-3" />

      <div className="guard-scroll-panel px-5 pb-8 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-brand-primary mb-1">Live coverage</p>
            <h2 className="text-xl font-bold leading-tight">{request.title}</h2>
            <p className={`text-sm font-semibold mt-1 ${statusCopy.tone}`}>{statusCopy.label}</p>
          </div>
          {onOpenCoverage && (
            <button
              type="button"
              onClick={onOpenCoverage}
              className="shrink-0 app-button-outline app-btn-sm gap-1.5"
            >
              <Radio className="w-3.5 h-3.5" />
              Ops
            </button>
          )}
        </div>

        <div className="segmented-control segmented-control-full">
          {CLIENT_SHIFT_STEPS.map((step) => (
            <span
              key={step}
              className={`segmented-control-btn flex-1 text-center py-2 text-[11px] sm:text-xs ${
                CLIENT_SHIFT_STEPS.indexOf(step) <= stepIdx ? 'segmented-control-btn-active' : ''
              }`}
            >
              {CLIENT_SHIFT_PHASE_LABELS[step]}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3 p-3 border border-brand-border bg-brand-bg-sec">
          <ProfileAvatar src={guard.avatar} name={guard.name} size="md" className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">{guard.name}</p>
            <div className="flex items-center gap-2 text-xs text-brand-text-muted mt-0.5">
              <Star className="w-3 h-3 fill-brand-primary text-brand-primary" />
              <span>{guard.rating.toFixed(1)}</span>
              <span>·</span>
              <span>{guard.jobsCompleted} jobs</span>
            </div>
          </div>
          {onOpenJobChat && (
            <button
              type="button"
              onClick={onOpenJobChat}
              className="shrink-0 app-button-primary app-btn-sm gap-1.5"
            >
              <MessageCircle className="w-4 h-4" />
              Message
            </button>
          )}
        </div>

        {phase === 'on-duty' && (
          <div className="text-center py-4 border-y border-brand-border bg-brand-primary/5">
            <p className="text-xs text-brand-text-muted mb-1">Guard on duty</p>
            <p className="text-3xl font-bold tracking-tight tabular-nums">{formatTimer(dutySeconds)}</p>
            <p className="text-sm text-brand-text-muted mt-2">
              {timerLabel} elapsed · {clientShiftScheduleLabel(request)} scheduled
            </p>
          </div>
        )}

        <div className="space-y-3 py-1 border-b border-brand-border">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 shrink-0 mt-0.5 text-brand-primary" strokeWidth={1.5} />
            <div>
              <p className="text-sm text-brand-text-muted">Site</p>
              <p className="font-medium mt-0.5">{address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 shrink-0 mt-0.5 text-brand-primary" strokeWidth={1.5} />
            <div>
              <p className="text-sm text-brand-text-muted">Shift window</p>
              <p className="font-medium mt-0.5">{clientShiftScheduleLabel(request)}</p>
            </div>
          </div>
        </div>

        {request.siteInstructions && (
          <div className="py-2 border-b border-brand-border">
            <p className="text-sm text-brand-text-muted flex items-center gap-1.5 mb-2">
              <Shield className="w-4 h-4" /> Post orders
            </p>
            <p className="text-sm leading-relaxed">{request.siteInstructions}</p>
          </div>
        )}

        {(phase === 'on-duty' || phase === 'on-site') && request.checkInAudit && (
          <JobSelfAuditPhotosSection request={request} hideStaffAttribution />
        )}

        <div className="app-action-row--2">
          {onOpenJobChat && (
            <button type="button" onClick={onOpenJobChat} className="app-button-primary app-btn-md gap-2 col-span-2" style={{ gridColumn: '1 / -1' }}>
              <MessageCircle className="w-4 h-4" /> Message guard
            </button>
          )}
          {onOpenCoverage && (
            <button type="button" onClick={onOpenCoverage} className="app-button-outline app-btn-md gap-2">
              <Activity className="w-4 h-4" /> Activity feed
            </button>
          )}
          {siteStatus === 'incident' && onOpenCoverage && (
            <button type="button" onClick={onOpenCoverage} className="app-button-outline app-btn-md gap-2 text-red-500 border-red-500/40">
              <AlertTriangle className="w-4 h-4" /> View incident
            </button>
          )}
        </div>

        {otherJobs.length > 0 && onSwitchJob && (
          <div className="border-t border-brand-border pt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
              Other active sites ({otherJobs.length})
            </p>
            {otherJobs.map((job) => (
              <button
                key={job.id}
                type="button"
                onClick={() => onSwitchJob(job.id)}
                className="w-full text-left px-3 py-2 border border-brand-border hover:bg-brand-bg-sec transition-colors"
              >
                <p className="text-sm font-semibold truncate">{job.title}</p>
                <p className="text-xs text-brand-text-muted mt-0.5">{CLIENT_SHIFT_PHASE_LABELS[inferClientShiftPhase(job)]}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
