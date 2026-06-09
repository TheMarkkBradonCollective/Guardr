import React from 'react';
import { paymentPipelineSummary } from '../../lib/paymentPipeline';
import { StaffSummaryCell } from './StaffSummaryCell';

interface StaffPaymentSummaryProps {
  summary: ReturnType<typeof paymentPipelineSummary>;
}

export function StaffPaymentSummary({ summary }: StaffPaymentSummaryProps) {
  return (
    <div className="staff-payment-summary-grid">
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
        label="Guard pay still due"
        value={`$${summary.guardPayoutDue.toFixed(2)}`}
        sub={
          summary.awaitingGuardPayout.length === 0
            ? 'No finished jobs waiting on guard payout'
            : `${summary.awaitingGuardPayout.length} finished job${summary.awaitingGuardPayout.length === 1 ? '' : 's'} — pay via Stripe or cash`
        }
        accent={summary.awaitingGuardPayout.length > 0}
      />
      <StaffSummaryCell
        label="Stripe deposit still due"
        value={`$${summary.cashDepositTotal.toFixed(2)}`}
        sub={
          summary.cashDepositPending.length === 0
            ? 'No cash jobs need a card deposit'
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
  );
}
