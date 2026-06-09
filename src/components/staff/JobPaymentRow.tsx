import React, { useState } from 'react';
import { Banknote, CreditCard, Loader2, RotateCcw } from 'lucide-react';
import {
  canDirectorDepositCashToStripe,
  canDirectorMarkClientPaidCash,
  canDirectorMarkGuardPaidCash,
  canStripePayGuard,
  getCashDepositedAmount,
  guardPayoutAmount,
  stripeDepositLabel,
} from '../../lib/cashPayments';
import { JOB_STATUS_LABELS } from '../../lib/jobStatus';
import { staffJobMoneySummary } from '../../lib/paymentDisplay';
import { getPaymentPipelineStage } from '../../lib/paymentPipeline';
import { PLATFORM_FEE_PER_HOUR } from '../../lib/payments';
import { Payment, SecurityGuard, SecurityRequest } from '../../types';
import { WfBadge } from '../ui/wireframe';

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

export function JobPaymentRow({
  req,
  guard,
  payment: _payment,
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
  const summary = staffJobMoneySummary(req);
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
    <div className="app-item-card app-item-card-align-top flex-col !items-stretch gap-4">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 w-full">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="font-semibold text-sm truncate">{req.title}</p>
            <WfBadge tone="default">{JOB_STATUS_LABELS[req.status]}</WfBadge>
          </div>
          <p className="text-sm text-brand-text-muted">
            {req.clientName} · Guard: {guard?.name || 'Unassigned'}
          </p>
          <p className="text-sm font-medium mt-2">{summary.headline}</p>
          {summary.detail && (
            <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">{summary.detail}</p>
          )}
          {getCashDepositedAmount(req) > 0 && (
            <p className="text-xs text-emerald-400/80 mt-1.5">
              ${getCashDepositedAmount(req).toFixed(2)} already deposited to Stripe
              {req.cashDepositedAt ? ` · ${new Date(req.cashDepositedAt).toLocaleString()}` : ''}
            </p>
          )}
        </div>

        <div className="shrink-0 text-sm space-y-1 lg:text-right">
          <p>
            <span className="text-brand-text-muted">Guard pay </span>
            <span className="font-bold">${guardAmount.toFixed(2)}</span>
          </p>
          <p>
            <span className="text-brand-text-muted">Client bill </span>
            <span className="font-medium">${req.estimatedPayout.toFixed(2)}</span>
          </p>
          <p className="text-xs text-brand-text-muted">Platform fee ${platformRevenue.toFixed(2)}</p>
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
              Send ${guardAmount.toFixed(0)} to guard (Stripe)
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
              Mark guard paid in cash
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
              Force Stripe payout
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
