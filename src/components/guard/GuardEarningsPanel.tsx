import React, { useMemo } from 'react';
import { GuardEarningsBreakdown } from '../../lib/guardEarnings';
import {
  GuardJobView,
  GuardPayoutView,
  getShiftPayDisplay,
} from '../../lib/guardJobView';
import { getEstimatedGuardEarnings } from '../../lib/guardJobs';
import { formatShiftRange } from '../../lib/dates';
import { AppList, AppListRow, AppScreen, AppScreenTitle } from '../ui/app/AppPrimitives';
import { Banknote, CreditCard, Link2, Loader2 } from 'lucide-react';

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
  const paymentByJobId = useMemo(
    () => new Map(payments.map((p) => [p.jobId, p])),
    [payments]
  );

  const sortedShifts = useMemo(
    () =>
      [...completedJobs].sort(
        (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
      ),
    [completedJobs]
  );

  const alreadyPaid = breakdown.cashPaid + breakdown.stripePaid;

  return (
    <AppScreen className="pb-8">
      <AppScreenTitle>Your pay</AppScreenTitle>

      <div className="px-5 pb-4">
        <p className="text-sm text-brand-text-muted leading-relaxed">
          When you finish a shift, your pay shows up here. Choose to receive it in your bank (Stripe) or pick up cash from staff.
        </p>
      </div>

      {!stripeReady && onConnectStripe && (
        <div className="app-inline-banner space-y-3 mx-5 mb-4">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            <p className="text-sm font-semibold">Connect your bank to get paid online</p>
          </div>
          <p className="text-xs text-brand-text-muted leading-relaxed">
            Link a Stripe account so we can send shift pay directly to your bank. You can still request cash without it.
          </p>
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
                <Link2 className="w-4 h-4" /> Connect bank account
              </>
            )}
          </button>
        </div>
      )}

      <div className="px-5 py-6 border-y border-brand-border">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted mb-1">
          Ready to collect
        </p>
        <p className="text-4xl font-bold tracking-tight mb-1">
          ${breakdown.onlineAvailable.toFixed(2)}
        </p>
        <p className="text-sm text-brand-text-muted mb-5">
          From finished shifts you haven&apos;t been paid for yet.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => void onRequestStripePayout?.()}
            disabled={breakdown.onlineAvailable <= 0 || stripeRequestPending || !onRequestStripePayout}
            className="app-button-primary !text-sm !h-auto !py-3 flex-col items-start gap-1 disabled:opacity-40 text-left"
          >
            <span className="flex items-center gap-2 font-semibold">
              {stripeRequestPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Send to my bank
            </span>
            <span className="text-xs font-normal opacity-80">
              Transfers to your connected Stripe account
            </span>
          </button>
          <button
            type="button"
            onClick={() => void onRequestCashPayout?.()}
            disabled={breakdown.onlineAvailable <= 0 || cashRequestPending || !onRequestCashPayout}
            className="app-button-outline !text-sm !h-auto !py-3 flex-col items-start gap-1 disabled:opacity-40 text-left"
          >
            <span className="flex items-center gap-2 font-semibold">
              {cashRequestPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Banknote className="w-4 h-4" />
              )}
              Request cash pickup
            </span>
            <span className="text-xs font-normal opacity-80">
              Staff will pay you in person
            </span>
          </button>
        </div>

        {breakdown.cashPendingRequest > 0 && (
          <p className="text-sm text-amber-400/90 mt-4 border border-amber-500/25 rounded-lg px-3 py-2">
            ${breakdown.cashPendingRequest.toFixed(2)} cash requested — waiting for staff to pay you.
          </p>
        )}
      </div>

      <div className="px-5 py-5 border-b border-brand-border">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm text-brand-text-muted">Already paid</span>
          <span className="text-xl font-bold">${alreadyPaid.toFixed(2)}</span>
        </div>
        <div className="flex gap-6 mt-2 text-sm">
          <p>
            <span className="text-brand-text-muted">Bank </span>
            <span className="font-medium">${breakdown.stripePaid.toFixed(2)}</span>
          </p>
          <p>
            <span className="text-brand-text-muted">Cash </span>
            <span className="font-medium">${breakdown.cashPaid.toFixed(2)}</span>
          </p>
        </div>
        <p className="text-xs text-brand-text-muted mt-3">
          Total earned from all completed shifts: ${breakdown.totalEarnings.toFixed(2)}
        </p>
      </div>

      {stripeConnected && stripeReady && (
        <p className="text-sm text-emerald-400/90 px-5 py-3 border-b border-brand-border">
          Bank account connected — online payouts enabled
        </p>
      )}

      <div className="px-5 mt-6 mb-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-[1.0625rem] font-bold tracking-tight">Completed shifts</h2>
          <span className="text-sm text-brand-text-muted">{sortedShifts.length}</span>
        </div>
        <p className="text-xs text-brand-text-muted mt-1.5 leading-relaxed">
          Each row shows what you earned and whether you&apos;ve been paid yet.
        </p>
      </div>

      {sortedShifts.length === 0 ? (
        <p className="text-sm text-brand-text-muted text-center py-10 px-5">
          Complete shifts to see earnings here.
        </p>
      ) : (
        <AppList>
          {sortedShifts.map((job) => {
            const pay = getShiftPayDisplay(job, paymentByJobId.get(job.id));
            const earned = getEstimatedGuardEarnings(job);
            return (
              <AppListRow key={job.id} className="app-list-row-align-top !items-start !py-4">
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-semibold text-sm">{job.title}</p>
                  <p className="text-xs text-brand-text-muted mt-0.5">{job.clientName}</p>
                  <p className="text-xs text-brand-text-muted mt-0.5">
                    {formatShiftRange(job.startDate, job.endDate)}
                  </p>
                  <p className="text-xs font-medium text-brand-text mt-2">{pay.headline}</p>
                  {pay.subtext && (
                    <p className="text-xs text-brand-text-muted mt-0.5">{pay.subtext}</p>
                  )}
                </div>
                <p className="font-bold text-sm shrink-0">${earned.toFixed(2)}</p>
              </AppListRow>
            );
          })}
        </AppList>
      )}
    </AppScreen>
  );
}
