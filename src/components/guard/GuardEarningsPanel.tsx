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
import { Banknote, CreditCard, DollarSign, Link2, Loader2 } from 'lucide-react';
import { useDevice } from '../../lib/platform';
import { GuardEarningsDesktop } from './GuardEarningsDesktop';

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
  openCashInvoices?: number;
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
  onRequestCashPayout,
  stripeRequestPending = false,
  cashRequestPending = false,
  openCashInvoices = 0,
  openStripeInvoices = 0,
  payments = [],
}: GuardEarningsPanelProps) {
  const { formFactor } = useDevice();
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
  const readyToCollect = Math.max(breakdown.cashAvailable ?? 0, breakdown.onlineAvailable ?? 0);
  const needsBankForOnline =
    !stripeReady && (breakdown.onlineAvailable > 0 || (breakdown.cashAvailable ?? 0) === 0);

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
        onRequestCashPayout={onRequestCashPayout}
        stripeRequestPending={stripeRequestPending}
        cashRequestPending={cashRequestPending}
        openCashInvoices={openCashInvoices}
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
          {stripeReady && breakdown.onlineAvailable <= 0 && (breakdown.cashAvailable ?? 0) > 0 && (
            <p className="guard-pay-action-hint">Pending deposit — cash pickup available now</p>
          )}
          {stripeReady && breakdown.onlineAvailable <= 0 && (breakdown.cashAvailable ?? 0) <= 0 && (
            <p className="guard-pay-action-hint">
              No bank payouts ready yet — complete more shifts first
            </p>
          )}
        </div>
        <div className="guard-pay-action-block">
          <AppButton
            type="button"
            variant="outline"
            onClick={() => void onRequestCashPayout?.()}
            disabled={(breakdown.cashAvailable ?? 0) <= 0 || cashRequestPending || !onRequestCashPayout}
            className="guard-pay-action-button"
          >
            {cashRequestPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Banknote className="w-4 h-4" />
            )}
            Request cash pickup
          </AppButton>
          {(breakdown.cashAvailable ?? 0) <= 0 && (
            <p className="guard-pay-action-hint">Available when cash pickup funds are ready</p>
          )}
        </div>
      </div>
    </section>
  );

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
            {(breakdown.cashAvailable ?? 0) > 0 || breakdown.onlineAvailable > 0 ? (
              <p className="guard-tier-hero-subtitle">
                {(breakdown.cashAvailable ?? 0) > 0 && (
                  <span>Cash pickup ${(breakdown.cashAvailable ?? 0).toFixed(2)}</span>
                )}
                {(breakdown.cashAvailable ?? 0) > 0 && breakdown.onlineAvailable > 0 ? ' · ' : null}
                {breakdown.onlineAvailable > 0 && (
                  <span>Bank transfer ${breakdown.onlineAvailable.toFixed(2)}</span>
                )}
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
          {!stripeReady && onConnectStripe && (
            <div className="guard-pref-empty-banner guard-pay-connect-banner">
              <Link2 className="guard-pref-empty-banner-icon" aria-hidden />
              <div>
                <p className="guard-pref-empty-banner-title">
                  {stripeConnected ? 'Finish connecting your bank' : 'Connect your bank to get paid online'}
                </p>
                <p className="guard-pref-empty-banner-text">
                  {stripeConnected
                    ? 'Stripe still needs a few payout details before online bank transfers are enabled.'
                    : 'Link your bank through Stripe to receive online payouts. Cash pickup stays available without this step.'}
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
          )}

          {(openCashInvoices > 0 || openStripeInvoices > 0) && (
            <p className="guard-pay-invoice-notice">
              {openCashInvoices > 0 && (
                <span>
                  {openCashInvoices} open cash pickup invoice{openCashInvoices === 1 ? '' : 's'} in Payments.
                </span>
              )}
              {openCashInvoices > 0 && openStripeInvoices > 0 ? ' ' : null}
              {openStripeInvoices > 0 && (
                <span>
                  {openStripeInvoices} open bank transfer invoice{openStripeInvoices === 1 ? '' : 's'} in Payments.
                </span>
              )}
              {' '}You can send another invoice when more jobs are ready to collect.
            </p>
          )}

          <div className="guard-performance-stats guard-pay-stats" aria-label="Earnings summary">
            <div className="guard-performance-stat">
              <p className="guard-performance-stat-label">Total received</p>
              <p className="guard-performance-stat-value">${alreadyPaid.toFixed(2)}</p>
              <p className="guard-performance-stat-sub">Already paid to you</p>
            </div>
            <div className="guard-performance-stat">
              <p className="guard-performance-stat-label">Bank</p>
              <p className="guard-performance-stat-value">${breakdown.stripePaid.toFixed(2)}</p>
              <p className="guard-performance-stat-sub">Online payouts</p>
            </div>
            <div className="guard-performance-stat">
              <p className="guard-performance-stat-label">Cash</p>
              <p className="guard-performance-stat-value">${breakdown.cashPaid.toFixed(2)}</p>
              <p className="guard-performance-stat-sub">Pickup payouts</p>
            </div>
            <div className="guard-performance-stat">
              <p className="guard-performance-stat-label">Total earned</p>
              <p className="guard-performance-stat-value">${breakdown.totalEarnings.toFixed(2)}</p>
              <p className="guard-performance-stat-sub">From all completed jobs</p>
            </div>
          </div>

          {stripeConnected && stripeReady && (
            <p className="guard-pay-bank-status">Bank account connected — online payouts enabled</p>
          )}

          <section className="guard-factors-section guard-pay-jobs-section">
            <div className="guard-factors-header">
              <h3 className="guard-factors-heading">Completed jobs ({sortedShifts.length})</h3>
              <p className="guard-factors-subheading">
                Each row shows what you earned and whether you&apos;ve been paid yet.
              </p>
            </div>

            {sortedShifts.length === 0 ? (
              <AppEmptyState icon={<Banknote className="w-5 h-5" />} title="No completed shifts yet">
                Your earnings history will appear here after you complete jobs.
              </AppEmptyState>
            ) : (
              <div className="guard-pay-jobs-list">
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
              </div>
            )}
          </section>
        </div>
      </div>
    </AppScreen>
  );
}
