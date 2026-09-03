import React, { useMemo, useState, useEffect } from 'react';
import { SecurityRequest, SecurityGuard, JobChatThread, SessionUser } from '../../types';
import type { ClientPaymentGates, PlatformSettings } from '../../lib/platformSettings';
import type { OvertimeDisputeInput } from '../../lib/shiftBilling';
import { formatShiftRange } from '../../lib/dates';
import { JobBillingSummaryFromRequest } from '../jobs/JobBillingSummary';
import { JobListingProfile } from '../jobs/JobListingProfile';
import { ClipboardList, Clock } from 'lucide-react';
import {
  WorkbenchEmpty,
  WorkbenchPage,
  WorkbenchPanel,
  WorkbenchSearchRow,
  WorkbenchSplit,
  WorkbenchStatChips,
} from '../baseui/layout/WorkbenchLayout';
import { GuardrButton } from '../baseui/GuardrButton';
import { StatusChip } from '../baseui/StatusChip';
import { GuardrDataTable, type GuardrTableColumn } from '../baseui/GuardrDataTable';
import { jobStatusLabel, jobStatusTone } from '../../lib/jobStatusTone';
import {
  isJobScheduleLocked,
  canClientReschedulePaidSchedule,
} from '../../lib/jobEditRules';
import { isJobMissed, JOB_TALLY_LABELS, splitCompletedAndMissed } from '../../lib/jobTallies';
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
  onVerifyStartCheckpoint?: (requestId: string) => void | Promise<void>;
  onFlagStartCheckpoint?: (requestId: string, category: string, note: string) => void | Promise<void>;
  onVerifyEndCheckpoint?: (requestId: string) => void | Promise<void>;
  onFlagEndCheckpoint?: (requestId: string, category: string, note: string) => void | Promise<void>;
  onApproveOvertime?: (requestId: string) => void | Promise<void>;
  onDisputeOvertime?: (requestId: string, input: OvertimeDisputeInput) => void | Promise<void>;
  onApproveScheduleChange?: (requestId: string) => void | Promise<void>;
  onRejectScheduleChange?: (requestId: string) => void | Promise<void>;
  onApprovePendingGuard?: (requestId: string) => void | Promise<void>;
  onDenyPendingGuard?: (requestId: string) => void | Promise<void>;
  onApproveTeamSlot?: (requestId: string, slotId: string) => void | Promise<void>;
  onDenyTeamSlot?: (requestId: string, slotId: string) => void | Promise<void>;
  onRequestSuggestedGuard?: (requestId: string, guardId: string) => void | Promise<void>;
  onDismissGuardSuggestion?: (requestId: string, suggestionId: string) => void | Promise<void>;
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
  initialJobTab?: JobTab;
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

