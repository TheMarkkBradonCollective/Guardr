import React, { useState } from 'react';
import { SecurityRequest, SecurityGuard, JobStatus } from '../../types';
import { formatDuration, formatShiftRange } from '../../lib/dates';
import { JOB_STATUS_LABELS } from '../../lib/jobStatus';
import { createCheckoutSession } from '../../lib/stripeApi';
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
  Shield,
  Star,
  X,
} from 'lucide-react';

interface ClientRequestsListProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  clientEmail: string;
  onCancelRequest: (requestId: string) => void;
  onHireGuard: (requestId: string, guardId: string) => void;
  onUpdateStatus: (requestId: string, status: SecurityRequest['status']) => void;
  onAddReview: (requestId: string, rating: number, reviewText: string) => void;
  onRequestNew: () => void;
}

function canClientModifyRequest(status: JobStatus): boolean {
  return status === 'pending-review' || status === 'open';
}

function statusBadgeClass(status: JobStatus): string {
  switch (status) {
    case 'open': return 'badge-open';
    case 'pending-review': return 'badge-assigned';
    case 'accepted': return 'badge-assigned';
    case 'in-progress': return 'badge-active';
    case 'completed': return 'badge-done';
    case 'closed': return 'badge-done';
    default: return 'badge-assigned';
  }
}

function paymentBadgeClass(status?: SecurityRequest['paymentStatus']): string {
  switch (status) {
    case 'paid': return 'badge-open';
    case 'held': return 'badge-assigned';
    case 'released': return 'badge-done';
    default: return 'badge-assigned';
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
  onHireGuard,
  onUpdateStatus,
  onAddReview,
  onRequestNew,
}: ClientRequestsListProps) {
  const [reviewRating, setReviewRating] = useState<{ [reqId: string]: number }>({});
  const [reviewNote, setReviewNote] = useState<{ [reqId: string]: string }>({});
  const [payingJobId, setPayingJobId] = useState<string | null>(null);

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
          <h1 className="text-xl font-black">All Requests</h1>
          <p className="text-xs font-mono text-brand-text-muted mt-1">Manage postings, hires, and reviews</p>
        </div>
        <button type="button" onClick={onRequestNew} className="uber-button-sage h-10 px-4 text-xs font-black uppercase shrink-0">
          + New
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="uber-card-flat rounded-2xl py-16 text-center">
          <Shield className="w-10 h-10 text-brand-primary/30 mx-auto mb-3" />
          <p className="text-brand-text-muted text-sm font-mono">No requests yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const hiredGuard = guards.find((g) => g.id === req.assignedGuardId);
            return (
              <div key={req.id} className="uber-card-flat rounded-xl p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-black text-sm">{req.title}</h3>
                    <p className="text-[10px] font-mono text-brand-text-muted capitalize mt-0.5">{req.type.replace('-', ' ')}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`px-2.5 py-1 text-[10px] font-mono font-black uppercase ${statusBadgeClass(req.status)}`}>
                      {JOB_STATUS_LABELS[req.status]}
                    </span>
                    <span className={`px-2 py-1 text-[9px] font-mono font-bold uppercase ${paymentBadgeClass(req.paymentStatus)}`}>
                      {paymentLabel(req.paymentStatus)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-brand-text-muted">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-brand-primary" />{formatShiftRange(req.startDate, req.endDate)}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-brand-primary" />{formatDuration(req.durationHours)}</span>
                  <span className="flex items-center gap-1 col-span-2 truncate"><MapPin className="w-3 h-3 text-brand-primary shrink-0" />{req.location}</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-brand-primary" />${req.hourlyRate}/hr · ${req.estimatedPayout} est.</span>
                </div>

                {canClientModifyRequest(req.status) && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { if (window.confirm(`Cancel "${req.title}"?`)) onCancelRequest(req.id); }}
                      className="text-[10px] font-black uppercase px-3 py-2 border border-red-500/40 text-red-400 rounded-lg"
                    >
                      <X className="w-3 h-3 inline" /> Cancel
                    </button>
                  </div>
                )}

                {req.status === 'open' && (
                  <div className="border-t border-brand-border pt-3 space-y-3">
                    {(!req.paymentStatus || req.paymentStatus === 'unpaid') && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-brand-primary/8 border border-brand-primary/25 p-3 rounded-lg">
                        <div>
                          <p className="text-[10px] font-mono uppercase text-brand-primary font-black">Payment Required</p>
                          <p className="text-xs text-brand-text-muted mt-0.5">
                            Pay ${req.estimatedPayout} to secure this approved job.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePayNow(req)}
                          disabled={payingJobId === req.id}
                          className="uber-button-sage h-9 px-5 text-xs font-black uppercase gap-1.5 shrink-0 disabled:opacity-50"
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
                      <p className="text-[10px] font-mono text-emerald-400/90 bg-emerald-500/8 border border-emerald-500/20 px-2.5 py-1.5 flex items-center gap-1.5 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Payment {paymentLabel(req.paymentStatus)} — you may hire a guard.
                      </p>
                    )}
                    <p className="uber-label">Hire a guard</p>
                    {guards.filter((g) => g.verified).map((guard) => (
                      <div key={guard.id} className="flex items-center gap-3 p-3 border border-brand-border rounded-lg">
                        <img src={guard.avatar} alt={guard.name} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs">{guard.name}</p>
                          <p className="text-[10px] font-mono text-brand-text-muted">★ {guard.rating}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onHireGuard(req.id, guard.id)}
                          disabled={!req.paymentStatus || req.paymentStatus === 'unpaid'}
                          className="uber-button-sage h-8 px-3 text-[10px] font-black uppercase disabled:opacity-40"
                        >
                          Hire <ChevronRight className="w-3 h-3 inline" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {req.status === 'accepted' && hiredGuard && (
                  <button type="button" onClick={() => onUpdateStatus(req.id, 'in-progress')} className="uber-button-sage h-9 px-4 text-xs font-black uppercase w-full">
                    <Activity className="w-3.5 h-3.5 inline" /> Start Deployment
                  </button>
                )}

                {req.status === 'in-progress' && hiredGuard && (
                  <button type="button" onClick={() => onUpdateStatus(req.id, 'completed')} className="uber-button-sage h-9 px-4 text-xs font-black uppercase w-full">
                    <Check className="w-3.5 h-3.5 inline" /> End Shift
                  </button>
                )}

                {req.status === 'completed' && hiredGuard && !req.ratingGiven && (
                  <div className="border-t border-brand-border pt-3 space-y-2">
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
                        className="uber-button-sage h-9 px-4 text-xs font-black uppercase"
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
