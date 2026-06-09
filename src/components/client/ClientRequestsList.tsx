import React, { useMemo, useState } from 'react';
import { SecurityRequest, SecurityGuard, JobStatus } from '../../types';
import { formatDuration, formatShiftRange } from '../../lib/dates';
import { JOB_STATUS_LABELS } from '../../lib/jobStatus';
import { createCheckoutSession } from '../../lib/stripeApi';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge, WfListCard, WfSearchBar } from '../ui/wireframe';
import {
  Activity,
  Award,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  Loader2,
  MapPin,
  Pencil,
  Shield,
  Star,
  X,
} from 'lucide-react';
import { canClientCancelRequest, canClientEditRequest, isJobPaid } from '../../lib/jobEditRules';
import { EditRequestForm } from './EditRequestForm';

interface ClientRequestsListProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  clientEmail: string;
  onCancelRequest: (requestId: string) => void;
  onEditRequest: (requestId: string, updates: Partial<SecurityRequest>) => void | Promise<void>;
  onHireGuard: (requestId: string, guardId: string) => void;
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

function paymentLabel(status?: SecurityRequest['paymentStatus']): string {
  switch (status) {
    case 'paid': return 'Paid';
    case 'held': return 'Held';
    case 'released': return 'Released';
    default: return 'Unpaid';
  }
}

export function ClientRequestsList({
  requests,
  guards,
  clientEmail,
  onCancelRequest,
  onEditRequest,
  onHireGuard,
  onUpdateStatus,
  onAddReview,
  onRequestNew,
}: ClientRequestsListProps) {
  const [search, setSearch] = useState('');
  const [reviewRating, setReviewRating] = useState<{ [reqId: string]: number }>({});
  const [reviewNote, setReviewNote] = useState<{ [reqId: string]: string }>({});
  const [payingJobId, setPayingJobId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

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
          <h1 className="text-xl font-bold">All Requests</h1>
          <p className="text-sm text-brand-text-muted mt-1">Manage postings, hires, and reviews</p>
        </div>
        <button
          type="button"
          onClick={onRequestNew}
          className="app-button-primary !w-auto !h-10 !px-4 !text-sm shrink-0"
        >
          + New
        </button>
      </div>

      {requests.length > 0 && (
        <WfSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search requests..."
        />
      )}

      {requests.length === 0 ? (
        <div className="wf-list-card justify-center py-16">
          <Shield className="w-10 h-10 text-brand-primary/30 mx-auto mb-3" />
          <p className="text-brand-text-muted text-sm text-center">No requests yet.</p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-brand-text-muted py-12">No requests match your search.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((req) => {
            const hiredGuard = guards.find((g) => g.id === req.assignedGuardId);
            return (
              <div key={req.id} className="wf-list-card flex-col items-stretch !flex !flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3 w-full">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm">{req.title}</h3>
                    <p className="text-sm text-brand-text-muted capitalize mt-0.5">{req.type.replace('-', ' ')}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <WfBadge tone={statusBadgeTone(req.status)}>{JOB_STATUS_LABELS[req.status]}</WfBadge>
                    <WfBadge tone={paymentBadgeTone(req.paymentStatus)}>{paymentLabel(req.paymentStatus)}</WfBadge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm text-brand-text-muted w-full">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-brand-primary" />{formatShiftRange(req.startDate, req.endDate)}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-brand-primary" />{formatDuration(req.durationHours)}</span>
                  <span className="flex items-center gap-1 col-span-2 truncate"><MapPin className="w-3 h-3 text-brand-primary shrink-0" />{req.location}</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-brand-primary" />${req.hourlyRate}/hr · ${req.estimatedPayout} est.</span>
                </div>

                {isJobPaid(req) && (
                  <p className="text-xs text-brand-text-muted border border-brand-border rounded-lg px-2.5 py-1.5 w-full">
                    Job locked — paid shifts cannot be edited.
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

                {req.status === 'open' && (
                  <div className="border-t border-brand-border pt-3 space-y-3 w-full">
                    {(!req.paymentStatus || req.paymentStatus === 'unpaid') && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-brand-primary/8 border border-brand-primary/25 p-3 rounded-lg">
                        <div>
                          <p className="text-sm text-brand-primary font-semibold">Payment required</p>
                          <p className="text-xs text-brand-text-muted mt-0.5">
                            Pay ${req.estimatedPayout} to secure this approved job.
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
                      <p className="text-xs text-emerald-400/90 bg-emerald-500/8 border border-emerald-500/20 px-2.5 py-1.5 flex items-center gap-1.5 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Payment {paymentLabel(req.paymentStatus)} — you may hire a guard.
                      </p>
                    )}
                    <p className="uber-label">Hire a guard</p>
                    {guards.map((guard) => (
                      <WfListCard
                        key={guard.id}
                        avatar={<ProfileAvatar src={guard.avatar} name={guard.name} size="xs" />}
                        title={guard.name}
                        subtitle={`★ ${guard.rating}`}
                        action={
                          <button
                            type="button"
                            onClick={() => onHireGuard(req.id, guard.id)}
                            disabled={!req.paymentStatus || req.paymentStatus === 'unpaid'}
                            className="app-button-primary !w-auto !h-8 !px-3 !text-xs disabled:opacity-40"
                          >
                            Hire <ChevronRight className="w-3 h-3 inline" />
                          </button>
                        }
                      />
                    ))}
                  </div>
                )}

                {req.status === 'accepted' && hiredGuard && (
                  <button type="button" onClick={() => onUpdateStatus(req.id, 'in-progress')} className="app-button-primary !h-9 !text-xs w-full">
                    <Activity className="w-3.5 h-3.5 inline" /> Start Deployment
                  </button>
                )}

                {req.status === 'in-progress' && hiredGuard && (
                  <button type="button" onClick={() => onUpdateStatus(req.id, 'completed')} className="app-button-primary !h-9 !text-xs w-full">
                    <Check className="w-3.5 h-3.5 inline" /> End Shift
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
            );
          })}
        </div>
      )}
    </div>
  );
}
