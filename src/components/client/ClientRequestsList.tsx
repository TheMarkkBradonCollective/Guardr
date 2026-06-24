import React, { useMemo, useState } from 'react';
import { SecurityRequest, SecurityGuard, JobStatus } from '../../types';
import type { ClientPaymentGates, PlatformSettings } from '../../lib/platformSettings';
import { JOB_STATUS_LABELS, jobPostingTypeLabel } from '../../lib/jobStatus';
import type { OvertimeDisputeInput } from '../../lib/shiftBilling';
import { JobBillingSummaryFromRequest } from '../jobs/JobBillingSummary';
import { JobListingProfile } from '../jobs/JobListingProfile';
import { JobListCard } from '../jobs/JobListCard';
import { AppItemCardStack, AppScreen, AppSection, AppSubScreenHeader } from '../ui/app/AppPrimitives';
import { WfBadge, WfSearchBar } from '../ui/wireframe';
import {
  Shield,
  ClipboardList,
  CalendarClock,
  CheckSquare,
  Archive,
} from 'lucide-react';
import { JobChatMessage, JobChatThread, SessionUser } from '../../types';
import {
  isJobScheduleLocked,
  canClientReschedulePaidSchedule,
} from '../../lib/jobEditRules';
import { clientPaymentStatusLabel } from '../../lib/paymentDisplay';
import { isMultiGuardJob, isFullCrewAwaitingClientApproval, isIndependentGuardPendingForClient, hasIndependentSlotsPendingClient } from '../../lib/guardTeams';
import { EditRequestSheet } from '../jobs/EditRequestSheet';
import { ClientJobActionsPanel } from './ClientJobActionsPanel';

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
  jobChatMessages?: JobChatMessage[];
  onSendJobChatMessage?: (requestId: string, body: string) => void | Promise<void>;
  onOpenJobChat?: (requestId: string) => void;
}

function statusBadgeTone(status: JobStatus): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'open': return 'primary';
    case 'pending-review': return 'warning';
    case 'accepted': return 'primary';
    case 'in-progress': return 'success';
    case 'completed': return 'success';
    case 'closed': return 'default';
    default: return 'default';
  }
}

