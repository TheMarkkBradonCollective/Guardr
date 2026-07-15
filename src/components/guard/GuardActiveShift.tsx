import React, { useEffect, useState } from 'react';
import { GuardJobView } from '../../lib/guardJobView';
import { ShiftPhase } from '../../lib/guardJobs';
import { formatDuration } from '../../lib/dates';
import {
  activeShiftBreak,
  breakMinutesRemaining,
  canGuardEndBreak,
  canGuardStartBreak,
  guardBreakBlockedMessage,
  totalBreakMinutesUsed,
} from '../../lib/shiftBreaks';
import {
  canGuardClockIn,
  canGuardClockOut,
  computeShiftDutySeconds,
  guardClockInBlockedMessage,
  guardClockOutBlockedMessage,
  shiftClockInOpensAt,
  shiftClockOutOpensAt,
  shiftDutyStartedAt,
} from '../../lib/shiftWindow';
import { JobSelfAuditPhotosSection } from '../jobs/JobSelfAuditPhotosSection';
import { JobBillingSummaryFromGuardJob } from '../jobs/JobBillingSummary';
import { SlideToConfirm } from '../ui/SlideToConfirm';
import { MidShiftCheckInPanel } from './MidShiftCheckInPanel';
import { ShiftPeriodStatusBar } from '../shift/ShiftPeriodStatusBar';
import {
  Coffee,
  Activity,
  AlertTriangle,
  Clock,
  DollarSign,
  FileText,
  MapPin,
  MessageCircle,
  Navigation,
} from 'lucide-react';

