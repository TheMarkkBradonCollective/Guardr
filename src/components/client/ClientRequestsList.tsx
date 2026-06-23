import React, { useMemo, useState } from 'react';
import { SecurityRequest, SecurityGuard, JobStatus } from '../../types';
import type { ClientPaymentGates } from '../../lib/platformSettings';
import { JOB_STATUS_LABELS, jobPostingTypeLabel } from '../../lib/jobStatus';
import { createCheckoutSession, createOvertimeCheckoutSession } from '../../lib/stripeApi';
import {
  canClientApproveOvertime,
  canClientPayOvertimeStripe,
  canClientRequestOvertimeCash,
  hasOvertime,
  hasUnpaidOvertime,
  isOvertimeCashPaymentPendingApproval,
} from '../../lib/shiftBilling';
import { showAppToast } from '../ui/AppToast';
import { showAppConfirm } from '../ui/AppConfirm';
import { JobBillingSummaryFromRequest } from '../jobs/JobBillingSummary';
import { JobListingProfile } from '../jobs/JobListingProfile';
import { JobListCard } from '../jobs/JobListCard';
import { AppFormSheet } from '../ui/app/AppFormSheet';
import { AppItemCardStack, AppScreen, AppSection } from '../ui/app/AppPrimitives';
import { WfBadge, WfSearchBar } from '../ui/wireframe';
import {
  Award,
  Banknote,
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  MessageCircle,
  Pencil,
  Shield,
  Star,
  X,
} from 'lucide-react';
import { isJobChatEligible, threadForRequest } from '../../lib/jobChat';
import { JobChatMessage, JobChatThread, SessionUser } from '../../types';
import {
  canClientCancelRequest,
  canClientEditJobListing,
  canClientEditRequest,
  canClientPayForJob,
  canClientRequestCashPayment,
  isJobScheduleLocked,
} from '../../lib/jobEditRules';
import { clientPaymentStatusHint, clientPaymentStatusLabel } from '../../lib/paymentDisplay';
import { isClientCashPaymentPendingApproval } from '../../lib/cashPayments';
import { isAwaitingClientGuardApproval } from '../../lib/guardAssignment';
import { EditRequestSheet } from '../jobs/EditRequestSheet';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { ClientSelfAuditConfirm } from './ClientSelfAuditConfirm';
import { ClientSpotCheckConfirm } from './ClientSpotCheckConfirm';

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
  onRequestOvertimeCash?: (requestId: string) => void | Promise<void>;
  onApprovePendingGuard?: (requestId: string) => void | Promise<void>;
  onDenyPendingGuard?: (requestId: string) => void | Promise<void>;
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
  onRequestOvertimeCash,
  onApprovePendingGuard,
  onDenyPendingGuard,
  onRequestNew,
  currentUser,
  jobChatThreads = [],
  onSendJobChatMessage,
  onOpenJobChat,
}: ClientRequestsListProps) {
  const [search, setSearch] = useState('');
  const [reviewRating, setReviewRating] = useState<{ [reqId: string]: number }>({});
  const [reviewNote, setReviewNote] = useState<{ [reqId: string]: string }>({});
  const [payingJobId, setPayingJobId] = useState<string | null>(null);
  const [payingOvertimeJobId, setPayingOvertimeJobId] = useState<string | null>(null);
  const [cashRequestJobId, setCashRequestJobId] = useState<string | null>(null);
  const [overtimeCashRequestJobId, setOvertimeCashRequestJobId] = useState<string | null>(null);
  const [overtimeApproveJobId, setOvertimeApproveJobId] = useState<string | null>(null);
  const [pendingGuardActionId, setPendingGuardActionId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const editingRequest = editingId ? requests.find((r) => r.id === editingId) ?? null : null;
  const reviewingRequest = reviewingId ? requests.find((r) => r.id === reviewingId) ?? null : null;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return requests.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q)
    );
  }, [requests, search]);

  const handlePayNow = async (req: SecurityRequest) => {
    setPayingJobId(req.id);
    try {
      const amountCents = Math.round(req.estimatedPayout * 100);
      const { url } = await createCheckoutSession({
        jobId: req.id,
        clientEmail,
        jobTitle: req.title,
        amountCents,
      });
      if (url) {
        window.location.href = url;
      }
    } catch (e: unknown) {
      showAppToast(e instanceof Error ? e.message : 'Unable to start checkout', { tone: 'error' });
    } finally {
      setPayingJobId(null);
    }
  };

  const handlePayOvertime = async (req: SecurityRequest) => {
    setPayingOvertimeJobId(req.id);
    try {
      const amountCents = Math.round((req.overtimeAmount ?? 0) * 100);
      const { url } = await createOvertimeCheckoutSession({
        jobId: req.id,
        clientEmail,
        jobTitle: req.title,
        amountCents,
      });
      if (url) {
        window.location.href = url;
      }
    } catch (e: unknown) {
      showAppToast(e instanceof Error ? e.message : 'Unable to start overtime checkout', { tone: 'error' });
    } finally {
      setPayingOvertimeJobId(null);
    }
  };

  const handleRequestCashPayment = async (req: SecurityRequest) => {
    if (!onRequestCashPayment) return;
    setCashRequestJobId(req.id);
    try {
      await onRequestCashPayment(req.id);
    } finally {
      setCashRequestJobId(null);
    }
  };

  return (
    <AppScreen>
      <div className="flex items-center justify-end gap-4 px-5 pt-2 pb-4 border-b border-brand-border">
        <button
          type="button"
          onClick={onRequestNew}
          className="app-button-primary !w-auto !h-10 !px-4 !text-sm shrink-0"
        >
          + Post offer
        </button>
      </div>

      <div className="px-5 py-4 border-b border-brand-border">
        {requests.length > 0 && (
          <WfSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search jobs..."
          />
        )}
      </div>

      <AppSection title="All jobs">
      {requests.length === 0 ? (
        <div className="app-empty-state">
          <Shield className="w-10 h-10 text-brand-primary/30 mx-auto mb-3" />
          <p className="text-brand-text-muted text-sm text-center">No jobs yet.</p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-brand-text-muted py-12">No jobs match your search.</p>
      ) : (
        <AppItemCardStack>
          {filtered.map((req) => {
            const hiredGuard = guards.find((g) => g.id === req.assignedGuardId);
            const pendingGuard = req.pendingGuardId
              ? guards.find((g) => g.id === req.pendingGuardId)
              : undefined;
            const awaitingClientGuard = isAwaitingClientGuardApproval(req);
            const isExpanded = expandedId === req.id;

            if (!isExpanded) {
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
                      {awaitingClientGuard && (
                        <WfBadge tone="warning">Guard pending your approval</WfBadge>
                      )}
                      <WfBadge tone={paymentBadgeTone(req.paymentStatus, req)}>{clientPaymentStatusLabel(req.paymentStatus, req)}</WfBadge>
                    </div>
                  }
                  onClick={() => setExpandedId(req.id)}
                  showStatus={false}
                />
              );
            }

            return (
              <div key={req.id} className="space-y-4">
                <JobListCard
                  job={req}
                  subtitle={req.siteName ? `${req.siteName} · ${req.clientName}` : req.clientName}
                  meta={
                    <div className="flex flex-wrap items-center gap-1.5">
                      <WfBadge tone={req.requestType === 'direct' ? 'primary' : 'default'}>
                        {jobPostingTypeLabel(req.requestType)}
                      </WfBadge>
                      <WfBadge tone={statusBadgeTone(req.status)}>{JOB_STATUS_LABELS[req.status]}</WfBadge>
                      {awaitingClientGuard && (
                        <WfBadge tone="warning">Guard pending your approval</WfBadge>
                      )}
                      <WfBadge tone={paymentBadgeTone(req.paymentStatus, req)}>{clientPaymentStatusLabel(req.paymentStatus, req)}</WfBadge>
                    </div>
                  }
                  onClick={() => setExpandedId(null)}
                  showStatus={false}
                  selected
                />

                <div className="staff-detail-pane space-y-4">
                <JobListingProfile
                  job={req}
                  showClientHeader={false}
                  showBadges={false}
                  payLine={<JobBillingSummaryFromRequest req={req} variant="client" />}
                />

                {isJobScheduleLocked(req) && (
                  <p className="text-xs text-brand-text-muted border-t border-brand-border pt-3">
                    Schedule is locked after payment. You can still update the job title and location.
                  </p>
                )}

                {canClientEditJobListing(req) && (
                  <div className="flex flex-wrap gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => setEditingId(req.id)}
                      className="app-button-outline !w-auto !h-9 !px-4 !text-xs"
                    >
                      <Pencil className="w-3 h-3 inline" /> {isJobScheduleLocked(req) ? 'Edit title & location' : 'Edit'}
                    </button>
                    {canClientCancelRequest(req) && (
                      <button
                        type="button"
                        onClick={() => {
                          void (async () => {
                            if (await showAppConfirm({
                              title: 'Cancel job?',
                              message: `Cancel "${req.title}"?`,
                              confirmLabel: 'Cancel job',
                              tone: 'danger',
                            })) {
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
                    {awaitingClientGuard && pendingGuard && onApprovePendingGuard && onDenyPendingGuard && (
                      <div className="rounded-xl border border-brand-primary/30 bg-brand-primary/10 px-3 py-3 space-y-3">
                        <div className="flex items-start gap-3">
                          <ProfileAvatar src={pendingGuard.avatar} name={pendingGuard.name} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-brand-text">Approve your guard</p>
                            <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">
                              Guardr approved <span className="font-medium text-brand-text">{pendingGuard.name}</span> for this job.
                              Confirm to hire them, or decline to send the job back to the applicant list.
                            </p>
                            <p className="text-xs text-brand-text-muted mt-1">
                              ★ {pendingGuard.rating.toFixed(1)} · {pendingGuard.jobsCompleted} jobs completed
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
                              onClick={() => handlePayNow(req)}
                              disabled={payingJobId === req.id || cashRequestJobId === req.id}
                              className="app-button-primary !w-auto !h-9 !px-5 !text-xs gap-1.5 disabled:opacity-50"
                            >
                              {payingJobId === req.id ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Redirecting...</>
                              ) : (
                                <><CreditCard className="w-3.5 h-3.5" /> Pay Now</>
                              )}
                            </button>
                          )}
                          {canClientRequestCashPayment(req, paymentGates) && onRequestCashPayment && (
                            <button
                              type="button"
                              onClick={() => handleRequestCashPayment(req)}
                              disabled={payingJobId === req.id || cashRequestJobId === req.id}
                              className="app-button-outline !w-auto !h-9 !px-5 !text-xs gap-1.5 disabled:opacity-50"
                            >
                              {cashRequestJobId === req.id ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Requesting...</>
                              ) : (
                                <><Banknote className="w-3.5 h-3.5" /> Pay in Cash</>
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
                        {clientPaymentStatusHint(req.paymentStatus, req.status, req) ? ` — ${clientPaymentStatusHint(req.paymentStatus, req.status, req)}` : ''}
                      </p>
                    )}
                    <p className="text-sm text-brand-text-muted">
                      {awaitingClientGuard ? (
                        <>Waiting for your approval on the guard Guardr recommended.</>
                      ) : req.applicants.length === 0 ? (
                        <>Guards can apply to this offer. Guardr staff will review applicants and send the best fit for your approval.</>
                      ) : (
                        <>
                          <span className="font-medium text-brand-text">{req.applicants.length} guard{req.applicants.length === 1 ? '' : 's'} applied.</span>
                          {' '}Staff will review applicants and send the best fit for your approval.
                        </>
                      )}
                    </p>
                  </div>
                )}

                {req.status === 'accepted' && hiredGuard && (
                  <div className="border-t border-brand-border pt-3 w-full space-y-2">
                    <p className="text-sm text-brand-text-muted leading-relaxed">
                      <span className="font-medium text-brand-text">{hiredGuard.name}</span> is assigned.
                      They will start the shift on site with a self-audit when clock-in opens — you can confirm their photos here once the job is in progress.
                    </p>
                    {onOpenJobChat && currentUser && onSendJobChatMessage && isJobChatEligible(req) && (
                      <button
                        type="button"
                        onClick={() => onOpenJobChat(req.id)}
                        className="app-button-outline !h-9 !text-xs w-full gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Message guard
                      </button>
                    )}
                  </div>
                )}

                {req.status === 'in-progress' && hiredGuard && onOpenJobChat && currentUser && onSendJobChatMessage && (
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

                {hasOvertime(req) && (
                  <div className="border-t border-brand-border pt-3 space-y-3 w-full">
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
                      <p className="text-sm font-semibold text-amber-300">Late clock-out overtime</p>
                      <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
                        Your guard clocked out {(req.overtimeHours ?? 0)}h after the scheduled end.
                        {req.overtimeStatus === 'pending_guard' && ' Waiting for the guard to confirm overtime.'}
                        {req.overtimeStatus === 'pending_client' && ` Additional charge: $${(req.overtimeAmount ?? 0).toFixed(2)} — approve to proceed.`}
                        {req.overtimeStatus === 'awaiting_payment' && ` Approved charge: $${(req.overtimeAmount ?? 0).toFixed(2)}.`}
                        {req.overtimeStatus === 'paid' && ` Overtime of $${(req.overtimeAmount ?? 0).toFixed(2)} has been paid.`}
                      </p>
                    </div>

                    {canClientApproveOvertime(req) && onApproveOvertime && (
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
                        disabled={overtimeApproveJobId === req.id}
                        className="app-button-primary !h-9 !text-xs w-full gap-1.5 disabled:opacity-50"
                      >
                        {overtimeApproveJobId === req.id ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Approving...</>
                        ) : (
                          <><CheckCircle2 className="w-3.5 h-3.5" /> Approve overtime ${(req.overtimeAmount ?? 0).toFixed(2)}</>
                        )}
                      </button>
                    )}

                    {isOvertimeCashPaymentPendingApproval(req) && (
                      <p className="text-xs text-amber-400/90">
                        Cash overtime payment pending staff approval.
                      </p>
                    )}

                    {hasUnpaidOvertime(req) && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        {canClientPayOvertimeStripe(req, paymentGates) && (
                          <button
                            type="button"
                            onClick={() => handlePayOvertime(req)}
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

                {onConfirmSelfAudit && (
                  <ClientSelfAuditConfirm request={req} onConfirm={onConfirmSelfAudit} />
                )}

                {onConfirmSpotCheck && (
                  <ClientSpotCheckConfirm request={req} onConfirm={onConfirmSpotCheck} />
                )}

                {req.status === 'in-progress' && hiredGuard && (
                  <button type="button" onClick={() => onUpdateStatus(req.id, 'completed')} className="app-button-primary !h-9 !text-xs w-full">
                    <Check className="w-3.5 h-3.5 inline" /> Complete job
                  </button>
                )}

                {req.status === 'completed' && hiredGuard && !req.ratingGiven && (
                  <div className="border-t border-brand-border pt-3 w-full">
                    <button
                      type="button"
                      onClick={() => setReviewingId(req.id)}
                      className="app-button-outline !w-full !h-9 !text-xs gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5" /> Rate guard
                    </button>
                  </div>
                )}
                </div>
              </div>
            );
          })}
        </AppItemCardStack>
      )}
      </AppSection>

      <EditRequestSheet
        open={!!editingRequest}
        request={editingRequest}
        scheduleLocked={editingRequest ? isJobScheduleLocked(editingRequest) : false}
        onSave={onEditRequest}
        onClose={() => setEditingId(null)}
      />

      <AppFormSheet
        open={!!reviewingRequest}
        onClose={() => setReviewingId(null)}
        title="Rate guard"
        subtitle={reviewingRequest ? `How was ${guards.find((g) => g.id === reviewingRequest.assignedGuardId)?.name ?? 'your guard'} on "${reviewingRequest.title}"?` : undefined}
      >
        {reviewingRequest && (
          <div className="space-y-4">
            <div className="flex gap-1 justify-center py-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" onClick={() => setReviewRating((p) => ({ ...p, [reviewingRequest.id]: s }))}>
                  <Star
                    className={`w-8 h-8 ${(reviewRating[reviewingRequest.id] || 0) >= s ? 'fill-brand-primary text-brand-primary' : 'text-brand-border'}`}
                  />
                </button>
              ))}
            </div>
            <textarea
              placeholder="Optional review note..."
              value={reviewNote[reviewingRequest.id] || ''}
              onChange={(e) => setReviewNote((p) => ({ ...p, [reviewingRequest.id]: e.target.value }))}
              className="uber-input w-full min-h-[100px] resize-y"
              rows={3}
            />
            <button
              type="button"
              onClick={() => {
                onAddReview(
                  reviewingRequest.id,
                  reviewRating[reviewingRequest.id] || 5,
                  reviewNote[reviewingRequest.id] || 'Good work.'
                );
                setReviewingId(null);
              }}
              className="app-button-primary w-full"
            >
              Submit review
            </button>
          </div>
        )}
      </AppFormSheet>
    </AppScreen>
  );
}
