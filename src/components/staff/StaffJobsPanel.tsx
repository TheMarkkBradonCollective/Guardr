import { useEffect, useMemo, useState } from 'react';
import { Briefcase, Clock, Search } from 'lucide-react';
import { Client, PlatformRole, SecurityGuard, SecurityRequest } from '../../types';
import type { ClientPlatformFeeSchedules, PlatformFeeConfig } from '../../lib/payments';
import { formatShiftRange } from '../../lib/dates';
import { useLayoutFormFactor } from '../../surfaces';
import { StatusChip } from '../baseui/StatusChip';
import { GuardrDataTable, type GuardrTableColumn } from '../baseui/GuardrDataTable';
import { jobStatusLabel, jobStatusTone } from '../../lib/jobStatusTone';
import {
  WorkbenchEmpty,
  WorkbenchSplit,
} from '../baseui/layout/WorkbenchLayout';
import { ListDetailLayout, useSplitListDetail } from '../ui/app/ListDetailLayout';
import { WfListCard, WfSearchBar } from '../ui/wireframe';
import { getPendingScheduleChangeApprovals } from '../../lib/jobScheduleChange';
import { StaffCreateJobForm } from './StaffCreateJobForm';
import type { StaffCreateJobInput } from './StaffCreateJobForm';
import { StaffJobDetailPanel } from './StaffJobDetailPanel';
import { StaffListFilterTabs } from './StaffListFilterTabs';
import { StaffOpsPageShell } from './StaffOpsPageShell';

type JobsFilter = 'all' | 'open' | 'active' | 'schedule' | 'complete' | 'cancelled';

const FILTER_OPTIONS: { id: JobsFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'active', label: 'Active' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'complete', label: 'Complete' },
  { id: 'cancelled', label: 'Cancelled' },
];

interface StaffJobsPanelProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  clients?: Client[];
  canManageJobs?: boolean;
  onApproveRequest: (id: string) => void;
  onDenyRequest: (id: string) => void;
  onCreateJob?: (input: StaffCreateJobInput) => Promise<string | void>;
  onEditJobListing?: (requestId: string, updates: Partial<SecurityRequest>) => void | Promise<void>;
  canEditJobListing?: boolean;
  onApproveGuardApplication?: (requestId: string, guardId: string) => void | Promise<void>;
  onDenyGuardApplication?: (requestId: string, guardId: string) => void | Promise<void>;
  onApproveScheduleChange?: (requestId: string) => void | Promise<void>;
  onRejectScheduleChange?: (requestId: string) => void | Promise<void>;
  onApproveScheduleChangeBilling?: (requestId: string) => void | Promise<void>;
  selectedId?: string | null;
  onSelectedIdChange?: (id: string | null) => void;
  initialSelectedId?: string | null;
  staffRole?: PlatformRole;
  feeConfig: PlatformFeeConfig;
  feeSchedules?: ClientPlatformFeeSchedules;
}

function hasPendingScheduleChange(req: SecurityRequest): boolean {
  return (
    req.scheduleChangeStatus === 'pending_staff' ||
    req.scheduleChangeStatus === 'pending_staff_billing'
  );
}

function matchesFilter(req: SecurityRequest, filter: JobsFilter): boolean {
  switch (filter) {
    case 'open':
      return req.status === 'open' || req.status === 'pending-review';
    case 'active':
      return req.status === 'accepted' || req.status === 'in-progress';
    case 'schedule':
      return hasPendingScheduleChange(req);
    case 'complete':
      return req.status === 'completed' || req.status === 'closed';
    case 'cancelled':
      return req.status === 'cancelled';
    default:
      return true;
  }
}

function guardMeta(req: SecurityRequest, guards: SecurityGuard[]): string {
  const assignedGuard = guards.find((g) => g.id === req.assignedGuardId);
  if (assignedGuard) return `Guard: ${assignedGuard.name}`;
  if (req.status === 'open' && req.applicants.length > 0) {
    return `${req.applicants.length} applicant${req.applicants.length === 1 ? '' : 's'}`;
  }
  return 'No guard yet';
}

