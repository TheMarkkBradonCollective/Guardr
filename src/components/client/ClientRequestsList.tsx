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
  AppSegmentedControl,
  AppSubScreenHeader,
} from '../ui/app/AppPrimitives';
import { ClipboardList, Clock, CheckCircle2, Plus } from 'lucide-react';
import {
  isJobScheduleLocked,
  canClientReschedulePaidSchedule,
} from '../../lib/jobEditRules';
import { EditRequestSheet } from '../jobs/EditRequestSheet';
import { ClientJobActionsPanel } from './ClientJobActionsPanel';

type JobTab = 'open' | 'upcoming' | 'past';

interface ClientRequestsListProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  clientEmail: string;
  paymentGates: ClientPaymentGates;
  onCancelRequest: (requestId: string) => void;
  onEditRequest: (requestId: string, updates: Partial<SecurityRequest>) => void | Promise<void>;
  onUpdateStatus: (requestId: string, status: SecurityRequest['status']) => void;
  onAddReview: (requestId: string, rating: number, reviewText: string) => void;
  onConfirmSelfAudit?: (requestId: string) => void | Promise<void>;
  onConfirmSpotCheck?: (requestId: string, spotCheckId: string) => void | Promise<void>;
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
  /** @deprecated Use crewSettings */
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
}

function JobRow({
  job,
  onSelect,
  showRate = false,
}: {
  job: SecurityRequest;
  onSelect: () => void;
  showRate?: boolean;
}) {
  return (
    <AppItemCard
      onClick={onSelect}
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

const TAB_OPTIONS: { id: JobTab; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
];

export function ClientRequestsList({
  requests,
  guards,
  clientEmail,
  paymentGates,
  onCancelRequest,
  onEditRequest,
  onUpdateStatus,
  onAddReview,
  onConfirmSelfAudit,
  onConfirmSpotCheck,
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
}: ClientRequestsListProps) {
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
    [requests]
  );
  const upcomingJobs = useMemo(
    () => requests.filter((r) => r.status === 'accepted' || r.status === 'in-progress'),
    [requests]
  );
  const pastJobs = useMemo(
    () => requests.filter((r) => r.status === 'completed' || r.status === 'closed'),
    [requests]
  );

  const updateSelectedId = (jobId: string | null) => {
    setSelectedId(jobId);
    onSelectedJobIdChange?.(jobId);
  };

  const selectedRequest = selectedId ? requests.find((r) => r.id === selectedId) ?? null : null;

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
              crewSettings={billingSettings}
              hideCrewUpcostNotice
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
          onConfirmSelfAudit={onConfirmSelfAudit}
          onConfirmSpotCheck={onConfirmSpotCheck}
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
        />
      </div>
    );
  }

  if (selectedRequest) {
    return (
      <AppScreen className="app-full-page-detail">
        <AppSubScreenHeader title={selectedRequest.title} onBack={() => updateSelectedId(null)} />
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
    <AppScreen>
      <AppSegmentedControl<JobTab>
        options={TAB_OPTIONS}
        value={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'open' && (
        <div className="app-section-body pt-4">
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

      {activeTab === 'upcoming' && (
        <div className="app-section-body pt-4">
          {upcomingJobs.length === 0 ? (
            <AppEmptyState
              icon={<Clock className="w-5 h-5" />}
              title="No upcoming coverage"
            >
              Accepted jobs will appear here leading up to their start date.
            </AppEmptyState>
          ) : (
            <AppItemCardStack>
              {upcomingJobs.map((job) => (
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

      {activeTab === 'past' && (
        <div className="app-section-body pt-4">
          {pastJobs.length === 0 ? (
            <AppEmptyState
              icon={<CheckCircle2 className="w-5 h-5" />}
              title="No completed jobs yet"
            >
              Your shift history will appear here once jobs are closed out.
            </AppEmptyState>
          ) : (
            <AppItemCardStack>
              {pastJobs.map((job) => (
                <JobRow key={job.id} job={job} onSelect={() => updateSelectedId(job.id)} />
              ))}
            </AppItemCardStack>
          )}
        </div>
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
