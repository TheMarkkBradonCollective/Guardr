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
import { formatDuration, formatShiftRange } from '../../lib/dates';
import { isNoSelfAuditFlagged } from '../../lib/selfAuditPhotos';
import { EditRequestSheet } from '../jobs/EditRequestSheet';
import { JobBillingSummaryFromRequest } from '../jobs/JobBillingSummary';
import { JobListingProfile } from '../jobs/JobListingProfile';
import { JobSelfAuditPhotosSection } from '../jobs/JobSelfAuditPhotosSection';
import { NoSelfAuditBadge } from '../jobs/NoSelfAuditBadge';
import { NoMapCoordsBadge } from '../jobs/NoMapCoordsBadge';
import { SlideToConfirm } from '../ui/SlideToConfirm';
import { WfBadge } from '../ui/wireframe';
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
  onApproveScheduleChange?: (requestId: string) => void | Promise<void>;
  onRejectScheduleChange?: (requestId: string) => void | Promise<void>;
  onApproveScheduleChangeBilling?: (requestId: string) => void | Promise<void>;
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
  onApproveScheduleChange,
  onRejectScheduleChange,
  onApproveScheduleChangeBilling,
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

  const scheduleChangePending =
    req.scheduleChangeStatus === 'pending_staff' ||
    req.scheduleChangeStatus === 'pending_staff_billing';
  const scheduleChangeBilling = req.scheduleChangeStatus === 'pending_staff_billing';
  const currentRange = formatShiftRange(req.startDate, req.endDate);
  const requestedRange =
    req.pendingStartDate && req.pendingEndDate
      ? formatShiftRange(req.pendingStartDate, req.pendingEndDate)
      : '—';
  const canReviewScheduleChange =
    scheduleChangePending &&
    (scheduleChangeBilling
      ? Boolean(onApproveScheduleChangeBilling)
      : Boolean(onApproveScheduleChange || onRejectScheduleChange));

  return (
    <div className="staff-detail-pane space-y-4">
      {onBack && (
        <div className="app-subscreen-header app-subscreen-header--back-only">
          <button type="button" onClick={onBack} className="app-subscreen-back">
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Back to Jobs
          </button>
        </div>
      )}
      {showStatusHeader && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <JobStatusBadge job={req} variant="staff" />
            {isNoSelfAuditFlagged(req) && <NoSelfAuditBadge />}
            {isJobLocationCoordsMissing(req) && <NoMapCoordsBadge />}
            {scheduleChangePending && (
              <WfBadge tone="warning">
                {scheduleChangeBilling ? 'Confirm billing' : 'Schedule change'}
              </WfBadge>
            )}
            <span className="text-xs text-brand-text-muted">{req.id}</span>
          </div>
          <p className="text-sm">
            Guard: <strong>{assigned ? assigned.name : 'No guard yet'}</strong>
            {req.guardsNeeded && req.guardsNeeded > 1 ? ` · ${req.guardsNeeded} guards needed` : ''}
          </p>
        </>
      )}
      {scheduleChangePending && (
        <section className="staff-detail-section space-y-3 border border-amber-500/30 bg-amber-500/5 rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">
              {scheduleChangeBilling ? 'Confirm schedule billing' : 'Schedule change review'}
            </p>
            {req.scheduleChangeRequestedBy === 'staff' && (
              <WfBadge tone="default">Staff proposed</WfBadge>
            )}
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-brand-text-muted">
              Current: {currentRange}
              {req.durationHours > 0 ? ` · ${formatDuration(req.durationHours)}` : ''}
            </p>
            <p className="font-medium text-brand-primary">
              {scheduleChangeBilling ? 'Approved times' : 'Requested'}: {requestedRange}
              {req.pendingDurationHours != null
                ? ` · ${formatDuration(req.pendingDurationHours)}`
                : ''}
            </p>
            {(req.scheduleChangeExtraAmount ?? 0) > 0 && (
              <p className="text-amber-600">
                Additional billing: ${(req.scheduleChangeExtraAmount ?? 0).toFixed(2)}
              </p>
            )}
          </div>
          {canReviewScheduleChange && (
            <div className="space-y-3 pt-1">
              {!scheduleChangeBilling && onRejectScheduleChange && (
                <div className="app-action-row--equal">
                  <button
                    type="button"
                    onClick={() => void onRejectScheduleChange(req.id)}
                    className="app-button-outline app-btn-sm text-red-400 border-red-500/40"
                  >
                    <X className="w-3.5 h-3.5" /> Decline
                  </button>
                </div>
              )}
              <SlideToConfirm
                label={
                  scheduleChangeBilling
                    ? 'Slide to confirm billing & publish'
                    : 'Slide to approve new times'
                }
                confirmedLabel={scheduleChangeBilling ? 'Confirmed' : 'Approved'}
                tone="success"
                onConfirm={() =>
                  scheduleChangeBilling
                    ? onApproveScheduleChangeBilling?.(req.id)
                    : onApproveScheduleChange?.(req.id)
                }
              />
            </div>
          )}
        </section>
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
