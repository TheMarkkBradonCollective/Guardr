import React, { useMemo, useState, useEffect } from 'react';
import { SecurityRequest, SecurityGuard, JobChatThread, SessionUser } from '../../types';
import type { ClientPaymentGates, PlatformSettings } from '../../lib/platformSettings';
import type { OvertimeDisputeInput } from '../../lib/shiftBilling';
import { formatShiftRange } from '../../lib/dates';
import { JobBillingSummaryFromRequest } from '../jobs/JobBillingSummary';
import { JobListingProfile } from '../jobs/JobListingProfile';
import {
  AppEmptyState,
  AppItemCard,
  AppItemCardStack,
  AppScreen,
  AppSubScreenHeader,
} from '../ui/app/AppPrimitives';
import { ListFilterTabs } from '../ui/ListFilterTabs';
import { ClipboardList, Clock, CheckCircle2, Plus, AlertTriangle } from 'lucide-react';
import { useLayoutFormFactor } from '../../surfaces';
import { ListDetailLayout } from '../ui/app/ListDetailLayout';
import { ClientRequestsDesktop } from './ClientRequestsDesktop';
import {
  isJobScheduleLocked,
  canClientReschedulePaidSchedule,
} from '../../lib/jobEditRules';
import { isJobMissed, JOB_TALLY_LABELS, splitCompletedAndMissed } from '../../lib/jobTallies';
import { formatTimeUntilShift } from '../../lib/shiftCountdown';
import {
  JobsScreenHero,
  JOBS_PIE_COLORS,
} from '../jobs/JobsScreenHero';
import type { JobsPieSegment } from '../jobs/JobsShiftPieChart';
import { EditRequestSheet } from '../jobs/EditRequestSheet';
import { ClientJobActionsPanel } from './ClientJobActionsPanel';

type JobTab = 'open' | 'scheduled' | 'completed' | 'missed';

interface ClientRequestsListProps {
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
  onApproveFullTeam?: (requestId: string) => void | Promise<void>;
  onDenyFullTeam?: (requestId: string) => void | Promise<void>;
  crewSettings?: PlatformSettings;
  /** @deprecated Use crewSettings */
  teamLeadSettings?: PlatformSettings;
  onRequestNew: () => void;
  currentUser?: SessionUser;
  jobChatThreads?: JobChatThread[];
  onOpenJobChat?: (requestId: string) => void;
  onSelectedJobIdChange?: (jobId: string | null) => void;
  initialSelectedId?: string | null;
  initialJobTab?: JobTab;
  onJobTabChange?: (tab: JobTab) => void;
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

function JobRow({
  job,
  onSelect,
  showRate = false,
  selected = false,
}: {
  job: SecurityRequest;
  onSelect: () => void;
  showRate?: boolean;
  selected?: boolean;
}) {
  return (
    <AppItemCard
      onClick={onSelect}
      selected={selected}
      className={showRate ? 'border-brand-primary/30 bg-brand-primary/8' : undefined}
    >
      <div className="min-w-0 flex-1 text-left">
        <p className="font-semibold truncate">{job.title}</p>
        <p className="text-sm text-brand-text-muted mt-1 truncate">
          {formatShiftRange(job.startDate, job.endDate)}
        </p>
        {showRate && (
          <p className="text-sm font-medium text-brand-primary mt-1">${job.hourlyRate}/hr</p>
        )}
      </div>
    </AppItemCard>
  );
}

export function ClientRequestsList({
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
  onJobTabChange,
  feeConfig,
  onSubmitPriceOffer,
  onAcceptPriceOffer,
  onRequestReplacement,
}: ClientRequestsListProps) {
  const formFactor = useLayoutFormFactor();
  const billingSettings = crewSettings ?? teamLeadSettings;
  const [activeTab, setActiveTabState] = useState<JobTab>(initialJobTab);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);

  useEffect(() => {
    setSelectedId(initialSelectedId);
  }, [initialSelectedId]);

  useEffect(() => {
    setActiveTabState(initialJobTab);
  }, [initialJobTab]);

  const setActiveTab = (tab: JobTab) => {
    setActiveTabState(tab);
    onJobTabChange?.(tab);
  };