export function StaffJobsPanel({
  requests,
  guards,
  clients = [],
  canManageJobs = false,
  onApproveRequest,
  onDenyRequest,
  onCreateJob,
  onEditJobListing,
  canEditJobListing = false,
  onApproveGuardApplication,
  onDenyGuardApplication,
  onApproveScheduleChange,
  onRejectScheduleChange,
  onApproveScheduleChangeBilling,
  selectedId: controlledSelectedId,
  onSelectedIdChange,
  initialSelectedId = null,
  staffRole,
  feeConfig,
  feeSchedules,
}: StaffJobsPanelProps) {
  const formFactor = useLayoutFormFactor();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<JobsFilter>('all');
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(initialSelectedId);
  const isControlled = controlledSelectedId !== undefined;
  const selectedId = isControlled ? controlledSelectedId : internalSelectedId;

  const setSelectedId = (id: string | null) => {
    if (!isControlled) setInternalSelectedId(id);
    onSelectedIdChange?.(id);
  };

  useEffect(() => {
    if (isControlled) return;
    setInternalSelectedId(initialSelectedId);
  }, [initialSelectedId, isControlled]);

  const tallies = useMemo(
    () => ({
      all: requests.length,
      open: requests.filter((r) => matchesFilter(r, 'open')).length,
      active: requests.filter((r) => matchesFilter(r, 'active')).length,
      schedule: requests.filter((r) => matchesFilter(r, 'schedule')).length,
      cancelled: requests.filter((r) => matchesFilter(r, 'cancelled')).length,
      complete: requests.filter((r) => matchesFilter(r, 'complete')).length,
    }),
    [requests],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...requests]
      .filter((r) => matchesFilter(r, filter))
      .filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.clientName.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q),
      )
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [requests, filter, search]);

  const selectedRequest = selectedId ? requests.find((r) => r.id === selectedId) ?? null : null;
  const { showDetailOnly } = useSplitListDetail(selectedId, 'page');

  useEffect(() => {
    if (formFactor === 'mobile') return;
    if (filtered.length === 0) {
      if (selectedId) setSelectedId(null);
      return;
    }
    const stillVisible = selectedId ? filtered.some((r) => r.id === selectedId) : false;
    if (!stillVisible) setSelectedId(filtered[0].id);
  }, [filter, filtered, selectedId, formFactor]);

  const createForm =
    canManageJobs && onCreateJob ? (
      <StaffCreateJobForm
        clients={clients}
        guards={guards}
        requests={requests}
        feeConfig={feeConfig}
        feeSchedules={feeSchedules}
        onCreate={onCreateJob}
        onCreated={(jobId) => setSelectedId(jobId)}
      />
    ) : null;

  function renderJobDetail(req: SecurityRequest, onBack?: () => void) {
    return (
      <StaffJobDetailPanel
        req={req}
        guards={guards}
        canEditJobListing={canEditJobListing}
        onApproveRequest={onApproveRequest}
        onDenyRequest={onDenyRequest}
        onEditJobListing={onEditJobListing}
        onApproveGuardApplication={onApproveGuardApplication}
        onDenyGuardApplication={onDenyGuardApplication}
        onApproveScheduleChange={onApproveScheduleChange}
        onRejectScheduleChange={onRejectScheduleChange}
        onApproveScheduleChangeBilling={onApproveScheduleChangeBilling}
        onBack={onBack}
        staffRole={staffRole}
      />
    );
  }

  const jobColumns: GuardrTableColumn<SecurityRequest>[] = [
    {
      id: 'job',
      header: 'Job',
      grow: true,
      sortValue: (req) => req.title.toLowerCase(),
      render: (req) => (
        <>
          <p className="uber-workbench-table-primary">{req.title}</p>
          <p className="uber-workbench-table-secondary">{req.clientName}</p>
        </>
      ),
    },
    {
      id: 'schedule',
      header: 'Schedule',
      sortValue: (req) => req.startDate,
      render: (req) => formatShiftRange(req.startDate, req.endDate),
    },
    {
      id: 'guard',
      header: 'Guard',
      hideOnNarrow: true,
      render: (req) => guardMeta(req, guards),
    },
    {
      id: 'rate',
      header: 'Rate',
      numeric: true,
      align: 'right',
      sortValue: (req) => req.hourlyRate,
      render: (req) => `$${req.hourlyRate}/hr`,
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (req) => req.status,
      render: (req) => (
        <StatusChip tone={jobStatusTone(req.status)}>{jobStatusLabel(req.status)}</StatusChip>
      ),
    },
  ];

  const toolbar = !showDetailOnly ? (
    <>
      <div className="staff-ops-cta-stack">{createForm}</div>
      <WfSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search client, location, or title"
        className="max-w-md"
      />
      <StaffListFilterTabs
        aria-label="Job pipeline status"
        activeId={filter}
        onChange={(id) => setFilter(id as JobsFilter)}
        tabs={FILTER_OPTIONS.map(({ id, label }) => ({ id, label, count: tallies[id] }))}
      />
    </>
  ) : null;

  if (formFactor === 'desktop') {
    return (
      <StaffOpsPageShell toolbar={toolbar} className="staff-roster-panel" data-tour="staff-jobs">
        <WorkbenchSplit
          list={
            filtered.length === 0 ? (
              <WorkbenchEmpty
                icon={search ? Search : Briefcase}
                message={search ? 'No matching jobs' : 'No jobs yet'}
              />
            ) : (
              <GuardrDataTable
                columns={jobColumns}
                rows={filtered}
                rowKey={(req) => req.id}
                selectedKey={selectedId ?? undefined}
                onRowClick={(req) => setSelectedId(req.id)}
                caption="Jobs"
                cardLayout={{ title: 'job', subtitle: 'schedule', trailing: 'status' }}
              />
            )
          }
          detail={
            selectedRequest ? (
              renderJobDetail(selectedRequest)
            ) : (
              <WorkbenchEmpty icon={Clock} message="Select a job to review details and actions" variant="detail" />
            )
          }
        />
      </StaffOpsPageShell>
    );
  }

  return (
    <StaffOpsPageShell toolbar={toolbar} className="staff-roster-panel" data-tour="staff-jobs">
      {filtered.length === 0 ? (
        <div className="app-empty-state app-empty-state--dashed">
          <div className="app-empty-state-icon">
            <Briefcase className="w-5 h-5" />
          </div>
          <p className="app-empty-state-title">{search ? 'No matching jobs' : 'No jobs yet'}</p>
          <p className="app-empty-state-body">
            {search
              ? `No jobs match "${search}". Try adjusting your search or filters.`
              : 'Jobs will appear here once clients post coverage requests.'}
          </p>
        </div>
      ) : (
        <ListDetailLayout
          items={filtered}
          selectedId={selectedId}
          onSelectId={setSelectedId}
          getItemId={(req) => req.id}
          listScrollClassName="max-h-[75vh] overflow-y-auto pr-1"
          mobilePresentation="page"
          autoSelectFirst={formFactor === 'tablet'}
          renderItem={(req, isActive, onSelect) => (
            <WfListCard
              avatar={
                <span className="staff-overview-list-row-icon" aria-hidden>
                  <Briefcase size={18} />
                </span>
              }
              title={req.title}
              subtitle={req.clientName}
              meta={
                <div className="flex flex-col items-start gap-1.5 w-full">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusChip tone={jobStatusTone(req.status)} size="small">
                      {jobStatusLabel(req.status)}
                    </StatusChip>
                    {hasPendingScheduleChange(req) && (
                      <StatusChip tone="warning" size="small">
                        {req.scheduleChangeStatus === 'pending_staff_billing'
                          ? 'Confirm billing'
                          : 'Schedule change'}
                      </StatusChip>
                    )}
                  </div>
                  <span className="text-[11px] text-brand-text-muted">
                    {formatShiftRange(req.startDate, req.endDate)} · {guardMeta(req, guards)}
                  </span>
                  <span className="text-[11px] text-brand-text-muted">{req.location}</span>
                </div>
              }
              onClick={onSelect}
              className={isActive ? 'app-item-card-selected' : ''}
            />
          )}
          renderDetail={(req, options) => renderJobDetail(req, options?.onBack)}
        />
      )}
    </StaffOpsPageShell>
  );
}
