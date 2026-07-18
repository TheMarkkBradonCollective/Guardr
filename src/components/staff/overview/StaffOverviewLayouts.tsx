import React from 'react';
import type { OverviewSegment, OverviewVisualCard, WeeklyJobPoint } from '../../../lib/overviewVisuals';
import type { StaffOverviewConfig } from '../../../lib/staffOverviewConfig';
import type { PlatformStats } from '../../../lib/staffOps';
import type { PlatformRole } from '../../../types';
import {
  WorkbenchGrid,
  WorkbenchGridCell,
  WorkbenchPage,
  WorkbenchPanel,
  WorkbenchQuickLinks,
} from '../../baseui/layout/WorkbenchLayout';
import {
  OverviewLineChart,
  OverviewPieChart,
  OverviewSegmentBar,
  OverviewVisualGrid,
  OverviewWeekChart,
} from './OverviewCharts';
import { StaffOverviewSectionHeader } from './StaffOverviewUberParts';

export interface StaffOverviewLayoutProps {
  config: StaffOverviewConfig;
  staffRole: PlatformRole;
  stats: PlatformStats;
  header: React.ReactNode;
  kpiGrid: React.ReactNode;
  hubCards: React.ReactNode;
  queueBoard: React.ReactNode | null;
  attentionPanel: React.ReactNode;
  livePanel: React.ReactNode;
  pulsePanel: React.ReactNode | null;
  financialsPanel: React.ReactNode | null;
  operationsPanel: React.ReactNode | null;
  insightsPanel: React.ReactNode | null;
  activityPanel: React.ReactNode | null;
  shortcuts: React.ReactNode;
  weeklySeries: WeeklyJobPoint[];
  jobPipelineSegments: OverviewSegment[];
  platformPulseCards: OverviewVisualCard[];
  operationsSnapshotCards: OverviewVisualCard[];
  queuePieSegments: OverviewSegment[];
  healthPieSegments: OverviewSegment[];
  onNavigateAnalytics?: () => void;
}

function DesktopChartsBand({
  weeklySeries,
  jobPipelineSegments,
  queuePieSegments,
  healthPieSegments,
  showPipeline,
}: {
  weeklySeries: WeeklyJobPoint[];
  jobPipelineSegments: OverviewSegment[];
  queuePieSegments: OverviewSegment[];
  healthPieSegments: OverviewSegment[];
  showPipeline: boolean;
}) {
  const weeklyTotal = weeklySeries.reduce((sum, point) => sum + point.count, 0);
  const pipelineTotal = jobPipelineSegments.reduce((sum, segment) => sum + segment.value, 0);
  const queueTotal = queuePieSegments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <section className="staff-overview-desktop-charts" aria-label="Performance charts">
      <WorkbenchPanel className="staff-overview-list-panel staff-overview-desktop-chart-panel" padding>
        <StaffOverviewSectionHeader title="Completed jobs trend" />
        <div className="staff-overview-desktop-chart-body staff-overview-desktop-chart-body--tall">
          <OverviewLineChart series={weeklySeries} />
          <p className="staff-overview-desktop-chart-footnote">
            {weeklyTotal > 0 ? `${weeklyTotal} completed this week` : 'Trend updates as jobs complete'}
          </p>
        </div>
      </WorkbenchPanel>

      {showPipeline ? (
        <WorkbenchPanel className="staff-overview-list-panel staff-overview-desktop-chart-panel" padding>
          <StaffOverviewSectionHeader title="Job pipeline mix" />
          <div className="staff-overview-desktop-chart-body">
            {pipelineTotal > 0 ? (
              <OverviewPieChart
                segments={jobPipelineSegments}
                centerLabel={String(pipelineTotal)}
                centerSub="jobs"
                size="lg"
              />
            ) : (
              <p className="text-sm uber-text-muted py-8 text-center">No jobs in the pipeline yet.</p>
            )}
          </div>
        </WorkbenchPanel>
      ) : null}

      <WorkbenchPanel className="staff-overview-list-panel staff-overview-desktop-chart-panel" padding>
        <StaffOverviewSectionHeader title={queueTotal > 0 ? 'Approval queue' : 'Platform health'} />
        <div className="staff-overview-desktop-chart-body">
          <OverviewPieChart
            segments={queueTotal > 0 ? queuePieSegments : healthPieSegments}
            centerLabel={String(queueTotal > 0 ? queueTotal : healthPieSegments.reduce((s, x) => s + x.value, 0))}
            centerSub={queueTotal > 0 ? 'pending' : 'signals'}
            size="lg"
          />
        </div>
      </WorkbenchPanel>
    </section>
  );
}

