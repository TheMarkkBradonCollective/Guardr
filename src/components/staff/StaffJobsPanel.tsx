import React, { useMemo, useState } from 'react';
import { Client, SecurityGuard, SecurityRequest } from '../../types';
import { formatDuration, formatShiftRange } from '../../lib/dates';
import { JOB_STATUS_LABELS } from '../../lib/jobStatus';
import { guardMeetsJobRequirements, rankApplicantGuards } from '../../lib/jobApplications';
import { LIVE_JOB_STATUS_LABEL, getLiveJobStatus } from '../../lib/staffOps';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { useDevice } from '../../lib/platform';
import { JobBillingSummaryFromRequest } from '../jobs/JobBillingSummary';
import { JobListingProfile } from '../jobs/JobListingProfile';
import { JobListCard } from '../jobs/JobListCard';
import { AppItemCardStack } from '../ui/app/AppPrimitives';
import { WfBadge, WfListCard, WfSearchBar } from '../ui/wireframe';
import { ArrowLeft, Loader2, UserPlus, X } from 'lucide-react';
import { StaffCreateJobForm } from './StaffCreateJobForm';
import type { StaffCreateJobInput } from './StaffCreateJobForm';

type JobsFilter = 'all' | 'open' | 'active' | 'done';

interface StaffJobsPanelProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  clients?: Client[];
  canManageJobs?: boolean;
  onApproveRequest: (id: string) => void;
  onDenyRequest: (id: string) => void;
  onCreateJob?: (input: StaffCreateJobInput) => Promise<string | void>;
  onAssignGuard?: (requestId: string, guardId: string) => Promise<void>;
  onApproveGuardApplication?: (requestId: string, guardId: string) => void | Promise<void>;
  initialSelectedId?: string | null;
}

function matchesFilter(req: SecurityRequest, filter: JobsFilter): boolean {
  switch (filter) {
    case 'open':
      return req.status === 'open' || req.status === 'pending-review';
    case 'active':
      return req.status === 'accepted' || req.status === 'in-progress';
    case 'done':
      return req.status === 'completed' || req.status === 'closed';
    default:
      return true;
  }
}

function statusBadgeTone(status: SecurityRequest['status']): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'open':
    case 'accepted':
      return 'primary';
    case 'pending-review':
      return 'warning';
    case 'in-progress':
      return 'success';
    case 'completed':
      return 'success';
    case 'closed':
      return 'default';
    default:
      return 'default';
  }
}

