import React, { useMemo } from 'react';
import { GuardEarningsBreakdown } from '../../lib/guardEarnings';
import {
  GuardJobView,
  GuardPayoutView,
  getShiftPayDisplay,
} from '../../lib/guardJobView';
import { getEstimatedGuardEarnings } from '../../lib/guardJobs';
import { formatShiftRange } from '../../lib/dates';
import { AppEmptyState, AppList, AppListRow, AppScreen } from '../ui/app/AppPrimitives';
import { AppButton } from '../ui/AppButton';
import { CreditCard, DollarSign, Link2, Loader2 } from 'lucide-react';
import { useLayoutFormFactor } from '../../surfaces';
import { GuardEarningsDesktop } from './GuardEarningsDesktop';

interface GuardEarningsPanelProps {
  breakdown: GuardEarningsBreakdown;
  completedJobs: GuardJobView[];
  stripeConnected?: boolean;
  stripeReady?: boolean;
  connectPending?: boolean;
  onConnectStripe?: () => void;
  onRequestStripePayout?: () => Promise<void>;
  stripeRequestPending?: boolean;
  openStripeInvoices?: number;
  payments?: GuardPayoutView[];
}

function payHeroClass(amount: number): string {
  if (amount >= 500) return 'guard-tier-hero-elite';
  if (amount >= 100) return 'guard-tier-hero-professional';
  if (amount > 0) return 'guard-tier-hero-rising';
  return 'guard-tier-hero-starting';
}

