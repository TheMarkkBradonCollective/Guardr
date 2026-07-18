import React, { useMemo, useState } from 'react';
import { Block } from 'baseui/block';
import { LabelSmall, ParagraphMedium } from 'baseui/typography';
import { SecurityGuard, SecurityRequest } from '../../types';
import {
  ClientReportCard,
  formatShiftTimeRange,
  getUpcomingCoverage,
} from '../../lib/clientCoverage';
import { getClientLiveJobs, inferClientShiftPhase, CLIENT_SHIFT_PHASE_LABELS } from '../../lib/clientShift';
import { canClientApproveStaffScheduleChange } from '../../lib/jobScheduleChange';
import { canClientApproveOvertime } from '../../lib/shiftBilling';
import { canClientConfirmSelfAudit, hasSelfAuditPhotosToReview, isSelfAuditClientConfirmed } from '../../lib/selfAuditPhotos';
import { buildJobPipelineSegments, computeWeeklyJobSeries } from '../../lib/overviewVisuals';
import { OverviewLineChart, OverviewSegmentBar } from '../staff/overview/OverviewCharts';
import { AppEmptyState, AppStatusBanner } from '../ui/app/AppPrimitives';
import { AppButton } from '../ui/AppButton';
import { GuardrCard } from '../baseui/GuardrCard';
import { UberDirectHubCard } from '../baseui/dashboard';
import {
  WorkbenchPage,
  WorkbenchPanel,
  WorkbenchSearchRow,
} from '../baseui/layout/WorkbenchLayout';
import {
  Briefcase,
  Clock,
  CreditCard,
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

function formatStatusLabel(req: SecurityRequest): string {
  if (req.status === 'in-progress') return CLIENT_SHIFT_PHASE_LABELS[inferClientShiftPhase(req)];
  if (req.status === 'completed' || req.status === 'closed') {
    const ended = req.endDate ? new Date(req.endDate) : null;
    if (ended) {
      return `Completed ${ended.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    }
    return 'Completed';
  }
  if (req.status === 'accepted') return 'Scheduled';
  if (req.status === 'open') return 'Open';
  return req.status;
}

export function ClientHomeDesktop({
  companyName,
  coverage,
  requests,
  recentReports,
  accountPending = false,
  onOpenProfile,
  onAction,
}: ClientHomeDesktopProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SecurityRequest['status']>('all');

  const upcoming = getUpcomingCoverage(requests);
  const liveJobs = useMemo(() => getClientLiveJobs(requests), [requests]);
  const pendingActions = useMemo(() => clientActionCount(requests), [requests]);
  const jobPipelineSegments = useMemo(() => buildJobPipelineSegments(requests), [requests]);
  const weeklySeries = useMemo(() => computeWeeklyJobSeries(requests), [requests]);

  const run = (action: ClientHomeAction) => {
    if (accountPending && action !== 'messages') {
      onOpenProfile?.();
      return;
    }
    onAction(action);
  };

  const tableJobs = useMemo(() => {
    const sorted = [...requests].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    );
    const query = searchQuery.trim().toLowerCase();
    return sorted.filter((job) => {
      if (statusFilter !== 'all' && job.status !== statusFilter) return false;
      if (!query) return true;
      const haystack = [
        job.title,
        job.siteName,
        job.location,
        job.assignedGuardName,
        job.id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [requests, searchQuery, statusFilter]);

  return (
    <WorkbenchPage className="client-home-desktop mobility-workspace uber-direct-home">
      {accountPending ? (
        <Block paddingBottom="scale500">
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
        </Block>
      ) : null}

      <div className="uber-direct-home-hub">
        <UberDirectHubCard
          title="Jobs"
          description="Create and manage jobs for your locations"
          icon={Briefcase}
          iconTone="yellow"
          onClick={() => run('requests')}
        />
        <UberDirectHubCard
          title="Billing"
          description="View statements, download docs and manage payments"
          icon={CreditCard}
          iconTone="green"
          onClick={() => run('invoices')}
        />
        <UberDirectHubCard
          title="Users"
          description="Manage your employees and user permissions"
          icon={Users}
          iconTone="orange"
          onClick={() => run('guards')}
        />
      </div>

      <WorkbenchSearchRow
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search for a job or location"
        filters={
          <>
            <label className="uber-workbench-filter">
              <span className="sr-only">Filter by status</span>
              <select
                className="uber-workbench-filter-select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              >
                <option value="all">All statuses</option>
                <option value="open">Open</option>
                <option value="accepted">Scheduled</option>
                <option value="in-progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
            </label>
            <button type="button" className="uber-workbench-filter-select" onClick={() => run('map')}>
              All locations
            </button>
            <button type="button" className="uber-workbench-filter-select uber-workbench-filter-select--muted">
              {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
            </button>
          </>
        }
        actions={
          <button type="button" className="uber-workbench-search-btn" onClick={() => setSearchQuery(searchQuery)}>
            Search
          </button>
        }
      />

      <WorkbenchPanel>
        {tableJobs.length === 0 ? (
          <AppEmptyState title="No jobs yet">Post a job to get matched with licensed guards.</AppEmptyState>
        ) : (
          <table className="uber-workbench-table uber-direct-deliveries-table">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Details</th>
                <th>Status</th>
                <th className="uber-workbench-table-col-total">Total</th>
              </tr>
            </thead>
            <tbody>
              {tableJobs.slice(0, 25).map((job) => (
                <tr
                  key={job.id}
                  className="uber-workbench-table-row"
                  onClick={() => run('requests')}
                >
                  <td>
                    <p className="uber-workbench-table-primary">
                      {job.assignedGuardName || job.title}
                    </p>
                    <p className="uber-workbench-table-secondary">{job.siteName || job.location}</p>
                  </td>
                  <td>
                    <p className="uber-workbench-table-primary">Guardr</p>
                    <p className="uber-workbench-table-secondary">
                      {job.siteName || companyName}
                    </p>
                    <p className="uber-workbench-table-secondary">{job.id.slice(0, 8).toUpperCase()}</p>
                  </td>
                  <td>
                    <p className="uber-workbench-table-primary">{formatStatusLabel(job)}</p>
                    <p className="uber-workbench-table-secondary">
                      {formatShiftTimeRange(job.startDate, job.endDate)}
                    </p>
                  </td>
                  <td className="uber-workbench-table-value uber-workbench-table-col-total">
                    US${job.hourlyRate ? (job.hourlyRate * 6).toFixed(2) : '0.00'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </WorkbenchPanel>

      {(liveJobs.length > 0 || pendingActions > 0 || jobPipelineSegments.length > 0) ? (
        <div className="uber-direct-home-insights">
          <WorkbenchPanel>
            <LabelSmall marginBottom="scale400" $style={{ fontWeight: 700, textTransform: 'none', fontSize: '14px' }}>
              Operations insight
            </LabelSmall>
            <Block display="grid" gridTemplateColumns="repeat(auto-fit, minmax(160px, 1fr))" gridGap="scale500" marginBottom="scale600">
              <Block>
                <LabelSmall margin={0} color="contentSecondary">Live assignments</LabelSmall>
                <ParagraphMedium margin={0} $style={{ fontWeight: 700 }}>{coverage.activeAssignments}</ParagraphMedium>
              </Block>
              <Block>
                <LabelSmall margin={0} color="contentSecondary">Guards on duty</LabelSmall>
                <ParagraphMedium margin={0} $style={{ fontWeight: 700 }}>{coverage.guardsOnDuty}</ParagraphMedium>
              </Block>
              <Block>
                <LabelSmall margin={0} color="contentSecondary">Scheduled</LabelSmall>
                <ParagraphMedium margin={0} $style={{ fontWeight: 700 }}>{upcoming.length}</ParagraphMedium>
              </Block>
              <Block>
                <LabelSmall margin={0} color="contentSecondary">Needs approval</LabelSmall>
                <ParagraphMedium margin={0} $style={{ fontWeight: 700 }}>{pendingActions}</ParagraphMedium>
              </Block>
            </Block>
            {jobPipelineSegments.length > 0 ? (
              <Block display="grid" gridTemplateColumns={['1fr', '1fr', '1fr']} gridGap="scale600">
                <GuardrCard title="Pipeline">
                  <OverviewSegmentBar segments={jobPipelineSegments} />
                </GuardrCard>
                <GuardrCard title="Weekly trend">
                  <OverviewLineChart series={weeklySeries} />
                </GuardrCard>
                <GuardrCard title="Recent reports">
                  <ParagraphMedium margin={0} $style={{ fontWeight: 700 }}>{recentReports.length}</ParagraphMedium>
                  <button type="button" className="uber-direct-inline-link" onClick={() => run('reports')}>
                    View reports
                  </button>
                </GuardrCard>
              </Block>
            ) : null}
          </WorkbenchPanel>
        </div>
      ) : null}
    </WorkbenchPage>
  );
}
