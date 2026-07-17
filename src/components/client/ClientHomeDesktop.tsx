import React, { useMemo } from 'react';
import { Block } from 'baseui/block';
import { HeadingSmall, LabelSmall, ParagraphMedium } from 'baseui/typography';
import { SecurityGuard, SecurityRequest } from '../../types';
import {
  ClientReportCard,
  formatCoverageDateLabel,
  formatShiftTimeRange,
  getUpcomingCoverage,
} from '../../lib/clientCoverage';
import { getClientLiveJobs, inferClientShiftPhase, CLIENT_SHIFT_PHASE_LABELS } from '../../lib/clientShift';
import { canClientApproveStaffScheduleChange } from '../../lib/jobScheduleChange';
import { canClientApproveOvertime } from '../../lib/shiftBilling';
import { canClientConfirmSelfAudit, hasSelfAuditPhotosToReview, isSelfAuditClientConfirmed } from '../../lib/selfAuditPhotos';
import { buildClientCoveragePieSegments, buildJobPipelineSegments, computeWeeklyJobSeries } from '../../lib/overviewVisuals';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import {
  OverviewDonutGrid,
  OverviewLineChart,
  OverviewPieChart,
  OverviewSegmentBar,
  OverviewWeekChart,
} from '../staff/overview/OverviewCharts';
import { clampPct, DesktopStatusPanel } from '../ui/desktop/DesktopStatusPanel';
import {
  AppDashboardHero,
  AppEmptyState,
  AppItemCard,
  AppMetricCell,
  AppMetricStrip,
  AppScreen,
  AppStatusBanner,
} from '../ui/app/AppPrimitives';
import { AppButton } from '../ui/AppButton';
import { GuardrButton } from '../baseui/GuardrButton';
import { GuardrCard } from '../baseui/GuardrCard';
import { GuardrTag } from '../baseui/GuardrTag';
import { QuickActionTile } from '../baseui/dashboard';
import {
  ArrowUpRight,
  Briefcase,
  Calendar,
  Clock,
  FileText,
  Map,
  MapPin,
  Plus,
  Radio,
  Shield,
  Star,
  Users,
} from 'lucide-react';
import type { ClientHomeAction } from './ClientHomeScreen';

interface ClientHomeDesktopProps {
  companyName: string;
  coverage: import('../../lib/clientCoverage').CoverageSummary;
  requests: SecurityRequest[];
  recentReports: ClientReportCard[];
  accountPending?: boolean;
  onOpenProfile?: () => void;
  onAction: (action: ClientHomeAction) => void;
  recentGuards?: SecurityGuard[];
  onHireGuard?: (guard: SecurityGuard) => void;
  onViewGuard?: (guard: SecurityGuard) => void;
}

const REPORT_TYPE_LABEL: Record<ClientReportCard['type'], string> = {
  incident: 'Incident report',
  activity: 'Activity report',
  property: 'Property report',
};

const QUICK_ACTIONS: { id: ClientHomeAction; icon: typeof Shield; label: string; sub: string }[] = [
  { id: 'request', icon: Plus, label: 'Post job', sub: 'Open to guards' },
  { id: 'guards', icon: Users, label: 'Browse guards', sub: 'Resumes & licenses' },
  { id: 'map', icon: Map, label: 'Map', sub: 'Live operations' },
  { id: 'locations', icon: MapPin, label: 'Locations', sub: 'Saved sites' },
  { id: 'schedule', icon: Calendar, label: 'Schedule', sub: 'Plan ahead' },
  { id: 'reports', icon: FileText, label: 'Reports', sub: 'Activity & incidents' },
];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function clientActionCount(requests: SecurityRequest[]): number {
  let count = 0;
  for (const req of requests) {
    if (canClientApproveOvertime(req)) count += 1;
    if (canClientApproveStaffScheduleChange(req)) count += 1;
    if (
      hasSelfAuditPhotosToReview(req) &&
      req.checkInAudit &&
      !isSelfAuditClientConfirmed(req.checkInAudit) &&
      canClientConfirmSelfAudit(req)
    ) {
      count += 1;
    }
  }
  return count;
}

