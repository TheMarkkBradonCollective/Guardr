import React from 'react';
import { GuardEarningsBreakdown } from '../../lib/guardEarnings';
import { GuardJobView, GuardPayoutView, guardPayoutStatusLabel } from '../../lib/guardJobView';
import { getEstimatedGuardEarnings } from '../../lib/guardJobs';
import { WfBadge, WfListCard, WfMetricTile, WfSectionHeader } from '../ui/wireframe';
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
              <p className="text-sm font-semibold text-amber-400">Stripe Connect required</p>
            </div>
            <button
              type="button"
              onClick={onConnectStripe}
              disabled={connectPending}
              className="app-button-primary disabled:opacity-50"
            >
              {connectPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Connecting...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" /> Connect Stripe account
                </>
              )}
            </button>
          </div>
        )}

        <div className="wf-list-card flex-col items-stretch !flex !flex-col !p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-dashed border-brand-border flex items-center gap-2">
            <Receipt className="w-4 h-4 text-brand-primary" />
            <p className="text-sm text-brand-text-muted">Earnings receipt</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-brand-text-muted">Total earnings</span>
              <span className="text-3xl font-bold text-brand-text">
                ${breakdown.totalEarnings.toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <WfMetricTile label="Paid in cash" value={`$${breakdown.cashPaid.toFixed(2)}`} />
              <WfMetricTile label="Online available" value={`$${breakdown.onlineAvailable.toFixed(2)}`} accent />
              {breakdown.cashPendingRequest > 0 && (
                <WfMetricTile
                  label="Cash requested (pending)"
                  value={`$${breakdown.cashPendingRequest.toFixed(2)}`}
                  className="col-span-2"
                />
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 p-4 border-t border-dashed border-brand-border">
            <button
              type="button"
              onClick={() => void onRequestStripePayout?.()}
              disabled={
                breakdown.onlineAvailable <= 0 || stripeRequestPending || !onRequestStripePayout
              }
              className="app-button-primary disabled:opacity-40"
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
              className="app-button-outline disabled:opacity-40"
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
          <WfBadge tone="success">Stripe Connect active</WfBadge>
        )}

        {payments.length > 0 && (
          <div>
            <WfSectionHeader title="Payout history" count={payments.length} />
            <div className="space-y-2">
              {payments.slice(0, 6).map((p) => (
                <WfListCard
                  key={p.id}
                  title={`Job ${p.jobId}`}
                  subtitle={p.status}
                  meta={<span className="text-lg font-bold text-brand-primary">${p.amount.toFixed(2)}</span>}
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <WfSectionHeader title="Recent shifts" count={completedJobs.length} />
          {completedJobs.length === 0 ? (
            <div className="wf-list-card justify-center py-12">
              <p className="text-brand-text-muted text-sm">Complete shifts to see earnings here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {completedJobs.slice(0, 8).map((job) => (
                <WfListCard
                  key={job.id}
                  title={job.title}
                  subtitle={job.clientName}
                  meta={
                    <div className="flex flex-wrap items-center gap-2">
                      {job.cashPayoutRequested && job.payoutStatus !== 'paid' && (
                        <WfBadge tone="warning">Cash requested</WfBadge>
                      )}
                      {job.payoutStatus && (
                        <WfBadge tone="primary">
                          {job.payoutMethod === 'cash'
                            ? 'Paid cash'
                            : job.payoutMethod === 'stripe'
                              ? 'Paid online'
                              : guardPayoutStatusLabel(job.payoutStatus)}
                        </WfBadge>
                      )}
                      <span className="text-lg font-bold text-brand-primary">+${getEstimatedGuardEarnings(job)}</span>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
