import { useEffect, useMemo, useState } from 'react';
import type { PlatformFeeConfig } from '../../lib/payments';
import { Client, PlatformRole, SecurityGuard, SecurityRequest } from '../../types';
import { JobStatusBadge } from '../jobs/JobStatusBadge';
import { ListDetailLayout, useSplitListDetail } from '../ui/app/ListDetailLayout';
import { JobListCard } from '../jobs/JobListCard';
import { WfBadge, WfSearchBar } from '../ui/wireframe';
import { StaffCreateJobForm } from './StaffCreateJobForm';
import type { StaffCreateJobInput } from './StaffCreateJobForm';
import { StaffJobDetailPanel } from './StaffJobDetailPanel';
import { StaffOpsPageShell } from './StaffOpsPageShell';
import { Briefcase, Search } from 'lucide-react';

type JobsFilter = 'all' | 'open' | 'active' | 'complete';

interface StaffJobsPanelProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  clients?: Client[];
  canManageJobs?: boolean;
  onApproveRequest: (id: string) => void;
  onDenyRequest: (id: string) => void;
  onCreateJob?: (input: StaffCreateJobInput) => Promise<string | void>;
  onAssignGuard?: (requestId: string, guardId: string) => Promise<void>;
  onEditJobListing?: (requestId: string, updates: Partial<SecurityRequest>) => void | Promise<void>;
  canEditJobListing?: boolean;
  onApproveGuardApplication?: (requestId: string, guardId: string) => void | Promise<void>;
  onDenyGuardApplication?: (requestId: string, guardId: string) => void | Promise<void>;
  selectedId?: string | null;
  onSelectedIdChange?: (id: string | null) => void;
  initialSelectedId?: string | null;
  staffRole?: PlatformRole;
  feeConfig: PlatformFeeConfig;
}

function matchesFilter(req: SecurityRequest, filter: JobsFilter): boolean {
  switch (filter) {
    case 'open':
      return req.status === 'open' || req.status === 'pending-review';
    case 'active':
      return req.status === 'accepted' || req.status === 'in-progress';
    case 'complete':
      return req.status === 'completed' || req.status === 'closed';
    default:
      return true;
  }
}

export function StaffJobsPanel({
  requests,
  guards,
  clients = [],
  canManageJobs = false,
  onApproveRequest,
  onDenyRequest,
  onCreateJob,
  onAssignGuard,
  onEditJobListing,
  canEditJobListing = false,
  onApproveGuardApplication,
  onDenyGuardApplication,
  selectedId: controlledSelectedId,
  onSelectedIdChange,
  initialSelectedId = null,
  staffRole,
  feeConfig,
}: StaffJobsPanelProps) {
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
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...requests]
      .filter((r) => matchesFilter(r, filter))
      .filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.clientName.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q)
      )
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [requests, filter, search]);

  const { showDetailOnly } = useSplitListDetail(selectedId, 'page');

  const filters: { id: JobsFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'open', label: 'Open' },
    { id: 'active', label: 'Active' },
    { id: 'complete', label: 'Complete' },
  ];

  function renderJobDetail(req: SecurityRequest, options?: { onBack?: () => void }) {
    return (
      <StaffJobDetailPanel
        req={req}
        guards={guards}
        canManageJobs={canManageJobs}
        canEditJobListing={canEditJobListing}
        onApproveRequest={onApproveRequest}
        onDenyRequest={onDenyRequest}
        onAssignGuard={onAssignGuard}
        onEditJobListing={onEditJobListing}
        onApproveGuardApplication={onApproveGuardApplication}
        onDenyGuardApplication={onDenyGuardApplication}
        onBack={options?.onBack}
        staffRole={staffRole}
      />
    );
  }

  const toolbar = !showDetailOnly ? (
    <>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        {canManageJobs && onCreateJob && (
          <StaffCreateJobForm
            clients={clients}
            guards={guards}
            requests={requests}
            feeConfig={feeConfig}
            onCreate={onCreateJob}
            onCreated={(jobId) => setSelectedId(jobId)}
          />
        )}
      </div>
      <div className="app-action-row--equal">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === f.id
                ? 'border-brand-primary bg-brand-primary/15 text-brand-primary'
                : 'border-brand-border text-brand-text-muted hover:text-brand-text'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <WfSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search client, location, title..."
        className="max-w-md"
      />
    </>
  ) : null;

  return (
    <StaffOpsPageShell toolbar={toolbar} data-tour="staff-jobs">
      {filtered.length === 0 ? (
        <div className="app-empty-state">
          <div className="app-empty-state-icon">
            {search ? <Search className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
          </div>
          <p className="app-empty-state-title">{search ? 'No matching jobs' : 'No jobs yet'}</p>
          <p className="app-empty-state-body">
            {search ? `No jobs match "${search}". Try adjusting your search or filters.` : 'Jobs will appear here once clients post coverage requests.'}
          </p>
        </div>
      ) : (
        <ListDetailLayout
          items={filtered}
          selectedId={selectedId}
          onSelectId={setSelectedId}
          getItemId={(req) => req.id}
          renderItem={(req, isActive, onSelect) => {
            const assignedGuard = guards.find((g) => g.id === req.assignedGuardId);
            return (
              <JobListCard
                job={req}
                subtitle={req.clientName}
                meta={
                  <div className="flex flex-wrap items-center gap-1.5">
                    <JobStatusBadge job={req} variant="staff" />
                    <span>
                      {assignedGuard
                        ? `Guard: ${assignedGuard.name}`
                        : req.status === 'open' && req.applicants.length > 0
                          ? `${req.applicants.length} applicant${req.applicants.length === 1 ? '' : 's'}`
                          : 'No guard yet'}
                    </span>
                  </div>
                }
                onClick={onSelect}
                selected={isActive}
                showStatus={false}
              />
            );
          }}
          renderDetail={renderJobDetail}
          mobilePresentation="page"
        />
      )}
    </StaffOpsPageShell>
  );
}