function paymentBadgeTone(
  status?: SecurityRequest['paymentStatus'],
  req?: SecurityRequest
): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
  if (req && isClientCashPaymentPendingApproval(req)) return 'warning';
  switch (status) {
    case 'paid': return 'success';
    case 'held': return 'warning';
    case 'released': return 'success';
    default: return 'warning';
  }
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
  onSendJobChatMessage,
  onOpenJobChat,
}: ClientRequestsListProps) {
  const billingSettings = crewSettings ?? teamLeadSettings;
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const editingRequest = editingId ? requests.find((r) => r.id === editingId) ?? null : null;

  const tabCounts = useMemo(() => ({
    all: requests.length,
    active: requests.filter((r) => r.status === 'in-progress' || r.status === 'accepted').length,
    upcoming: requests.filter((r) => r.status === 'open' || r.status === 'pending-review').length,
    completed: requests.filter((r) => r.status === 'completed' || r.status === 'closed').length,
  }), [requests]);

  const filtered = useMemo(() => {
    let base = requests;
    if (statusTab === 'active') base = base.filter((r) => r.status === 'in-progress' || r.status === 'accepted');
    else if (statusTab === 'upcoming') base = base.filter((r) => r.status === 'open' || r.status === 'pending-review');
    else if (statusTab === 'completed') base = base.filter((r) => r.status === 'completed' || r.status === 'closed');
    const q = search.toLowerCase();
    if (!q) return base;
    return base.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q)
    );
  }, [requests, search, statusTab]);

  const selectedRequest = expandedId
    ? requests.find((r) => r.id === expandedId) ?? null
    : null;

  function renderSelectedRequestDetail(req: SecurityRequest) {
    return (
      <div className="staff-detail-pane space-y-4">
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
        />
      </div>
    );
  }

  return (
    <AppScreen className={selectedRequest ? 'app-full-page-detail' : ''}>
      {selectedRequest ? (
        <>
          <AppSubScreenHeader title={selectedRequest.title} onBack={() => setExpandedId(null)} backLabel="Jobs" />
          <div className="px-5 pb-8">{renderSelectedRequestDetail(selectedRequest)}</div>
        </>
      ) : (
        <>
      <div className="flex items-center justify-between gap-4 px-5 pt-2 pb-3 border-b border-brand-border">
        <p className="text-sm font-semibold text-brand-text">
          {requests.length} job{requests.length !== 1 ? 's' : ''}
        </p>
        <button
          type="button"
          onClick={onRequestNew}
          className="app-button-primary !w-auto !h-9 !px-4 !text-sm shrink-0"
        >
          + Post offer
        </button>
      </div>

      {requests.length > 0 && (
        <>
          {/* Status filter tabs */}
          <div className="flex gap-0 border-b border-brand-border overflow-x-auto scrollbar-hide">
            {(
              [
                { id: 'all', label: 'All', icon: ClipboardList },
                { id: 'active', label: 'Active', icon: CalendarClock },
                { id: 'upcoming', label: 'Upcoming', icon: Shield },
                { id: 'completed', label: 'Done', icon: CheckSquare },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setStatusTab(id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors shrink-0 ${
                  statusTab === id
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-brand-text-muted hover:text-brand-text'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {tabCounts[id] > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    statusTab === id ? 'bg-brand-primary/15 text-brand-primary' : 'bg-brand-bg-sec text-brand-text-muted'
                  }`}>
                    {tabCounts[id]}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="px-5 py-3 border-b border-brand-border">
            <WfSearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search jobs by title, location…"
            />
          </div>
        </>
      )}

      <AppSection title={statusTab === 'all' ? 'All jobs' : statusTab === 'active' ? 'Active jobs' : statusTab === 'upcoming' ? 'Upcoming jobs' : 'Completed jobs'}>
      {requests.length === 0 ? (
        <div className="flex flex-col items-center py-12 px-6 text-center">
          <Shield className="w-10 h-10 text-brand-border mb-3" />
          <p className="font-semibold text-brand-text mb-1">No jobs yet</p>
          <p className="text-sm text-brand-text-muted mb-4">Post your first security job offer to get started.</p>
          <button
            type="button"
            onClick={onRequestNew}
            className="app-button-primary !w-auto !h-9 !px-5 !text-sm"
          >
            + Post offer
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-10 px-6 text-center">
          <Archive className="w-8 h-8 text-brand-border mb-2" />
          <p className="text-sm font-medium text-brand-text mb-1">No jobs here</p>
          <p className="text-xs text-brand-text-muted">
            {search ? 'No jobs match your search.' : `No ${statusTab === 'active' ? 'active' : statusTab === 'upcoming' ? 'upcoming' : 'completed'} jobs right now.`}
          </p>
        </div>
      ) : (
        <AppItemCardStack>
          {filtered.map((req) => {
            const awaitingIndependentGuard = isIndependentGuardPendingForClient(req);
            const awaitingFullCrew = isFullCrewAwaitingClientApproval(req);
            const independentPending = hasIndependentSlotsPendingClient(req);
            return (
              <JobListCard
                key={req.id}
                job={req}
                subtitle={req.siteName ? `${req.siteName} · ${req.clientName}` : req.clientName}
                meta={
                  <div className="flex flex-wrap items-center gap-1.5">
                    <WfBadge tone={req.requestType === 'direct' ? 'primary' : 'default'}>
                      {jobPostingTypeLabel(req.requestType)}
                    </WfBadge>
                    <WfBadge tone={statusBadgeTone(req.status)}>{JOB_STATUS_LABELS[req.status]}</WfBadge>
                    {independentPending && (
                      <WfBadge tone="warning">
                        {req.guardSlots?.filter((s) => s.status === 'pending_client').length ?? 1} independent pending
                      </WfBadge>
                    )}
                    {awaitingIndependentGuard && !independentPending && !isMultiGuardJob(req) && (
                      <WfBadge tone="warning">Independent guard pending</WfBadge>
                    )}
                    {awaitingFullCrew && (
                      <WfBadge tone="warning">Full crew pending</WfBadge>
                    )}
                    {req.scheduleChangeStatus === 'pending_staff' && (
                      <WfBadge tone="warning">Schedule change pending</WfBadge>
                    )}
                    {req.scheduleChangeStatus === 'pending_client' && (
                      <WfBadge tone="warning">Guardr schedule proposal</WfBadge>
                    )}
                    {req.scheduleChangeStatus === 'awaiting_payment' && (
                      <WfBadge tone="warning">Schedule extension due</WfBadge>
                    )}
                    <WfBadge tone={paymentBadgeTone(req.paymentStatus, req)}>{clientPaymentStatusLabel(req.paymentStatus, req)}</WfBadge>
                  </div>
                }
                onClick={() => setExpandedId(req.id)}
                showStatus={false}
              />
            );
          })}
        </AppItemCardStack>
      )}
      </AppSection>
        </>
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
