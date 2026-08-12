import React from 'react';
import { CreditCard } from 'lucide-react';
import { GuardPayoutInvoice, SecurityGuard, SecurityRequest } from '../../types';
import { payoutInvoiceLabel, guardPayoutInvoiceLines, guardPayoutInvoiceTotal } from '../../lib/guardPayoutInvoiceStorage';
import { WfBadge } from '../ui/wireframe';
import {
  computeWorkedHours,
  formatGuardWorkedHours,
  getEffectiveClockIn,
  getEffectiveClockOut,
  guardHasTimesheetActivity,
} from '../../lib/guardTimesheet';

interface StaffPayoutInvoiceRowProps {
  invoice: GuardPayoutInvoice;
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  isDirector: boolean;
  onReleasePayout?: (requestId: string, force?: boolean) => Promise<void>;
  onCompleteInvoice?: (invoiceId: string) => Promise<void>;
}

export function StaffPayoutInvoiceRow({
  invoice,
  requests,
  guards,
  isDirector,
  onReleasePayout,
  onCompleteInvoice,
}: StaffPayoutInvoiceRowProps) {
  const guard = guards.find((g) => g.id === invoice.guardId);
  const issued = new Date(invoice.createdAt).toLocaleString();
  const lines = guardPayoutInvoiceLines(invoice);
  const total = guardPayoutInvoiceTotal(invoice);
  const unpaidLines = lines.filter((line) => {
    const job = requests.find((r) => r.id === line.jobId);
    return job?.paymentStatus !== 'released';
  });

  return (
    <div className="app-item-card app-item-card-align-top flex-col !items-stretch gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3 w-full">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4 text-brand-primary shrink-0" />
            <p className="font-semibold text-sm">{payoutInvoiceLabel(invoice)} payout invoice</p>
            <WfBadge tone="warning">Open</WfBadge>
          </div>
          <p className="text-sm text-brand-text-muted">
            {invoice.guardName} · {invoice.guardEmail}
          </p>
          <p className="text-xs text-brand-text-muted mt-1">Submitted {issued}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-text-muted">Total due</p>
          <p className="text-xl font-bold">${total.toFixed(2)}</p>
        </div>
      </div>

      <ul className="space-y-2 text-sm border-t border-brand-border pt-3 w-full">
        {lines.map((line) => {
          const job = requests.find((r) => r.id === line.jobId);
          const paid = job?.paymentStatus === 'released';
          const workedHours =
            job && job.assignedGuardId && guardHasTimesheetActivity(job, job.assignedGuardId)
              ? formatGuardWorkedHours(
                  computeWorkedHours(getEffectiveClockIn(job), getEffectiveClockOut(job)),
                )
              : null;
          return (
            <li key={line.jobId} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium leading-tight">{line.title}</p>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  {line.clientName} · {line.schedule}
                </p>
                {workedHours ? (
                  <p className="text-xs text-brand-text-muted mt-0.5">{workedHours} worked</p>
                ) : null}
                <p className={`text-xs mt-0.5 ${paid ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {paid ? 'Paid' : 'Awaiting payout'}
                </p>
              </div>
              <div className="shrink-0 text-right space-y-2">
                <p className="font-semibold">${(Number(line.amount) || 0).toFixed(2)}</p>
                {!paid && isDirector && job && onReleasePayout && (
                  <button
                    type="button"
                    onClick={() => onReleasePayout(line.jobId)}
                    disabled={!guard?.stripeConnectAccountId}
                    className="app-button-primary app-btn-sm disabled:opacity-40"
                    title={
                      guard?.stripeConnectAccountId
                        ? 'Send payout via Stripe'
                        : 'Guard has no Stripe account connected'
                    }
                  >
                    Send via Stripe
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {unpaidLines.length === 0 && onCompleteInvoice && (
        <div className="pt-2 border-t border-brand-border w-full">
          <button
            type="button"
            onClick={() => onCompleteInvoice(invoice.id)}
            className="app-button-outline app-btn-sm"
          >
            Mark invoice completed
          </button>
        </div>
      )}
    </div>
  );
}
