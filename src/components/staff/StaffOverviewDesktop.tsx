import React, { useMemo } from 'react';
import { Block } from 'baseui/block';
import { HeadingSmall, LabelSmall, ParagraphMedium } from 'baseui/typography';
import {
  buildOverviewMetricCells,
  LIVE_JOB_STATUS_LABEL,
  OpsActivityItem,
  OverviewActionItem,
  OverviewLiveJob,
  OverviewNavigationSelection,
  PlatformStats,
  resolveOverviewActionSelection,
  StaffSection,
} from '../../lib/staffOps';
import {
  buildDirectorFinancialCells,
  computeOperationalFinancials,
} from '../../lib/operationalFinancials';
import {
  buildJobPipelineSegments,
  buildOperationsSnapshotCards,
  buildPlatformHealthPieSegments,
  buildPlatformPulseCards,
  buildPeopleSegments,
  buildQueuePieSegments,
  computeWeeklyJobSeries,
} from '../../lib/overviewVisuals';
import {
  filterOverviewActionItems,
  filterOverviewMetrics,
  getStaffOverviewConfig,
} from '../../lib/staffOverviewConfig';
import { buildPerformanceTierPercentBars, buildStaffGuardStatRows } from '../../lib/staffStats';
import { PlatformRole, Client, SecurityGuard, SecurityRequest } from '../../types';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Crown,
  DollarSign,
  FileText,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  MapPin,
  MessagesSquare,
  Settings,
  Shield,
  UserCheck,
  Users,
} from 'lucide-react';
import { StaffSummaryCell } from './StaffSummaryCell';
import {
  OverviewDonutGrid,
  OverviewLineChart,
  OverviewPieChart,
  OverviewSegmentBar,
  OverviewVisualGrid,
  OverviewWeekChart,
} from './overview/OverviewCharts';
import { PerformanceTierProgressBars } from './overview/PerformanceTierProgressBars';
import { clampPct, DesktopStatusPanel } from '../ui/desktop/DesktopStatusPanel';
import {
  AppDashboardHero,
  AppDashboardZone,
  AppItemCard,
  AppItemCardStack,
  AppMetricCell,
  AppMetricStrip,
  AppScreen,
} from '../ui/app/AppPrimitives';
import { AppButton } from '../ui/AppButton';
import { GuardrCard } from '../baseui/GuardrCard';
import { AccentIcon } from '../baseui/dashboard';
import {
  WorkbenchCardTitle,
  WorkbenchGrid,
  WorkbenchGridCell,
  WorkbenchQuickLinks,
  WorkbenchSectionLabel,
} from '../baseui/layout/WorkbenchLayout';
import { WfBadge } from '../ui/wireframe';

interface StaffOverviewDesktopProps {
  stats: PlatformStats;
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  clients: Client[];
  activityFeed: OpsActivityItem[];
  actionItems: OverviewActionItem[];
  liveJobs: OverviewLiveJob[];
  onNavigate: (section: StaffSection, selection?: OverviewNavigationSelection) => void;
  onOpenJob?: (jobId: string) => void;
  canUpdateJobs?: boolean;
  staffName: string;
  staffRole: PlatformRole;
}

const ACTION_ICONS: Partial<Record<OverviewActionItem['id'], React.ReactNode>> = {
  'pending-jobs': <Briefcase className="w-4 h-4" />,
  'pending-schedule-changes': <Briefcase className="w-4 h-4" />,
  'pending-certs': <ClipboardCheck className="w-4 h-4" />,
  'account-applications': <UserCheck className="w-4 h-4" />,
  'open-marketplace': <Briefcase className="w-4 h-4" />,
  'active-guard-jobs': <Briefcase className="w-4 h-4" />,
  incidents: <AlertTriangle className="w-4 h-4" />,
  payments: <Shield className="w-4 h-4" />,
  support: <LifeBuoy className="w-4 h-4" />,
  'live-jobs': <MapPin className="w-4 h-4" />,
  'pending-staff-accounts': <Shield className="w-4 h-4" />,
  'jobs-missing-coords': <MapPin className="w-4 h-4" />,
};

