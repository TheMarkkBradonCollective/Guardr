import React, { useMemo } from 'react';
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
  buildOperationsSnapshotCards,
  buildPlatformPulseCards,
  buildJobPipelineSegments,
  computeWeeklyJobSeries,
} from '../../lib/overviewVisuals';
import {
  filterOverviewActionItems,
  filterOverviewMetrics,
  getStaffOverviewConfig,
} from '../../lib/staffOverviewConfig';
import { useDevice } from '../../lib/platform';
import { PlatformRole, Client, SecurityGuard, SecurityRequest } from '../../types';
import {
  WorkbenchGrid,
  WorkbenchGridCell,
  WorkbenchPage,
  WorkbenchPanel,
  WorkbenchQuickLinks,
  WorkbenchStatChips,
} from '../baseui/layout/WorkbenchLayout';
import { WfBadge } from '../ui/wireframe';
import { StaffSummaryCell } from './StaffSummaryCell';
import { OverviewSegmentBar, OverviewVisualGrid, OverviewWeekChart } from './overview/OverviewCharts';
import {
  buildStaffOverviewHubItems,
  QUICK_LINK_META,
  StaffOverviewHubCards,
  StaffOverviewListPanel,
  StaffOverviewListRow,
  StaffOverviewMetricChips,
  StaffOverviewQuickGrid,
  StaffOverviewSectionHeader,
  StaffOverviewStatusBanner,
} from './overview/StaffOverviewUberParts';

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
  staffRole: PlatformRole;
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

