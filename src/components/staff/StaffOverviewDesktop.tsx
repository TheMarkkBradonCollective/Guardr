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
  buildPlatformHealthPieSegments,
  buildPlatformPulseCards,
  buildJobPipelineSegments,
  buildQueuePieSegments,
  computeWeeklyJobSeries,
} from '../../lib/overviewVisuals';
import {
  filterOverviewActionItems,
  filterOverviewMetrics,
  getStaffOverviewConfig,
} from '../../lib/staffOverviewConfig';
import { isStaffRole } from '../../lib/permissions';
import { useDevice } from '../../lib/platform';
import { PlatformRole, Client, SecurityGuard, SecurityRequest } from '../../types';
import {
  WorkbenchPanel,
  WorkbenchQuickLinks,
} from '../baseui/layout/WorkbenchLayout';
import { WfBadge } from '../ui/wireframe';
import { StaffSummaryCell } from './StaffSummaryCell';
import { OverviewVisualGrid } from './overview/OverviewCharts';
import {
  StaffOverviewDesktopLayout,
  StaffOverviewInsightGlance,
  StaffOverviewMobileLayout,
  StaffOverviewTabletLayout,
} from './overview/StaffOverviewLayouts';
import {
  buildStaffOverviewHubItems,
  QUICK_LINK_META,
  StaffOverviewActivityPanel,
  StaffOverviewDesktopHeader,
  StaffOverviewDesktopKpiStrip,
  StaffOverviewHubCards,
  StaffOverviewKpiGrid,
  StaffOverviewListPanel,
  StaffOverviewListRow,
  StaffOverviewQueueBoard,
  StaffOverviewQuickGrid,
  StaffOverviewRoleHeader,
  StaffOverviewSectionHeader,
} from './overview/StaffOverviewShellParts';

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
  const queuePieSegments = useMemo(() => buildQueuePieSegments(stats), [stats]);
  const healthPieSegments = useMemo(() => buildPlatformHealthPieSegments(stats), [stats]);

  return {
    config,
    metrics,
    filteredActions,
    directorFinancialCells,
    operationsSnapshotCards,
    platformPulseCards,
    weeklySeries,
    jobPipelineSegments,
    queuePieSegments,
    healthPieSegments,
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
  const {
    config,
    metrics,
    filteredActions,
    directorFinancialCells,
    operationsSnapshotCards,
    platformPulseCards,
    weeklySeries,
    jobPipelineSegments,
    queuePieSegments,
    healthPieSegments,
  } = useOverviewData(stats, requests, guards, clients, actionItems, staffRole);

  const hubItems = useMemo(
    () => buildStaffOverviewHubItems(config.quickLinkSections, onNavigate),
    [config.quickLinkSections, onNavigate],
  );

  const quickGridItems = config.quickLinkSections.map((section) => {
    const meta = QUICK_LINK_META[section];
    return {
      id: section,
      label: meta.label,
      sub: meta.sub,
      icon: meta.icon,
      primary: true,
      onClick: () => onNavigate(section),
    };
  });

  const quickLinks = config.quickLinkSections.map((section) => {
    const meta = QUICK_LINK_META[section];
    return {
      id: section,
      label: meta.label,
      icon: meta.icon,
      onClick: () => onNavigate(section),
    };
  });

  const showQueueBoard = isStaffRole(staffRole);
  const attentionLimit = formFactor === 'mobile' ? 5 : formFactor === 'tablet' ? 8 : 10;
  const liveLimit = formFactor === 'mobile' ? 3 : formFactor === 'tablet' ? 6 : 8;
  const activityLimit = formFactor === 'mobile' ? 5 : formFactor === 'tablet' ? 8 : 12;

  const header =
    formFactor === 'desktop' ? (
      <StaffOverviewDesktopHeader
        config={config}
        healthy={stats.platformHealthy}
        pendingReviews={stats.pendingReviews}
        onReview={stats.pendingReviews > 0 ? () => onNavigate('applications') : undefined}
      />
    ) : (
      <StaffOverviewRoleHeader
        config={config}
        healthy={stats.platformHealthy}
        pendingReviews={stats.pendingReviews}
        onReview={stats.pendingReviews > 0 ? () => onNavigate('applications') : undefined}
      />
    );

  const kpiGrid =
    formFactor === 'desktop' ? (
      <StaffOverviewDesktopKpiStrip metrics={metrics} onNavigate={onNavigate} />
    ) : (
      <StaffOverviewKpiGrid metrics={metrics} onNavigate={onNavigate} />
    );

  const hubCards = (
    <StaffOverviewHubCards
      items={hubItems}
      className={formFactor === 'desktop' ? 'staff-overview-pro-hub staff-overview-desktop-destinations-grid' : 'staff-overview-pro-hub'}
    />
  );

  const queueBoard = showQueueBoard ? (
    <StaffOverviewQueueBoard
      stats={stats}
      showPayments={config.showPaymentsInQueue}
      staffRole={staffRole}
      onNavigate={onNavigate}
      layout={formFactor === 'desktop' ? 'desktop' : 'default'}
    />
  ) : null;

  const attentionPanel = (
    <StaffOverviewListPanel
      title="Needs your attention"
      actionLabel={filteredActions.length > 0 ? 'Review queue' : undefined}
      onAction={filteredActions.length > 0 ? () => onNavigate('applications') : undefined}
      emptyTitle="You're caught up"
      emptyBody={config.emptyAttentionCopy}
    >
      {filteredActions.slice(0, attentionLimit).map((item) => (
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
      {liveJobs.slice(0, liveLimit).map((job) => {
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
        actionLabel="Analytics"
        onAction={() => onNavigate('analytics')}
      />
      <OverviewVisualGrid
        cards={platformPulseCards}
        columns={formFactor === 'tablet' ? 2 : 3}
        variant="full"
      />
    </WorkbenchPanel>
  ) : null;

  const financialsPanel = config.showDirectorFinancials ? (
    <WorkbenchPanel className="staff-overview-list-panel staff-overview-financials-panel" padding>
      <StaffOverviewSectionHeader title="Company financials" actionLabel="Payments & invoices" onAction={() => onNavigate('payments')} />
      <div className="staff-overview-financials-grid staff-overview-pro-financials">
        {directorFinancialCells.map(({ label, value, sub, accent }) => (
          <StaffSummaryCell key={label} label={label} value={value} sub={sub} accent={accent} />
        ))}
      </div>
    </WorkbenchPanel>
  ) : null;

  const operationsPanel = config.showOperationsSnapshot ? (
    <WorkbenchPanel className="staff-overview-list-panel" padding>
      <StaffOverviewSectionHeader title="Operations snapshot" actionLabel="Stats" onAction={() => onNavigate('stats')} />
      <OverviewVisualGrid cards={operationsSnapshotCards} columns={3} variant="full" />
    </WorkbenchPanel>
  ) : null;

  const insightsPanel =
    config.showWeeklyInsight || config.showPipelineInsight ? (
      <StaffOverviewInsightGlance
        showWeekly={config.showWeeklyInsight}
        showPipeline={config.showPipelineInsight}
        weeklySeries={weeklySeries}
        jobPipelineSegments={jobPipelineSegments}
        compact={formFactor === 'mobile'}
      />
    ) : null;

  const activityPanel = config.showActivityFeed ? (
    <StaffOverviewActivityPanel
      items={activityFeed.slice(0, activityLimit)}
      formatTime={formatActivityTime}
      onViewAll={() => onNavigate('messages')}
    />
  ) : null;

  const mobileShortcuts = (
    <>
      <StaffOverviewSectionHeader title="Quick actions" />
      <StaffOverviewQuickGrid items={quickGridItems} />
    </>
  );

  const tabletShortcuts = (
    <WorkbenchPanel padding={false} className="staff-overview-quicklinks-panel">
      <WorkbenchQuickLinks items={quickLinks} />
    </WorkbenchPanel>
  );

  const sharedLayoutProps = {
    config,
    staffRole,
    stats,
    header,
    kpiGrid,
    hubCards,
    queueBoard,
    attentionPanel,
    livePanel,
    pulsePanel,
    financialsPanel,
    operationsPanel,
    insightsPanel,
    activityPanel,
    weeklySeries,
    jobPipelineSegments,
    platformPulseCards,
    operationsSnapshotCards,
    queuePieSegments,
    healthPieSegments,
    onNavigateAnalytics: () => onNavigate('analytics'),
  };

  if (formFactor === 'mobile') {
    return <StaffOverviewMobileLayout {...sharedLayoutProps} shortcuts={mobileShortcuts} />;
  }

  if (formFactor === 'tablet') {
    return <StaffOverviewTabletLayout {...sharedLayoutProps} shortcuts={tabletShortcuts} />;
  }

  return <StaffOverviewDesktopLayout {...sharedLayoutProps} />;
}
