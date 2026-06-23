import { useEffect, useMemo, useState } from 'react';
import { isGuardAccountActive } from '../../lib/accountStatus';
import { Client, PlatformRole, SecurityGuard, SecurityRequest } from '../../types';
import { formatDuration, formatShiftRange } from '../../lib/dates';
import { JOB_STATUS_LABELS } from '../../lib/jobStatus';
import { guardMeetsJobRequirements, rankApplicantGuards } from '../../lib/jobApplications';
import { isAwaitingClientGuardApproval } from '../../lib/guardAssignment';
import { LIVE_JOB_STATUS_LABEL, getLiveJobStatus } from '../../lib/staffOps';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { useDevice } from '../../lib/platform';
import { canStaffEditJobTitleAndLocation, isJobScheduleLocked } from '../../lib/jobEditRules';
import { EditRequestSheet } from '../jobs/EditRequestSheet';
import { AppFormSheet } from '../ui/app/AppFormSheet';
import { JobBillingSummaryFromRequest } from '../jobs/JobBillingSummary';
import { JobListingProfile } from '../jobs/JobListingProfile';
import { JobListCard } from '../jobs/JobListCard';
import { AppItemCardStack } from '../ui/app/AppPrimitives';
import { WfBadge, WfListCard, WfSearchBar } from '../ui/wireframe';
import { ArrowLeft, Loader2, UserPlus, X } from 'lucide-react';
import { canStaffUploadSelfAuditPhotos, isNoSelfAuditFlagged } from '../../lib/selfAuditPhotos';
import { JobSelfAuditPhotosSection } from '../jobs/JobSelfAuditPhotosSection';
import { JobSpotCheckPhotosSection } from '../jobs/JobSpotCheckPhotosSection';
import { NoSelfAuditBadge } from '../jobs/NoSelfAuditBadge';
import { StaffCreateJobForm } from './StaffCreateJobForm';
import type { StaffCreateJobInput } from './StaffCreateJobForm';
import { StaffJobActionsBar } from './StaffJobActionsBar';
import { StaffSelfAuditPhotoUpload, type StaffSelfAuditPhotoPayload } from './StaffSelfAuditPhotoUpload';
import { StaffSpotCheckUpload } from './StaffSpotCheckUpload';
import { canStaffAddSpotCheck, hasSpotChecks, isNoSpotCheckFlagged } from '../../lib/spotChecks';
import { NoSpotCheckBadge } from '../jobs/NoSpotCheckBadge';

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
  onUploadSelfAuditPhotos?: (requestId: string, photos: StaffSelfAuditPhotoPayload) => void | Promise<void>;
  canUploadSelfAuditPhotos?: boolean;
  onUploadSpotCheck?: (requestId: string, imageUrl: string) => void | Promise<void>;
  canUploadSpotCheck?: boolean;
  onEditJobListing?: (requestId: string, updates: Partial<SecurityRequest>) => void | Promise<void>;
  canEditJobListing?: boolean;
  onApproveGuardApplication?: (requestId: string, guardId: string) => void | Promise<void>;
  onDenyGuardApplication?: (requestId: string, guardId: string) => void | Promise<void>;
  selectedId?: string | null;
  onSelectedIdChange?: (id: string | null) => void;
  initialSelectedId?: string | null;
  staffRole?: PlatformRole;
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
  canEditJobListing,
  onApproveRequest,
  onDenyRequest,
  onAssignGuard,
  onUploadSelfAuditPhotos,
  canUploadSelfAuditPhotos,
  onUploadSpotCheck,
  canUploadSpotCheck,
  onEditJobListing,
  onApproveGuardApplication,
  onDenyGuardApplication,
  onBack,
  staffRole,
}: {
  req: SecurityRequest;
  guards: SecurityGuard[];
  canManageJobs?: boolean;
  canUploadSelfAuditPhotos?: boolean;
  canUploadSpotCheck?: boolean;
  canEditJobListing?: boolean;
  staffRole?: PlatformRole;
  onApproveRequest: (id: string) => void;
  onDenyRequest: (id: string) => void;
  onAssignGuard?: (requestId: string, guardId: string) => Promise<void>;
  onUploadSelfAuditPhotos?: (requestId: string, photos: StaffSelfAuditPhotoPayload) => void | Promise<void>;
  onUploadSpotCheck?: (requestId: string, imageUrl: string) => void | Promise<void>;
  onEditJobListing?: (requestId: string, updates: Partial<SecurityRequest>) => void | Promise<void>;
  onApproveGuardApplication?: (requestId: string, guardId: string) => void | Promise<void>;
  onDenyGuardApplication?: (requestId: string, guardId: string) => void | Promise<void>;
  onBack?: () => void;
}) {
  const [assignGuardId, setAssignGuardId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [editing, setEditing] = useState(false);
  const [auditUploadOpen, setAuditUploadOpen] = useState(() => isNoSelfAuditFlagged(req));
  const [spotCheckOpen, setSpotCheckOpen] = useState(() => isNoSpotCheckFlagged(req));
  useEffect(() => setEditing(false), [req.id]);
  useEffect(() => {
    if (isNoSelfAuditFlagged(req)) setAuditUploadOpen(true);
  }, [req.id, req.checkInAudit?.selfAuditSkipped, req.checkInAudit?.selfieUpload, req.checkInAudit?.uniformPhoto, req.checkInAudit?.shoesPhoto]);
  useEffect(() => {
    if (isNoSpotCheckFlagged(req)) setSpotCheckOpen(true);
  }, [req.id, req.status, req.spotChecks?.length, req.checkInAudit?.checkedAt]);
  const scheduleLocked = isJobScheduleLocked(req);
  const showEdit =
    canEditJobListing && onEditJobListing && staffRole && canStaffEditJobTitleAndLocation(req, staffRole);
  const canUploadAudit =
    !!canUploadSelfAuditPhotos &&
    !!onUploadSelfAuditPhotos &&
    canStaffUploadSelfAuditPhotos(req, staffRole);
  const canAddSpotCheck =
    !!canUploadSpotCheck && !!onUploadSpotCheck && canStaffAddSpotCheck(req);
  const jobStatus = getLiveJobStatus(req);
  const statusCfg = LIVE_JOB_STATUS_LABEL[jobStatus];
  const workflowLabel = JOB_STATUS_LABELS[req.status];
  const showLiveBadge = jobStatus === 'incident-flagged' || statusCfg.label !== workflowLabel;
  const assigned = guards.find((g) => g.id === req.assignedGuardId);
  const pendingGuard = req.pendingGuardId ? guards.find((g) => g.id === req.pendingGuardId) : undefined;
  const awaitingClientGuard = isAwaitingClientGuardApproval(req);
  const canAssign =
    canManageJobs &&
    onAssignGuard &&
    !req.assignedGuardId &&
    !awaitingClientGuard &&
    (req.status === 'open' || req.status === 'pending-review');
  const assignableGuards = useMemo(
    () =>
      guards
        .filter((g) => isGuardAccountActive(g))
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
        {showLiveBadge && (
          <WfBadge tone="primary">{statusCfg.emoji} {statusCfg.label}</WfBadge>
        )}
        <WfBadge tone={statusBadgeTone(req.status)}>{workflowLabel}</WfBadge>
        {isNoSelfAuditFlagged(req) && <NoSelfAuditBadge />}
        {isNoSpotCheckFlagged(req) && <NoSpotCheckBadge />}
        <span className="text-xs text-brand-text-muted">{req.id}</span>
      </div>
      <p className="text-sm">
        Guard: <strong>{assigned ? assigned.name : 'No guard yet'}</strong>
        {req.guardsNeeded && req.guardsNeeded > 1 ? ` · ${req.guardsNeeded} guards needed` : ''}
      </p>
      {!editing && (
        <JobListingProfile
          job={req}
          showClientHeader
          showBadges={false}
          payLine={<JobBillingSummaryFromRequest req={req} variant="staff" />}
        />
      )}
      {scheduleLocked && !editing && (
        <p className="text-xs text-brand-text-muted border-t border-brand-border pt-3">
          Schedule is locked after payment. Title and location can still be updated.
        </p>
      )}
      {!editing && !auditUploadOpen && <JobSelfAuditPhotosSection request={req} />}
      {!editing && !spotCheckOpen && (hasSpotChecks(req) || isNoSpotCheckFlagged(req)) && (
        <JobSpotCheckPhotosSection request={req} />
      )}
      <StaffJobActionsBar
        request={req}
        showEdit={showEdit}
        editing={editing}
        onStartEdit={() => setEditing(true)}
        canUploadAudit={canUploadAudit}
        auditUploadOpen={auditUploadOpen}
        onToggleAuditUpload={() => setAuditUploadOpen((open) => !open)}
        canUploadSpotCheck={canAddSpotCheck}
        spotCheckOpen={spotCheckOpen}
        onToggleSpotCheck={() => setSpotCheckOpen((open) => !open)}
      />
      <EditRequestSheet
        open={editing && showEdit}
        request={req}
        scheduleLocked={scheduleLocked}
        onSave={async (requestId, updates) => {
          await onEditJobListing!(requestId, updates);
          setEditing(false);
        }}
        onClose={() => setEditing(false)}
      />
      {rankedApplicants.length > 0 && onApproveGuardApplication && (
        <div className="pt-2 border-t border-brand-border space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
            Guard applications ({rankedApplicants.length})
          </p>
          {awaitingClientGuard && pendingGuard ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
              <p className="text-sm font-medium text-amber-300">Awaiting client approval</p>
              <p className="text-xs text-brand-text-muted mt-1">
                {pendingGuard.name} was sent to {req.clientName} for confirmation.
              </p>
            </div>
          ) : (
            <p className="text-xs text-brand-text-muted">
              Review applicants — send the best fit to the client for approval.
            </p>
          )}
          <div className="space-y-2">
            {rankedApplicants.map((guard, index) => {
              const meets = guardMeetsJobRequirements(guard, req);
              const isPending = req.pendingGuardId === guard.id;
              const anotherPending = !!req.pendingGuardId && !isPending;
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
                    <span className={isPending ? 'text-amber-400' : meets ? 'text-emerald-400' : 'text-amber-400'}>
                      {isPending
                        ? 'Awaiting client approval'
                        : meets
                          ? 'Meets job requirements'
                          : 'Missing required credentials'}
                    </span>
                  }
                  action={
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {isPending ? (
                        onDenyGuardApplication && (
                          <button
                            type="button"
                            onClick={() => onDenyGuardApplication(req.id, guard.id)}
                            className="app-button-outline app-btn-sm text-red-400 border-red-500/40"
                          >
                            Withdraw
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={() => onApproveGuardApplication(req.id, guard.id)}
                          disabled={!meets || anotherPending}
                          className="app-button-primary app-btn-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Send to client
                        </button>
                      )}
                      {!isPending && onDenyGuardApplication && (
                        <button
                          type="button"
                          onClick={() => onDenyGuardApplication(req.id, guard.id)}
                          className="app-button-outline app-btn-sm text-red-400 border-red-500/40"
                        >
                          Decline
                        </button>
                      )}
                    </div>
                  }
                />
              );
            })}
          </div>
        </div>
      )}
      {canAssign && (
        <div className="pt-2 border-t border-brand-border space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">Select guard</p>
          <div className="app-action-row--equal">
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
              className="app-button-primary app-btn-sm gap-1.5"
            >
              {assigning ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
              Select guard
            </button>
          </div>
        </div>
      )}
      <div className="app-action-row--equal pt-2 border-t border-brand-border">
        {req.status === 'pending-review' && (
          <button type="button" onClick={() => onApproveRequest(req.id)} className="app-button-primary app-btn-sm">
            Approve Job
          </button>
        )}
        {req.status !== 'completed' && req.status !== 'closed' && (
          <button type="button" onClick={() => onDenyRequest(req.id)} className="app-button-outline app-btn-sm text-red-400 border-red-500/40">
            <X className="w-3 h-3" /> Cancel
          </button>
        )}
      </div>
      <AppFormSheet
        open={auditUploadOpen && canUploadAudit}
        onClose={() => setAuditUploadOpen(false)}
        title="Upload self-audit photos"
        subtitle="Add uniform, shoes, and selfie photos for this shift."
      >
        {canUploadAudit && onUploadSelfAuditPhotos && (
          <StaffSelfAuditPhotoUpload request={req} onUpload={onUploadSelfAuditPhotos} />
        )}
      </AppFormSheet>
      <AppFormSheet
        open={spotCheckOpen && canAddSpotCheck}
        onClose={() => setSpotCheckOpen(false)}
        title="Spot check photo"
        subtitle="Upload a spot-check image for this job."
      >
        {canAddSpotCheck && onUploadSpotCheck && (
          <StaffSpotCheckUpload request={req} onUpload={onUploadSpotCheck} />
        )}
      </AppFormSheet>
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
  onUploadSelfAuditPhotos,
  canUploadSelfAuditPhotos = false,
  onUploadSpotCheck,
  canUploadSpotCheck = false,
  onEditJobListing,
  canEditJobListing = false,
  onApproveGuardApplication,
  onDenyGuardApplication,
  selectedId: controlledSelectedId,
  onSelectedIdChange,
  initialSelectedId = null,
  staffRole,
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
                  : 'No guard yet'}
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
          requests={requests}
          onCreate={onCreateJob}
          onCreated={(jobId) => setSelectedId(jobId)}
        />
      )}
      {!showDetailOnly && (
        <>
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
      )}

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-brand-text-muted py-12">No jobs match your filters.</p>
      ) : showDetailOnly && selected ? (
        <JobDetailPanel
          req={selected}
          guards={guards}
          canManageJobs={canManageJobs}
          canUploadSelfAuditPhotos={canUploadSelfAuditPhotos}
          canEditJobListing={canEditJobListing}
          onApproveRequest={onApproveRequest}
          onDenyRequest={onDenyRequest}
          onAssignGuard={onAssignGuard}
          onUploadSelfAuditPhotos={onUploadSelfAuditPhotos}
          onUploadSpotCheck={onUploadSpotCheck}
          canUploadSpotCheck={canUploadSpotCheck}
          onEditJobListing={onEditJobListing}
          onApproveGuardApplication={onApproveGuardApplication}
          onDenyGuardApplication={onDenyGuardApplication}
          onBack={() => setSelectedId(null)}
          staffRole={staffRole}
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
              canUploadSelfAuditPhotos={canUploadSelfAuditPhotos}
              canEditJobListing={canEditJobListing}
              onApproveRequest={onApproveRequest}
              onDenyRequest={onDenyRequest}
              onAssignGuard={onAssignGuard}
              onUploadSelfAuditPhotos={onUploadSelfAuditPhotos}
              onUploadSpotCheck={onUploadSpotCheck}
              canUploadSpotCheck={canUploadSpotCheck}
              onEditJobListing={onEditJobListing}
              onApproveGuardApplication={onApproveGuardApplication}
          onDenyGuardApplication={onDenyGuardApplication}
              staffRole={staffRole}
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
