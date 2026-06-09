import React, { useState } from 'react';
import { Banknote, CreditCard, Loader2, RotateCcw } from 'lucide-react';
import {
  canDirectorDepositCashToStripe,
  canDirectorMarkClientPaidCash,
  canDirectorMarkGuardPaidCash,
  canStripePayGuard,
  clientPaymentDisplay,
  getCashDepositedAmount,
  guardPayoutAmount,
  guardPayoutDisplay,
  platformFundsDisplay,
  stripeDepositLabel,
} from '../../lib/cashPayments';
import { JOB_STATUS_LABELS } from '../../lib/jobStatus';
import {
  clientPaymentBadgeClass,
  getPaymentPipelineStage,
  guardPayoutBadgeClass,
  platformFundsBadgeClass,
} from '../../lib/paymentPipeline';
import { PLATFORM_FEE_PER_HOUR } from '../../lib/payments';
import { Payment, SecurityGuard, SecurityRequest } from '../../types';
import { WfBadge, WfMetricTile } from '../ui/wireframe';

interface JobPaymentRowProps {
  req: SecurityRequest;
  guard?: SecurityGuard;
  payment?: Payment;
  isDirector: boolean;
  onReleasePayout?: (requestId: string, force?: boolean) => Promise<void>;
  onRefundPayment?: (requestId: string) => Promise<void>;
  onMarkClientPaidCash?: (requestId: string) => Promise<void>;
  onMarkGuardPaidCash?: (requestId: string) => Promise<void>;
  onDepositCashToStripe?: (requestId: string) => Promise<void>;
  readOnly?: boolean;
}

function badgeToneFromClass(className: string): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
  if (className.includes('emerald')) return 'success';
  if (className.includes('amber') || className.includes('orange')) return 'warning';
  if (className.includes('sky') || className.includes('brand-primary')) return 'primary';
  return 'default';
}

