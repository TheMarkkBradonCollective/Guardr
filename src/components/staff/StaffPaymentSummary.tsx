import React from 'react';
import { paymentPipelineSummary } from '../../lib/paymentPipeline';
import { isPlatformFeeOnlyDeposit } from '../../lib/cashPayments';
import type { OperationalFinancials } from '../../lib/operationalFinancials';
import { formatOperationalMoney } from '../../lib/operationalFinancials';
import { StaffSummaryCell } from './StaffSummaryCell';

interface StaffPaymentSummaryProps {
  summary: ReturnType<typeof paymentPipelineSummary>;
  financials?: OperationalFinancials;
}

export function StaffPaymentSummary({ summary, financials }: StaffPaymentSummaryProps) {
  const platformFeeOnlyDeposits =
    summary.cashDepositPending.length > 0 &&
    summary.cashDepositPending.every((req) => isPlatformFeeOnlyDeposit(req));

  return (
    <div className="staff-payment-stats-wrap">
      {financials && (
        <div className="guard-performance-stats staff-payment-stats" aria-label="Company income">
          <StaffSummaryCell
            label="Gross income"
            value={formatOperationalMoney(financials.grossIncome)}
            sub={
              financials.paidJobCount === 0
                ? 'No client payments recorded yet'
                : `${formatOperationalMoney(financials.grossIncomeCash)} cash · ${formatOperationalMoney(financials.grossIncomeCard)} card · ${financials.paidJobCount} paid job${financials.paidJobCount === 1 ? '' : 's'}`
            }
            accent={financials.grossIncome > 0}
          />
          <StaffSummaryCell
            label="Company earnings"
            value={formatOperationalMoney(financials.platformFeesCollected)}
            sub={
              financials.platformFeesOutstanding > 0
                ? `${formatOperationalMoney(financials.platformFeesOutstanding)} still to collect · ${formatOperationalMoney(financials.platformFeesTotal)} total`
                : financials.platformFeesTotal > 0
                  ? 'All platform fees collected'
                  : 'No fees collected yet'
            }
            accent={financials.platformFeesCollected > 0}
          />
        </div>
      )}
      <div className="guard-performance-stats staff-payment-stats" aria-label="Payment pipeline">
        <StaffSummaryCell
          label="Client still owes"
          value={`$${summary.awaitingClientTotal.toFixed(2)}`}
          sub={
            summary.awaitingClient.length === 0
              ? 'All posted jobs are paid or in progress'
              : `${summary.awaitingClient.length} job${summary.awaitingClient.length === 1 ? '' : 's'} waiting on client payment`
          }
          accent={summary.awaitingClient.length > 0}
        />
        <StaffSummaryCell
          label="Guard pay to release"
          value={`$${summary.guardPayoutDue.toFixed(2)}`}
          sub={
            summary.awaitingGuardPayout.length === 0
              ? 'No finished jobs waiting on release'
              : `${summary.awaitingGuardPayout.length} finished job${summary.awaitingGuardPayout.length === 1 ? '' : 's'} — make funds available for guard collection`
          }
          accent={summary.awaitingGuardPayout.length > 0}
        />
        <StaffSummaryCell
          label={platformFeeOnlyDeposits ? 'Platform fees still due' : 'Stripe deposit still due'}
          value={`$${summary.cashDepositTotal.toFixed(2)}`}
          sub={
            summary.cashDepositPending.length === 0
              ? 'No cash jobs need a deposit'
              : platformFeeOnlyDeposits
                ? `${summary.cashDepositPending.length} cash job${summary.cashDepositPending.length === 1 ? '' : 's'} — manually deposit or pay platform fee with card`
                : `${summary.cashDepositPending.length} cash job${summary.cashDepositPending.length === 1 ? '' : 's'} — record in Stripe with your card`
          }
          accent={summary.cashDepositPending.length > 0}
        />
        <StaffSummaryCell
          label="Already paid to guards"
          value={`$${summary.settledGuardTotal.toFixed(2)}`}
          sub={`${summary.settledCount} job${summary.settledCount === 1 ? '' : 's'} fully settled — client paid and guard paid`}
        />
      </div>
    </div>
  );
}
