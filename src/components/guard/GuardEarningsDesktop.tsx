import React from 'react';
import { GuardEarningsBreakdown } from '../../lib/guardEarnings';
import { GuardJobView, GuardPayoutView, getShiftPayDisplay } from '../../lib/guardJobView';
import { getEstimatedGuardEarnings } from '../../lib/guardJobs';
import { formatShiftRange } from '../../lib/dates';
import { Banknote, CreditCard, DollarSign, Link2, Loader2 } from 'lucide-react';

export interface GuardEarningsDesktopProps {
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
  openCashInvoices?: number;
  openStripeInvoices?: number;
  payments?: GuardPayoutView[];
}

export function GuardEarningsDesktop({
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
  openCashInvoices = 0,
  openStripeInvoices = 0,
  payments = [],
}: GuardEarningsDesktopProps) {
  const paymentByJobId = new Map(payments.map((p) => [p.jobId, p]));
  const sortedShifts = [...completedJobs].sort(
    (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
  );
  const alreadyPaid = breakdown.cashPaid + breakdown.stripePaid;
  const readyToCollect = Math.max(breakdown.cashAvailable ?? 0, breakdown.onlineAvailable ?? 0);

  return (
    <div className="adm-dashboard" data-tour="guard-earnings">
      <div className="adm-dashboard-grid">
        <article className="adm-card adm-span-4">
          <p className="adm-card-eyebrow">Ready to collect</p>
          <p className="adm-stat-value">${readyToCollect.toFixed(2)}</p>
          <p className="adm-stat-delta">${alreadyPaid.toFixed(2)} already paid</p>
        </article>
        <article className="adm-card adm-span-4">
          <p className="adm-card-eyebrow">Cash pickup</p>
          <p className="adm-stat-value">${(breakdown.cashAvailable ?? 0).toFixed(2)}</p>
          <button
            type="button"
            className="adm-btn adm-btn--outline adm-btn--sm adm-mt-sm"
            disabled={(breakdown.cashAvailable ?? 0) <= 0 || cashRequestPending || !onRequestCashPayout}
            onClick={() => void onRequestCashPayout?.()}
          >
            {cashRequestPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
            Request cash pickup
          </button>
        </article>
        <article className="adm-card adm-span-4">
          <p className="adm-card-eyebrow">Bank transfer</p>
          <p className="adm-stat-value">${breakdown.onlineAvailable.toFixed(2)}</p>
          <button
            type="button"
            className="adm-btn adm-btn--sand adm-btn--sm adm-mt-sm"
            disabled={breakdown.onlineAvailable <= 0 || stripeRequestPending || !onRequestStripePayout || !stripeReady}
            onClick={() => void onRequestStripePayout?.()}
          >
            {stripeRequestPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            Send to bank
          </button>
        </article>

        {!stripeReady && onConnectStripe ? (
          <article className="adm-card adm-span-12">
            <p className="adm-card-heading">Connect your bank</p>
            <p className="adm-card-body">
              Link Stripe to receive online payouts. Cash pickup works without this step.
            </p>
            <button type="button" className="adm-btn adm-btn--sand adm-btn--sm" onClick={onConnectStripe} disabled={connectPending}>
              {connectPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              {stripeConnected ? 'Finish bank setup' : 'Connect bank account'}
            </button>
          </article>
        ) : null}

        <article className="adm-card adm-span-12">
          <p className="adm-card-heading">Completed shifts</p>
          {sortedShifts.length === 0 ? (
            <p className="adm-card-body">Completed shifts and payouts will appear here.</p>
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Shift</th>
                  <th>Date</th>
                  <th>Est. pay</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedShifts.map((job) => {
                  const payout = paymentByJobId.get(job.id);
                  const pay = getShiftPayDisplay(job, payout);
                  const est = getEstimatedGuardEarnings(job);
                  return (
                    <tr key={job.id}>
                      <td>
                        <p className="adm-table-primary">{job.title}</p>
                        <p className="adm-table-secondary">{job.siteName || job.location}</p>
                      </td>
                      <td className="adm-table-secondary">{formatShiftRange(job.startDate, job.endDate)}</td>
                      <td className="adm-stat-value adm-stat-value--sm">${est.toFixed(2)}</td>
                      <td className="adm-table-secondary">
                        <p className="adm-table-primary">{pay.headline}</p>
                        {pay.subtext ? <p className="adm-table-secondary">{pay.subtext}</p> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </article>
      </div>
    </div>
  );
}