/** Mobile — app-first: quick actions, scroll hubs, lightweight lists. */
export function StaffOverviewMobileLayout({
  staffRole,
  header,
  kpiGrid,
  hubCards,
  queueBoard,
  attentionPanel,
  livePanel,
  insightsPanel,
  shortcuts,
}: StaffOverviewLayoutProps) {
  return (
    <WorkbenchPage
      className="staff-overview-pro staff-overview-uber staff-overview--mobile staff-overview-mobile-app"
      data-tour="staff-overview"
      data-staff-role={staffRole}
    >
      {header}

      <section className="staff-overview-mobile-primary" aria-label="Quick actions">
        {shortcuts}
      </section>

      {kpiGrid}

      {hubCards}

      {queueBoard}

      <section className="staff-overview-mobile-ops">{attentionPanel}</section>
      <section className="staff-overview-mobile-live">{livePanel}</section>

      {insightsPanel ? <section className="staff-overview-mobile-glance">{insightsPanel}</section> : null}
    </WorkbenchPage>
  );
}

/** Tablet — balanced command center with charts and split panels. */
export function StaffOverviewTabletLayout({
  staffRole,
  header,
  kpiGrid,
  hubCards,
  queueBoard,
  attentionPanel,
  livePanel,
  pulsePanel,
  financialsPanel,
  insightsPanel,
  activityPanel,
  shortcuts,
}: StaffOverviewLayoutProps) {
  return (
    <WorkbenchPage
      className="staff-overview-pro staff-overview-uber staff-overview--tablet staff-overview-tablet-command"
      data-tour="staff-overview"
      data-staff-role={staffRole}
    >
      {header}
      {kpiGrid}
      {hubCards}
      {queueBoard}
      {financialsPanel}

      <section className="staff-overview-tablet-ops">
        {attentionPanel}
        {livePanel}
      </section>

      {insightsPanel ? <section className="staff-overview-tablet-insights">{insightsPanel}</section> : null}

      {pulsePanel ? <section className="staff-overview-tablet-pulse">{pulsePanel}</section> : null}

      {activityPanel ? <section className="staff-overview-tablet-activity">{activityPanel}</section> : null}

      <section className="staff-overview-tablet-shortcuts">
        <StaffOverviewSectionHeader title="More tools" />
        {shortcuts}
      </section>
    </WorkbenchPage>
  );
}

