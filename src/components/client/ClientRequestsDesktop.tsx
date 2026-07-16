import React, { useMemo, useState, useEffect } from 'react';
import { SecurityRequest, SecurityGuard, JobChatThread, SessionUser } from '../../types';
import type { ClientPaymentGates, PlatformSettings } from '../../lib/platformSettings';
import type { OvertimeDisputeInput } from '../../lib/shiftBilling';
import { formatShiftRange } from '../../lib/dates';
import { JobBillingSummaryFromRequest } from '../jobs/JobBillingSummary';
import { JobListingProfile } from '../jobs/JobListingProfile';
import { ClipboardList, Clock, Plus } from 'lucide-react';
import {
  isJobScheduleLocked,
  canClientReschedulePaidSchedule,
} from '../../lib/jobEditRules';
import { isJobMissed, JOB_TALLY_LABELS, splitCompletedAndMissed } from '../../lib/jobTallies';
import { formatTimeUntilShift } from '../../lib/shiftCountdown';
import { EditRequestSheet } from '../jobs/EditRequestSheet';
import { ClientJobActionsPanel } from './ClientJobActionsPanel';

type JobTab = 'open' | 'scheduled' | 'completed' | 'missed';

export interface ClientRequestsDesktopProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  clientEmail: string;
  paymentGates: ClientPaymentGates;
  onCancelRequest: (requestId: string) => void;
  onEditRequest: (requestId: string, updates: Partial<SecurityRequest>) => void | Promise<void>;
  onUpdateStatus: (requestId: string, status: SecurityRequest['status']) => void;
  onAddReview: (
    requestId: string,
    rating: number,
    reviewText: string,
    tipCents?: number
  ) => Promise<string | void> | void;
  onReportViolation?: (requestId: string, input: import('./ClientViolationReportSheet').ClientViolationReportInput) => void | Promise<void>;
  onConfirmSelfAudit?: (requestId: string) => void | Promise<void>;
  onRequestCashPayment?: (requestId: string) => void | Promise<void>;
  onApproveOvertime?: (requestId: string) => void | Promise<void>;
  onDisputeOvertime?: (requestId: string, input: OvertimeDisputeInput) => void | Promise<void>;
  onRequestOvertimeCash?: (requestId: string) => void | Promise<void>;
  onApproveScheduleChange?: (requestId: string) => void | Promise<void>;
  onRejectScheduleChange?: (requestId: string) => void | Promise<void>;
  onApprovePendingGuard?: (requestId: string) => void | Promise<void>;
  onDenyPendingGuard?: (requestId: string) => void | Promise<void>;
  onApproveTeamSlot?: (requestId: string, slotId: string) => void | Promise<void>;
  onDenyTeamSlot?: (requestId: string, slotId: string) => void | Promise<void>;
  onApproveFullTeam?: (requestId: string) => void | Promise<void>;
  onDenyFullTeam?: (requestId: string) => void | Promise<void>;
  crewSettings?: PlatformSettings;
  teamLeadSettings?: PlatformSettings;
  onRequestNew: () => void;
  currentUser?: SessionUser;
  jobChatThreads?: JobChatThread[];
  onOpenJobChat?: (requestId: string) => void;
  onSelectedJobIdChange?: (jobId: string | null) => void;
  initialSelectedId?: string | null;
  feeConfig?: import('../../lib/payments').PlatformFeeConfig;
  onSubmitPriceOffer?: (
    requestId: string,
    guardId: string,
    input: {
      hourlyRate: number;
      agreementFeeConfig?: import('../../types').AgreementPlatformFeeConfig;
      message?: string;
    }
  ) => void | Promise<void>;
  onAcceptPriceOffer?: (requestId: string, guardId: string, offerId: string) => void | Promise<void>;
  onRequestReplacement?: (requestId: string, reasonNote?: string) => void | Promise<void>;
}

const TAB_OPTIONS: { id: JobTab; label: string }[] = [
  { id: 'open', label: JOB_TALLY_LABELS.open },
  { id: 'scheduled', label: JOB_TALLY_LABELS.scheduled },
  { id: 'completed', label: JOB_TALLY_LABELS.completed },
  { id: 'missed', label: JOB_TALLY_LABELS.missed },
];

function statusTone(status: SecurityRequest['status']): string {
  if (status === 'in-progress' || status === 'accepted') return 'success';
  if (status === 'open' || status === 'pending-review') return 'warn';
  if (status === 'cancelled') return 'danger';
  return 'neutral';
}