export function ClientHomeDesktop({
  companyName,
  coverage,
  requests,
  recentReports,
  accountPending = false,
  onOpenProfile,
  onAction,
  recentGuards = [],
  onHireGuard,
  onViewGuard,
}: ClientHomeDesktopProps) {
  const upcoming = getUpcomingCoverage(requests);
  const liveJobs = useMemo(() => getClientLiveJobs(requests), [requests]);
  const openCount = requests.filter(
    (r) => r.status === 'open' || r.status === 'accepted' || r.status === 'pending-review',
  ).length;
  const completedCount = requests.filter((r) => r.status === 'completed' || r.status === 'closed').length;
  const pendingActions = useMemo(() => clientActionCount(requests), [requests]);
  const jobPipelineSegments = useMemo(() => buildJobPipelineSegments(requests), [requests]);
  const weeklySeries = useMemo(() => computeWeeklyJobSeries(requests), [requests]);
  const coveragePieSegments = useMemo(
    () =>
      buildClientCoveragePieSegments(
        coverage.activeAssignments,
        coverage.guardsOnDuty,
        coverage.guardsArriving,
        openCount,
        upcoming.length,
        completedCount,
      ),
    [coverage, openCount, upcoming.length, completedCount],
  );
  const hasLiveCoverage = coverage.activeAssignments > 0;
  const livePct = coverage.activeAssignments > 0 ? Math.min(100, coverage.activeAssignments * 20) : 0;

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const run = (action: ClientHomeAction) => {
    if (accountPending && action !== 'messages') {
      onOpenProfile?.();
      return;
    }
    onAction(action);
  };

  const statusBreakdown = liveJobs.slice(0, 4).map((job) => ({
    id: job.id,
    label: job.title,
    value: CLIENT_SHIFT_PHASE_LABELS[inferClientShiftPhase(job)],
    detail: 'Live on site',
    tone: 'ok' as const,
    onClick: () => run('map'),
  }));

  const liveStatus = hasLiveCoverage ? (
    <button type="button" onClick={() => run('map')} className="app-live-pill">
      <Radio className="w-3.5 h-3.5" />
      {coverage.activeAssignments} live
    </button>
  ) : undefined;

  return (
    <AppScreen className="client-home-desktop mobility-workspace">
      <AppDashboardHero
        kicker={`${todayLabel} · ${companyName}`}
        title={greeting()}
        status={liveStatus}
      />

      <Block paddingLeft="scale800" paddingRight="scale800" paddingBottom="scale600">
        {accountPending ? (
          <AppStatusBanner
            icon={<Clock className="w-5 h-5 text-amber-400" />}
            title="Account pending approval"
            action={
              onOpenProfile ? (
                <AppButton type="button" variant="outline" size="sm" onClick={onOpenProfile}>
                  Review profile
                </AppButton>
              ) : undefined
            }
          >
            <p className="text-sm uber-text-muted leading-relaxed">
              Complete your profile before posting jobs.
            </p>
          </AppStatusBanner>
        ) : null}
      </Block>

      <Block
        paddingLeft="scale800"
        paddingRight="scale800"
        paddingBottom="scale800"
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gridGap="scale600"
        maxWidth="1600px"
        margin="0 auto"
        width="100%"
      >
        {/* Welcome card */}
        <Block gridColumn={['span 12', 'span 12', 'span 4']}>
          <GuardrCard>
            <LabelSmall color="contentSecondary" marginBottom="scale200">
              {todayLabel} · {companyName}
            </LabelSmall>
            <HeadingSmall marginTop={0} marginBottom="scale400">
              {greeting()}
            </HeadingSmall>
            <ParagraphMedium marginTop={0} marginBottom="scale600" color="contentSecondary">
              Manage coverage, review guards, and monitor live operations from your console.
            </ParagraphMedium>
            <GuardrButton kind="primary" onClick={() => run('request')}>
              Post job
              <ArrowUpRight className="w-4 h-4" />
            </GuardrButton>
          </GuardrCard>
        </Block>

        {/* Status panel */}
        <Block gridColumn={['span 12', 'span 12', 'span 8']}>
          <DesktopStatusPanel
            eyebrow="Coverage status"
            title={hasLiveCoverage ? 'Live coverage active' : 'No guards on site'}
            summary={
              hasLiveCoverage
                ? `${coverage.guardsOnDuty} guard${coverage.guardsOnDuty === 1 ? '' : 's'} on duty across ${coverage.activeAssignments} assignment${coverage.activeAssignments === 1 ? '' : 's'}.`
                : 'Post a job or open the map to track coverage when shifts go live.'
            }
            variant={hasLiveCoverage ? 'ok' : 'muted'}
            alert={
              pendingActions > 0
                ? `${pendingActions} item${pendingActions === 1 ? '' : 's'} need your approval on the map`
                : undefined
            }
            metrics={[
              { id: 'live', label: 'Live assignments', value: coverage.activeAssignments, tone: coverage.activeAssignments > 0 ? 'ok' : 'default', onClick: () => run('map') },
              { id: 'on-duty', label: 'Guards on duty', value: coverage.guardsOnDuty, tone: coverage.guardsOnDuty > 0 ? 'ok' : 'default', onClick: () => run('map') },
              { id: 'arriving', label: 'Arriving soon', value: coverage.guardsArriving, onClick: () => run('map') },
              { id: 'open', label: 'Open jobs', value: openCount, onClick: () => run('requests') },
              { id: 'scheduled', label: 'Scheduled', value: upcoming.length, onClick: () => run('requests') },
              { id: 'completed', label: 'Completed', value: completedCount, onClick: () => run('reports') },
              { id: 'reports', label: 'Recent reports', value: recentReports.length, onClick: () => run('reports') },
              { id: 'approvals', label: 'Needs approval', value: pendingActions, tone: pendingActions > 0 ? 'warn' : 'ok', onClick: () => run('map') },
            ]}
            meters={[
              {
                id: 'coverage',
                label: 'Coverage utilization',
                value: `${livePct}%`,
                pct: livePct,
                sub:
                  coverage.guardsArriving > 0 && coverage.arrivingTimeLabel
                    ? `Next arrival ${coverage.arrivingTimeLabel}`
                    : hasLiveCoverage
                      ? 'Guards actively covering your sites'
                      : 'No live shifts right now',
                tone: hasLiveCoverage ? 'success' : 'muted',
                onClick: () => run('map'),
              },
              {
                id: 'pipeline',
                label: 'Open vs scheduled',
                value: `${openCount}/${upcoming.length}`,
                pct: clampPct(openCount, Math.max(openCount + upcoming.length, 1)),
                sub: `${openCount} open · ${upcoming.length} upcoming`,
                tone: 'primary',
                onClick: () => run('requests'),
              },
            ]}
            breakdown={statusBreakdown}
            breakdownTitle="Live jobs on site"
            pipelineSegments={jobPipelineSegments}
            queuePieSegments={jobPipelineSegments}
            actions={[
              { id: 'map', label: 'Open map', onClick: () => run('map'), variant: 'sand' },
              { id: 'jobs', label: 'View jobs', onClick: () => run('requests'), variant: 'outline' },
              { id: 'post', label: 'Post job', onClick: () => run('request'), variant: 'soft' },
            ]}
          />
        </Block>

        {/* Key metrics strip */}
        <Block gridColumn="span 12">
          <AppMetricStrip>
            <AppMetricCell label="Live coverage" value={coverage.activeAssignments} sub={`${coverage.guardsOnDuty} on duty`} onClick={() => run('map')} accent={hasLiveCoverage} />
            <AppMetricCell label="Open jobs" value={openCount} sub={`${upcoming.length} scheduled`} onClick={() => run('requests')} accent={openCount > 0} />
            <AppMetricCell label="Completed" value={completedCount} sub={`${recentReports.length} reports`} onClick={() => run('reports')} />
            <AppMetricCell label="Scheduled" value={upcoming.length} sub={coverage.arrivingTimeLabel ? `Next ${coverage.arrivingTimeLabel}` : 'Upcoming shifts'} onClick={() => run('schedule')} />
          </AppMetricStrip>
        </Block>

        {/* Charts */}
        <Block gridColumn={['span 12', 'span 6', 'span 4']}>
          <GuardrCard title="Coverage pie">
            <OverviewPieChart segments={coveragePieSegments} centerLabel={String(coverage.activeAssignments)} centerSub="live" />
          </GuardrCard>
        </Block>
        <Block gridColumn={['span 12', 'span 6', 'span 4']}>
          <GuardrCard title="Job pipeline">
            <OverviewPieChart
              segments={jobPipelineSegments}
              centerLabel={String(jobPipelineSegments.reduce((sum, s) => sum + s.value, 0))}
              centerSub="jobs"
            />
          </GuardrCard>
        </Block>
        <Block gridColumn={['span 12', 'span 12', 'span 4']}>
          <GuardrCard title="Coverage gauges">
            <OverviewDonutGrid
              items={[
                { id: 'live', label: 'Live', value: String(coverage.activeAssignments), pct: livePct, tone: 'success' },
                { id: 'duty', label: 'On duty', value: String(coverage.guardsOnDuty), pct: clampPct(coverage.guardsOnDuty, Math.max(coverage.activeAssignments, 1)), tone: 'primary' },
                { id: 'open', label: 'Open jobs', value: String(openCount), pct: clampPct(openCount, Math.max(openCount + upcoming.length, 1)), tone: 'warning' },
                { id: 'scheduled', label: 'Scheduled', value: String(upcoming.length), pct: clampPct(upcoming.length, Math.max(openCount + upcoming.length, 1)), tone: 'info' },
              ]}
            />
          </GuardrCard>
        </Block>
        <Block gridColumn={['span 12', 'span 6', 'span 6']}>
          <GuardrCard title="Completed jobs trend">
            <OverviewLineChart series={weeklySeries} />
          </GuardrCard>
        </Block>
        <Block gridColumn={['span 12', 'span 6', 'span 6']}>
          <GuardrCard title="Weekly bar chart">
            <OverviewWeekChart series={weeklySeries} />
          </GuardrCard>
        </Block>
        <Block gridColumn="span 12">
          <GuardrCard title="Pipeline breakdown">
            {jobPipelineSegments.length > 0 ? (
              <OverviewSegmentBar segments={jobPipelineSegments} />
            ) : (
              <AppEmptyState title="No jobs in the pipeline yet">Post a job to get started.</AppEmptyState>
            )}
          </GuardrCard>
        </Block>

        {/* Live operations */}
        <Block gridColumn={['span 12', 'span 8', 'span 8']}>
          <GuardrCard
            title="Field status"
            action={
              <GuardrButton kind="primary" size="compact" onClick={() => run('map')}>
                Open map
              </GuardrButton>
            }
          >
            {liveJobs.length > 0 ? (
              <Block as="ul" margin={0} padding={0} $style={{ listStyle: 'none' }}>
                {liveJobs.slice(0, 5).map((job) => (
                  <Block
                    as="li"
                    key={job.id}
                    padding="scale400"
                    marginBottom="scale300"
                    onClick={() => run('map')}
                    overrides={{
                      Block: {
                        style: { cursor: 'pointer', border: '1px solid', borderColor: 'borderOpaque', borderRadius: '10px' },
                      },
                    }}
                  >
                    <Block display="flex" justifyContent="space-between" alignItems="center">
                      <ParagraphMedium margin={0} $style={{ fontWeight: 600 }}>{job.title}</ParagraphMedium>
                      <GuardrTag kind="success">Live</GuardrTag>
                    </Block>
                    <LabelSmall marginTop="scale200" marginBottom={0} color="contentSecondary">
                      {CLIENT_SHIFT_PHASE_LABELS[inferClientShiftPhase(job)]}
                    </LabelSmall>
                  </Block>
                ))}
              </Block>
            ) : (
              <AppEmptyState icon={<Map className="w-8 h-8" />} title="No guards on site right now" />
            )}
          </GuardrCard>
        </Block>

        {/* Quick actions */}
        <Block gridColumn={['span 12', 'span 4', 'span 4']}>
          <GuardrCard title="Quick actions">
            <Block display="grid" gridTemplateColumns="repeat(2, 1fr)" gridGap="scale400">
              {QUICK_ACTIONS.map((action) => (
                <QuickActionTile
                  key={action.id}
                  icon={action.icon}
                  label={action.label}
                  sub={action.sub}
                  primary={action.id === 'request'}
                  disabled={accountPending}
                  onClick={() => run(action.id)}
                />
              ))}
            </Block>
          </GuardrCard>
        </Block>

        {/* Scheduled jobs */}
        <Block gridColumn={['span 12', 'span 8', 'span 8']}>
          <GuardrCard
            title="Latest scheduled jobs"
            action={
              upcoming.length > 0 ? (
                <AppButton variant="ghost" size="inline" onClick={() => run('requests')}>
                  View all
                </AppButton>
              ) : undefined
            }
          >
            {upcoming.length > 0 ? (
              <Block display="flex" flexDirection="column" gridGap="scale300">
                {upcoming.slice(0, 5).map((req) => (
                  <AppItemCard key={req.id} onClick={() => run('requests')} className="flex-col !items-stretch gap-1">
                    <ParagraphMedium margin={0} $style={{ fontWeight: 600 }}>{req.title}</ParagraphMedium>
                    <LabelSmall margin={0} color="accent">{formatCoverageDateLabel(req.startDate)}</LabelSmall>
                    <LabelSmall margin={0} color="contentSecondary">{formatShiftTimeRange(req.startDate, req.endDate)}</LabelSmall>
                    <GuardrTag kind="neutral">Scheduled</GuardrTag>
                  </AppItemCard>
                ))}
              </Block>
            ) : (
              <AppEmptyState title="No scheduled coverage yet" />
            )}
          </GuardrCard>
        </Block>

        {/* Recent reports */}
        <Block gridColumn={['span 12', 'span 6', 'span 4']}>
          <GuardrCard
            title="Recent reports"
            action={
              recentReports.length > 0 ? (
                <AppButton variant="ghost" size="inline" onClick={() => run('reports')}>
                  View all
                </AppButton>
              ) : undefined
            }
          >
            {recentReports.length === 0 ? (
              <AppEmptyState title="No reports yet" />
            ) : (
              <Block display="flex" flexDirection="column" gridGap="scale300">
                {recentReports.slice(0, 4).map((report) => (
                  <AppItemCard key={report.id} onClick={() => run('reports')} className="flex-col !items-stretch gap-1">
                    <LabelSmall margin={0} color="accent">{REPORT_TYPE_LABEL[report.type]}</LabelSmall>
                    <ParagraphMedium margin={0} $style={{ fontWeight: 600 }}>{report.title}</ParagraphMedium>
                  </AppItemCard>
                ))}
              </Block>
            )}
          </GuardrCard>
        </Block>

        {/* Guards */}
        <Block gridColumn={['span 12', 'span 6', 'span 4']}>
          <GuardrCard
            title="Your guards"
            action={
              <AppButton variant="ghost" size="inline" onClick={() => run('guards')}>
                Browse
              </AppButton>
            }
          >
            {recentGuards.length === 0 ? (
              <AppEmptyState title="No guards yet" />
            ) : (
              <Block display="flex" flexDirection="column" gridGap="scale300">
                {recentGuards.slice(0, 4).map((guard) => (
                  <Block
                    key={guard.id}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    gridGap="scale400"
                  >
                    <button type="button" onClick={() => onViewGuard?.(guard)} className="flex items-center gap-3 min-w-0 text-left">
                      <ProfileAvatar src={guard.avatar} name={guard.name} size="sm" rounded="full" className="w-9 h-9" />
                      <Block minWidth={0}>
                        <ParagraphMedium margin={0} $style={{ fontWeight: 600 }}>{guard.name}</ParagraphMedium>
                        <LabelSmall margin={0} color="contentSecondary">
                          <Star className="w-3 h-3 inline" /> {guard.rating.toFixed(1)}
                        </LabelSmall>
                      </Block>
                    </button>
                    {onHireGuard ? (
                      <GuardrButton kind="tertiary" size="compact" onClick={() => onHireGuard(guard)}>
                        Hire
                      </GuardrButton>
                    ) : null}
                  </Block>
                ))}
              </Block>
            )}
          </GuardrCard>
        </Block>

        {/* Operations at a glance */}
        <Block gridColumn="span 12">
          <GuardrCard title="Operations at a glance">
            <Block display="grid" gridTemplateColumns="repeat(auto-fit, minmax(140px, 1fr))" gridGap="scale400">
              <Block display="flex" alignItems="center" gridGap="scale300">
                <Radio className="w-4 h-4" />
                <Block>
                  <LabelSmall margin={0} color="contentSecondary">Live assignments</LabelSmall>
                  <ParagraphMedium margin={0} $style={{ fontWeight: 700 }}>{coverage.activeAssignments}</ParagraphMedium>
                </Block>
              </Block>
              <Block display="flex" alignItems="center" gridGap="scale300">
                <Users className="w-4 h-4" />
                <Block>
                  <LabelSmall margin={0} color="contentSecondary">Guards on duty</LabelSmall>
                  <ParagraphMedium margin={0} $style={{ fontWeight: 700 }}>{coverage.guardsOnDuty}</ParagraphMedium>
                </Block>
              </Block>
              <Block display="flex" alignItems="center" gridGap="scale300">
                <Briefcase className="w-4 h-4" />
                <Block>
                  <LabelSmall margin={0} color="contentSecondary">Open jobs</LabelSmall>
                  <ParagraphMedium margin={0} $style={{ fontWeight: 700 }}>{openCount}</ParagraphMedium>
                </Block>
              </Block>
              <Block display="flex" alignItems="center" gridGap="scale300">
                <FileText className="w-4 h-4" />
                <Block>
                  <LabelSmall margin={0} color="contentSecondary">Recent reports</LabelSmall>
                  <ParagraphMedium margin={0} $style={{ fontWeight: 700 }}>{recentReports.length}</ParagraphMedium>
                </Block>
              </Block>
            </Block>
          </GuardrCard>
        </Block>
      </Block>
    </AppScreen>
  );
}