  const editingRequest = editingId ? requests.find((r) => r.id === editingId) ?? null : null;

  const openJobs = useMemo(
    () => requests.filter((r) => r.status === 'open' || r.status === 'pending-review'),
    [requests]
  );
  const activeJobs = useMemo(
    () => requests.filter((r) => r.status === 'accepted' || r.status === 'in-progress'),
    [requests]
  );
  const scheduledJobs = useMemo(
    () => activeJobs.filter((r) => !isJobMissed(r)),
    [activeJobs]
  );
  const missedActiveJobs = useMemo(
    () => activeJobs.filter((r) => isJobMissed(r)),
    [activeJobs]
  );
  const pastJobs = useMemo(
    () => requests.filter((r) => r.status === 'completed' || r.status === 'closed'),
    [requests]
  );
  const { completed: completedJobs, missed: missedPastJobs } = useMemo(
    () => splitCompletedAndMissed(pastJobs),
    [pastJobs]
  );
  const missedJobs = useMemo(
    () => [...missedActiveJobs, ...missedPastJobs],
    [missedActiveJobs, missedPastJobs]
  );

  const tallies = useMemo(
    () => ({
      open: openJobs.length,
      scheduled: scheduledJobs.length,
      completed: completedJobs.length,
      missed: missedJobs.length,
    }),
    [openJobs.length, scheduledJobs.length, completedJobs.length, missedJobs.length]
  );

  const pieSegments = useMemo<JobsPieSegment[]>(
    () => [
      { id: 'open', label: JOB_TALLY_LABELS.open, value: tallies.open, color: JOBS_PIE_COLORS.open },
      {
        id: 'scheduled',
        label: JOB_TALLY_LABELS.scheduled,
        value: tallies.scheduled,
        color: JOBS_PIE_COLORS.scheduled,
      },
      {
        id: 'completed',
        label: JOB_TALLY_LABELS.completed,
        value: tallies.completed,
        color: JOBS_PIE_COLORS.completed,
      },
      { id: 'missed', label: JOB_TALLY_LABELS.missed, value: tallies.missed, color: JOBS_PIE_COLORS.missed },
    ],
    [tallies]
  );

  const tabOptions = useMemo(
    () => [
      { id: 'open' as const, label: JOB_TALLY_LABELS.open },
      { id: 'scheduled' as const, label: JOB_TALLY_LABELS.scheduled },
      { id: 'completed' as const, label: JOB_TALLY_LABELS.completed },
      { id: 'missed' as const, label: JOB_TALLY_LABELS.missed },
    ],
    []
  );

  const jobTotal = tallies.open + tallies.scheduled + tallies.completed + tallies.missed;

