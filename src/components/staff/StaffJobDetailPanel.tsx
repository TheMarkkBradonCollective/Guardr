import { useEffect, useMemo, useState } from 'react';
import { PlatformRole, SecurityGuard, SecurityRequest } from '../../types';
import { JOB_STATUS_LABELS } from '../../lib/jobStatus';
import { jobStatusBadgeTone } from '../../lib/jobStatusBadges';
import { guardMeetsJobRequirements, rankApplicantGuards } from '../../lib/jobApplications';
import { isAwaitingClientGuardApproval } from '../../lib/guardAssignment';
import { isJobLocationCoordsMissing } from '../../lib/jobLocation';
import { LIVE_JOB_STATUS_LABEL, getLiveJobStatus } from '../../lib/staffOps';
import { isGuardAccountActive } from '../../lib/accountStatus';
import {
  canStaffEditJobTitleAndLocation,
  isJobScheduleLocked,
  canStaffReschedulePaidSchedule,
} from '../../lib/jobEditRules';
import { canStaffUploadSelfAuditPhotos, isNoSelfAuditFlagged } from '../../lib/selfAuditPhotos';
import { canStaffAddSpotCheck, hasSpotChecks, isNoSpotCheckFlagged } from '../../lib/spotChecks';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { EditRequestSheet } from '../jobs/EditRequestSheet';
import { AppFormSheet } from '../ui/app/AppFormSheet';
import { JobBillingSummaryFromRequest } from '../jobs/JobBillingSummary';
import { JobListingProfile } from '../jobs/JobListingProfile';
import { JobSelfAuditPhotosSection } from '../jobs/JobSelfAuditPhotosSection';
import { JobSpotCheckPhotosSection } from '../jobs/JobSpotCheckPhotosSection';
import { NoSelfAuditBadge } from '../jobs/NoSelfAuditBadge';
import { NoSpotCheckBadge } from '../jobs/NoSpotCheckBadge';
import { NoMapCoordsBadge } from '../jobs/NoMapCoordsBadge';
import { WfBadge, WfListCard } from '../ui/wireframe';
import { ArrowLeft, Loader2, UserPlus, X } from 'lucide-react';
import { StaffJobActionsBar } from './StaffJobActionsBar';
import { StaffSelfAuditPhotoUpload, type StaffSelfAuditPhotoPayload } from './StaffSelfAuditPhotoUpload';
import { StaffSpotCheckUpload } from './StaffSpotCheckUpload';

export interface StaffJobDetailPanelProps {
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
  /** Map card peek already shows status — hide duplicate header in full body */
  showStatusHeader?: boolean;
}

export function StaffJobDetailPanel({
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
  showStatusHeader = true,
}: StaffJobDetailPanelProps) {
  const [assignGuardId, setAssignGuardId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [editing, setEditing] = useState(false);
  const [auditUploadOpen, setAuditUploadOpen] = useState(() => isNoSelfAuditFlagged(req));
  const [spotCheckOpen, setSpotCheckOpen] = useState(false);
  useEffect(() => setEditing(false), [req.id]);
  useEffect(() => setSpotCheckOpen(false), [req.id]);
  useEffect(() => {
    if (isNoSelfAuditFlagged(req)) setAuditUploadOpen(true);
  }, [req.id, req.checkInAudit?.selfAuditSkipped, req.checkInAudit?.selfieUpload, req.checkInAudit?.uniformPhoto, req.checkInAudit?.shoesPhoto]);
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
  const requestStatusLabel = JOB_STATUS_LABELS[req.status];
  const showLiveBadge = jobStatus === 'incident-flagged' || statusCfg.label !== requestStatusLabel;
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
    <div className="staff-detail-pane space-y-4">
      {onBack && (
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm text-brand-primary">
          <ArrowLeft className="w-4 h-4" />
          Back to jobs
        </button>
      )}
      {showStatusHeader && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {showLiveBadge && (
              <WfBadge tone="primary">
                {statusCfg.emoji} {statusCfg.label}
              </WfBadge>
            )}
            <WfBadge tone={jobStatusBadgeTone(req.status)}>{requestStatusLabel}</WfBadge>
            {isNoSelfAuditFlagged(req) && <NoSelfAuditBadge />}
            {isNoSpotCheckFlagged(req) && <NoSpotCheckBadge />}
            {isJobLocationCoordsMissing(req) && <NoMapCoordsBadge />}
            <span className="text-xs text-brand-text-muted">{req.id}</span>
          </div>
          <p className="text-sm">
            Guard: <strong>{assigned ? assigned.name : 'No guard yet'}</strong>
            {req.guardsNeeded && req.guardsNeeded > 1 ? ` · ${req.guardsNeeded} guards needed` : ''}
          </p>
        </>
      )}
      {!editing && (
        <JobListingProfile
          job={req}
          showClientHeader
          showBadges={false}
          payLine={<JobBillingSummaryFromRequest req={req} variant="staff" />}
          operationalDetails={req.operationalDetails}
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
        paidReschedule={canStaffReschedulePaidSchedule(req)}
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
                  title={index === 0 ? `${guard.name} · Best fit` : guard.name}
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
      >
        {canUploadAudit && onUploadSelfAuditPhotos && (
          <StaffSelfAuditPhotoUpload request={req} onUpload={onUploadSelfAuditPhotos} />
        )}
      </AppFormSheet>
      <AppFormSheet
        open={spotCheckOpen && canAddSpotCheck}
        onClose={() => setSpotCheckOpen(false)}
        title="Spot check photo"
      >
        {canAddSpotCheck && onUploadSpotCheck && (
          <StaffSpotCheckUpload request={req} onUpload={onUploadSpotCheck} />
        )}
      </AppFormSheet>
    </div>
  );
}
