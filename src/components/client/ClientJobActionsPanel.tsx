import React, { useMemo, useState } from 'react';
import {
  JobChatThread,
  SecurityGuard,
  SecurityRequest,
  SessionUser,
} from '../../types';
import type { ClientPaymentGates, PlatformSettings } from '../../lib/platformSettings';
import type { PlatformFeeConfig } from '../../lib/payments';
import { isOpenContractPricing } from '../../lib/agreementPricing';
import { PriceNegotiationPanel } from '../jobs/PriceNegotiationPanel';
import { createCheckoutSession, createOvertimeCheckoutSession, createScheduleChangeCheckoutSession, createTipCheckoutSession } from '../../lib/stripeApi';
import {
  canClientApproveOvertime,
  canClientPayOvertimeStripe,
  canClientRequestOvertimeCash,
  computeLateClockOutHours,
  computeOvertimeAmount,
  hasOvertime,
  hasUnpaidOvertime,
  isOvertimeCashPaymentPendingApproval,
  isOvertimeDisputed,
  isOvertimeWaived,
  type OvertimeDisputeInput,
} from '../../lib/shiftBilling';
import { toDatetimeLocal, formatShiftRange } from '../../lib/dates';
import {
  canClientApproveStaffScheduleChange,
  canClientPayScheduleChangeExtension,
} from '../../lib/jobScheduleChange';
import {
  canClientCancelRequest,
  canClientEditJobListing,
  canClientPayForJob,
  canClientRequestCashPayment,
  canClientReschedulePaidSchedule,
  isJobScheduleLocked,
} from '../../lib/jobEditRules';
import { clientPaymentStatusHint, clientPaymentStatusLabel } from '../../lib/paymentDisplay';
import { isClientCashPaymentPendingApproval } from '../../lib/cashPayments';
import {
  isMultiGuardJob,
  isFullCrewAwaitingClientApproval,
  isIndependentGuardPendingForClient,
  hasIndependentSlotsPendingClient,
} from '../../lib/guardTeams';
import { isJobChatEligible, threadForRequest } from '../../lib/jobChat';
import { showAppToast } from '../ui/AppToast';
import { showAppConfirm } from '../ui/AppConfirm';
import { CrewTeamUpcostNotice } from '../jobs/JobBillingSummary';
import { JobTeamRoster } from '../jobs/JobTeamRoster';
import { AppFormSheet } from '../ui/app/AppFormSheet';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { ClientSelfAuditConfirm } from './ClientSelfAuditConfirm';
import { ClientViolationReportSheet, type ClientViolationReportInput } from './ClientViolationReportSheet';
import { ReplacementRequestPanel } from './ReplacementRequestPanel';
import { GuardArmedStatusPill } from '../guard/GuardArmedStatusPill';
import { GuardMatchScoreRow } from '../guard/GuardMatchScoreRow';
import { rankGuardsForJob } from '../../lib/guardQualificationMatching';
import {
  canClientLeaveTip,
  formatTipAmountCents,
  isValidTipCents,
  parseTipDollarsToCents,
  TIP_PRESET_CENTS,
} from '../../lib/clientTips';
import {
  computeGuardPerformance,
  formatPerformanceScore,
} from '../../lib/guardPerformance';
import {
  canClientReportViolation,
  listClientViolationReports,
} from '../../lib/clientViolations';
import {
  AlertTriangle,
  Award,
  Banknote,
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  MessageCircle,
  Pencil,
  Star,
  X,
  DollarSign,
} from 'lucide-react';

export interface ClientJobActionsPanelProps {
  request: SecurityRequest;
  guards: SecurityGuard[];
  clientEmail: string;
  paymentGates: ClientPaymentGates;
  crewSettings?: PlatformSettings;
  /** @deprecated Use crewSettings */
  teamLeadSettings?: PlatformSettings;
  currentUser?: SessionUser;
  jobChatThreads?: JobChatThread[];
  context?: 'jobs' | 'map';
  hideMessaging?: boolean;
  onCancelRequest?: (requestId: string) => void;
  onRequestEdit?: (requestId: string) => void;
  onUpdateStatus?: (requestId: string, status: SecurityRequest['status']) => void;
  onAddReview?: (
    requestId: string,
    rating: number,
    reviewText: string,
    tipCents?: number
  ) => Promise<string | void> | void;
  onReportViolation?: (requestId: string, input: ClientViolationReportInput) => void | Promise<void>;
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
  onOpenJobChat?: (requestId: string) => void;
  onEditRequest?: (requestId: string, updates: Partial<SecurityRequest>) => void | Promise<void>;
  feeConfig?: PlatformFeeConfig;
  onSubmitPriceOffer?: (
    requestId: string,
    guardId: string,
    input: {
      hourlyRate: number;
      agreementFeeConfig?: SecurityRequest['agreementFeeConfig'];
      message?: string;
    }
  ) => void | Promise<void>;
  onAcceptPriceOffer?: (requestId: string, guardId: string, offerId: string) => void | Promise<void>;
  onRequestReplacement?: (requestId: string, reasonNote?: string) => void | Promise<void>;
  allRequests?: SecurityRequest[];
}

