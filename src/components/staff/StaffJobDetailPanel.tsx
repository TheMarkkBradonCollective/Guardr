import { useEffect, useMemo, useState } from 'react';
import { PlatformRole, SecurityGuard, SecurityRequest } from '../../types';
import { JobStatusBadge } from '../jobs/JobStatusBadge';
import { rankApplicantGuards } from '../../lib/jobApplications';
import { rankGuardsForJob } from '../../lib/guardQualificationMatching';
import { GuardMatchScoreRow } from '../guard/GuardMatchScoreRow';
import { isAwaitingClientGuardApproval } from '../../lib/guardAssignment';
import { isJobLocationCoordsMissing } from '../../lib/jobLocation';
import {
  canStaffEditJobTitleAndLocation,
  canStaffEditJobMapCoordinates,
  isJobScheduleLocked,
  canStaffReschedulePaidSchedule,
} from '../../lib/jobEditRules';
import { isNoSelfAuditFlagged } from '../../lib/selfAuditPhotos';
import { EditRequestSheet } from '../jobs/EditRequestSheet';
import { JobBillingSummaryFromRequest } from '../jobs/JobBillingSummary';
import { JobListingProfile } from '../jobs/JobListingProfile';
import { JobSelfAuditPhotosSection } from '../jobs/JobSelfAuditPhotosSection';
import { NoSelfAuditBadge } from '../jobs/NoSelfAuditBadge';
import { NoMapCoordsBadge } from '../jobs/NoMapCoordsBadge';
import { ArrowLeft, X } from 'lucide-react';
import { StaffJobActionsBar } from './StaffJobActionsBar';

export interface StaffJobDetailPanelProps {
  req: SecurityRequest;
  guards: SecurityGuard[];
  canEditJobListing?: boolean;
  staffRole?: PlatformRole;
  onApproveRequest: (id: string) => void;
  onDenyRequest: (id: string) => void;
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
  canEditJobListing,
  onApproveRequest,
  onDenyRequest,
  onEditJobListing,
  onApproveGuardApplication,
  onDenyGuardApplication,
  onBack,
  staffRole,
  showStatusHeader = true,
}: StaffJobDetailPanelProps) {
  const [editing, setEditing] = useState(false);
  useEffect(() => setEditing(false), [req.id]);
  const scheduleLocked = isJobScheduleLocked(req);
  const coordsMissing = isJobLocationCoordsMissing(req);
  const showEditListing =
    canEditJobListing && onEditJobListing && staffRole && canStaffEditJobTitleAndLocation(req, staffRole);
  const showEditCoords =
    onEditJobListing && staffRole && canStaffEditJobMapCoordinates(req, staffRole) && coordsMissing;
  const showEdit = showEditListing || showEditCoords;
  const assigned = guards.find((g) => g.id === req.assignedGuardId);
  const pendingGuard = req.pendingGuardId ? guards.find((g) => g.id === req.pendingGuardId) : undefined;
  const awaitingClientGuard = isAwaitingClientGuardApproval(req);
  const rankedApplicants = useMemo(
    () => (req.status === 'open' && !req.assignedGuardId ? rankApplicantGuards(req, guards) : []),
    [req, guards]
  );
  const rankedMatchScores = useMemo(
    () =>
      req.status === 'open' && !req.assignedGuardId
        ? rankGuardsForJob(req, guards, { applicantsOnly: true })
        : [],
    [req, guards]
  );

  return (
    <div className="staff-detail-pane space-y-4">
      {onBack && (
        <button type="button" onClick={onBack} className="app-subscreen-back">
          <ArrowLeft className="w-4 h-4" />
          Back to jobs
        </button>
      )}
      {showStatusHeader && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <JobStatusBadge job={req} variant="staff" />
            {isNoSelfAuditFlagged(req) && <NoSelfAuditBadge />}
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
      {!editing && <JobSelfAuditPhotosSection request={req} />}
      <StaffJobActionsBar
        request={req}
        showEdit={!!showEdit}
        editing={editing}
        onStartEdit={() => setEditing(true)}
      />
      <EditRequestSheet
        open={editing && !!showEdit}
        request={req}
        scheduleLocked={scheduleLocked}
        paidReschedule={canStaffReschedulePaidSchedule(req)}
        onSave={async (requestId, updates) => {
          await onEditJobListing!(requestId, updates);
          setEditing(false);
        }}
        onClose={() => setEditing(false)}
      />
      {rankedApplicants.length > 0 && (
        <div className="pt-2 border-t border-brand-border space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
            Guard applications ({rankedApplicants.length})
          </p>
          {awaitingClientGuard && pendingGuard ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
              <p className="text-sm font-medium text-amber-300">Awaiting client approval</p>
              <p className="text-xs text-brand-text-muted mt-1">
                {pendingGuard.name} is waiting for {req.clientName} to confirm.
              </p>
            </div>
          ) : (
            <p className="text-xs text-brand-text-muted">
              Ranked for reference — clients approve guards directly. Staff no longer picks applicants.
            </p>
          )}
          <div className="space-y-2">
            {rankedMatchScores.map((score, index) => (
              <GuardMatchScoreRow key={score.guard.id} score={score} rank={index + 1} />
            ))}
          </div>
        </div>
      )}
      <div className="app-action-row--equal pt-2 border-t border-brand-border">
        {req.status === 'pending-review' && (
          <button
            type="button"
            onClick={() => onApproveRequest(req.id)}
            disabled={coordsMissing}
            title={coordsMissing ? 'Add map coordinates before approving' : undefined}
            className="app-button-primary app-btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Approve Job
          </button>
        )}
        {req.status !== 'completed' && req.status !== 'closed' && (
          <button type="button" onClick={() => onDenyRequest(req.id)} className="app-button-outline app-btn-sm text-red-400 border-red-500/40">
            <X className="w-3 h-3" /> Cancel
          </button>
        )}
      </div>
    </div>
  );
}