function useOverviewData(
  stats: PlatformStats,
  requests: SecurityRequest[],
  guards: SecurityGuard[],
  clients: Client[],
  actionItems: OverviewActionItem[],
  staffRole: PlatformRole,
) {
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

  return {
    config,
    metrics,
    filteredActions,
    directorFinancialCells,
    operationsSnapshotCards,
    platformPulseCards,
    weeklySeries,
    jobPipelineSegments,
  };
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
  staffRole,
}: StaffOverviewDesktopProps) {
  const { formFactor } = useDevice();
  const isDesktop = formFactor === 'desktop';
  const {
    config,
    metrics,
    filteredActions,
    directorFinancialCells,
    operationsSnapshotCards,
    platformPulseCards,
    weeklySeries,
    jobPipelineSegments,
  } = useOverviewData(stats, requests, guards, clients, actionItems, staffRole);

  const hubItems = useMemo(
    () => buildStaffOverviewHubItems(config.quickLinkSections, onNavigate),
    [config.quickLinkSections, onNavigate],
  );

  const quickGridItems = config.quickLinkSections.slice(0, 6).map((section) => {
    const meta = QUICK_LINK_META[section];
    return {
      id: section,
      label: meta.label,
      sub: meta.sub,
      icon: meta.icon,
      primary: section === 'map',
      onClick: () => onNavigate(section),
    };
  });

  const quickLinks = config.quickLinkSections.slice(0, 8).map((section) => {
    const meta = QUICK_LINK_META[section];
    return {
      id: section,
      label: meta.label,
      icon: meta.icon,
      onClick: () => onNavigate(section),
    };
  });

  const metricChipItems = metrics.map((metric) => ({
    id: metric.label,
    label: metric.label,
    value: Number.parseInt(metric.value, 10) || 0,
  }));

  const attentionPanel = (
    <StaffOverviewListPanel
      title="Needs your attention"
      actionLabel={filteredActions.length > 0 ? 'Review queue' : undefined}
      onAction={filteredActions.length > 0 ? () => onNavigate('applications') : undefined}
      emptyTitle="You're caught up"
      emptyBody={config.emptyAttentionCopy}
    >
      {filteredActions.slice(0, 8).map((item) => (
        <StaffOverviewListRow
          key={item.id}
          title={item.title}
          description={item.description}
          badge={<WfBadge tone={item.tone === 'urgent' ? 'warning' : 'default'}>{item.count}</WfBadge>}
          urgent={item.tone === 'urgent'}
          onClick={() =>
            onNavigate(item.section, resolveOverviewActionSelection(item, { requests, guards, clients }))
          }
        />
      ))}
    </StaffOverviewListPanel>
  );

  const livePanel = (
    <StaffOverviewListPanel
      title="Live on site"
      actionLabel={liveJobs.length > 0 ? 'Open map' : undefined}
      onAction={liveJobs.length > 0 ? () => onNavigate('map') : undefined}
      emptyTitle="No guards on site"
      emptyBody="Picked-up and in-progress jobs appear here when work is underway."
    >
      {liveJobs.slice(0, 6).map((job) => {
        const statusCfg = LIVE_JOB_STATUS_LABEL[job.status];
        return (
          <StaffOverviewListRow
            key={job.id}
            title={job.title}
            description={`${job.guardName} · ${job.clientName}`}
            meta={`${statusCfg.emoji} ${statusCfg.label}${job.startedAt ? ` · ${formatActivityTime(job.startedAt)}` : ''}`}
            onClick={() => (onOpenJob && canUpdateJobs ? onOpenJob(job.id) : onNavigate('jobs'))}
          />
        );
      })}
    </StaffOverviewListPanel>
  );

  const pulsePanel = config.showPlatformPulse ? (
    <WorkbenchPanel className="staff-overview-list-panel staff-overview-pulse-panel" padding>
      <StaffOverviewSectionHeader
        title="Platform pulse"
        actionLabel={config.showDirectorFinancials ? 'Analytics' : undefined}
        onAction={config.showDirectorFinancials ? () => onNavigate('analytics') : undefined}
      />
      <OverviewVisualGrid
        cards={platformPulseCards}
        columns={config.layout === 'compact' ? 2 : 3}
        variant="full"
      />
    </WorkbenchPanel>
  ) : null;

  const financialsPanel = config.showDirectorFinancials ? (
    <WorkbenchPanel className="staff-overview-list-panel staff-overview-financials-panel" padding>
      <StaffOverviewSectionHeader title="Company financials" actionLabel="Payments" onAction={() => onNavigate('payments')} />
      <div className="staff-overview-financials-grid">
        {directorFinancialCells.map(({ label, value, sub, accent }) => (
          <StaffSummaryCell key={label} label={label} value={value} sub={sub} accent={accent} />
        ))}
      </div>
    </WorkbenchPanel>
  ) : null;

  const operationsPanel = config.showOperationsSnapshot ? (
    <WorkbenchPanel className="staff-overview-list-panel" padding>
      <StaffOverviewSectionHeader title="Operations snapshot" actionLabel="Payments" onAction={() => onNavigate('payments')} />
      <OverviewVisualGrid cards={operationsSnapshotCards} columns={3} variant="full" />
    </WorkbenchPanel>
  ) : null;

  const insightsPanel =
    config.showWeeklyInsight || config.showPipelineInsight || config.showActivityFeed ? (
      <WorkbenchPanel className="staff-overview-list-panel staff-overview-insights-panel" padding>
        <StaffOverviewSectionHeader title="Insights" />
        <div className="staff-overview-insights-grid">
          {config.showWeeklyInsight ? (
            <section className="staff-overview-chart-card">
              <p className="overview-visual-title">Completed jobs this week</p>
              <OverviewWeekChart series={weeklySeries} />
            </section>
          ) : null}
          {config.showPipelineInsight ? (
            <section className="staff-overview-chart-card">
              <p className="overview-visual-title">Job pipeline mix</p>
              {jobPipelineSegments.length > 0 ? (
                <OverviewSegmentBar segments={jobPipelineSegments} />
              ) : (
                <p className="text-sm uber-text-muted py-4">No jobs in the pipeline yet.</p>
              )}
            </section>
          ) : null}
          {config.showActivityFeed ? (
            <section className="staff-overview-feed-card">
              <p className="overview-visual-title">Recent activity</p>
              {activityFeed.length === 0 ? (
                <p className="text-sm uber-text-muted py-4">
                  Check-ins, patrol reports, and new jobs will show here as they happen.
                </p>
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
            </section>
          ) : null}
        </div>
      </WorkbenchPanel>
    ) : null;

  if (isDesktop) {
    return (
      <WorkbenchPage
        className="staff-overview-uber staff-overview-desktop uber-direct-home mobility-workspace"
        data-tour="staff-overview"
      >
        <StaffOverviewStatusBanner
          healthy={stats.platformHealthy}
          pendingReviews={stats.pendingReviews}
          onReview={stats.pendingReviews > 0 ? () => onNavigate('applications') : undefined}
        />

        <StaffOverviewHubCards items={hubItems} />

        {metricChipItems.length > 0 ? (
          <WorkbenchStatChips
            items={metricChipItems}
            activeId={metricChipItems[0]?.id ?? ''}
            onSelect={(id) => {
              const metric = metrics.find((cell) => cell.label === id);
              if (metric?.navigateTo) onNavigate(metric.navigateTo);
            }}
          />
        ) : null}

        <WorkbenchPanel padding={false} className="staff-overview-quicklinks-panel">
          <WorkbenchQuickLinks items={quickLinks} />
        </WorkbenchPanel>

        <WorkbenchGrid>
          <WorkbenchGridCell span={6}>{attentionPanel}</WorkbenchGridCell>
          <WorkbenchGridCell span={6}>{livePanel}</WorkbenchGridCell>

          {pulsePanel ? (
            <WorkbenchGridCell span={financialsPanel ? 8 : 12}>{pulsePanel}</WorkbenchGridCell>
          ) : null}
          {financialsPanel ? (
            <WorkbenchGridCell span={pulsePanel ? 4 : 12}>{financialsPanel}</WorkbenchGridCell>
          ) : null}

          {operationsPanel ? <WorkbenchGridCell span={12}>{operationsPanel}</WorkbenchGridCell> : null}
          {insightsPanel ? <WorkbenchGridCell span={12}>{insightsPanel}</WorkbenchGridCell> : null}
        </WorkbenchGrid>
      </WorkbenchPage>
    );
  }

  return (
    <WorkbenchPage
      className="staff-overview-uber uber-direct-home uber-mobile-overview mobility-workspace"
      data-tour="staff-overview"
    >
      <div className="uber-mobile-overview-header">
        <p className="uber-mobile-overview-focus">{config.focusLine}</p>
      </div>

      <StaffOverviewStatusBanner
        healthy={stats.platformHealthy}
        pendingReviews={stats.pendingReviews}
        onReview={stats.pendingReviews > 0 ? () => onNavigate('applications') : undefined}
      />

      <StaffOverviewQuickGrid items={quickGridItems} />

      <StaffOverviewMetricChips
        metrics={metrics.map((metric) => ({
          label: metric.label,
          value: metric.value,
          navigateTo: metric.navigateTo,
        }))}
        onNavigate={(section) => onNavigate(section as StaffSection)}
      />

      {attentionPanel}
      {livePanel}
      {pulsePanel}
      {financialsPanel}
      {operationsPanel}
      {insightsPanel}
    </WorkbenchPage>
  );
}