function JobDetailPanel({
  req,
  guards,
  canManageJobs,
  onApproveRequest,
  onDenyRequest,
  onAssignGuard,
  onApproveGuardApplication,
  onBack,
}: {
  req: SecurityRequest;
  guards: SecurityGuard[];
  canManageJobs?: boolean;
  onApproveRequest: (id: string) => void;
  onDenyRequest: (id: string) => void;
  onAssignGuard?: (requestId: string, guardId: string) => Promise<void>;
  onApproveGuardApplication?: (requestId: string, guardId: string) => void | Promise<void>;
  onBack?: () => void;
}) {
  const [assignGuardId, setAssignGuardId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const jobStatus = getLiveJobStatus(req);
  const statusCfg = LIVE_JOB_STATUS_LABEL[jobStatus];
  const assigned = guards.find((g) => g.id === req.assignedGuardId);
  const canAssign =
    canManageJobs &&
    onAssignGuard &&
    !req.assignedGuardId &&
    (req.status === 'open' || req.status === 'pending-review');
  const assignableGuards = useMemo(
    () =>
      guards
        .filter((g) => !g.isStaff && (g.userStatus || 'active') === 'active')
        .sort((a, b) => a.name.localeCompare(b.name)),
    [guards]
  );
  const rankedApplicants = useMemo(
    () => (req.status === 'open' && !req.assignedGuardId ? rankApplicantGuards(req, guards) : []),
    [req, guards]
  );

  const handleAssign = async () => {
    if (!assignGuardId || !onAssignGuard) return;
    setAssigning(true);
    try {
      await onAssignGuard(req.id, assignGuardId);
      setAssignGuardId('');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="staff-detail-pane h-full space-y-4">
      {onBack && (
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm text-brand-primary">
          <ArrowLeft className="w-4 h-4" />
          Back to jobs
        </button>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <WfBadge tone="primary">{statusCfg.emoji} {statusCfg.label}</WfBadge>
        <WfBadge tone={statusBadgeTone(req.status)}>{JOB_STATUS_LABELS[req.status]}</WfBadge>
        <span className="text-xs text-brand-text-muted">{req.id}</span>
      </div>
      <p className="text-sm">
        Assigned: <strong>{assigned ? assigned.name : 'Unassigned'}</strong>
        {req.guardsNeeded && req.guardsNeeded > 1 ? ` · ${req.guardsNeeded} guards needed` : ''}
      </p>
      <JobListingProfile
        job={req}
        showClientHeader
        payLine={<JobBillingSummaryFromRequest req={req} variant="staff" />}
      />
      {rankedApplicants.length > 0 && onApproveGuardApplication && (
        <div className="pt-2 border-t border-brand-border space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
            Guard applications ({rankedApplicants.length})
          </p>
          <p className="text-xs text-brand-text-muted">
            Review applicants and approve the best fit for this job.
          </p>
          <div className="space-y-2">
            {rankedApplicants.map((guard, index) => {
              const meets = guardMeetsJobRequirements(guard, req);
              return (
                <WfListCard
                  key={guard.id}
                  avatar={<ProfileAvatar src={guard.avatar} name={guard.name} size="xs" />}
                  title={
                    index === 0
                      ? `${guard.name} · Best fit`
                      : guard.name
                  }
                  subtitle={`★ ${guard.rating.toFixed(1)} · ${guard.jobsCompleted} jobs`}
                  meta={
                    <span className={meets ? 'text-emerald-400' : 'text-amber-400'}>
                      {meets ? 'Meets job requirements' : 'Missing required credentials'}
                    </span>
                  }
                  action={
                    <button
                      type="button"
                      onClick={() => onApproveGuardApplication(req.id, guard.id)}
                      disabled={!meets}
                      className="app-button-primary !w-auto !h-8 !px-3 !text-xs shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Approve guard
                    </button>
                  }
                />
              );
            })}
          </div>
        </div>
      )}
      {canAssign && (
        <div className="pt-2 border-t border-brand-border space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">Assign guard</p>
          <div className="flex flex-wrap gap-2">
            <select
              value={assignGuardId}
              onChange={(e) => setAssignGuardId(e.target.value)}
              className="uber-input flex-1 min-w-[12rem] !h-9 !text-sm"
            >
              <option value="">Select guard…</option>
              {assignableGuards.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAssign}
              disabled={!assignGuardId || assigning}
              className="app-button-primary !w-auto !h-9 !px-4 !text-xs gap-1.5"
            >
              {assigning ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
              Assign guard
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-brand-border">
        {req.status === 'pending-review' && (
          <button type="button" onClick={() => onApproveRequest(req.id)} className="app-button-primary !w-auto !h-9 !px-4 !text-xs">
            Approve Job
          </button>
        )}
        {req.status !== 'completed' && req.status !== 'closed' && (
          <button type="button" onClick={() => onDenyRequest(req.id)} className="app-button-outline !w-auto !h-9 !px-4 !text-xs text-red-400 border-red-500/40">
            <X className="w-3 h-3" /> Cancel
          </button>
        )}
      </div>
    </div>
  );
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
  onApproveGuardApplication,
  initialSelectedId = null,
}: StaffJobsPanelProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<JobsFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const { formFactor } = useDevice();
  const splitView = formFactor === 'tablet' || formFactor === 'desktop';

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

  const selected = filtered.find((r) => r.id === selectedId) ?? (splitView ? filtered[0] : null) ?? null;
  const showDetailOnly = Boolean(selected && !splitView);

  const filters: { id: JobsFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'open', label: 'Open' },
    { id: 'active', label: 'Active' },
    { id: 'done', label: 'Done' },
  ];

  function renderJobCard(req: SecurityRequest, isActive: boolean) {
    const assignedGuard = guards.find((g) => g.id === req.assignedGuardId);
    return (
      <JobListCard
        key={req.id}
        job={req}
        subtitle={req.clientName}
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <WfBadge tone={statusBadgeTone(req.status)}>{JOB_STATUS_LABELS[req.status]}</WfBadge>
            <span>
              {assignedGuard
                ? `Guard: ${assignedGuard.name}`
                : req.status === 'open' && req.applicants.length > 0
                  ? `${req.applicants.length} applicant${req.applicants.length === 1 ? '' : 's'}`
                  : 'Unassigned'}
            </span>
          </div>
        }
        onClick={() => setSelectedId(req.id)}
        selected={isActive}
        showStatus={false}
      />
    );
  }

  return (
    <div className="animate-fade-in space-y-4">
      {canManageJobs && onCreateJob && !showDetailOnly && (
        <StaffCreateJobForm
          clients={clients}
          guards={guards}
          onCreate={onCreateJob}
          onCreated={(jobId) => setSelectedId(jobId)}
        />
      )}
      {!showDetailOnly && (
        <>
          <div className="flex flex-wrap gap-2">
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
      )}

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-brand-text-muted py-12">No jobs match your filters.</p>
      ) : showDetailOnly && selected ? (
        <JobDetailPanel
          req={selected}
          guards={guards}
          canManageJobs={canManageJobs}
          onApproveRequest={onApproveRequest}
          onDenyRequest={onDenyRequest}
          onAssignGuard={onAssignGuard}
          onApproveGuardApplication={onApproveGuardApplication}
          onBack={() => setSelectedId(null)}
        />
      ) : splitView ? (
        <div className="tablet-split-panel">
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <AppItemCardStack>
              {filtered.map((req) => renderJobCard(req, selected?.id === req.id))}
            </AppItemCardStack>
          </div>
          {selected && (
            <JobDetailPanel
              req={selected}
              guards={guards}
              canManageJobs={canManageJobs}
              onApproveRequest={onApproveRequest}
              onDenyRequest={onDenyRequest}
              onAssignGuard={onAssignGuard}
              onApproveGuardApplication={onApproveGuardApplication}
            />
          )}
        </div>
      ) : (
        <AppItemCardStack>
          {filtered.map((req) => renderJobCard(req, false))}
        </AppItemCardStack>
      )}
    </div>
  );
}