const REQUEST_COLUMNS: GuardrTableColumn<SecurityRequest>[] = [
  {
    id: 'job',
    header: 'Job',
    grow: true,
    sortValue: (job) => job.title.toLowerCase(),
    render: (job) => (
      <>
        <p className="uber-workbench-table-primary">{job.title}</p>
        <p className="uber-workbench-table-secondary">{job.siteName || job.location}</p>
      </>
    ),
  },
  {
    id: 'schedule',
    header: 'Schedule',
    sortValue: (job) => job.startDate,
    render: (job) => formatShiftRange(job.startDate, job.endDate),
  },
  {
    id: 'rate',
    header: 'Rate',
    numeric: true,
    align: 'right',
    sortValue: (job) => job.hourlyRate,
    render: (job) => `$${job.hourlyRate}/hr`,
  },
  {
    id: 'status',
    header: 'Status',
    sortValue: (job) => job.status,
    render: (job) => (
      <StatusChip tone={jobStatusTone(job.status)}>{jobStatusLabel(job.status)}</StatusChip>
    ),
  },
];

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
    onVerifyStartCheckpoint,
    onFlagStartCheckpoint,
    onVerifyEndCheckpoint,
    onFlagEndCheckpoint,
    onApproveOvertime,
    onDisputeOvertime,
    onApproveScheduleChange,
    onRejectScheduleChange,
    onApprovePendingGuard,
    onDenyPendingGuard,
    onApproveTeamSlot,
    onDenyTeamSlot,
    onRequestSuggestedGuard,
    onDismissGuardSuggestion,
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
    initialJobTab = 'open',
    feeConfig,
    onSubmitPriceOffer,
    onAcceptPriceOffer,
    onRequestReplacement,
  } = props;

  const billingSettings = crewSettings ?? teamLeadSettings;
  const [activeTab, setActiveTab] = useState<JobTab>(initialJobTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);

  useEffect(() => {
    setActiveTab(initialJobTab);
  }, [initialJobTab]);

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

  const listJobs = useMemo(() => {
    const base = jobsByTab[activeTab];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return base;
    return base.filter((job) => {
      const guardName = job.assignedGuardId
        ? guards.find((guard) => guard.id === job.assignedGuardId)?.name
        : undefined;
      return [job.title, job.siteName, job.location, guardName, job.id]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [jobsByTab, activeTab, searchQuery, guards]);

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

  return (
    <WorkbenchPage data-tour="client-jobs">
      <WorkbenchSearchRow
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search for a job or location"
      />

      <div data-tour="client-jobs-tabs">
      <WorkbenchStatChips<JobTab>
        items={TAB_OPTIONS.map(({ id, label }) => ({ id, label, value: tallies[id] }))}
        activeId={activeTab}
        onSelect={setActiveTab}
      />
      </div>

      <WorkbenchPanel padding={false}>
      <WorkbenchSplit
        list={
          listJobs.length === 0 ? (
            <WorkbenchEmpty
              icon={ClipboardList}
              message={`No ${JOB_TALLY_LABELS[activeTab].toLowerCase()} jobs`}
              action={
                activeTab === 'open' ? (
                  <GuardrButton kind="secondary" size="compact" onClick={onRequestNew}>
                    Post a job
                  </GuardrButton>
                ) : undefined
              }
            />
          ) : (
            <GuardrDataTable
              columns={REQUEST_COLUMNS}
              rows={listJobs}
              rowKey={(job) => job.id}
              selectedKey={selectedId ?? undefined}
              onRowClick={(job) => updateSelectedId(job.id)}
              caption="Your jobs"
              cardLayout={{ title: 'job', subtitle: 'schedule', trailing: 'status' }}
            />
          )
        }
        detail={
          selectedRequest ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-bold m-0">{selectedRequest.title}</h2>
                <StatusChip tone={jobStatusTone(selectedRequest.status)}>
                  {jobStatusLabel(selectedRequest.status)}
                </StatusChip>
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
                onVerifyStartCheckpoint={onVerifyStartCheckpoint}
                onFlagStartCheckpoint={onFlagStartCheckpoint}
                onVerifyEndCheckpoint={onVerifyEndCheckpoint}
                onFlagEndCheckpoint={onFlagEndCheckpoint}
                onApproveOvertime={onApproveOvertime}
                onDisputeOvertime={onDisputeOvertime}
                onApproveScheduleChange={onApproveScheduleChange}
                onRejectScheduleChange={onRejectScheduleChange}
                onApprovePendingGuard={onApprovePendingGuard}
                onDenyPendingGuard={onDenyPendingGuard}
                onApproveTeamSlot={onApproveTeamSlot}
                onDenyTeamSlot={onDenyTeamSlot}
                onRequestSuggestedGuard={onRequestSuggestedGuard}
                onDismissGuardSuggestion={onDismissGuardSuggestion}
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
            <WorkbenchEmpty icon={Clock} message="Select a job to view details and actions" variant="detail" />
          )
        }
      />
      </WorkbenchPanel>

      <EditRequestSheet
        open={!!editingRequest}
        request={editingRequest}
        scheduleLocked={editingRequest ? isJobScheduleLocked(editingRequest) : false}
        paidReschedule={editingRequest ? canClientReschedulePaidSchedule(editingRequest) : false}
        onSave={onEditRequest}
        onClose={() => setEditingId(null)}
      />
    </WorkbenchPage>
  );
}