export function JobPaymentRow({
  req,
  guard,
  payment,
  isDirector,
  onReleasePayout,
  onRefundPayment,
  onMarkClientPaidCash,
  onMarkGuardPaidCash,
  onDepositCashToStripe,
  readOnly = false,
}: JobPaymentRowProps) {
  const [busy, setBusy] = useState<'client' | 'guard' | 'stripe' | 'force' | 'refund' | 'deposit' | null>(null);

  const stage = getPaymentPipelineStage(req);
  const guardAmount = guardPayoutAmount(req);
  const platformRevenue =
    Math.round((req.platformFeePerHour ?? PLATFORM_FEE_PER_HOUR) * req.durationHours * 100) / 100;
  const canMarkClientCash = isDirector && canDirectorMarkClientPaidCash(req) && onMarkClientPaidCash;
  const canDeposit = isDirector && canDirectorDepositCashToStripe(req) && onDepositCashToStripe;
  const canPayGuard = stage === 'awaiting-guard-payout' && !!guard;
  const stripePayAllowed = canStripePayGuard(req);
  const canStripeRelease = canPayGuard && onReleasePayout && !readOnly && stripePayAllowed;
  const canCashGuard = isDirector && canDirectorMarkGuardPaidCash(req) && onMarkGuardPaidCash && !readOnly;
  const canRefund =
    isDirector &&
    !!req.stripePaymentIntentId &&
    req.paymentStatus !== 'released' &&
    onRefundPayment &&
    !readOnly;

  const run = async (kind: typeof busy, fn?: (id: string, force?: boolean) => Promise<void>, force = false) => {
    if (!fn) return;
    setBusy(kind);
    try {
      await fn(req.id, force);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="wf-list-card flex-col items-stretch !flex !flex-col gap-4">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 w-full">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="font-semibold text-sm truncate">{req.title}</p>
            <WfBadge tone="default">{JOB_STATUS_LABELS[req.status]}</WfBadge>
          </div>
          <p className="text-sm text-brand-text-muted">
            {req.clientName} · Guard: {guard?.name || 'Unassigned'}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <WfBadge tone={badgeToneFromClass(clientPaymentBadgeClass(req))}>
              Client — {clientPaymentDisplay(req)}
            </WfBadge>
            <WfBadge tone={badgeToneFromClass(platformFundsBadgeClass(req))}>
              Platform — {platformFundsDisplay(req)}
            </WfBadge>
            <WfBadge tone={badgeToneFromClass(guardPayoutBadgeClass(req))}>
              Guard — {guardPayoutDisplay(req)}
            </WfBadge>
          </div>
          {payment && (
            <p className="text-xs text-brand-text-muted mt-1.5">
              Ledger ${payment.amount} · {payment.paymentMethod || 'stripe'} · {payment.status}
            </p>
          )}
          {req.guardCashPayoutRequested && req.paymentStatus !== 'released' && (
            <p className="text-xs text-amber-400/90 mt-1.5">
              Guard requested cash payout — pay in cash, not Stripe
            </p>
          )}
          {getCashDepositedAmount(req) > 0 && (
            <p className="text-xs text-emerald-400/80 mt-1">
              ${getCashDepositedAmount(req)} paid into Stripe (card)
              {req.cashDepositedAt ? ` · ${new Date(req.cashDepositedAt).toLocaleString()}` : ''}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 shrink-0 lg:w-64">
          <WfMetricTile label="Platform revenue" value={`$${platformRevenue}`} accent className="col-span-2 sm:col-span-1" />
          <WfMetricTile label="Client bill" value={`$${req.estimatedPayout}`} />
          <WfMetricTile label="Guard pay" value={`$${guardAmount}`} />
        </div>
      </div>

      {!readOnly &&
        (canMarkClientCash || canDeposit || canStripeRelease || canCashGuard || canRefund) && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-brand-border w-full">
          {canMarkClientCash && (
            <button
              type="button"
              onClick={() => run('client', onMarkClientPaidCash)}
              disabled={busy !== null}
              className="app-button-outline !w-auto !h-9 !px-4 !text-xs gap-1.5"
            >
              {busy === 'client' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Banknote className="w-3 h-3" />}
              Client paid cash
            </button>
          )}

          {canDeposit && (
            <button
              type="button"
              onClick={() => run('deposit', onDepositCashToStripe)}
              disabled={busy !== null}
              className="app-button-primary !w-auto !h-9 !px-4 !text-xs gap-1.5"
            >
              {busy === 'deposit' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CreditCard className="w-3 h-3" />}
              {stripeDepositLabel(req)}
            </button>
          )}

          {canStripeRelease && (
            <button
              type="button"
              onClick={() => run('stripe', onReleasePayout)}
              disabled={busy !== null || !guard?.stripeConnectAccountId}
              className="app-button-primary !w-auto !h-9 !px-4 !text-xs gap-1.5"
              title={guard?.stripeConnectAccountId ? 'Send payout via Stripe Connect' : 'Guard has no Stripe account connected'}
            >
              {busy === 'stripe' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CreditCard className="w-3 h-3" />}
              Pay guard (Stripe)
            </button>
          )}

          {canCashGuard && (
            <button
              type="button"
              onClick={() => run('guard', onMarkGuardPaidCash)}
              disabled={busy !== null}
              className="app-button-outline !w-auto !h-9 !px-4 !text-xs gap-1.5"
            >
              {busy === 'guard' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Banknote className="w-3 h-3" />}
              Guard paid cash
            </button>
          )}

          {isDirector && canPayGuard && onReleasePayout && stripePayAllowed && !readOnly && (
            <button
              type="button"
              onClick={() => run('force', onReleasePayout, true)}
              disabled={busy !== null}
              className="app-button-outline !w-auto !h-9 !px-4 !text-xs text-amber-400 border-amber-500/40"
              title="Director force payout without Connect check"
            >
              {busy === 'force' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Force Stripe
            </button>
          )}

          {canRefund && (
            <button
              type="button"
              onClick={() => run('refund', onRefundPayment)}
              disabled={busy !== null}
              className="app-button-outline !w-auto !h-9 !px-4 !text-xs gap-1.5 text-red-400 border-red-500/40"
            >
              {busy === 'refund' ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
              Refund client
            </button>
          )}
        </div>
      )}
    </div>
  );
}