const QUICK_LINK_META: Record<
  StaffSection,
  { label: string; icon: import('lucide-react').LucideIcon }
> = {
  overview: { label: 'Overview', icon: LayoutDashboard },
  map: { label: 'Map', icon: MapPin },
  applications: { label: 'Applications', icon: UserCheck },
  credentials: { label: 'Credentials', icon: ClipboardCheck },
  jobs: { label: 'Jobs', icon: Briefcase },
  guards: { label: 'Guards', icon: Shield },
  team: { label: 'Staff', icon: Users },
  clients: { label: 'Clients', icon: Building2 },
  crews: { label: 'Crews', icon: Users },
  incidents: { label: 'Incidents', icon: AlertTriangle },
  violations: { label: 'Violations', icon: AlertTriangle },
  stats: { label: 'Stats', icon: BarChart3 },
  messages: { label: 'Messages', icon: MessagesSquare },
  support: { label: 'Messages', icon: MessagesSquare },
  'team-chat': { label: 'Messages', icon: MessagesSquare },
  'job-chats': { label: 'Messages', icon: MessagesSquare },
  payments: { label: 'Payments', icon: DollarSign },
  'payment-settings': { label: 'Payment settings', icon: DollarSign },
  agreements: { label: 'Agreements', icon: FileText },
  'audit-log': { label: 'Audit log', icon: FileText },
  disputes: { label: 'Disputes', icon: AlertTriangle },
  analytics: { label: 'Analytics', icon: BarChart3 },
  settings: { label: 'Public Information', icon: Settings },
  permissions: { label: 'Permissions', icon: KeyRound },
  integrations: { label: 'Integrations', icon: Settings },
  cities: { label: 'Operations', icon: MapPin },
  guide: { label: 'Guide', icon: LayoutDashboard },
  'dev-updates': { label: 'Dev notes', icon: LayoutDashboard },
  profile: { label: 'Profile', icon: UserCheck },
  preferences: { label: 'Preferences', icon: Settings },
};

function formatOverviewDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatActivityTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function RoleBadge({ role }: { role: PlatformRole }) {
  const config = getStaffOverviewConfig(role);
  const Icon =
    role === 'owner' ? Crown : role === 'director' ? Shield : role === 'administrator' ? Briefcase : UserCheck;

  return (
    <span className={`staff-overview-role-badge staff-overview-role-badge--${role}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
      {config.roleLabel}
    </span>
  );
}

export function StaffOverviewDesktop({
  stats,
  requests,
  guards,
  clients,
  activityFeed,
  actionItems,
  liveJobs,
  onNavigate,
  onOpenJob,
  canUpdateJobs = false,
  staffName,
  staffRole,
}: StaffOverviewDesktopProps) {
  const config = getStaffOverviewConfig(staffRole);

  const metrics = useMemo(
    () => filterOverviewMetrics(buildOverviewMetricCells(stats, requests), staffRole),
    [stats, requests, staffRole],
  );

  const filteredActions = useMemo(
    () => filterOverviewActionItems(actionItems, staffRole),
    [actionItems, staffRole],
  );

  const financials = useMemo(() => computeOperationalFinancials(requests), [requests]);
  const directorFinancialCells = useMemo(
    () => buildDirectorFinancialCells(financials),
    [financials],
  );
  const operationsSnapshotCards = useMemo(
    () => buildOperationsSnapshotCards(stats, financials, guards, clients, requests),
    [stats, financials, guards, clients, requests],
  );
  const platformPulseCards = useMemo(
    () => buildPlatformPulseCards(stats, requests, guards, clients, config.pulseFullDetail),
    [stats, requests, guards, clients, config.pulseFullDetail],
  );
  const weeklySeries = useMemo(() => computeWeeklyJobSeries(requests), [requests]);
  const jobPipelineSegments = useMemo(() => buildJobPipelineSegments(requests), [requests]);
  const queuePieSegments = useMemo(() => buildQueuePieSegments(stats), [stats]);
  const healthPieSegments = useMemo(() => buildPlatformHealthPieSegments(stats), [stats]);
  const peopleSegments = useMemo(() => buildPeopleSegments(guards, clients), [guards, clients]);
  const guardStatRows = useMemo(() => buildStaffGuardStatRows(guards, requests), [guards, requests]);
  const tierPercentBars = useMemo(() => buildPerformanceTierPercentBars(guardStatRows), [guardStatRows]);

  const queueBreakdown = [
    {
      id: 'jobs',
      label: 'Job offers',
      value: stats.pendingJobApprovals,
      detail: 'Awaiting approval',
      tone: stats.pendingJobApprovals > 0 ? ('warn' as const) : ('ok' as const),
      onClick: () => onNavigate('applications'),
    },
    {
      id: 'schedule',
      label: 'Schedule changes',
      value: stats.pendingScheduleChanges,
      detail: 'Client or staff edits',
      tone: stats.pendingScheduleChanges > 0 ? ('warn' as const) : ('ok' as const),
      onClick: () => onNavigate('applications'),
    },
    {
      id: 'certs',
      label: 'Credentials',
      value: stats.pendingCertApprovals,
      detail: 'Guard uploads',
      tone: stats.pendingCertApprovals > 0 ? ('warn' as const) : ('ok' as const),
      onClick: () => onNavigate('credentials'),
    },
    {
      id: 'accounts',
      label: 'Account applications',
      value: stats.pendingAccountApplications,
      detail: `${stats.pendingClientAccounts} client · guard signups`,
      tone: stats.pendingAccountApplications > 0 ? ('warn' as const) : ('ok' as const),
      onClick: () => onNavigate('applications'),
    },
    {
      id: 'payments',
      label: 'Payments',
      value: stats.paymentsNeedingAction,
      detail: 'Deposits or payouts',
      tone: stats.paymentsNeedingAction > 0 ? ('warn' as const) : ('ok' as const),
      onClick: () => onNavigate('payments'),
    },
  ];

  const healthStatus = (
    <div
      className={`staff-overview-health shrink-0 ${
        stats.platformHealthy ? 'staff-overview-health-ok' : 'staff-overview-health-warn'
      }`}
    >
      <span className="staff-overview-health-dot" aria-hidden />
      <div>
        <p className="text-sm font-semibold leading-tight">
          {stats.platformHealthy ? 'All clear' : 'Needs review'}
        </p>
        <p className="text-xs uber-text-muted mt-0.5">{stats.pendingReviews} in queue</p>
      </div>
    </div>
  );

  const quickLinks = config.quickLinkSections.map((section) => {
    const meta = QUICK_LINK_META[section];
    return {
      id: section,
      label: meta.label,
      icon: meta.icon,
      onClick: () => onNavigate(section),
    };
  });

  return (
    <AppScreen className="staff-overview-desktop mobility-workspace" data-tour="staff-overview">
      <AppDashboardHero
        kicker={`${config.workspaceKicker} · ${formatOverviewDate()}`}
        title={`Hello, ${staffName.split(' ')[0]}`}
        status={healthStatus}
      />

      <Block paddingLeft="scale800" paddingRight="scale800" paddingBottom="scale500">
        <RoleBadge role={staffRole} />
        <ParagraphMedium marginTop="scale300" marginBottom={0} color="contentSecondary">
          {config.focusLine}
        </ParagraphMedium>
      </Block>

      <WorkbenchGrid>
        <WorkbenchGridCell span={4}>
          <GuardrCard>
            <LabelSmall color="contentSecondary" marginBottom="scale200">
              {config.workspaceKicker}
            </LabelSmall>
            <HeadingSmall marginTop={0} marginBottom="scale400">
              Operations command center
            </HeadingSmall>
            <ParagraphMedium marginTop={0} marginBottom="scale600" color="contentSecondary">
              {config.focusLine}
            </ParagraphMedium>
            <AppButton variant="primary" onClick={() => onNavigate('map')}>
              Open map
            </AppButton>
          </GuardrCard>
        </WorkbenchGridCell>

        <WorkbenchGridCell span={8}>
          <DesktopStatusPanel
            eyebrow="Platform status"
            title={stats.platformHealthy ? 'All clear' : 'Needs review'}
            summary={
              stats.platformHealthy
                ? 'Operations are running smoothly across the platform.'
                : `${stats.pendingReviews} item${stats.pendingReviews === 1 ? '' : 's'} waiting in the review queue.`
            }
            variant={stats.platformHealthy ? 'ok' : 'warn'}
            alert={
              filteredActions.length > 0
                ? `${filteredActions.length} action item${filteredActions.length === 1 ? '' : 's'} need follow-up today`
                : undefined
            }
            metrics={[
              { id: 'on-site', label: 'On site now', value: stats.onDutyGuards, tone: stats.onDutyGuards > 0 ? 'ok' : 'default', onClick: () => onNavigate('map') },
              { id: 'live-jobs', label: 'Live jobs', value: liveJobs.length, tone: liveJobs.length > 0 ? 'ok' : 'default', onClick: () => onNavigate('jobs') },
              { id: 'active-jobs', label: 'Active jobs', value: stats.activeJobs, onClick: () => onNavigate('jobs') },
              { id: 'queue', label: 'Review queue', value: stats.pendingReviews, tone: stats.pendingReviews > 0 ? 'warn' : 'ok', onClick: () => onNavigate('applications') },
              { id: 'incidents', label: 'Open incidents', value: stats.activeIncidents, tone: stats.activeIncidents > 0 ? 'warn' : 'ok', onClick: () => onNavigate('incidents') },
              { id: 'clients', label: 'Active clients', value: stats.activeClients, onClick: () => onNavigate('clients') },
              { id: 'guards', label: 'Active guards', value: stats.activeGuards, onClick: () => onNavigate('guards') },
              { id: 'completed', label: 'Completed jobs', value: stats.completedJobs, onClick: () => onNavigate('analytics') },
            ]}
            meters={[
              { id: 'approvals', label: 'Approvals backlog', value: String(stats.pendingApprovals), pct: clampPct(stats.pendingApprovals, 20), sub: stats.pendingApprovals === 0 ? 'Queue clear' : 'Items waiting for review', tone: stats.pendingApprovals > 5 ? 'warning' : stats.pendingApprovals > 0 ? 'primary' : 'success', onClick: () => onNavigate('applications') },
              { id: 'coverage', label: 'Field coverage', value: `${stats.onDutyGuards}/${Math.max(stats.activeGuards, 1)}`, pct: clampPct(stats.onDutyGuards, Math.max(stats.activeGuards, 1)), sub: `${stats.assignedGuardsOnJobs} assigned to active jobs`, tone: 'primary', onClick: () => onNavigate('map') },
              { id: 'payments', label: 'Payments needing action', value: String(stats.paymentsNeedingAction), pct: clampPct(stats.paymentsNeedingAction, 15), sub: stats.paymentsNeedingAction > 0 ? 'Client, guard, or Stripe follow-up' : 'All payments current', tone: stats.paymentsNeedingAction > 0 ? 'warning' : 'success', onClick: () => onNavigate('payments') },
            ]}
            breakdown={queueBreakdown}
            pipelineSegments={jobPipelineSegments}
            queuePieSegments={queuePieSegments}
            actions={[
              { id: 'map', label: 'Open map', onClick: () => onNavigate('map'), variant: 'sand' },
              { id: 'queue', label: 'Review queue', onClick: () => onNavigate('applications'), variant: 'outline' },
              { id: 'stats', label: 'Stats', onClick: () => onNavigate('stats'), variant: 'soft' },
            ]}
          />
        </WorkbenchGridCell>

        <WorkbenchGridCell span={12}>
          <GuardrCard>
            <WorkbenchQuickLinks items={quickLinks} />
          </GuardrCard>
        </WorkbenchGridCell>

        <WorkbenchGridCell span={12}>
          <WorkbenchSectionLabel>Charts &amp; graphs</WorkbenchSectionLabel>
          <Block display="grid" gridTemplateColumns="repeat(12, 1fr)" gridGap="scale500">
            <Block gridColumn={['span 12', 'span 6', 'span 3']}>
              <GuardrCard>
                <WorkbenchCardTitle>Job pipeline pie</WorkbenchCardTitle>
                <OverviewPieChart segments={jobPipelineSegments} centerLabel={String(jobPipelineSegments.reduce((sum, s) => sum + s.value, 0))} centerSub="jobs" />
              </GuardrCard>
            </Block>
            <Block gridColumn={['span 12', 'span 6', 'span 3']}>
              <GuardrCard>
                <WorkbenchCardTitle>Review queue pie</WorkbenchCardTitle>
                <OverviewPieChart segments={queuePieSegments} centerLabel={String(stats.pendingReviews)} centerSub="in queue" />
              </GuardrCard>
            </Block>
            <Block gridColumn={['span 12', 'span 6', 'span 3']}>
              <GuardrCard>
                <WorkbenchCardTitle>Platform health</WorkbenchCardTitle>
                <OverviewPieChart segments={healthPieSegments} centerLabel={stats.platformHealthy ? 'OK' : 'Review'} centerSub="status" size="sm" />
              </GuardrCard>
            </Block>
            <Block gridColumn={['span 12', 'span 6', 'span 3']}>
              <GuardrCard>
                <WorkbenchCardTitle>People mix</WorkbenchCardTitle>
                <OverviewPieChart segments={peopleSegments} centerLabel={String(clients.length + guards.length)} centerSub="accounts" size="sm" />
              </GuardrCard>
            </Block>
            <Block gridColumn={['span 12', 'span 12', 'span 6']}>
              <GuardrCard>
                <WorkbenchCardTitle>Completed jobs trend</WorkbenchCardTitle>
                <OverviewLineChart series={weeklySeries} />
              </GuardrCard>
            </Block>
            <Block gridColumn={['span 12', 'span 12', 'span 6']}>
              <GuardrCard>
                <WorkbenchCardTitle>Weekly bar chart</WorkbenchCardTitle>
                <OverviewWeekChart series={weeklySeries} />
              </GuardrCard>
            </Block>
            <Block gridColumn={['span 12', 'span 6', 'span 4']}>
              <GuardrCard>
                <WorkbenchCardTitle>Pipeline bars</WorkbenchCardTitle>
                {jobPipelineSegments.length > 0 ? (
                  <OverviewSegmentBar segments={jobPipelineSegments} />
                ) : (
                  <ParagraphMedium margin={0} color="contentSecondary">No jobs in the pipeline yet.</ParagraphMedium>
                )}
              </GuardrCard>
            </Block>
            <Block gridColumn={['span 12', 'span 6', 'span 4']}>
              <GuardrCard>
                <WorkbenchCardTitle>Guard performance levels</WorkbenchCardTitle>
                <ParagraphMedium marginTop={0} marginBottom="scale400" color="contentSecondary" $style={{ fontSize: '13px' }}>
                  Share of field guards at each tier — Starting, Rising, Professional, and Elite.
                </ParagraphMedium>
                <PerformanceTierProgressBars bars={tierPercentBars} totalGuards={guardStatRows.length} showPie />
              </GuardrCard>
            </Block>
            <Block gridColumn={['span 12', 'span 6', 'span 4']}>
              <GuardrCard>
                <WorkbenchCardTitle>Field &amp; queue gauges</WorkbenchCardTitle>
                <OverviewDonutGrid
                  items={[
                    { id: 'coverage', label: 'Field coverage', value: `${stats.onDutyGuards}`, pct: clampPct(stats.onDutyGuards, Math.max(stats.activeGuards, 1)), tone: 'primary' },
                    { id: 'approvals', label: 'Approvals', value: String(stats.pendingApprovals), pct: clampPct(stats.pendingApprovals, 20), tone: stats.pendingApprovals > 5 ? 'warning' : 'success' },
                    { id: 'payments', label: 'Payments', value: String(stats.paymentsNeedingAction), pct: clampPct(stats.paymentsNeedingAction, 15), tone: stats.paymentsNeedingAction > 0 ? 'warning' : 'success' },
                    { id: 'incidents', label: 'Incidents', value: String(stats.activeIncidents), pct: clampPct(stats.activeIncidents, 10), tone: stats.activeIncidents > 0 ? 'warning' : 'success' },
                    { id: 'live', label: 'Live jobs', value: String(liveJobs.length), pct: clampPct(liveJobs.length, Math.max(stats.activeJobs, 1)), tone: 'info' },
                    { id: 'completed', label: 'Completed', value: String(stats.completedJobs), pct: clampPct(stats.completedJobs, Math.max(requests.length, 1)), tone: 'muted' },
                  ]}
                />
              </GuardrCard>
            </Block>
          </Block>
        </WorkbenchGridCell>

        <WorkbenchGridCell span={12}>
          <AppDashboardZone title="At a glance" className="!mb-0">
            <AppMetricStrip className={`app-metric-strip--staff app-metric-strip--count-${metrics.length}`}>
              {metrics.map((metric) =>
                metric.navigateTo ? (
                  <AppMetricCell key={metric.label} label={metric.label} value={metric.value} sub={metric.sub} accent={metric.accent} onClick={() => onNavigate(metric.navigateTo!)} />
                ) : (
                  <AppMetricCell key={metric.label} label={metric.label} value={metric.value} sub={metric.sub} accent={metric.accent} />
                ),
              )}
            </AppMetricStrip>
          </AppDashboardZone>
        </WorkbenchGridCell>
      </WorkbenchGrid>

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
        <Block gridColumn={['span 12', 'span 12', 'span 6']}>
          <AppDashboardZone title="Needs your attention" className="!mb-0">
            {filteredActions.length === 0 ? (
              <div className="staff-overview-empty-card">
                <AccentIcon icon={CheckCircle2} size={20} className="shrink-0" />
                <div>
                  <p className="text-sm font-semibold">You&apos;re caught up</p>
                  <p className="text-xs uber-text-muted mt-0.5 leading-relaxed">{config.emptyAttentionCopy}</p>
                </div>
              </div>
            ) : (
              <AppItemCardStack>
                {filteredActions.slice(0, 8).map((item) => (
                  <AppItemCard
                    key={item.id}
                    onClick={() =>
                      onNavigate(item.section, resolveOverviewActionSelection(item, { requests, guards, clients }))
                    }
                  >
                    <div className="flex items-start gap-3 w-full text-left">
                      <span className={`staff-overview-action-icon ${item.tone === 'urgent' ? 'staff-overview-action-icon-urgent' : ''}`}>
                        {ACTION_ICONS[item.id] ?? <ArrowRight className="w-4 h-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold">{item.title}</p>
                          <WfBadge tone={item.tone === 'urgent' ? 'warning' : 'default'}>{item.count}</WfBadge>
                        </div>
                        <p className="text-xs uber-text-muted mt-1 leading-relaxed">{item.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 shrink-0 uber-text-muted mt-0.5" />
                    </div>
                  </AppItemCard>
                ))}
              </AppItemCardStack>
            )}
          </AppDashboardZone>
        </Block>

        <Block gridColumn={['span 12', 'span 12', 'span 6']}>
          <AppDashboardZone
            title="Live on site"
            actionLabel={liveJobs.length > 0 ? 'Open map' : undefined}
            onAction={liveJobs.length > 0 ? () => onNavigate('map') : undefined}
            className="!mb-0"
          >
            {liveJobs.length === 0 ? (
              <div className="staff-overview-empty-card">
                <MapPin className="w-5 h-5 uber-text-muted shrink-0" />
                <div>
                  <p className="text-sm font-semibold">No guards on site</p>
                  <p className="text-xs uber-text-muted mt-0.5">
                    Picked-up and in-progress jobs appear here when work is underway.
                  </p>
                </div>
              </div>
            ) : (
              <AppItemCardStack>
                {liveJobs.slice(0, 6).map((job) => {
                  const statusCfg = LIVE_JOB_STATUS_LABEL[job.status];
                  return (
                    <AppItemCard
                      key={job.id}
                      onClick={() => (onOpenJob ? onOpenJob(job.id) : onNavigate('jobs'))}
                    >
                      <div className="flex items-start justify-between gap-3 w-full text-left">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold truncate">{job.title}</p>
                            <WfBadge tone={job.status === 'in-progress' ? 'success' : 'primary'}>
                              {statusCfg.emoji} {statusCfg.label}
                            </WfBadge>
                          </div>
                          <p className="text-xs uber-text-muted mt-1">
                            {job.guardName} · {job.clientName}
                          </p>
                          <p className="text-xs uber-text-muted mt-0.5 truncate">{job.site}</p>
                          {canUpdateJobs && onOpenJob ? (
                            <AppButton
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenJob(job.id);
                              }}
                              className="mt-2"
                            >
                              Edit job
                            </AppButton>
                          ) : null}
                        </div>
                        {job.startedAt ? (
                          <p className="text-[11px] uber-text-muted shrink-0">
                            {formatActivityTime(job.startedAt)}
                          </p>
                        ) : null}
                      </div>
                    </AppItemCard>
                  );
                })}
              </AppItemCardStack>
            )}
          </AppDashboardZone>
        </Block>

        {config.showPlatformPulse ? (
          <Block gridColumn="span 12">
            <AppDashboardZone
              title="Platform pulse"
              actionLabel={config.showDirectorFinancials ? 'Analytics' : undefined}
              onAction={config.showDirectorFinancials ? () => onNavigate('analytics') : undefined}
              className="!mb-0"
            >
              <OverviewVisualGrid cards={platformPulseCards} columns={config.layout === 'compact' ? 2 : 3} variant="full" />
            </AppDashboardZone>
          </Block>
        ) : null}

        {config.showDirectorFinancials ? (
          <Block gridColumn="span 12">
            <AppDashboardZone title="Company financials" actionLabel="Payments" onAction={() => onNavigate('payments')} className="!mb-0">
              <div className="guard-performance-stats staff-payment-stats">
                {directorFinancialCells.map(({ label, value, sub, accent }) => (
                  <StaffSummaryCell key={label} label={label} value={value} sub={sub} accent={accent} />
                ))}
              </div>
            </AppDashboardZone>
          </Block>
        ) : null}

        {config.showOperationsSnapshot ? (
          <Block gridColumn="span 12">
            <AppDashboardZone title="Operations snapshot" actionLabel="Payments" onAction={() => onNavigate('payments')} className="!mb-0">
              <OverviewVisualGrid cards={operationsSnapshotCards} columns={3} variant="full" />
            </AppDashboardZone>
          </Block>
        ) : null}

        {config.showWeeklyInsight ? (
          <Block gridColumn={['span 12', 'span 6', 'span 4']}>
            <GuardrCard>
              <WorkbenchCardTitle>Completed jobs this week</WorkbenchCardTitle>
              <OverviewWeekChart series={weeklySeries} />
            </GuardrCard>
          </Block>
        ) : null}

        {config.showPipelineInsight ? (
          <Block gridColumn={['span 12', 'span 6', 'span 4']}>
            <GuardrCard>
              <WorkbenchCardTitle>Job pipeline mix</WorkbenchCardTitle>
              {jobPipelineSegments.length > 0 ? (
                <OverviewSegmentBar segments={jobPipelineSegments} />
              ) : (
                <ParagraphMedium margin={0} color="contentSecondary">No jobs in the pipeline yet.</ParagraphMedium>
              )}
            </GuardrCard>
          </Block>
        ) : null}

        {config.showActivityFeed ? (
          <Block gridColumn={['span 12', 'span 6', 'span 4']}>
            <GuardrCard>
              <WorkbenchCardTitle>Recent activity</WorkbenchCardTitle>
              {activityFeed.length === 0 ? (
                <ParagraphMedium margin={0} color="contentSecondary">
                  Activity will appear here as shifts run.
                </ParagraphMedium>
              ) : (
                <ul className="staff-overview-feed-list">
                  {activityFeed.slice(0, 10).map((item) => (
                    <li key={item.id} className="staff-overview-feed-item">
                      <span className="staff-overview-feed-dot" aria-hidden />
                      <div className="min-w-0">
                        <p className="text-sm leading-snug">{item.message}</p>
                        <p className="text-[11px] uber-text-muted mt-0.5">{formatActivityTime(item.timestamp)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </GuardrCard>
          </Block>
        ) : null}
      </Block>
    </AppScreen>
  );
}