export function ClientRequestsDesktop(props: ClientRequestsDesktopProps) {
  const {
    requests,
    guards,
    clientEmail,
    paymentGates,
    onCancelRequest,
    onEditRequest,
    onUpdateStatus,
    onAddReview,
    onReportViolation,
    onConfirmSelfAudit,
    onRequestCashPayment,
    onApproveOvertime,
    onDisputeOvertime,
    onRequestOvertimeCash,
    onApproveScheduleChange,
    onRejectScheduleChange,
    onApprovePendingGuard,
    onDenyPendingGuard,
    onApproveTeamSlot,
    onDenyTeamSlot,
    onApproveFullTeam,
    onDenyFullTeam,
    crewSettings,
    teamLeadSettings,
    onRequestNew,
    currentUser,
    jobChatThreads = [],
    onOpenJobChat,
    onSelectedJobIdChange,
    initialSelectedId = null,
    feeConfig,
    onSubmitPriceOffer,
    onAcceptPriceOffer,
    onRequestReplacement,
  } = props;

  const billingSettings = crewSettings ?? teamLeadSettings;
  const [activeTab, setActiveTab] = useState<JobTab>('open');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);

  useEffect(() => {
    setSelectedId(initialSelectedId);
  }, [initialSelectedId]);

  const editingRequest = editingId ? requests.find((r) => r.id === editingId) ?? null : null;

  const openJobs = useMemo(
    () => requests.filter((r) => r.status === 'open' || r.status === 'pending-review'),
    [requests],
  );
  const activeJobs = useMemo(
    () => requests.filter((r) => r.status === 'accepted' || r.status === 'in-progress'),
    [requests],
  );
  const scheduledJobs = useMemo(() => activeJobs.filter((r) => !isJobMissed(r)), [activeJobs]);
  const missedActiveJobs = useMemo(() => activeJobs.filter((r) => isJobMissed(r)), [activeJobs]);
  const pastJobs = useMemo(
    () => requests.filter((r) => r.status === 'completed' || r.status === 'closed'),
    [requests],
  );
  const { completed: completedJobs, missed: missedPastJobs } = useMemo(
    () => splitCompletedAndMissed(pastJobs),
    [pastJobs],
  );
  const missedJobs = useMemo(
    () => [...missedActiveJobs, ...missedPastJobs],
    [missedActiveJobs, missedPastJobs],
  );

  const tallies = useMemo(
    () => ({
      open: openJobs.length,
      scheduled: scheduledJobs.length,
      completed: completedJobs.length,
      missed: missedJobs.length,
    }),
    [openJobs.length, scheduledJobs.length, completedJobs.length, missedJobs.length],
  );

  const jobsByTab: Record<JobTab, SecurityRequest[]> = {
    open: openJobs,
    scheduled: scheduledJobs,
    completed: completedJobs,
    missed: missedJobs,
  };

  const listJobs = jobsByTab[activeTab];

  const updateSelectedId = (jobId: string | null) => {
    setSelectedId(jobId);
    onSelectedJobIdChange?.(jobId);
  };

  const selectedRequest = selectedId ? requests.find((r) => r.id === selectedId) ?? null : null;

  useEffect(() => {
    if (listJobs.length === 0) {
      if (selectedId) updateSelectedId(null);
      return;
    }
    const stillVisible = selectedId ? listJobs.some((j) => j.id === selectedId) : false;
    if (!stillVisible) updateSelectedId(listJobs[0].id);
  }, [activeTab, listJobs, selectedId]);

  const nextScheduled = useMemo(() => {
    if (scheduledJobs.length === 0) return null;
    return [...scheduledJobs].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    )[0];
  }, [scheduledJobs]);

  const subtitle = useMemo(() => {
    if (nextScheduled) {
      return `Next: ${nextScheduled.title} — ${formatTimeUntilShift(nextScheduled.startDate)}`;
    }
    if (tallies.open > 0) return `${tallies.open} open posting${tallies.open === 1 ? '' : 's'} awaiting guards.`;
    return 'Post a job to get matched with licensed guards.';
  }, [nextScheduled, tallies.open]);

  return (
    <div className="adm-workbench" data-tour="client-jobs">
      <div className="adm-workbench-toolbar">
        <div>
          <p className="adm-card-eyebrow">Your coverage</p>
          <p className="adm-workbench-subtitle">{subtitle}</p>
        </div>
        <button type="button" className="adm-btn adm-btn--sand" onClick={onRequestNew}>
          <Plus className="w-4 h-4" />
          Post job
        </button>
      </div>

      <div className="adm-workbench-stats">
        {TAB_OPTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`adm-stat-chip${activeTab === id ? ' adm-stat-chip--active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <span className="adm-stat-chip-value">{tallies[id]}</span>
            <span className="adm-stat-chip-label">{label}</span>
          </button>
        ))}
      </div>

      <div className="adm-workbench-split">
        <div className="adm-workbench-list">
          {listJobs.length === 0 ? (
            <div className="adm-empty">
              <ClipboardList className="w-8 h-8 adm-muted-icon" />
              <p>No {JOB_TALLY_LABELS[activeTab].toLowerCase()} jobs</p>
              {activeTab === 'open' ? (
                <button type="button" className="adm-btn adm-btn--outline adm-btn--sm" onClick={onRequestNew}>
                  Post a job
                </button>
              ) : null}
            </div>
          ) : (
            <table className="adm-table adm-table--list">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Schedule</th>
                  <th>Rate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {listJobs.map((job) => (
                  <tr
                    key={job.id}
                    className={`adm-table-row--click${selectedId === job.id ? ' adm-table-row--selected' : ''}`}
                    onClick={() => updateSelectedId(job.id)}
                  >
                    <td>
                      <p className="adm-table-primary">{job.title}</p>
                      <p className="adm-table-secondary">{job.siteName || job.location}</p>
                    </td>
                    <td className="adm-table-secondary">{formatShiftRange(job.startDate, job.endDate)}</td>
                    <td className="adm-stat-value adm-stat-value--sm">${job.hourlyRate}/hr</td>
                    <td>
                      <span className={`adm-pill adm-pill--${statusTone(job.status)}`}>{job.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="adm-workbench-detail">
          {selectedRequest ? (
            <div className="adm-workbench-detail-inner">
              <div className="adm-workbench-detail-head">
                <h2 className="adm-card-title">{selectedRequest.title}</h2>
                <span className={`adm-pill adm-pill--${statusTone(selectedRequest.status)}`}>
                  {selectedRequest.status}
                </span>
              </div>
              <JobListingProfile
                job={selectedRequest}
                showClientHeader={false}
                showBadges={false}
                operationalDetails={selectedRequest.operationalDetails}
                payLine={
                  <JobBillingSummaryFromRequest
                    req={selectedRequest}
                    variant="client"
                    crewSettings={billingSettings}
                    hideCrewUpcostNotice
                  />
                }
              />
              <ClientJobActionsPanel
                request={selectedRequest}
                guards={guards}
                clientEmail={clientEmail}
                paymentGates={paymentGates}
                crewSettings={billingSettings}
                currentUser={currentUser}
                jobChatThreads={jobChatThreads}
                context="jobs"
                onCancelRequest={onCancelRequest}
                onRequestEdit={setEditingId}
                onUpdateStatus={onUpdateStatus}
                onAddReview={onAddReview}
                onReportViolation={onReportViolation}
                onConfirmSelfAudit={onConfirmSelfAudit}
                onRequestCashPayment={onRequestCashPayment}
                onApproveOvertime={onApproveOvertime}
                onDisputeOvertime={onDisputeOvertime}
                onRequestOvertimeCash={onRequestOvertimeCash}
                onApproveScheduleChange={onApproveScheduleChange}
                onRejectScheduleChange={onRejectScheduleChange}
                onApprovePendingGuard={onApprovePendingGuard}
                onDenyPendingGuard={onDenyPendingGuard}
                onApproveTeamSlot={onApproveTeamSlot}
                onDenyTeamSlot={onDenyTeamSlot}
                onApproveFullTeam={onApproveFullTeam}
                onDenyFullTeam={onDenyFullTeam}
                onOpenJobChat={onOpenJobChat}
                feeConfig={feeConfig}
                onSubmitPriceOffer={onSubmitPriceOffer}
                onAcceptPriceOffer={onAcceptPriceOffer}
                onRequestReplacement={onRequestReplacement}
                allRequests={requests}
              />
            </div>
          ) : (
            <div className="adm-empty adm-empty--detail">
              <Clock className="w-10 h-10 adm-muted-icon" />
              <p>Select a job to view details and actions</p>
            </div>
          )}
        </div>
      </div>

      <EditRequestSheet
        open={!!editingRequest}
        request={editingRequest}
        scheduleLocked={editingRequest ? isJobScheduleLocked(editingRequest) : false}
        paidReschedule={editingRequest ? canClientReschedulePaidSchedule(editingRequest) : false}
        onSave={onEditRequest}
        onClose={() => setEditingId(null)}
      />
    </div>
  );
}