  const nextScheduled = useMemo(() => {
    if (scheduledJobs.length === 0) return null;
    return [...scheduledJobs].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )[0];
  }, [scheduledJobs]);

  const jobsHeroSubtitle = useMemo(() => {
    if (nextScheduled) {
      const timeUntil = formatTimeUntilShift(nextScheduled.startDate);
      return `Next: ${nextScheduled.title} — ${timeUntil}`;
    }
    if (tallies.open > 0) {
      return `${tallies.open} open posting${tallies.open === 1 ? '' : 's'} awaiting guards.`;
    }
    if (jobTotal === 0) {
      return 'Post a job to get matched with licensed guards.';
    }
    return 'Tap a tab below to browse your coverage.';
  }, [nextScheduled, tallies.open, jobTotal]);

  const updateSelectedId = (jobId: string | null) => {
    setSelectedId(jobId);
    onSelectedJobIdChange?.(jobId);
  };

  const selectedRequest = selectedId ? requests.find((r) => r.id === selectedId) ?? null : null;

  const tabJobs =
    activeTab === 'open' ? openJobs :
    activeTab === 'scheduled' ? scheduledJobs :
    activeTab === 'completed' ? completedJobs :
    missedJobs;

  if (formFactor === 'desktop') {
    return (
      <ClientRequestsDesktop
        requests={requests}
        guards={guards}
        clientEmail={clientEmail}
        paymentGates={paymentGates}
        onCancelRequest={onCancelRequest}
        onEditRequest={onEditRequest}
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
        onApproveFullTeam={onApproveFullTeam}
        onDenyFullTeam={onDenyFullTeam}
        crewSettings={crewSettings}
        teamLeadSettings={teamLeadSettings}
        onRequestNew={onRequestNew}
        currentUser={currentUser}
        jobChatThreads={jobChatThreads}
        onOpenJobChat={onOpenJobChat}
        onSelectedJobIdChange={onSelectedJobIdChange}
        initialSelectedId={initialSelectedId}
        initialJobTab={initialJobTab}
        feeConfig={feeConfig}
        onSubmitPriceOffer={onSubmitPriceOffer}
        onAcceptPriceOffer={onAcceptPriceOffer}
        onRequestReplacement={onRequestReplacement}
      />
    );
  }

  function renderSelectedRequestDetail(req: SecurityRequest) {
    return (
      <div className="space-y-4">
        <JobListingProfile
          job={req}
          showClientHeader={false}
          showBadges={false}
          operationalDetails={req.operationalDetails}
          payLine={
            <JobBillingSummaryFromRequest
              req={req}
              variant="client"
            />
          }
        />
        <ClientJobActionsPanel
          request={req}
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
    );
  }

  if (formFactor === 'tablet') {
    const emptyTitle =
      activeTab === 'open' ? 'No open offers' :
      activeTab === 'scheduled' ? 'No scheduled coverage' :
      activeTab === 'completed' ? 'No completed jobs yet' :
      'No missed coverage';
    const emptyBody =
      activeTab === 'open' ? 'Post your first security request to get matched with licensed guards.' :
      activeTab === 'scheduled' ? 'Accepted jobs will appear here leading up to their start date.' :
      activeTab === 'completed' ? 'Your completed jobs will appear here once shifts are closed out.' :
      'No-call and no-show shifts will appear here.';

    return (
      <AppScreen className="h-full min-h-0" data-tour="client-jobs">
        <div className="sft-jobs-toolbar">
          <ListFilterTabs
            aria-label="Job status"
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as JobTab)}
            tabs={tabOptions.map((tab) => ({
              id: tab.id,
              label: tab.label,
              count: tallies[tab.id],
            }))}
          />
          {onRequestNew ? (
            <button
              type="button"
              onClick={onRequestNew}
              className="app-button-primary app-btn-md app-btn-inline flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Post a job
            </button>
          ) : null}
        </div>
        {tabJobs.length === 0 ? (
          <AppEmptyState
            icon={<ClipboardList className="w-5 h-5" />}
            title={emptyTitle}
            action={
              activeTab === 'open' && onRequestNew ? (
                <button
                  type="button"
                  onClick={onRequestNew}
                  className="app-button-primary app-btn-md app-btn-inline flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Post a job
                </button>
              ) : undefined
            }
          >
            {emptyBody}
          </AppEmptyState>
        ) : (
          <ListDetailLayout
            items={tabJobs}
            selectedId={selectedId}
            onSelectId={updateSelectedId}
            getItemId={(job) => job.id}
            autoSelectFirst
            mobilePresentation="page"
            emptyDetail={
              <div className="sft-empty">
                <p className="sft-empty-title">Select a job</p>
                <p className="sft-empty-message">Choose a posting from the list to review coverage, billing, and actions.</p>
              </div>
            }
            renderItem={(job, isSelected, onSelect) => (
              <JobRow
                job={job}
                onSelect={onSelect}
                selected={isSelected}
                showRate={activeTab === 'open' || activeTab === 'scheduled'}
              />
            )}
            renderDetail={(job, options) => (
              <>
                {options?.onBack ? (
                  <AppSubScreenHeader
                    title={job.title}
                    hideTitle
                    onBack={options.onBack}
                    backLabel="Requests"
                  />
                ) : null}
                <div className="px-5 pb-8">{renderSelectedRequestDetail(job)}</div>
              </>
            )}
          />
        )}
        <EditRequestSheet
          open={!!editingRequest}
          request={editingRequest}
          scheduleLocked={editingRequest ? isJobScheduleLocked(editingRequest) : false}
          paidReschedule={editingRequest ? canClientReschedulePaidSchedule(editingRequest) : false}
          onSave={onEditRequest}
          onClose={() => setEditingId(null)}
        />
      </AppScreen>
    );
  }

  if (selectedRequest) {
    return (
      <AppScreen className="app-full-page-detail">
        <AppSubScreenHeader
          title={selectedRequest.title}
          hideTitle
          onBack={() => updateSelectedId(null)}
          backLabel="Requests"
        />
        <div className="px-5 pb-8">{renderSelectedRequestDetail(selectedRequest)}</div>
        <EditRequestSheet
          open={!!editingRequest}
          request={editingRequest}
          scheduleLocked={editingRequest ? isJobScheduleLocked(editingRequest) : false}
          paidReschedule={editingRequest ? canClientReschedulePaidSchedule(editingRequest) : false}
          onSave={onEditRequest}
          onClose={() => setEditingId(null)}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen className="guard-tiered-screen h-full min-h-0" data-tour="client-jobs">
      <div className="guard-tiered-screen-pinned">
        <JobsScreenHero
          eyebrow="Your coverage"
          title="Jobs"
          subtitle={jobsHeroSubtitle}
          segments={pieSegments}
          activeId={activeTab}
          onSegmentSelect={(id) => setActiveTab(id as JobTab)}
          totalLabel="jobs"
        />
      </div>

      <div className="guard-tiered-screen-toolbar crew-hub-sticky-head guard-jobs-toolbar px-1">
        <ListFilterTabs
          aria-label="Job status"
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as JobTab)}
          tabs={tabOptions.map((tab) => ({
            id: tab.id,
            label: tab.label,
            count: tallies[tab.id],
          }))}
        />
      </div>

      <div className="guard-tiered-screen-scroll">
        <div className="guard-rating-body">
      {activeTab === 'open' && (
        <div className="app-section-body pt-2">
          {openJobs.length === 0 ? (
            <AppEmptyState
              icon={<ClipboardList className="w-5 h-5" />}
              title="No open offers"
              action={
                <button
                  type="button"
                  onClick={onRequestNew}
                  className="app-button-primary app-btn-md app-btn-inline flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Post a job
                </button>
              }
            >
              Post your first security request to get matched with licensed guards.
            </AppEmptyState>
          ) : (
            <AppItemCardStack>
              {openJobs.map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  onSelect={() => updateSelectedId(job.id)}
                  showRate
                />
              ))}
            </AppItemCardStack>
          )}
        </div>
      )}

      {activeTab === 'scheduled' && (
        <div className="app-section-body pt-2">
          {scheduledJobs.length === 0 ? (
            <AppEmptyState
              icon={<Clock className="w-5 h-5" />}
              title="No scheduled coverage"
            >
              Accepted jobs will appear here leading up to their start date.
            </AppEmptyState>
          ) : (
            <AppItemCardStack>
              {scheduledJobs.map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  onSelect={() => updateSelectedId(job.id)}
                  showRate
                />
              ))}
            </AppItemCardStack>
          )}
        </div>
      )}

      {activeTab === 'completed' && (
        <div className="app-section-body pt-2">
          {completedJobs.length === 0 ? (
            <AppEmptyState
              icon={<CheckCircle2 className="w-5 h-5" />}
              title="No completed jobs yet"
            >
              Your completed jobs will appear here once shifts are closed out.
            </AppEmptyState>
          ) : (
            <AppItemCardStack>
              {completedJobs.map((job) => (
                <JobRow key={job.id} job={job} onSelect={() => updateSelectedId(job.id)} />
              ))}
            </AppItemCardStack>
          )}
        </div>
      )}

      {activeTab === 'missed' && (
        <div className="app-section-body pt-2">
          {missedJobs.length === 0 ? (
            <AppEmptyState
              icon={<AlertTriangle className="w-5 h-5" />}
              title="No missed coverage"
            >
              No-call and no-show shifts will appear here.
            </AppEmptyState>
          ) : (
            <AppItemCardStack>
              {missedJobs.map((job) => (
                <JobRow key={job.id} job={job} onSelect={() => updateSelectedId(job.id)} />
              ))}
            </AppItemCardStack>
          )}
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
    </AppScreen>
  );
}
