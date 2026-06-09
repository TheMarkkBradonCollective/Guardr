import React from 'react';
import { GuardEarningsBreakdown } from '../../lib/guardEarnings';
import { GuardJobView, GuardPayoutView, guardPayoutStatusLabel } from '../../lib/guardJobView';
import { getEstimatedGuardEarnings } from '../../lib/guardJobs';
import { AppList, AppListRow, AppScreen, AppScreenTitle } from '../ui/app/AppPrimitives';
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
    <AppScreen className="pb-8">
      <AppScreenTitle>Your pay</AppScreenTitle>

      {!stripeReady && onConnectStripe && (
        <div className="app-inline-banner space-y-3">
          <div className="flex items-center gap-2 px-5">
            <Link2 className="w-4 h-4" />
            <p className="text-sm font-semibold">Stripe Connect required</p>
          </div>
          <div className="px-5">
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
        </div>
      )}

      <div className="px-5 py-6 border-b border-brand-border">
        <div className="flex items-center gap-2 text-sm text-brand-text-muted mb-3">
          <Receipt className="w-4 h-4" strokeWidth={1.5} />
          Earnings summary
        </div>
        <div className="flex items-baseline justify-between gap-4 mb-5">
          <span className="text-sm text-brand-text-muted">Total earnings</span>
          <span className="text-3xl font-bold tracking-tight">${breakdown.totalEarnings.toFixed(2)}</span>
        </div>
        <div className="app-metric-strip !mx-0 !px-0 !border-x-0">
          <div className="app-metric-item">
            <p className="app-metric-label">Paid in cash</p>
            <p className="app-metric-value">${breakdown.cashPaid.toFixed(2)}</p>
          </div>
          <div className="app-metric-item">
            <p className="app-metric-label">Paid on Stripe</p>
            <p className="app-metric-value">${breakdown.stripePaid.toFixed(2)}</p>
          </div>
          <div className="app-metric-item">
            <p className="app-metric-label">Online available</p>
            <p className="app-metric-value">${breakdown.onlineAvailable.toFixed(2)}</p>
          </div>
        </div>
        {breakdown.cashPendingRequest > 0 && (
          <p className="text-sm text-brand-text-muted mt-4 text-center">
            Cash requested (pending): ${breakdown.cashPendingRequest.toFixed(2)}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2 mt-5">
          <button
            type="button"
            onClick={() => void onRequestStripePayout?.()}
            disabled={breakdown.onlineAvailable <= 0 || stripeRequestPending || !onRequestStripePayout}
            className="app-button-primary !text-xs disabled:opacity-40"
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
            disabled={breakdown.onlineAvailable <= 0 || cashRequestPending || !onRequestCashPayout}
            className="app-button-outline !text-xs disabled:opacity-40"
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
        <p className="text-sm text-brand-text-muted px-5 py-3 border-b border-brand-border">Stripe Connect active</p>
      )}

      {payments.length > 0 && (
        <>
          <div className="app-section-head mt-6">
            <h2>Payout history</h2>
            <span className="text-sm text-brand-text-muted">{payments.length}</span>
          </div>
          <AppList>
            {payments.slice(0, 6).map((p) => (
              <AppListRow key={p.id}>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-semibold text-sm">Job {p.jobId}</p>
                  <p className="text-xs text-brand-text-muted mt-0.5">{p.status}</p>
                </div>
                <p className="font-bold text-sm shrink-0">${p.amount.toFixed(2)}</p>
              </AppListRow>
            ))}
          </AppList>
        </>
      )}

      <div className="app-section-head mt-6">
        <h2>Recent shifts</h2>
        <span className="text-sm text-brand-text-muted">{completedJobs.length}</span>
      </div>
      {completedJobs.length === 0 ? (
        <p className="text-sm text-brand-text-muted text-center py-10 px-5">
          Complete shifts to see earnings here.
        </p>
      ) : (
        <AppList>
          {completedJobs.slice(0, 8).map((job) => (
            <AppListRow key={job.id} className="app-list-row-align-top !items-start !py-4">
              <div className="flex-1 min-w-0 text-left">
                <p className="font-semibold text-sm">{job.title}</p>
                <p className="text-xs text-brand-text-muted mt-0.5">{job.clientName}</p>
                <p className="text-xs text-brand-text-muted mt-1">
                  {job.cashPayoutRequested && job.payoutStatus !== 'paid' && 'Cash requested · '}
                  {job.payoutStatus &&
                    (job.payoutMethod === 'cash'
                      ? 'Paid cash'
                      : job.payoutMethod === 'stripe'
                        ? 'Paid online'
                        : guardPayoutStatusLabel(job.payoutStatus))}
                </p>
              </div>
              <p className="font-bold text-sm shrink-0">+${getEstimatedGuardEarnings(job)}</p>
            </AppListRow>
          ))}
        </AppList>
      )}
    </AppScreen>
  );
}