/** Desktop — broad analytics workspace with charts, grids, and deep visibility. */
export function StaffOverviewDesktopLayout({
  config,
  staffRole,
  header,
  kpiGrid,
  hubCards,
  queueBoard,
  attentionPanel,
  livePanel,
  pulsePanel,
  financialsPanel,
  operationsPanel,
  activityPanel,
  shortcuts,
  weeklySeries,
  jobPipelineSegments,
  platformPulseCards,
  operationsSnapshotCards,
  queuePieSegments,
  healthPieSegments,
  onNavigateAnalytics,
}: StaffOverviewLayoutProps) {
  return (
    <WorkbenchPage
      className="staff-overview-pro staff-overview-uber staff-overview--desktop staff-overview-desktop-command"
      data-tour="staff-overview"
      data-staff-role={staffRole}
    >
      <header className="staff-overview-desktop-topbar">
        <div className="staff-overview-desktop-topbar-copy">{header}</div>
        <div className="staff-overview-desktop-topbar-actions">{shortcuts}</div>
      </header>

      {kpiGrid}

      <DesktopChartsBand
        weeklySeries={weeklySeries}
        jobPipelineSegments={jobPipelineSegments}
        queuePieSegments={queuePieSegments}
        healthPieSegments={healthPieSegments}
        showPipeline={config.showPipelineInsight}
      />

      {queueBoard}

      <WorkbenchGrid className="staff-overview-desktop-main staff-overview-pro-main">
        {financialsPanel ? <WorkbenchGridCell span={12}>{financialsPanel}</WorkbenchGridCell> : null}

        {pulsePanel && operationsPanel ? (
          <>
            <WorkbenchGridCell span={8}>{pulsePanel}</WorkbenchGridCell>
            <WorkbenchGridCell span={4}>{operationsPanel}</WorkbenchGridCell>
          </>
        ) : (
          <>
            {pulsePanel ? <WorkbenchGridCell span={12}>{pulsePanel}</WorkbenchGridCell> : null}
            {operationsPanel ? <WorkbenchGridCell span={12}>{operationsPanel}</WorkbenchGridCell> : null}
          </>
        )}

        {!pulsePanel && config.showPlatformPulse && platformPulseCards.length > 0 ? (
          <WorkbenchGridCell span={12}>
            <WorkbenchPanel className="staff-overview-list-panel" padding>
              <StaffOverviewSectionHeader title="Platform pulse" actionLabel="Analytics" onAction={onNavigateAnalytics} />
              <OverviewVisualGrid cards={platformPulseCards} columns={3} variant="full" />
            </WorkbenchPanel>
          </WorkbenchGridCell>
        ) : null}

        {!operationsPanel && config.showOperationsSnapshot && operationsSnapshotCards.length > 0 ? (
          <WorkbenchGridCell span={12}>
            <WorkbenchPanel className="staff-overview-list-panel" padding>
              <StaffOverviewSectionHeader title="Operations snapshot" />
              <OverviewVisualGrid cards={operationsSnapshotCards} columns={3} variant="full" />
            </WorkbenchPanel>
          </WorkbenchGridCell>
        ) : null}

        <WorkbenchGridCell span={6}>{attentionPanel}</WorkbenchGridCell>
        <WorkbenchGridCell span={6}>{livePanel}</WorkbenchGridCell>

        {activityPanel ? <WorkbenchGridCell span={12}>{activityPanel}</WorkbenchGridCell> : null}

        <WorkbenchGridCell span={12}>
          <section className="staff-overview-desktop-hubs">{hubCards}</section>
        </WorkbenchGridCell>
      </WorkbenchGrid>
    </WorkbenchPage>
  );
}

/** Compact weekly + pipeline glance for mobile/tablet insight panels. */
export function StaffOverviewInsightGlance({
  showWeekly,
  showPipeline,
  weeklySeries,
  jobPipelineSegments,
  compact = false,
}: {
  showWeekly: boolean;
  showPipeline: boolean;
  weeklySeries: WeeklyJobPoint[];
  jobPipelineSegments: OverviewSegment[];
  compact?: boolean;
}) {
  if (!showWeekly && !showPipeline) return null;

  return (
    <WorkbenchPanel className="staff-overview-list-panel staff-overview-insights-panel" padding>
      <StaffOverviewSectionHeader title={compact ? 'This week' : 'Performance insights'} />
      <div className={`staff-overview-insights-grid staff-overview-pro-insights${compact ? ' staff-overview-insights-grid--compact' : ''}`}>
        {showWeekly ? (
          <section className="staff-overview-chart-card">
            <p className="overview-visual-title">Completed jobs this week</p>
            <OverviewWeekChart series={weeklySeries} />
          </section>
        ) : null}
        {showPipeline ? (
          <section className="staff-overview-chart-card">
            <p className="overview-visual-title">Job pipeline mix</p>
            {jobPipelineSegments.length > 0 ? (
              <OverviewSegmentBar segments={jobPipelineSegments} />
            ) : (
              <p className="text-sm uber-text-muted py-4">No jobs in the pipeline yet.</p>
            )}
          </section>
        ) : null}
      </div>
    </WorkbenchPanel>
  );
}
