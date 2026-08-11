import React from 'react';
import { LabelSmall, ParagraphMedium, HeadingMedium } from 'baseui/typography';
import { GuardEarningsBreakdown } from '../../lib/guardEarnings';
import { GuardJobView, GuardPayoutView, getShiftPayDisplay } from '../../lib/guardJobView';
import { getEstimatedGuardEarnings } from '../../lib/guardJobs';
import { formatShiftRange } from '../../lib/dates';
import { Banknote, CreditCard, Link2, Loader2 } from 'lucide-react';
import { GuardrCard } from '../baseui/GuardrCard';
import { GuardrButton } from '../baseui/GuardrButton';
import { GuardrDataTable, type GuardrTableColumn } from '../baseui/GuardrDataTable';
import {
  WorkbenchCardTitle,
  WorkbenchGrid,
  WorkbenchGridCell,
  WorkbenchPage,
} from '../baseui/layout/WorkbenchLayout';

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
  payments = [],
}: GuardEarningsDesktopProps) {
  const paymentByJobId = new Map(payments.map((p) => [p.jobId, p]));
  const sortedShifts = [...completedJobs].sort(
    (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
  );
  const alreadyPaid = breakdown.cashPaid + breakdown.stripePaid;
  const readyToCollect = Math.max(breakdown.cashAvailable ?? 0, breakdown.onlineAvailable ?? 0);

  const earningsColumns: GuardrTableColumn<GuardJobView>[] = [
    {
      id: 'shift',
      header: 'Shift',
      grow: true,
      sortValue: (job) => job.title.toLowerCase(),
      render: (job) => (
        <>
          <p className="uber-workbench-table-primary">{job.title}</p>
          <p className="uber-workbench-table-secondary">{job.siteName || job.location}</p>
        </>
      ),
    },
    {
      id: 'date',
      header: 'Date',
      sortValue: (job) => job.endDate,
      render: (job) => formatShiftRange(job.startDate, job.endDate),
    },
    {
      id: 'est',
      header: 'Est. pay',
      numeric: true,
      align: 'right',
      sortValue: (job) => getEstimatedGuardEarnings(job),
      render: (job) => `$${getEstimatedGuardEarnings(job).toFixed(2)}`,
    },
    {
      id: 'pay',
      header: 'Status',
      render: (job) => {
        const pay = getShiftPayDisplay(job, paymentByJobId.get(job.id));
        return (
          <>
            <p className="uber-workbench-table-primary">{pay.headline}</p>
            {pay.subtext ? <p className="uber-workbench-table-secondary">{pay.subtext}</p> : null}
          </>
        );
      },
    },
  ];

  return (
    <WorkbenchPage className="mobility-workspace" data-tour="guard-earnings">
      <WorkbenchGrid>
        <WorkbenchGridCell span={4}>
          <GuardrCard>
            <LabelSmall color="contentSecondary" marginBottom="scale200">
              Ready to collect
            </LabelSmall>
            <HeadingMedium marginTop={0} marginBottom="scale200">
              ${readyToCollect.toFixed(2)}
            </HeadingMedium>
            <ParagraphMedium margin={0} color="contentSecondary" $style={{ fontSize: '13px' }}>
              ${alreadyPaid.toFixed(2)} already paid
            </ParagraphMedium>
          </GuardrCard>
        </WorkbenchGridCell>

        <WorkbenchGridCell span={4}>
          <GuardrCard>
            <LabelSmall color="contentSecondary" marginBottom="scale200">
              Cash pickup
            </LabelSmall>
            <HeadingMedium marginTop={0} marginBottom="scale400">
              ${(breakdown.cashAvailable ?? 0).toFixed(2)}
            </HeadingMedium>
            <GuardrButton
              kind="secondary"
              size="compact"
              disabled={(breakdown.cashAvailable ?? 0) <= 0 || cashRequestPending || !onRequestCashPayout}
              onClick={() => void onRequestCashPayout?.()}
            >
              {cashRequestPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
              Request cash pickup
            </GuardrButton>
          </GuardrCard>
        </WorkbenchGridCell>

        <WorkbenchGridCell span={4}>
          <GuardrCard>
            <LabelSmall color="contentSecondary" marginBottom="scale200">
              Bank transfer
            </LabelSmall>
            <HeadingMedium marginTop={0} marginBottom="scale400">
              ${breakdown.onlineAvailable.toFixed(2)}
            </HeadingMedium>
            <GuardrButton
              kind="primary"
              size="compact"
              disabled={breakdown.onlineAvailable <= 0 || stripeRequestPending || !onRequestStripePayout || !stripeReady}
              onClick={() => void onRequestStripePayout?.()}
            >
              {stripeRequestPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              Send to bank
            </GuardrButton>
          </GuardrCard>
        </WorkbenchGridCell>

        {!stripeReady && onConnectStripe ? (
          <WorkbenchGridCell span={12}>
            <GuardrCard>
              <WorkbenchCardTitle>Connect your bank</WorkbenchCardTitle>
              <ParagraphMedium marginTop={0} marginBottom="scale500" color="contentSecondary">
                Link Stripe to receive online payouts. Cash pickup works without this step.
              </ParagraphMedium>
              <GuardrButton kind="primary" size="compact" onClick={onConnectStripe} disabled={connectPending}>
                {connectPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                {stripeConnected ? 'Finish bank setup' : 'Connect bank account'}
              </GuardrButton>
            </GuardrCard>
          </WorkbenchGridCell>
        ) : null}

        <WorkbenchGridCell span={12}>
          <GuardrCard>
            <WorkbenchCardTitle>Completed shifts</WorkbenchCardTitle>
            {sortedShifts.length === 0 ? (
              <ParagraphMedium margin={0} color="contentSecondary">
                Completed shifts and payouts will appear here.
              </ParagraphMedium>
            ) : (
              <GuardrDataTable
                columns={earningsColumns}
                rows={sortedShifts}
                rowKey={(job) => job.id}
                caption="Completed shifts"
                cardLayout={{ title: 'shift', subtitle: 'date', trailing: 'pay' }}
              />
            )}
          </GuardrCard>
        </WorkbenchGridCell>
      </WorkbenchGrid>
    </WorkbenchPage>
  );
}
