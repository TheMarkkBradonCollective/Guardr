import React from 'react';
import { GuardEarningsBreakdown } from '../../lib/guardEarnings';
import { GuardJobView, GuardPayoutView, guardPayoutStatusLabel } from '../../lib/guardJobView';
import { getEstimatedGuardEarnings } from '../../lib/guardJobs';
import { Banknote, CreditCard, Link2, Loader2, Receipt } from 'lucide-react';

interface GuardEarningsPanelProps {
  breakdown: GuardEarningsBreakdown;
  completedJobs: GuardJobView[];
  stripeConnected?: boolean;
  stripeReady?: boolean;
  connectPending?: boolean;
  onConnectStripe?: () => void;
  onRequestStripePayout?: () => Promise<void>;
  onRequestCashPayout?: () => Promise<void>;
  stripeRequestPending?: boolean;
  cashRequestPending?: boolean;
  payments?: GuardPayoutView[];
}

export function GuardEarningsPanel({
  breakdown,
  completedJobs,
  stripeConnected = false,
  stripeReady = false,
  connectPending = false,
  onConnectStripe,
  onRequestStripePayout,
  onRequestCashPayout,
  stripeRequestPending = false,
  cashRequestPending = false,
  payments = [],
}: GuardEarningsPanelProps) {
  return (
    <div className="px-4 py-4">
      <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
        <div>
          <p className="text-sm text-brand-text-muted mb-1">Earnings</p>
          <h2 className="text-2xl font-bold tracking-tight">Your pay</h2>
        </div>

        {!stripeReady && onConnectStripe && (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-amber-400" />
              <p className="text-xs font-black uppercase text-amber-400">Stripe Connect Required</p>
            </div>
            <button
              type="button"
              onClick={onConnectStripe}
              disabled={connectPending}
              className="w-full py-3 rounded-xl bg-amber-500 text-black font-black text-xs uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {connectPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Connecting...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" /> Connect Stripe Account
                </>
              )}
            </button>
          </div>
        )}

        <div className="rounded-2xl border border-brand-border bg-white/[0.03] overflow-hidden">
          <div className="px-5 py-3 border-b border-dashed border-brand-border flex items-center gap-2">
            <Receipt className="w-4 h-4 text-brand-primary" />
            <p className="text-[10px] font-mono uppercase text-brand-text-muted">Earnings receipt</p>
          </div>
          <div className="p-5 space-y-4 font-mono">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-brand-text-muted">Total earnings</span>
              <span className="text-3xl font-black text-brand-text">
                ${breakdown.totalEarnings.toFixed(2)}
              </span>
            </div>
            <div className="border-t border-dashed border-brand-border pt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-brand-text-muted">Paid in cash</span>
                <span className="font-bold">${breakdown.cashPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-brand-text-muted">Online available to payout</span>
                <span className="font-bold text-brand-primary">
                  ${breakdown.onlineAvailable.toFixed(2)}
                </span>
              </div>
              {breakdown.cashPendingRequest > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-amber-400/90">Cash requested (pending)</span>
                  <span className="font-bold text-amber-400">
                    ${breakdown.cashPendingRequest.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 p-4 border-t border-dashed border-brand-border bg-black/20">
            <button
              type="button"
              onClick={() => void onRequestStripePayout?.()}
              disabled={
                breakdown.onlineAvailable <= 0 || stripeRequestPending || !onRequestStripePayout
              }
              className="py-3 px-2 rounded-xl bg-brand-primary text-black font-black text-[10px] uppercase tracking-wider disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              {stripeRequestPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CreditCard className="w-3.5 h-3.5" />
              )}
              Payout (Stripe)
            </button>
            <button
              type="button"
              onClick={() => void onRequestCashPayout?.()}
              disabled={
                breakdown.onlineAvailable <= 0 || cashRequestPending || !onRequestCashPayout
              }
              className="py-3 px-2 rounded-xl border border-brand-border font-black text-[10px] uppercase tracking-wider disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              {cashRequestPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Banknote className="w-3.5 h-3.5" />
              )}
              Cash out
            </button>
          </div>
        </div>

        {stripeConnected && stripeReady && (
          <p className="text-[10px] font-mono text-emerald-400/90 bg-emerald-500/8 border border-emerald-500/20 px-3 py-2 rounded-xl">
            Stripe Connect active
          </p>
        )}

        {payments.length > 0 && (
          <div>
            <h3 className="font-black text-sm uppercase tracking-tight mb-3">Payout history</h3>
            <div className="space-y-2">
              {payments.slice(0, 6).map((p) => (
                <div key={p.id} className="uber-card rounded-xl flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">Job {p.jobId}</p>
                    <p className="text-[10px] font-mono text-brand-text-muted capitalize">{p.status}</p>
                  </div>
                  <p className="text-lg font-black font-mono text-brand-primary shrink-0">
                    ${p.amount.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="font-black text-sm uppercase tracking-tight mb-3">Recent shifts</h3>
          {completedJobs.length === 0 ? (
            <div className="uber-card rounded-2xl py-12 text-center">
              <p className="text-brand-text-muted text-sm font-mono">Complete shifts to see earnings here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {completedJobs.slice(0, 8).map((job) => (
                <div key={job.id} className="uber-card rounded-xl flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{job.title}</p>
                    <p className="text-[10px] font-mono text-brand-text-muted">{job.clientName}</p>
                    {job.cashPayoutRequested && job.payoutStatus !== 'paid' && (
                      <p className="text-[9px] font-mono text-amber-400 mt-0.5">Cash requested</p>
                    )}
                    {job.payoutStatus && (
                      <p className="text-[9px] font-mono text-brand-primary mt-0.5">
                        {job.payoutMethod === 'cash'
                          ? 'Paid cash'
                          : job.payoutMethod === 'stripe'
                            ? 'Paid online'
                            : guardPayoutStatusLabel(job.payoutStatus)}
                      </p>
                    )}
                  </div>
                  <p className="text-lg font-black font-mono text-brand-primary shrink-0">
                    +${getEstimatedGuardEarnings(job)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