export function ClientJobActionsPanel({
  request: req,
  guards,
  clientEmail,
  paymentGates,
  crewSettings,
  teamLeadSettings,
  currentUser,
  jobChatThreads = [],
  context = 'jobs',
  hideMessaging = false,
  onCancelRequest,
  onRequestEdit,
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
  onOpenJobChat,
  feeConfig,
  onSubmitPriceOffer,
  onAcceptPriceOffer,
  onRequestReplacement,
  allRequests = [],
}: ClientJobActionsPanelProps) {
  const billingSettings = crewSettings ?? teamLeadSettings;
  const hiredGuard = guards.find((g) => g.id === req.assignedGuardId);
  const pendingGuard = req.pendingGuardId ? guards.find((g) => g.id === req.pendingGuardId) : undefined;
  const awaitingClientGuard = isIndependentGuardPendingForClient(req);
  const fullCrewAwaitingClient = isFullCrewAwaitingClientApproval(req);
  const independentSlotsPending = hasIndependentSlotsPendingClient(req);

  const [reviewRating, setReviewRating] = useState(0);
  const [reviewNote, setReviewNote] = useState('');
  const [payingJobId, setPayingJobId] = useState<string | null>(null);
  const [payingOvertimeJobId, setPayingOvertimeJobId] = useState<string | null>(null);
  const [cashRequestJobId, setCashRequestJobId] = useState<string | null>(null);
  const [overtimeCashRequestJobId, setOvertimeCashRequestJobId] = useState<string | null>(null);
  const [overtimeApproveJobId, setOvertimeApproveJobId] = useState<string | null>(null);
  const [overtimeDisputeOpen, setOvertimeDisputeOpen] = useState(false);
  const [overtimeDisputeReason, setOvertimeDisputeReason] = useState('');
  const [overtimeDisputeClockOutLocal, setOvertimeDisputeClockOutLocal] = useState('');
  const [overtimeDisputing, setOvertimeDisputing] = useState(false);
  const [scheduleApproveJobId, setScheduleApproveJobId] = useState<string | null>(null);
  const [scheduleRejectJobId, setScheduleRejectJobId] = useState<string | null>(null);
  const [payingScheduleJobId, setPayingScheduleJobId] = useState<string | null>(null);
  const [pendingGuardActionId, setPendingGuardActionId] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [selectedTipCents, setSelectedTipCents] = useState<number | null>(null);
  const [customTip, setCustomTip] = useState('');
  const [violationOpen, setViolationOpen] = useState(false);
  const [replacementBusy, setReplacementBusy] = useState(false);

  const rankedApplicants = useMemo(
    () =>
      req.status === 'open' && req.applicants.length
        ? rankGuardsForJob(req, guards, { applicantsOnly: true, allRequests: allRequests.length ? allRequests : [req] })
        : [],
    [req, guards, allRequests]
  );

  const pendingPerformance = pendingGuard
    ? computeGuardPerformance(pendingGuard.id, allRequests.length ? allRequests : [req])
    : null;

  const disputeClockOutIso = overtimeDisputeClockOutLocal
    ? new Date(overtimeDisputeClockOutLocal).toISOString()
    : null;
  const disputeClaimedHours = disputeClockOutIso
    ? computeLateClockOutHours(disputeClockOutIso, req.endDate)
    : 0;
  const disputeClaimedAmount = computeOvertimeAmount(
    disputeClaimedHours,
    req.hourlyRate,
    req.guardsNeeded ?? 1
  );

  const tipEnabled = canClientLeaveTip(req, paymentGates, hiredGuard);
  const customTipCents = parseTipDollarsToCents(customTip);
  const resolvedTipCents =
    selectedTipCents != null
      ? selectedTipCents
      : customTipCents != null && isValidTipCents(customTipCents)
        ? customTipCents
        : 0;

  const openReviewSheet = () => {
    setReviewSubmitting(false);
    setReviewRating(0);
    setReviewNote('');
    setSelectedTipCents(null);
    setCustomTip('');
    setReviewOpen(true);
  };

  const handlePayNow = async () => {
    setPayingJobId(req.id);
    try {
      const amountCents = Math.round(req.estimatedPayout * 100);
      const { url } = await createCheckoutSession({
        jobId: req.id,
        clientEmail,
        jobTitle: req.title,
        amountCents,
      });
      if (url) window.location.href = url;
    } catch (e: unknown) {
      showAppToast(e instanceof Error ? e.message : 'Unable to start checkout', { tone: 'error' });
    } finally {
      setPayingJobId(null);
    }
  };

  const handlePayOvertime = async () => {
    setPayingOvertimeJobId(req.id);
    try {
      const amountCents = Math.round((req.overtimeAmount ?? 0) * 100);
      const { url } = await createOvertimeCheckoutSession({
        jobId: req.id,
        clientEmail,
        jobTitle: req.title,
        amountCents,
      });
      if (url) window.location.href = url;
    } catch (e: unknown) {
      showAppToast(e instanceof Error ? e.message : 'Unable to start overtime checkout', { tone: 'error' });
    } finally {
      setPayingOvertimeJobId(null);
    }
  };

  const handlePayScheduleExtension = async () => {
    setPayingScheduleJobId(req.id);
    try {
      const amountCents = Math.round((req.scheduleChangeExtraAmount ?? 0) * 100);
      const { url } = await createScheduleChangeCheckoutSession({
        jobId: req.id,
        clientEmail,
        jobTitle: req.title,
        amountCents,
      });
      if (url) window.location.href = url;
    } catch (e: unknown) {
      showAppToast(e instanceof Error ? e.message : 'Unable to start schedule payment', { tone: 'error' });
    } finally {
      setPayingScheduleJobId(null);
    }
  };

  const openDispute = () => {
    setOvertimeDisputeReason('');
    setOvertimeDisputeClockOutLocal(toDatetimeLocal(req.endDate));
    setOvertimeDisputeOpen(true);
  };

  const showEditActions = context === 'jobs' && onRequestEdit;

  return (
    <>
      <div className="client-job-actions space-y-4 w-full">
        {isMultiGuardJob(req) && billingSettings && fullCrewAwaitingClient && (
          <CrewTeamUpcostNotice req={req} crewSettings={billingSettings} />
        )}

        {independentSlotsPending && (
          <JobTeamRoster
            job={req}
            guards={guards}
            variant="client"
            showIndependentSlotActions
            slotFilter={(slot) => slot.status === 'pending_client' && !!slot.guardId}
            onApproveSlot={onApproveTeamSlot ? (slotId) => void onApproveTeamSlot(req.id, slotId) : undefined}
            onDenySlot={onDenyTeamSlot ? (slotId) => void onDenyTeamSlot(req.id, slotId) : undefined}
          />
        )}

        {fullCrewAwaitingClient && (
          <JobTeamRoster
            job={req}
            guards={guards}
            variant="client"
            showFullTeamActions={!!(onApproveFullTeam && onDenyFullTeam)}
            onApproveFullTeam={onApproveFullTeam ? () => void onApproveFullTeam(req.id) : undefined}
            onDenyFullTeam={onDenyFullTeam ? () => void onDenyFullTeam(req.id) : undefined}
          />
        )}

        {showEditActions && isJobScheduleLocked(req) && !canClientReschedulePaidSchedule(req) && (
          <p className="text-xs text-brand-text-muted border-t border-brand-border pt-3">
            Schedule is locked after payment. You can still update the job title and location.
          </p>
        )}

        {showEditActions && canClientEditJobListing(req) && (
          <div className="flex flex-wrap gap-2 w-full">
            <button
              type="button"
              onClick={() => onRequestEdit(req.id)}
              className="app-button-outline !w-auto !h-9 !px-4 !text-xs"
            >
              <Pencil className="w-3 h-3 inline" />{' '}
              {canClientReschedulePaidSchedule(req)
                ? 'Reschedule'
                : isJobScheduleLocked(req)
                  ? 'Edit title & location'
                  : 'Edit'}
            </button>
            {onCancelRequest && canClientCancelRequest(req) && (
              <button
                type="button"
                onClick={() => {
                  void (async () => {
                    if (
                      await showAppConfirm({
                        title: 'Cancel job?',
                        message: `Cancel "${req.title}"?`,
                        confirmLabel: 'Cancel job',
                        tone: 'danger',
                      })
                    ) {
                      onCancelRequest(req.id);
                    }
                  })();
                }}
                className="app-button-outline !w-auto !h-9 !px-4 !text-xs text-red-400 border-red-500/40"
              >
                <X className="w-3 h-3 inline" /> Cancel
              </button>
            )}
          </div>
        )}

        {req.status === 'pending-review' && (
          <div className="border-t border-brand-border pt-3 w-full">
            <p className="text-xs text-amber-400/95 leading-relaxed">
              Waiting for staff approval. You can pay after Guardr approves this job offer; guards apply and staff approves the best fit.
            </p>
          </div>
        )}

        {req.status === 'open' && (
          <div className="border-t border-brand-border pt-3 space-y-3 w-full">
            {isOpenContractPricing(req.pricingMode) &&
              feeConfig &&
              (pendingGuard ? [pendingGuard.id] : req.applicants).map((guardId) => {
                const guard = guards.find((g) => g.id === guardId);
                if (!guard) return null;
                return (
                  <PriceNegotiationPanel
                    key={`negotiation-${guardId}`}
                    job={req}
                    guardId={guardId}
                    guardName={guard.name}
                    viewerRole="client"
                    feeConfig={feeConfig}
                    onSubmitOffer={
                      onSubmitPriceOffer
                        ? (input) => void onSubmitPriceOffer(req.id, guardId, input)
                        : undefined
                    }
                    onAcceptOffer={
                      onAcceptPriceOffer
                        ? (offerId) => void onAcceptPriceOffer(req.id, guardId, offerId)
                        : undefined
                    }
                  />
                );
              })}
            {awaitingClientGuard && pendingGuard && onApprovePendingGuard && onDenyPendingGuard && !isMultiGuardJob(req) && (
              <div className="rounded-xl border border-brand-primary/30 bg-brand-primary/10 px-3 py-3 space-y-3">
                <div className="flex items-start gap-3">
                  <ProfileAvatar src={pendingGuard.avatar} name={pendingGuard.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-brand-text">Approve your guard</p>
                    <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">
                      Guardr approved <span className="font-medium text-brand-text">{pendingGuard.name}</span> for this job. Confirm to hire them, or decline to send the job back to the applicant list.
                    </p>
                    <p className="text-xs text-brand-text-muted mt-1 flex flex-wrap items-center gap-2">
                      <GuardArmedStatusPill guard={pendingGuard} />
                      <span>★ {pendingGuard.rating.toFixed(1)}</span>
                      {pendingPerformance && pendingPerformance.overallScore > 0 && (
                        <span>Security score {formatPerformanceScore(pendingPerformance.overallScore)}</span>
                      )}
                      <span>{pendingGuard.jobsCompleted} jobs completed</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setPendingGuardActionId(req.id);
                      try {
                        await onApprovePendingGuard(req.id);
                      } finally {
                        setPendingGuardActionId(null);
                      }
                    }}
                    disabled={pendingGuardActionId === req.id}
                    className="app-button-primary !w-auto !h-9 !px-5 !text-xs gap-1.5 disabled:opacity-50"
                  >
                    {pendingGuardActionId === req.id ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Confirming...</>
                    ) : (
                      <><CheckCircle2 className="w-3.5 h-3.5" /> Approve guard</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setPendingGuardActionId(req.id);
                      try {
                        await onDenyPendingGuard(req.id);
                      } finally {
                        setPendingGuardActionId(null);
                      }
                    }}
                    disabled={pendingGuardActionId === req.id}
                    className="app-button-outline !w-auto !h-9 !px-5 !text-xs gap-1.5 text-red-400 border-red-500/40 disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" /> Decline guard
                  </button>
                </div>
              </div>
            )}
            {rankedApplicants.length > 1 && !awaitingClientGuard && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
                  Qualified applicants (ranked)
                </p>
                {rankedApplicants.slice(0, 5).map((score, index) => (
                  <GuardMatchScoreRow
                    key={score.guard.id}
                    score={score}
                    rank={index + 1}
                    allRequests={allRequests.length ? allRequests : [req]}
                  />
                ))}
              </div>
            )}
            {isClientCashPaymentPendingApproval(req) && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
                <p className="text-sm font-semibold text-amber-300">Cash payment pending approval</p>
                <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
                  {clientPaymentStatusHint(req.paymentStatus, req.status, req)}
                </p>
              </div>
            )}
            {(canClientPayForJob(req, paymentGates) || canClientRequestCashPayment(req, paymentGates)) && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-brand-primary font-semibold">Pay for this job</p>
                  <p className="text-xs text-brand-text-muted mt-0.5">
                    {clientPaymentStatusHint(req.paymentStatus, req.status, req, paymentGates)} Total: ${req.estimatedPayout.toFixed(2)}.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  {canClientPayForJob(req, paymentGates) && (
                    <button
                      type="button"
                      onClick={() => void handlePayNow()}
                      disabled={payingJobId === req.id || cashRequestJobId === req.id}
                      className="app-button-primary !w-auto !h-9 !px-5 !text-xs gap-1.5 disabled:opacity-50"
                    >
                      {payingJobId === req.id ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Redirecting...</>
                      ) : (
                        <><CreditCard className="w-3.5 h-3.5" /> Pay by card</>
                      )}
                    </button>
                  )}
                  {canClientRequestCashPayment(req, paymentGates) && onRequestCashPayment && (
                    <button
                      type="button"
                      onClick={async () => {
                        setCashRequestJobId(req.id);
                        try {
                          await onRequestCashPayment(req.id);
                        } finally {
                          setCashRequestJobId(null);
                        }
                      }}
                      disabled={payingJobId === req.id || cashRequestJobId === req.id}
                      className="app-button-outline !w-auto !h-9 !px-5 !text-xs gap-1.5 disabled:opacity-50"
                    >
                      {cashRequestJobId === req.id ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Requesting...</>
                      ) : (
                        <><Banknote className="w-3.5 h-3.5" /> Pay in cash</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
            {(req.paymentStatus === 'paid' || req.paymentStatus === 'held' || req.paymentStatus === 'released') && (
              <p className="text-xs text-emerald-400/90 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {clientPaymentStatusLabel(req.paymentStatus, req)}
                {clientPaymentStatusHint(req.paymentStatus, req.status, req)
                  ? ` — ${clientPaymentStatusHint(req.paymentStatus, req.status, req)}`
                  : ''}
              </p>
            )}
          </div>
        )}

        {req.status === 'accepted' && hiredGuard && !hideMessaging && onOpenJobChat && currentUser && (
          <div className="border-t border-brand-border pt-3 w-full">
            <button
              type="button"
              onClick={() => onOpenJobChat(req.id)}
              className="app-button-outline !h-9 !text-xs w-full gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Message guard
            </button>
          </div>
        )}

        {(req.status === 'accepted' || req.status === 'in-progress') && onRequestReplacement && (
          <div className="border-t border-brand-border pt-3 w-full">
            <ReplacementRequestPanel
              request={req}
              busy={replacementBusy}
              onRequestReplacement={async (requestId, reasonNote) => {
                setReplacementBusy(true);
                try {
                  await onRequestReplacement(requestId, reasonNote);
                } finally {
                  setReplacementBusy(false);
                }
              }}
            />
          </div>
        )}

        {hasOvertime(req) && (
          <div className="border-t border-brand-border pt-3 space-y-3 w-full">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
              <p className="text-sm font-semibold text-amber-300">Late clock-out overtime</p>
              <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
                Your guard clocked out {(req.overtimeHours ?? 0)}h after the scheduled end.
                {req.overtimeStatus === 'pending_guard' && ' Overtime recorded — awaiting your confirmation.'}
                {req.overtimeStatus === 'pending_client' && ` Additional charge: $${(req.overtimeAmount ?? 0).toFixed(2)} — approve to proceed.`}
                {isOvertimeDisputed(req) && (
                  <>
                    {' Staff is reviewing your dispute.'}
                    {req.overtimeDisputeClaimedClockOutAt && (
                      <>
                        {' You claimed the guard left at '}
                        {new Date(req.overtimeDisputeClaimedClockOutAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                        .
                      </>
                    )}
                  </>
                )}
                {isOvertimeWaived(req) && ' Overtime charge was waived after your dispute.'}
                {req.overtimeStatus === 'awaiting_payment' && ` Approved charge: $${(req.overtimeAmount ?? 0).toFixed(2)}.`}
                {req.overtimeStatus === 'paid' && ` Overtime of $${(req.overtimeAmount ?? 0).toFixed(2)} has been paid.`}
              </p>
            </div>

            {canClientApproveOvertime(req) && onApproveOvertime && (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setOvertimeApproveJobId(req.id);
                    try {
                      await onApproveOvertime(req.id);
                    } finally {
                      setOvertimeApproveJobId(null);
                    }
                  }}
                  disabled={overtimeApproveJobId === req.id || overtimeDisputing}
                  className="app-button-primary !h-9 !text-xs flex-1 gap-1.5 disabled:opacity-50"
                >
                  {overtimeApproveJobId === req.id ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Approving...</>
                  ) : (
                    <><CheckCircle2 className="w-3.5 h-3.5" /> Approve overtime ${(req.overtimeAmount ?? 0).toFixed(2)}</>
                  )}
                </button>
                {onDisputeOvertime && (
                  <button
                    type="button"
                    onClick={openDispute}
                    disabled={overtimeApproveJobId === req.id || overtimeDisputing}
                    className="app-button-outline !h-9 !text-xs flex-1 gap-1.5 disabled:opacity-50"
                  >
                    Dispute charge
                  </button>
                )}
              </div>
            )}

            {isOvertimeCashPaymentPendingApproval(req) && (
              <p className="text-xs text-amber-400/90">Cash overtime payment pending staff approval.</p>
            )}

            {hasUnpaidOvertime(req) && (
              <div className="flex flex-col sm:flex-row gap-2">
                {canClientPayOvertimeStripe(req, paymentGates) && (
                  <button
                    type="button"
                    onClick={() => void handlePayOvertime()}
                    disabled={payingOvertimeJobId === req.id || overtimeCashRequestJobId === req.id}
                    className="app-button-primary !h-9 !text-xs flex-1 gap-1.5 disabled:opacity-50"
                  >
                    {payingOvertimeJobId === req.id ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Redirecting...</>
                    ) : (
                      <><CreditCard className="w-3.5 h-3.5" /> Pay ${(req.overtimeAmount ?? 0).toFixed(2)} by card</>
                    )}
                  </button>
                )}
                {canClientRequestOvertimeCash(req, paymentGates) && onRequestOvertimeCash && (
                  <button
                    type="button"
                    onClick={async () => {
                      setOvertimeCashRequestJobId(req.id);
                      try {
                        await onRequestOvertimeCash(req.id);
                      } finally {
                        setOvertimeCashRequestJobId(null);
                      }
                    }}
                    disabled={payingOvertimeJobId === req.id || overtimeCashRequestJobId === req.id}
                    className="app-button-outline !h-9 !text-xs flex-1 gap-1.5 disabled:opacity-50"
                  >
                    {overtimeCashRequestJobId === req.id ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Requesting...</>
                    ) : (
                      <><Banknote className="w-3.5 h-3.5" /> Pay in cash</>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {(req.scheduleChangeStatus === 'pending_client' ||
          req.scheduleChangeStatus === 'awaiting_payment' ||
          req.scheduleChangeStatus === 'pending_staff_billing') && (
          <div className="border-t border-brand-border pt-3 space-y-3 w-full">
            <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2.5">
              <p className="text-sm font-semibold text-sky-300">Schedule change</p>
              <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
                {req.scheduleChangeStatus === 'pending_client' && req.pendingStartDate && req.pendingEndDate && (
                  <>
                    Guardr proposed new times:{' '}
                    <span className="text-brand-text">
                      {formatShiftRange(req.pendingStartDate, req.pendingEndDate)}
                    </span>
                    {(req.scheduleChangeExtraAmount ?? 0) > 0
                      ? ` · additional $${(req.scheduleChangeExtraAmount ?? 0).toFixed(2)} if approved`
                      : ''}
                  </>
                )}
                {req.scheduleChangeStatus === 'awaiting_payment' &&
                  ` Approved extension: $${(req.scheduleChangeExtraAmount ?? 0).toFixed(2)} — pay to update the listing.`}
                {req.scheduleChangeStatus === 'pending_staff_billing' &&
                  ' Approved — Guardr is confirming cash billing before guards are notified.'}
              </p>
            </div>

            {canClientApproveStaffScheduleChange(req) && onApproveScheduleChange && onRejectScheduleChange && (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setScheduleApproveJobId(req.id);
                    try {
                      await onApproveScheduleChange(req.id);
                    } finally {
                      setScheduleApproveJobId(null);
                    }
                  }}
                  disabled={scheduleApproveJobId === req.id || scheduleRejectJobId === req.id}
                  className="app-button-primary !h-9 !text-xs flex-1 gap-1.5 disabled:opacity-50"
                >
                  {scheduleApproveJobId === req.id ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Approving...</>
                  ) : (
                    <><CheckCircle2 className="w-3.5 h-3.5" /> Approve new times</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setScheduleRejectJobId(req.id);
                    try {
                      await onRejectScheduleChange(req.id);
                    } finally {
                      setScheduleRejectJobId(null);
                    }
                  }}
                  disabled={scheduleApproveJobId === req.id || scheduleRejectJobId === req.id}
                  className="app-button-outline !h-9 !text-xs flex-1 gap-1.5 disabled:opacity-50"
                >
                  {scheduleRejectJobId === req.id ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Declining...</>
                  ) : (
                    'Decline'
                  )}
                </button>
              </div>
            )}

            {canClientPayScheduleChangeExtension(req) && paymentGates.allowStripe && (
              <button
                type="button"
                onClick={() => void handlePayScheduleExtension()}
                disabled={payingScheduleJobId === req.id}
                className="app-button-primary !h-9 !text-xs w-full gap-1.5 disabled:opacity-50"
              >
                {payingScheduleJobId === req.id ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Starting checkout...</>
                ) : (
                  <><CreditCard className="w-3.5 h-3.5" /> Pay ${(req.scheduleChangeExtraAmount ?? 0).toFixed(2)} extension</>
                )}
              </button>
            )}
          </div>
        )}

        {onConfirmSelfAudit && <ClientSelfAuditConfirm request={req} onConfirm={onConfirmSelfAudit} />}

        {req.status === 'in-progress' && hiredGuard && onUpdateStatus && context === 'jobs' && (
          <button
            type="button"
            onClick={() => onUpdateStatus(req.id, 'completed')}
            className="app-button-primary !h-9 !text-xs w-full"
          >
            <Check className="w-3.5 h-3.5 inline" /> Complete job
          </button>
        )}

        {!hideMessaging &&
          req.status === 'in-progress' &&
          hiredGuard &&
          onOpenJobChat &&
          currentUser &&
          context === 'jobs' && (
            <button
              type="button"
              onClick={() => onOpenJobChat(req.id)}
              className="app-button-outline !h-9 !text-xs w-full gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Message guard on shift
            </button>
          )}

        {(req.status === 'completed' || req.status === 'closed') &&
          onOpenJobChat &&
          threadForRequest(jobChatThreads, req.id) && (
            <button
              type="button"
              onClick={() => onOpenJobChat(req.id)}
              className="app-button-outline !h-9 !text-xs w-full gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" /> View job chat history
            </button>
          )}

        {req.status === 'completed' && hiredGuard && req.ratingGiven && req.tipPaymentStatus === 'paid' && (req.tipAmount ?? 0) > 0 && (
          <p className="text-xs text-brand-text-muted border-t border-brand-border pt-3 w-full">
            You left a {formatTipAmountCents(Math.round((req.tipAmount ?? 0) * 100))} tip for {hiredGuard.name}.
          </p>
        )}

        {req.status === 'completed' && hiredGuard && !req.ratingGiven && onAddReview && (
          <div className="border-t border-brand-border pt-3 w-full">
            <button
              type="button"
              onClick={openReviewSheet}
              className="app-button-outline !w-full !h-9 !text-xs gap-1.5"
            >
              <Award className="w-3.5 h-3.5" /> Rate guard
            </button>
          </div>
        )}

        {onReportViolation && canClientReportViolation(req) && (
          <div className={`${req.status === 'completed' && hiredGuard && !req.ratingGiven && onAddReview ? 'pt-2' : 'border-t border-brand-border pt-3'} w-full`}>
            <button
              type="button"
              onClick={() => setViolationOpen(true)}
              className="client-violation-report-btn app-button-outline !w-full !h-9 !text-xs gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Report violation
              {listClientViolationReports(req).length > 0
                ? ` (${listClientViolationReports(req).length})`
                : ''}
            </button>
          </div>
        )}
      </div>

      <AppFormSheet
        open={overtimeDisputeOpen}
        onClose={() => {
          if (overtimeDisputing) return;
          setOvertimeDisputeOpen(false);
        }}
        title="Dispute late clock-out charge"
      >
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-brand-text-muted">Guard&apos;s actual clock-out time</span>
            <input
              type="datetime-local"
              value={overtimeDisputeClockOutLocal}
              min={toDatetimeLocal(req.checkInAudit?.checkedAt ?? req.startDate)}
              max={toDatetimeLocal(req.checkOutAudit?.checkedAt ?? new Date().toISOString())}
              onChange={(e) => setOvertimeDisputeClockOutLocal(e.target.value)}
              className="uber-input w-full"
            />
            <p className="text-xs text-brand-text-muted leading-relaxed">
              Recorded clock-out:{' '}
              {req.checkOutAudit?.checkedAt
                ? new Date(req.checkOutAudit.checkedAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : '—'}
              . Your claim implies {disputeClaimedHours}h overtime (${disputeClaimedAmount.toFixed(2)}).
            </p>
          </label>
          <textarea
            placeholder="e.g. The guard left at the scheduled end time, or the billed hours are incorrect..."
            value={overtimeDisputeReason}
            onChange={(e) => setOvertimeDisputeReason(e.target.value)}
            className="uber-input w-full min-h-[120px] resize-y"
            rows={4}
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              disabled={overtimeDisputing}
              onClick={() => setOvertimeDisputeOpen(false)}
              className="app-button-outline flex-1 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!overtimeDisputeReason.trim() || !disputeClockOutIso || !onDisputeOvertime || overtimeDisputing}
              onClick={async () => {
                if (!onDisputeOvertime || !disputeClockOutIso) return;
                setOvertimeDisputing(true);
                try {
                  await onDisputeOvertime(req.id, {
                    reason: overtimeDisputeReason,
                    claimedClockOutAt: disputeClockOutIso,
                  });
                  setOvertimeDisputeOpen(false);
                } finally {
                  setOvertimeDisputing(false);
                }
              }}
              className="app-button-primary flex-1 disabled:opacity-50 gap-1.5"
            >
              {overtimeDisputing ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...</>
              ) : (
                'Submit dispute'
              )}
            </button>
          </div>
        </div>
      </AppFormSheet>

      <AppFormSheet
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title="Rate guard"
        subtitle={hiredGuard ? `How was ${hiredGuard.name} on "${req.title}"?` : undefined}
      >
        <div className="space-y-4">
          <div className="flex gap-1 justify-center py-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} type="button" onClick={() => setReviewRating(s)} aria-label={`${s} star${s === 1 ? '' : 's'}`}>
                <Star
                  className={`w-8 h-8 ${reviewRating >= s ? 'fill-brand-primary text-brand-primary' : 'text-brand-border'}`}
                />
              </button>
            ))}
          </div>
          <textarea
            placeholder="Optional review note..."
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            className="uber-input w-full min-h-[100px] resize-y"
            rows={3}
          />
          {tipEnabled && (
            <div className="client-tip-section space-y-3">
              <div className="client-tip-section-head">
                <DollarSign className="w-4 h-4 text-brand-primary" aria-hidden />
                <div>
                  <p className="client-tip-section-title">Add a tip (optional)</p>
                  <p className="client-tip-section-subtitle">100% goes to {hiredGuard?.name ?? 'your guard'}</p>
                </div>
              </div>
              <div className="client-tip-presets">
                <button
                  type="button"
                  className={`client-tip-preset ${selectedTipCents === 0 && !customTip ? 'client-tip-preset-active' : ''}`}
                  onClick={() => {
                    setSelectedTipCents(0);
                    setCustomTip('');
                  }}
                >
                  No tip
                </button>
                {TIP_PRESET_CENTS.map((cents) => (
                  <button
                    key={cents}
                    type="button"
                    className={`client-tip-preset ${selectedTipCents === cents ? 'client-tip-preset-active' : ''}`}
                    onClick={() => {
                      setSelectedTipCents(cents);
                      setCustomTip('');
                    }}
                  >
                    {formatTipAmountCents(cents)}
                  </button>
                ))}
              </div>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-brand-text-muted">Custom amount</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="$15.00"
                  value={customTip}
                  onChange={(e) => {
                    setCustomTip(e.target.value);
                    setSelectedTipCents(null);
                  }}
                  className="uber-input w-full"
                />
              </label>
              {customTip && customTipCents != null && !isValidTipCents(customTipCents) && (
                <p className="text-xs text-amber-500">Minimum tip is $1.00</p>
              )}
            </div>
          )}
          <button
            type="button"
            disabled={
              reviewSubmitting ||
              (customTip.length > 0 && customTipCents != null && !isValidTipCents(customTipCents))
            }
            onClick={async () => {
              if (reviewSubmitting) return;
              setReviewSubmitting(true);
              try {
                const tipCents = resolvedTipCents > 0 ? resolvedTipCents : undefined;
                const redirectUrl = await onAddReview?.(
                  req.id,
                  reviewRating || 5,
                  reviewNote || 'Good work.',
                  tipCents
                );
                setReviewOpen(false);
                if (redirectUrl) {
                  window.location.href = redirectUrl;
                  return;
                }
                showAppToast(
                  tipCents
                    ? 'Review saved. Complete card checkout to send your tip.'
                    : 'Review submitted. Thank you!',
                  { tone: 'success' }
                );
              } catch (e: unknown) {
                showAppToast(e instanceof Error ? e.message : 'Could not submit review', { tone: 'error' });
              } finally {
                setReviewSubmitting(false);
              }
            }}
            className="app-button-primary w-full disabled:opacity-50"
          >
            {reviewSubmitting
              ? 'Submitting…'
              : resolvedTipCents > 0
                ? `Submit review & tip ${formatTipAmountCents(resolvedTipCents)}`
                : 'Submit review'}
          </button>
        </div>
      </AppFormSheet>

      {onReportViolation && (
        <ClientViolationReportSheet
          open={violationOpen}
          onClose={() => setViolationOpen(false)}
          request={req}
          hiredGuard={hiredGuard}
          onSubmit={onReportViolation}
        />
      )}
    </>
  );
}
