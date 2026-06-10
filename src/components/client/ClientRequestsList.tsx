import React, { useMemo, useState } from 'react';
import { SecurityRequest, SecurityGuard, JobStatus } from '../../types';
import { JOB_STATUS_LABELS, jobPostingTypeLabel } from '../../lib/jobStatus';
import { createCheckoutSession } from '../../lib/stripeApi';
import { JobBillingSummaryFromRequest } from '../jobs/JobBillingSummary';
import { JobListingProfile } from '../jobs/JobListingProfile';
import { JobListCard } from '../jobs/JobListCard';
import { AppItemCardStack } from '../ui/app/AppPrimitives';
import { WfBadge, WfSearchBar } from '../ui/wireframe';
import {
  Activity,
  Award,
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  Pencil,
  Shield,
  Star,
  X,
} from 'lucide-react';
import { canClientCancelRequest, canClientEditRequest, canClientPayForJob, isJobPaid } from '../../lib/jobEditRules';
import { clientPaymentStatusHint, clientPaymentStatusLabel } from '../../lib/paymentDisplay';
import { EditRequestForm } from './EditRequestForm';

interface ClientRequestsListProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  clientEmail: string;
  onCancelRequest: (requestId: string) => void;
  onEditRequest: (requestId: string, updates: Partial<SecurityRequest>) => void | Promise<void>;
  onUpdateStatus: (requestId: string, status: SecurityRequest['status']) => void;
  onAddReview: (requestId: string, rating: number, reviewText: string) => void;
  onRequestNew: () => void;
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

function paymentBadgeTone(status?: SecurityRequest['paymentStatus']): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
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
  onCancelRequest,
  onEditRequest,
  onUpdateStatus,
  onAddReview,
  onRequestNew,
}: ClientRequestsListProps) {
  const [search, setSearch] = useState('');
  const [reviewRating, setReviewRating] = useState<{ [reqId: string]: number }>({});
  const [reviewNote, setReviewNote] = useState<{ [reqId: string]: string }>({});
  const [payingJobId, setPayingJobId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      alert(e instanceof Error ? e.message : 'Unable to start checkout');
    } finally {
      setPayingJobId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Your jobs</h1>
          <p className="text-sm text-brand-text-muted mt-1">Job offers and direct guard requests — payments and reviews</p>
        </div>
        <button
          type="button"
          onClick={onRequestNew}
          className="app-button-primary !w-auto !h-10 !px-4 !text-sm shrink-0"
        >
          + Post offer
        </button>
      </div>

      {requests.length > 0 && (
        <WfSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search jobs..."
        />
      )}

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
                      <WfBadge tone={paymentBadgeTone(req.paymentStatus)}>{clientPaymentStatusLabel(req.paymentStatus)}</WfBadge>
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
                      <WfBadge tone={paymentBadgeTone(req.paymentStatus)}>{clientPaymentStatusLabel(req.paymentStatus)}</WfBadge>
                    </div>
                  }
                  onClick={() => setExpandedId(null)}
                  showStatus={false}
                  selected
                />

                <div className="staff-detail-pane space-y-4">
                {editingId !== req.id && (
                  <JobListingProfile
                    job={req}
                    showClientHeader={false}
                    showBadges={false}
                    payLine={<JobBillingSummaryFromRequest req={req} variant="client" />}
                  />
                )}

                {editingId === req.id && (
                  <JobBillingSummaryFromRequest req={req} variant="client" />
                )}

                {isJobPaid(req) && (
                  <p className="text-xs text-brand-text-muted border-t border-brand-border pt-3">
                    Job locked — paid jobs cannot be edited.
                  </p>
                )}

                {editingId === req.id && canClientEditRequest(req) && (
                  <EditRequestForm
                    request={req}
                    onSave={onEditRequest}
                    onCancel={() => setEditingId(null)}
                  />
                )}

                {canClientEditRequest(req) && editingId !== req.id && (
                  <div className="flex flex-wrap gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => setEditingId(req.id)}
                      className="app-button-outline !w-auto !h-9 !px-4 !text-xs"
                    >
                      <Pencil className="w-3 h-3 inline" /> Edit
                    </button>
                    {canClientCancelRequest(req) && (
                      <button
                        type="button"
                        onClick={() => { if (window.confirm(`Cancel "${req.title}"?`)) onCancelRequest(req.id); }}
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
                    {canClientPayForJob(req) && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-brand-primary font-semibold">Pay for this job</p>
                          <p className="text-xs text-brand-text-muted mt-0.5">
                            {clientPaymentStatusHint(req.paymentStatus, req.status)} Total: ${req.estimatedPayout.toFixed(2)}.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePayNow(req)}
                          disabled={payingJobId === req.id}
                          className="app-button-primary !w-auto !h-9 !px-5 !text-xs gap-1.5 shrink-0 disabled:opacity-50"
                        >
                          {payingJobId === req.id ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Redirecting...</>
                          ) : (
                            <><CreditCard className="w-3.5 h-3.5" /> Pay Now</>
                          )}
                        </button>
                      </div>
                    )}
                    {(req.paymentStatus === 'paid' || req.paymentStatus === 'held' || req.paymentStatus === 'released') && (
                      <p className="text-xs text-emerald-400/90 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {clientPaymentStatusLabel(req.paymentStatus)}
                        {clientPaymentStatusHint(req.paymentStatus, req.status) ? ` — ${clientPaymentStatusHint(req.paymentStatus, req.status)}` : ''}
                      </p>
                    )}
                    <p className="text-sm text-brand-text-muted">
                      {req.applicants.length === 0 ? (
                        <>Guards can apply to this offer. Guardr staff will review applicants and approve the best fit.</>
                      ) : (
                        <>
                          <span className="font-medium text-brand-text">{req.applicants.length} guard{req.applicants.length === 1 ? '' : 's'} applied.</span>
                          {' '}Staff will approve who picks up this job.
                        </>
                      )}
                    </p>
                  </div>
                )}

                {req.status === 'accepted' && hiredGuard && (
                  <button type="button" onClick={() => onUpdateStatus(req.id, 'in-progress')} className="app-button-primary !h-9 !text-xs w-full">
                    <Activity className="w-3.5 h-3.5 inline" /> Start Deployment
                  </button>
                )}

                {req.status === 'in-progress' && hiredGuard && (
                  <button type="button" onClick={() => onUpdateStatus(req.id, 'completed')} className="app-button-primary !h-9 !text-xs w-full">
                    <Check className="w-3.5 h-3.5 inline" /> Complete job
                  </button>
                )}

                {req.status === 'completed' && hiredGuard && !req.ratingGiven && (
                  <div className="border-t border-brand-border pt-3 space-y-2 w-full">
                    <p className="uber-label flex items-center gap-1"><Award className="w-3.5 h-3.5" /> Rate guard</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} type="button" onClick={() => setReviewRating((p) => ({ ...p, [req.id]: s }))}>
                          <Star className={`w-5 h-5 ${(reviewRating[req.id] || 0) >= s ? 'fill-brand-primary text-brand-primary' : 'text-brand-border'}`} />
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Review..."
                        value={reviewNote[req.id] || ''}
                        onChange={(e) => setReviewNote((p) => ({ ...p, [req.id]: e.target.value }))}
                        className="uber-input flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => onAddReview(req.id, reviewRating[req.id] || 5, reviewNote[req.id] || 'Good work.')}
                        className="app-button-primary !w-auto !h-9 !px-4 !text-xs"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                )}
                </div>
              </div>
            );
          })}
        </AppItemCardStack>
      )}
    </div>
  );
}
