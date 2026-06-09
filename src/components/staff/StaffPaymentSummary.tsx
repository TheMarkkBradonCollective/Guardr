import React from 'react';
import { paymentPipelineSummary } from '../../lib/paymentPipeline';

interface StaffPaymentSummaryProps {
  summary: ReturnType<typeof paymentPipelineSummary>;
}

function SummaryCell({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className={`staff-payment-summary-cell ${accent ? 'staff-payment-summary-cell-accent' : ''}`}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-brand-text-muted">{label}</p>
      <p className="text-lg font-bold mt-1">{value}</p>
      <p className="text-xs text-brand-text-muted mt-0.5 leading-snug">{sub}</p>
    </div>
  );
}

export function StaffPaymentSummary({ summary }: StaffPaymentSummaryProps) {
  return (
    <div className="staff-payment-summary-grid">
      <SummaryCell
        label="Client still owes"
        value={`$${summary.awaitingClientTotal.toFixed(2)}`}
        sub={
          summary.awaitingClient.length === 0
            ? 'All posted jobs are paid or in progress'
            : `${summary.awaitingClient.length} job${summary.awaitingClient.length === 1 ? '' : 's'} waiting on client payment`
        }
        accent={summary.awaitingClient.length > 0}
      />
      <SummaryCell
        label="Guard pay still due"
        value={`$${summary.guardPayoutDue.toFixed(2)}`}
        sub={
          summary.awaitingGuardPayout.length === 0
            ? 'No finished jobs waiting on guard payout'
            : `${summary.awaitingGuardPayout.length} finished job${summary.awaitingGuardPayout.length === 1 ? '' : 's'} — pay via Stripe or cash`
        }
        accent={summary.awaitingGuardPayout.length > 0}
      />
      <SummaryCell
        label="Stripe deposit still due"
        value={`$${summary.cashDepositTotal.toFixed(2)}`}
        sub={
          summary.cashDepositPending.length === 0
            ? 'No cash jobs need a card deposit'
            : `${summary.cashDepositPending.length} cash job${summary.cashDepositPending.length === 1 ? '' : 's'} — record in Stripe with your card`
        }
        accent={summary.cashDepositPending.length > 0}
      />
      <SummaryCell
        label="Already paid to guards"
        value={`$${summary.settledGuardTotal.toFixed(2)}`}
        sub={`${summary.settledCount} job${summary.settledCount === 1 ? '' : 's'} fully settled — client paid and guard paid`}
      />
    </div>
  );
}