export function GuardEarningsPanel({
  breakdown,
  completedJobs,
  stripeConnected = false,
  stripeReady = false,
  connectPending = false,
  onConnectStripe,
  onRequestStripePayout,
  stripeRequestPending = false,
  openStripeInvoices = 0,
  payments = [],
}: GuardEarningsPanelProps) {
  const formFactor = useLayoutFormFactor();
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

  const alreadyPaid = breakdown.stripePaid;
  const readyToCollect = breakdown.onlineAvailable ?? 0;
  const needsBankForOnline = !stripeReady && breakdown.onlineAvailable > 0;

  if (formFactor === 'desktop') {
    return (
      <GuardEarningsDesktop
        breakdown={breakdown}
        completedJobs={completedJobs}
        stripeConnected={stripeConnected}
        stripeReady={stripeReady}
        connectPending={connectPending}
        onConnectStripe={onConnectStripe}
        onRequestStripePayout={onRequestStripePayout}
        stripeRequestPending={stripeRequestPending}
        openStripeInvoices={openStripeInvoices}
        payments={payments}
      />
    );
  }

  const payHeroActions = (
    <section className="guard-pay-actions-section" aria-label="Payout actions">
      <div className="guard-pay-actions-grid">
        <div className="guard-pay-action-block">
          <AppButton
            type="button"
            variant="primary"
            onClick={() => void onRequestStripePayout?.()}
            disabled={
              breakdown.onlineAvailable <= 0 ||
              stripeRequestPending ||
              !onRequestStripePayout ||
              !stripeReady
            }
            className="guard-pay-action-button"
          >
            {stripeRequestPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            Send to my bank
          </AppButton>
          {!stripeReady && needsBankForOnline && (
            <p className="guard-pay-action-hint">Connect your bank through Stripe first</p>
          )}
          {stripeReady && breakdown.onlineAvailable <= 0 && (
            <p className="guard-pay-action-hint">
              No bank payouts ready yet — complete more shifts first
            </p>
          )}
        </div>
      </div>
    </section>
  );

  const stripeConnectBanner = !stripeReady && onConnectStripe ? (
    <div className="guard-pref-empty-banner guard-pay-connect-banner">
      <Link2 className="guard-pref-empty-banner-icon" aria-hidden />
      <div>
        <p className="guard-pref-empty-banner-title">
          {stripeConnected ? 'Finish connecting your bank' : 'Connect your bank to get paid'}
        </p>
        <p className="guard-pref-empty-banner-text">
          {stripeConnected
            ? 'Stripe still needs a few payout details before bank transfers are enabled.'
            : 'Link your bank through Stripe to receive payouts for completed shifts.'}
        </p>
        <AppButton
          type="button"
          variant="primary"
          size="sm"
          onClick={onConnectStripe}
          disabled={connectPending}
          className="mt-3"
        >
          {connectPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Connecting...
            </>
          ) : (
            <>
              <Link2 className="w-4 h-4" /> {stripeConnected ? 'Finish bank setup' : 'Connect bank account'}
            </>
          )}
        </AppButton>
      </div>
    </div>
  ) : null;

  const invoiceNotice = openStripeInvoices > 0 ? (
    <p className="guard-pay-invoice-notice">
      {openStripeInvoices} open bank transfer invoice{openStripeInvoices === 1 ? '' : 's'} in Payments.
      {' '}You can send another invoice when more jobs are ready to collect.
    </p>
  ) : null;

  const bankStatus = stripeConnected && stripeReady ? (
    <p className="guard-pay-bank-status">Bank account connected — online payouts enabled</p>
  ) : null;

  const shiftsList =
    sortedShifts.length === 0 ? (
      <AppEmptyState icon={<CreditCard className="w-5 h-5" />} title="No completed shifts yet">
        Your earnings history will appear here after you complete jobs.
      </AppEmptyState>
    ) : (
      <AppList>
        {sortedShifts.map((job) => {
          const pay = getShiftPayDisplay(job, paymentByJobId.get(job.id));
          const earned = getEstimatedGuardEarnings(job);
          return (
            <AppListRow key={job.id} className="app-list-row-align-top !items-start !py-4">
              <div className="flex-1 min-w-0 text-left">
                <p className="font-semibold text-sm">{job.title}</p>
                <p className="text-xs uber-text-muted mt-0.5">{job.clientName}</p>
                <p className="text-xs uber-text-muted mt-0.5">
                  {formatShiftRange(job.startDate, job.endDate)}
                </p>
                <p className="text-xs font-medium uber-text mt-2">{pay.headline}</p>
                {pay.subtext && (
                  <p className="text-xs uber-text-muted mt-0.5">{pay.subtext}</p>
                )}
              </div>
              <p className="font-bold text-sm shrink-0">${earned.toFixed(2)}</p>
            </AppListRow>
          );
        })}
      </AppList>
    );

  if (formFactor === 'tablet') {
    return (
      <AppScreen className="guard-tiered-screen h-full min-h-0">
        <div className="guard-earnings-tablet">
          <div className="guard-earnings-tablet-metrics" aria-label="Earnings summary">
            <div className="guard-performance-stat">
              <p className="guard-performance-stat-label">Ready to collect</p>
              <p className="guard-performance-stat-value">${readyToCollect.toFixed(2)}</p>
              <p className="guard-performance-stat-sub">
                {breakdown.onlineAvailable > 0
                  ? `Bank transfer $${breakdown.onlineAvailable.toFixed(2)}`
                  : 'Complete shifts to start earning'}
              </p>
            </div>
            <div className="guard-performance-stat">
              <p className="guard-performance-stat-label">Total received</p>
              <p className="guard-performance-stat-value">${alreadyPaid.toFixed(2)}</p>
              <p className="guard-performance-stat-sub">Already paid to you</p>
            </div>
            <div className="guard-performance-stat">
              <p className="guard-performance-stat-label">Bank</p>
              <p className="guard-performance-stat-value">${breakdown.stripePaid.toFixed(2)}</p>
              <p className="guard-performance-stat-sub">Stripe payouts</p>
            </div>
            <div className="guard-performance-stat">
              <p className="guard-performance-stat-label">Total earned</p>
              <p className="guard-performance-stat-value">${breakdown.totalEarnings.toFixed(2)}</p>
              <p className="guard-performance-stat-sub">From all completed jobs</p>
            </div>
          </div>

          {payHeroActions}
          {stripeConnectBanner}
          {invoiceNotice}
          {bankStatus}

          <section className="guard-factors-section guard-pay-jobs-section">
            <div className="guard-factors-header">
              <h3 className="guard-factors-heading">Completed jobs ({sortedShifts.length})</h3>
              <p className="guard-factors-subheading">
                Each row shows what you earned and whether you&apos;ve been paid yet.
              </p>
            </div>
            <div className="guard-pay-jobs-list">{shiftsList}</div>
          </section>
        </div>
      </AppScreen>
    );
  }

  return (
    <AppScreen className="guard-tiered-screen">
      <div className="guard-tiered-screen-pinned">
        <section className="guard-rating-section guard-rating-section-tiered guard-pay-screen-card guard-tier-hero-card">
          <div className={`guard-tier-hero guard-pay-tier-hero ${payHeroClass(readyToCollect)}`}>
            <div className="guard-tier-hero-glow" aria-hidden />
            <div className="guard-pref-tier-medal" aria-hidden>
              <div className="guard-pref-tier-medal-ring">
                <DollarSign className="guard-pref-tier-medal-icon" />
              </div>
            </div>
            <p className="guard-tier-hero-eyebrow">Your pay</p>
            <h2 className="guard-tier-hero-name guard-pay-hero-amount">${readyToCollect.toFixed(2)}</h2>
            <div className="guard-tier-hero-score-row">
              <span className="guard-tier-hero-score-label">Ready to collect</span>
              <span className="guard-tier-hero-score-value">${alreadyPaid.toFixed(2)} paid</span>
            </div>
            {breakdown.onlineAvailable > 0 ? (
              <p className="guard-tier-hero-subtitle">
                Bank transfer ${breakdown.onlineAvailable.toFixed(2)}
              </p>
            ) : (
              <p className="guard-tier-hero-subtitle">
                Complete shifts to start earning — payouts appear here when jobs are settled.
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="guard-tiered-screen-scroll">
        <div className="guard-rating-body">
          {payHeroActions}
          {stripeConnectBanner}
          {invoiceNotice}

          <div className="guard-performance-stats guard-pay-stats" aria-label="Earnings summary">
            <div className="guard-performance-stat">
              <p className="guard-performance-stat-label">Total received</p>
              <p className="guard-performance-stat-value">${alreadyPaid.toFixed(2)}</p>
              <p className="guard-performance-stat-sub">Already paid to you</p>
            </div>
            <div className="guard-performance-stat">
              <p className="guard-performance-stat-label">Bank</p>
              <p className="guard-performance-stat-value">${breakdown.stripePaid.toFixed(2)}</p>
              <p className="guard-performance-stat-sub">Stripe payouts</p>
            </div>
            <div className="guard-performance-stat">
              <p className="guard-performance-stat-label">Total earned</p>
              <p className="guard-performance-stat-value">${breakdown.totalEarnings.toFixed(2)}</p>
              <p className="guard-performance-stat-sub">From all completed jobs</p>
            </div>
          </div>

          {bankStatus}

          <section className="guard-factors-section guard-pay-jobs-section">
            <div className="guard-factors-header">
              <h3 className="guard-factors-heading">Completed jobs ({sortedShifts.length})</h3>
              <p className="guard-factors-subheading">
                Each row shows what you earned and whether you&apos;ve been paid yet.
              </p>
            </div>
            <div className="guard-pay-jobs-list">{shiftsList}</div>
          </section>
        </div>
      </div>
    </AppScreen>
  );
}