interface GuardActiveShiftProps {
  job: GuardJobView;
  phase: ShiftPhase;
  onSite?: boolean;
  onArrived: () => void;
  onBeginAudit: () => void;
  onSkipAudit: () => void;
  onIncidentReport: () => void;
  onActivityReport: () => void;
  onEndShift: () => void;
  onStartBreak?: () => void;
  onEndBreak?: () => void;
  onOpenJobChat?: () => void;
  onStartEnRoute?: () => void;
  onMidShiftCheckIn?: (payload: {
    selfie: string;
    uniformVerified: boolean;
    equipmentVerified: boolean;
  }) => void | Promise<void>;
  captureSelfie?: () => Promise<string | null>;
  midShiftCheckInDue?: boolean;
}

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const PHASE_LABELS: Record<ShiftPhase, string> = {
  upcoming: 'Upcoming',
  'en-route': 'En route',
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
  onSite = false,
  onArrived,
  onBeginAudit,
  onSkipAudit,
  onIncidentReport,
  onActivityReport,
  onEndShift,
  onStartBreak,
  onEndBreak,
  onOpenJobChat,
  onStartEnRoute,
  onMidShiftCheckIn,
  captureSelfie,
  midShiftCheckInDue = false,
}: GuardActiveShiftProps) {
  const [now, setNow] = useState(() => new Date());
  const [dutySeconds, setDutySeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (phase !== 'on-duty') {
      setDutySeconds(0);
      return;
    }
    const startedAt = shiftDutyStartedAt(job);
    if (!startedAt) {
      setDutySeconds(0);
      return;
    }
    const tick = () => setDutySeconds(computeShiftDutySeconds(startedAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, job.id, job.checkInAudit?.checkedAt]);

  const address = job.address || job.location;
  const statusSteps: ShiftPhase[] = ['upcoming', 'en-route', 'arrived', 'on-duty', 'complete'];
  const displaySteps = statusSteps.filter((s) => s !== 'complete');
  const currentIdx = statusSteps.indexOf(phase);
  const clockInOpen = canGuardClockIn(job, now);
  const clockOutOpen = canGuardClockOut(job, now);
  const clockInMsg = guardClockInBlockedMessage(job, now);
  const clockOutMsg = guardClockOutBlockedMessage(job, now);
  const clockInOpensLabel = formatClockWindowTime(shiftClockInOpensAt(job.startDate));
  const clockOutOpensLabel = formatClockWindowTime(shiftClockOutOpensAt(job.endDate));
  const onBreak = !!activeShiftBreak(job);
  const breakRemaining = breakMinutesRemaining(job);
  const breakAllowed = (job.breakMinutes ?? 0) > 0;
  const breakBlocked = guardBreakBlockedMessage(job);
  const jobHasCoords = typeof job.latitude === 'number' && typeof job.longitude === 'number';
  const gpsRequired = jobHasCoords;
  const notOnSiteBlocked = gpsRequired && !onSite;

  return (
    <div className="absolute inset-x-0 bottom-0 z-[1001] guardr-bottom-sheet guardr-active-shift rounded-t-2xl flex flex-col overflow-hidden">
      <div className="w-10 h-1 rounded-full sheet-handle mx-auto mt-3 mb-3" />

      <div className="guard-scroll-panel px-5 pb-8 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-brand-primary mb-1">Active shift</p>
            <h2 className="text-xl font-bold leading-tight">{job.title}</h2>
            <p className="text-sm text-brand-text-muted mt-1 truncate">{job.clientName}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs text-brand-text-muted flex items-center justify-end gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              Your pay
            </p>
            <div className="text-sm font-bold text-brand-primary mt-0.5">
              <JobBillingSummaryFromGuardJob job={job} />
            </div>
          </div>
        </div>

        <ShiftPeriodStatusBar
          startDate={job.startDate}
          endDate={job.endDate}
          live={phase === 'on-duty'}
        />

        <div className="segmented-control segmented-control-full">
          {displaySteps.map((step) => {
            const stepIdx = statusSteps.indexOf(step);
            const isReached = stepIdx <= currentIdx;
            const isCurrent = step === phase;
            const glowArrived = step === 'arrived' && (phase === 'arrived' || (phase === 'upcoming' && onSite) || phase === 'en-route' && onSite);
            return (
              <span
                key={step}
                className={[
                  'segmented-control-btn flex-1 text-center py-2 text-[11px] sm:text-xs',
                  isReached && 'segmented-control-btn-active',
                  isCurrent && 'segmented-control-btn-current',
                  glowArrived && 'guard-arrived-on-site-glow',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {PHASE_LABELS[step]}
              </span>
            );
          })}
        </div>

        {phase === 'on-duty' && (
          <div className="text-center py-4 border-y border-brand-border bg-brand-primary/5">
            <p className="text-xs text-brand-text-muted mb-1">Time on site</p>
            <p className="text-3xl font-bold tracking-tight tabular-nums">{formatTimer(dutySeconds)}</p>
            <p className="text-sm text-brand-text-muted mt-2">{formatDuration(job.durationHours)} scheduled</p>
          </div>
        )}

        <div className="space-y-4 py-2 border-b border-brand-border">
          <div className="flex items-start gap-3 w-full">
            <MapPin className="w-5 h-5 shrink-0 mt-0.5 text-brand-primary" strokeWidth={1.5} />
            <div>
              <p className="text-sm text-brand-text-muted">Site location</p>
              <p className="font-medium mt-0.5">{address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 w-full">
            <Navigation className="w-5 h-5 shrink-0 mt-0.5 text-brand-primary" strokeWidth={1.5} />
            <div>
              <p className="text-sm text-brand-text-muted">Client contact</p>
              <p className="font-medium mt-0.5">{job.clientName}</p>
            </div>
          </div>
        </div>

        {job.siteInstructions && (
          <div className="py-2 border-b border-brand-border">
            <p className="text-sm text-brand-text-muted flex items-center gap-1.5 mb-2">
              <FileText className="w-4 h-4" strokeWidth={1.5} /> Site instructions
            </p>
            <p className="text-sm leading-relaxed">{job.siteInstructions}</p>
          </div>
        )}

        {(phase === 'on-duty' || phase === 'complete') && (
          <JobSelfAuditPhotosSection request={job} />
        )}

        {phase === 'upcoming' && onStartEnRoute && (
          <button
            type="button"
            onClick={onStartEnRoute}
            className="app-button-outline app-btn-md w-full gap-2"
          >
            <Navigation className="w-4 h-4" />
            Start heading to site
          </button>
        )}

        {phase === 'en-route' && (
          <div className="space-y-3">
            <p className="text-xs text-center text-brand-text-muted">
              Share your location with the client while en route.
            </p>
            <SlideToConfirm
              label={gpsRequired && !onSite ? 'Must be on site to arrive' : 'Slide to arrive on site'}
              confirmedLabel="Arrived"
              onConfirm={onArrived}
              disabled={notOnSiteBlocked}
              disabledHint={
                notOnSiteBlocked
                  ? 'GPS requires you to be within 150m of the site pin.'
                  : 'Move within range of the site pin.'
              }
            />
          </div>
        )}

        {phase === 'upcoming' && (
          <div className="space-y-3">
            {onSite ? (
              <SlideToConfirm
                label="Slide to clock in"
                confirmedLabel="Clocking in…"
                onConfirm={onBeginAudit}
                disabled={!clockInOpen}
                disabledHint={clockInMsg ?? `Clock-in opens at ${clockInOpensLabel} (15 min before start).`}
              />
            ) : (
              <SlideToConfirm
                label={gpsRequired ? 'Must be on site to clock in' : 'Slide to arrive on site'}
                confirmedLabel="Arrived"
                onConfirm={onArrived}
                disabled={!clockInOpen || notOnSiteBlocked}
                disabledHint={
                  notOnSiteBlocked
                    ? 'GPS requires you to be within 150m of the site pin to clock in.'
                    : clockInMsg ??
                      `Move within range of the site pin. Clock-in opens at ${clockInOpensLabel}.`
                }
              />
            )}
            {!onSite && (
              <p className={`text-xs text-center ${notOnSiteBlocked ? 'text-amber-700 dark:text-amber-300' : 'text-brand-text-muted'}`}>
                {notOnSiteBlocked
                  ? 'GPS location required — move to the job site to enable clock-in.'
                  : 'The Arrived step glows when you are within range of the site.'}
              </p>
            )}
          </div>
        )}

        {phase === 'arrived' && (
          <div className="app-button-stack">
            <SlideToConfirm
              label="Slide to start shift"
              confirmedLabel="Starting…"
              onConfirm={onBeginAudit}
              disabled={!clockInOpen || !onSite}
              disabledHint={
                !onSite
                  ? 'Move within range of the site pin to clock in.'
                  : clockInMsg ?? `Clock-in opens at ${clockInOpensLabel} (15 min before start).`
              }
            />
            <button
              type="button"
              onClick={onSkipAudit}
              disabled={!clockInOpen}
              className="app-button-outline app-btn-md disabled:opacity-40 text-amber-700 dark:text-amber-400 border-amber-500/40"
            >
              Skip self audit · clock in
            </button>
            <p className="text-xs text-brand-text-muted text-center">
              Skipping flags this job until you complete your self-audit photos.
            </p>
          </div>
        )}

        {phase === 'upcoming' && clockInOpen && (
          <p className="text-xs text-brand-text-muted text-center flex items-center justify-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Clock-in open from {clockInOpensLabel} until job ends
          </p>
        )}

        {phase === 'on-duty' && midShiftCheckInDue && onMidShiftCheckIn && captureSelfie && (
          <MidShiftCheckInPanel
            lastCheckInAt={job.midShiftAudits?.[job.midShiftAudits.length - 1]?.checkedAt}
            onSubmit={onMidShiftCheckIn}
            captureSelfie={captureSelfie}
          />
        )}

        {phase === 'on-duty' && (
          <div className="space-y-3">
            {breakAllowed && (
              <div className="rounded-xl border border-brand-border bg-brand-bg-sec/60 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-brand-primary" />
                      {onBreak ? 'On break' : 'Scheduled breaks'}
                    </p>
                    <p className="text-xs text-brand-text-muted mt-1">
                      {onBreak
                        ? `${Math.ceil(totalBreakMinutesUsed(job) / 1)}m used · ${breakRemaining}m remaining`
                        : `${breakRemaining} of ${job.breakMinutes} minutes available`}
                    </p>
                  </div>
                </div>
                {onBreak ? (
                  <button
                    type="button"
                    onClick={onEndBreak}
                    disabled={!canGuardEndBreak(job) || !onEndBreak}
                    className="w-full app-button-primary app-btn-md disabled:opacity-40"
                  >
                    End break · back on duty
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onStartBreak}
                    disabled={!canGuardStartBreak(job) || !onStartBreak}
                    className="w-full app-button-outline app-btn-md disabled:opacity-40"
                  >
                    Start break
                  </button>
                )}
                {breakBlocked && !onBreak && (
                  <p className="text-xs text-brand-text-muted text-center">{breakBlocked}</p>
                )}
              </div>
            )}
            <div className="app-action-row--2">
              <button type="button" onClick={onIncidentReport} className="app-button-outline app-btn-md gap-2">
                <AlertTriangle className="w-4 h-4" /> Report incident
              </button>
              <button type="button" onClick={onActivityReport} className="app-button-outline app-btn-md gap-2">
                <Activity className="w-4 h-4" /> Activity report
              </button>
              <button
                type="button"
                onClick={onOpenJobChat}
                disabled={!onOpenJobChat}
                className="app-button-primary app-btn-md gap-2 col-span-2 disabled:opacity-40"
                style={{ gridColumn: '1 / -1' }}
              >
                <MessageCircle className="w-4 h-4" /> Message client
              </button>
            </div>
            <SlideToConfirm
              label="Slide to end shift"
              confirmedLabel="Ending…"
              tone="success"
              onConfirm={onEndShift}
              disabled={!clockOutOpen}
              disabledHint={
                clockOutMsg ?? `Clock-out opens at ${clockOutOpensLabel} (scheduled end).`
              }
            />
            {clockOutOpen && (
              <p className="text-xs text-brand-text-muted text-center flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Clock-out open from {clockOutOpensLabel}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
