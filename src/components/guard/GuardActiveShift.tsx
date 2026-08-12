import React, { useEffect, useState } from 'react';
import { useStyletron } from 'baseui';
import { Block } from 'baseui/block';
import { HeadingSmall, LabelSmall, LabelXSmall, ParagraphSmall, ParagraphXSmall } from 'baseui/typography';
import { GuardJobView } from '../../lib/guardJobView';
import { ShiftPhase } from '../../lib/guardJobs';
import { formatDuration } from '../../lib/dates';
import { AppButton } from '../ui/AppButton';
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
import { MapDesktopInspector, MapMobileBottomSheet } from '../map/MapDesktopInspector';

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
  'on-duty': 'On job',
  complete: 'Complete',
};

function formatJobWindowTime(d: Date): string {
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
  const displaySteps = statusSteps.filter((s) => s !== 'complete' && s !== 'upcoming');
  const currentIdx = statusSteps.indexOf(phase);
  const jobStartOpen = canGuardClockIn(job, now);
  const jobCompleteOpen = canGuardClockOut(job, now);
  const jobStartMsg = guardClockInBlockedMessage(job, now);
  const jobCompleteMsg = guardClockOutBlockedMessage(job, now);
  const jobStartOpensLabel = formatJobWindowTime(shiftClockInOpensAt(job.startDate));
  const jobCompleteOpensLabel = formatJobWindowTime(shiftClockOutOpensAt(job.endDate));
  const onBreak = !!activeShiftBreak(job);
  const breakRemaining = breakMinutesRemaining(job);
  const breakAllowed = (job.breakMinutes ?? 0) > 0;
  const breakBlocked = guardBreakBlockedMessage(job);
  const jobHasCoords = typeof job.latitude === 'number' && typeof job.longitude === 'number';
  const gpsRequired = jobHasCoords;
  const notOnSiteBlocked = gpsRequired && !onSite;
  const [, theme] = useStyletron();
  const tripMode = phase === 'en-route' || phase === 'arrived' || phase === 'on-duty' || phase === 'complete';

  const panelBody = (
      <Block className="guard-scroll-panel" paddingLeft="scale600" paddingRight="scale600" paddingBottom="scale900" display="flex" flexDirection="column" gridGap="scale600">
        <Block display="flex" alignItems="flex-start" justifyContent="space-between" gridGap="scale400">
          <Block minWidth={0}>
            <LabelSmall color="accent" marginBottom="scale100" margin={0} $style={{ fontWeight: 600 }}>
              Active job
            </LabelSmall>
            <HeadingSmall margin={0} $style={{ fontWeight: 700, lineHeight: 1.2 }}>
              {job.title}
            </HeadingSmall>
            <ParagraphSmall color="contentSecondary" marginTop="scale100" margin={0} $style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {job.clientName}
            </ParagraphSmall>
          </Block>
          <Block $style={{ flexShrink: 0, textAlign: 'right' }}>
            <LabelXSmall color="contentSecondary" display="flex" alignItems="center" justifyContent="flex-end" gridGap="scale100">
              <DollarSign size={14} />
              Your pay
            </LabelXSmall>
            <Block color="accent" marginTop="scale100" $style={{ fontSize: '14px', fontWeight: 700 }}>
              <JobBillingSummaryFromGuardJob job={job} />
            </Block>
          </Block>
        </Block>

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
            const glowArrived =
              step === 'arrived' &&
              (phase === 'arrived' || ((phase === 'upcoming' || phase === 'en-route') && onSite));
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
          <Block
            paddingTop="scale600"
            paddingBottom="scale600"
            backgroundColor="accent50"
            $style={{
              textAlign: 'center',
              borderTop: `1px solid ${theme.colors.borderOpaque}`,
              borderBottom: `1px solid ${theme.colors.borderOpaque}`,
            }}
          >
            <LabelXSmall color="contentSecondary" marginBottom="scale100">Time on job</LabelXSmall>
            <Block $style={{ fontSize: '30px', fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
              {formatTimer(dutySeconds)}
            </Block>
            <ParagraphSmall color="contentSecondary" marginTop="scale300" margin={0}>
              {formatDuration(job.durationHours)} scheduled
            </ParagraphSmall>
          </Block>
        )}

        <Block
          display="flex"
          flexDirection="column"
          gridGap="scale500"
          paddingTop="scale300"
          paddingBottom="scale300"
          $style={{ borderBottom: `1px solid ${theme.colors.borderOpaque}` }}
        >
          <Block display="flex" alignItems="flex-start" gridGap="scale400" width="100%">
            <MapPin size={20} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: '2px', color: theme.colors.accent }} />
            <Block>
              <LabelSmall color="contentSecondary" margin={0}>Site location</LabelSmall>
              <ParagraphSmall marginTop="scale100" margin={0} $style={{ fontWeight: 500 }}>{address}</ParagraphSmall>
            </Block>
          </Block>
          <Block display="flex" alignItems="flex-start" gridGap="scale400" width="100%">
            <Navigation size={20} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: '2px', color: theme.colors.accent }} />
            <Block>
              <LabelSmall color="contentSecondary" margin={0}>Client contact</LabelSmall>
              <ParagraphSmall marginTop="scale100" margin={0} $style={{ fontWeight: 500 }}>{job.clientName}</ParagraphSmall>
            </Block>
          </Block>
        </Block>

        {job.siteInstructions && (
          <Block paddingTop="scale300" paddingBottom="scale300" $style={{ borderBottom: `1px solid ${theme.colors.borderOpaque}` }}>
            <LabelSmall color="contentSecondary" display="flex" alignItems="center" gridGap="scale200" marginBottom="scale300">
              <FileText size={16} strokeWidth={1.5} /> Site instructions
            </LabelSmall>
            <ParagraphSmall margin={0} $style={{ lineHeight: 1.55 }}>{job.siteInstructions}</ParagraphSmall>
          </Block>
        )}

        {(phase === 'on-duty' || phase === 'complete') && (
          <JobSelfAuditPhotosSection request={job} />
        )}

        {phase === 'en-route' && (
          <Block display="flex" flexDirection="column" gridGap="scale400">
            <ParagraphXSmall color="contentSecondary" margin={0} $style={{ textAlign: 'center' }}>
              Your location is shared with the client while you head to the site.
            </ParagraphXSmall>
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
          </Block>
        )}

        {phase === 'upcoming' && (
          <Block display="flex" flexDirection="column" gridGap="scale400">
            {onSite ? (
              <>
                <SlideToConfirm
                  label="Slide to start job"
                  confirmedLabel="Starting…"
                  onConfirm={onBeginAudit}
                  disabled={!jobStartOpen}
                  disabledHint={jobStartMsg ?? `Job start opens at ${jobStartOpensLabel} (15 min before start).`}
                />
                <AppButton
                  variant="outline"
                  onClick={onSkipAudit}
                  disabled={!jobStartOpen}
                  fullWidth
                >
                  Skip self audit · start job
                </AppButton>
                <ParagraphXSmall color="contentSecondary" margin={0} $style={{ textAlign: 'center' }}>
                  Skipping flags missing start items automatically for client review.
                </ParagraphXSmall>
              </>
            ) : (
              <SlideToConfirm
                label={gpsRequired ? 'Must be on site to arrive' : 'Slide to arrive on site'}
                confirmedLabel="Arrived"
                onConfirm={onArrived}
                disabled={notOnSiteBlocked}
                disabledHint={
                  notOnSiteBlocked
                    ? 'GPS requires you to be within 150m of the site pin.'
                    : 'Move within range of the site pin.'
                }
              />
            )}
            {!onSite && (
              <ParagraphXSmall
                margin={0}
                color={notOnSiteBlocked ? undefined : 'contentSecondary'}
                $style={{ textAlign: 'center', color: notOnSiteBlocked ? theme.colors.warning : undefined }}
              >
                {notOnSiteBlocked
                  ? 'GPS location required — move to the job site to enable arrival.'
                  : jobStartOpen
                    ? 'The Arrived step glows when you are within range of the site.'
                    : `Arrive on site when ready. Job start opens at ${jobStartOpensLabel}.`}
              </ParagraphXSmall>
            )}
          </Block>
        )}

        {phase === 'arrived' && (
          <Block display="flex" flexDirection="column" gridGap="scale400" className="app-button-stack">
            <SlideToConfirm
              label="Slide to start job"
              confirmedLabel="Starting…"
              onConfirm={onBeginAudit}
              disabled={!jobStartOpen || !onSite}
              disabledHint={
                !onSite
                  ? 'Move within range of the site pin to start the job.'
                  : jobStartMsg ?? `Job start opens at ${jobStartOpensLabel} (15 min before start).`
              }
            />
            <AppButton
              variant="outline"
              onClick={onSkipAudit}
              disabled={!jobStartOpen || !onSite}
              fullWidth
            >
              Skip self audit · start job
            </AppButton>
            <ParagraphXSmall color="contentSecondary" margin={0} $style={{ textAlign: 'center' }}>
              Skipping flags missing start items automatically for client review.
            </ParagraphXSmall>
          </Block>
        )}

        {phase === 'upcoming' && jobStartOpen && (
          <ParagraphXSmall color="contentSecondary" margin={0} display="flex" alignItems="center" justifyContent="center" gridGap="scale200">
            <Clock size={14} />
            Job start open from {jobStartOpensLabel} until the job ends
          </ParagraphXSmall>
        )}

        {phase === 'on-duty' && midShiftCheckInDue && onMidShiftCheckIn && captureSelfie && (
          <MidShiftCheckInPanel
            lastCheckInAt={job.midShiftAudits?.[job.midShiftAudits.length - 1]?.checkedAt}
            onSubmit={onMidShiftCheckIn}
            captureSelfie={captureSelfie}
          />
        )}

        {phase === 'on-duty' && (
          <Block display="flex" flexDirection="column" gridGap="scale400">
            {breakAllowed && (
              <Block
                padding="scale600"
                display="flex"
                flexDirection="column"
                gridGap="scale400"
                backgroundColor="backgroundSecondary"
                $style={{ borderRadius: '12px', border: `1px solid ${theme.colors.borderOpaque}` }}
              >
                <Block display="flex" alignItems="center" justifyContent="space-between" gridGap="scale400">
                  <Block>
                    <LabelSmall margin={0} display="flex" alignItems="center" gridGap="scale300" $style={{ fontWeight: 600 }}>
                      <Coffee size={16} style={{ color: theme.colors.accent }} />
                      {onBreak ? 'On break' : 'Scheduled breaks'}
                    </LabelSmall>
                    <LabelXSmall color="contentSecondary" marginTop="scale100">
                      {onBreak
                        ? `${Math.ceil(totalBreakMinutesUsed(job) / 1)}m used · ${breakRemaining}m remaining`
                        : `${breakRemaining} of ${job.breakMinutes} minutes available`}
                    </LabelXSmall>
                  </Block>
                </Block>
                {onBreak ? (
                  <AppButton
                    variant="primary"
                    fullWidth
                    onClick={onEndBreak}
                    disabled={!canGuardEndBreak(job) || !onEndBreak}
                  >
                    End break · resume job
                  </AppButton>
                ) : (
                  <AppButton
                    variant="outline"
                    fullWidth
                    onClick={onStartBreak}
                    disabled={!canGuardStartBreak(job) || !onStartBreak}
                  >
                    Start break
                  </AppButton>
                )}
                {breakBlocked && !onBreak && (
                  <LabelXSmall color="contentSecondary" $style={{ textAlign: 'center' }}>{breakBlocked}</LabelXSmall>
                )}
              </Block>
            )}
            <Block display="grid" gridGap="scale300" $style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <AppButton variant="outline" onClick={onIncidentReport} startEnhancer={<AlertTriangle size={16} />}>
                Report incident
              </AppButton>
              <AppButton variant="outline" onClick={onActivityReport} startEnhancer={<Activity size={16} />}>
                Activity report
              </AppButton>
              <Block $style={{ gridColumn: '1 / -1' }}>
                <AppButton
                  variant="primary"
                  fullWidth
                  onClick={onOpenJobChat}
                  disabled={!onOpenJobChat}
                  startEnhancer={<MessageCircle size={16} />}
                >
                  Message client
                </AppButton>
              </Block>
            </Block>
            <SlideToConfirm
              label="Slide to complete job"
              confirmedLabel="Completing…"
              tone="success"
              onConfirm={onEndShift}
              disabled={!jobCompleteOpen}
              disabledHint={
                jobCompleteMsg ?? `Complete job opens at ${jobCompleteOpensLabel} (scheduled end).`
              }
            />
            {jobCompleteOpen && (
              <ParagraphXSmall color="contentSecondary" margin={0} display="flex" alignItems="center" justifyContent="center" gridGap="scale200">
                <Clock size={14} />
                Complete job open from {jobCompleteOpensLabel}
              </ParagraphXSmall>
            )}
          </Block>
        )}
      </Block>
  );

  return (
    <MapDesktopInspector label="Active job" className={tripMode ? 'dsk-map-inspector--trip' : undefined}>
      <MapMobileBottomSheet mode={tripMode ? 'trip' : 'sheet'} className="guardr-active-shift">
        {panelBody}
      </MapMobileBottomSheet>
    </MapDesktopInspector>
  );
}
