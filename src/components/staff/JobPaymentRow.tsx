import React, { useState } from 'react';
import { Banknote, CreditCard, Loader2, RotateCcw, Wallet } from 'lucide-react';
import {
  canDirectorDepositCashToStripe,
  canDirectorMarkClientPaidCash,
  canDirectorMarkCashDepositManually,
  canDirectorMarkPlatformFeePaidCash,
  canMakeGuardPayoutAvailable,
  canStaffApproveClientCashPayment,
  getCashDepositedAmount,
  getManualCashDepositDue,
  getPlatformFeeAmount,
  guardPayoutAmount,
  isClientCashPaymentPendingApproval,
  stripeDepositLabel,
} from '../../lib/cashPayments';
import { JOB_STATUS_LABELS } from '../../lib/jobStatus';
import { jobPaymentLedger, staffJobMoneySummary, PaymentLedgerStatus } from '../../lib/paymentDisplay';
import { Payment, SecurityGuard, SecurityRequest } from '../../types';
import type { ClientPaymentGates } from '../../lib/platformSettings';
import { WfBadge } from '../ui/wireframe';

const LEDGER_STATUS_TONE: Record<PaymentLedgerStatus, string> = {
  paid: 'text-emerald-400',
  owed: 'text-amber-400',
  waiting: 'text-brand-text-muted',
  na: 'text-brand-text-muted/70',
};

function LedgerRow({
  label,
  amount,
  status,
  statusLabel,
}: {
  label: string;
  amount: number;
  status: PaymentLedgerStatus;
  statusLabel: string;
}) {
  const amountLabel = status === 'na' ? '—' : `$${amount.toFixed(2)}`;
  return (
    <li className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-medium leading-tight">{label}</p>
        <p className={`text-xs mt-0.5 leading-snug ${LEDGER_STATUS_TONE[status]}`}>{statusLabel}</p>
      </div>
      <p className={`font-semibold shrink-0 ${LEDGER_STATUS_TONE[status]}`}>{amountLabel}</p>
    </li>
  );
}

interface JobPaymentRowProps {
  req: SecurityRequest;
  guard?: SecurityGuard;
  payment?: Payment;
  isDirector: boolean;
  canManagePayments: boolean;
  paymentGates: ClientPaymentGates;
  onMakeGuardPayoutAvailable?: (requestId: string) => Promise<void>;
  onRefundPayment?: (requestId: string) => Promise<void>;
  onMarkClientPaidCash?: (requestId: string) => Promise<void>;
  onApproveClientCashPayment?: (requestId: string) => Promise<void>;
  onRejectClientCashPayment?: (requestId: string) => Promise<void>;
  onMarkPlatformFeePaidCash?: (requestId: string) => Promise<void>;
  onMarkCashDepositManually?: (requestId: string) => Promise<void>;
  onDepositCashToStripe?: (requestId: string) => Promise<void>;
  readOnly?: boolean;
}

export function JobPaymentRow({
  req,
  guard,
  payment: _payment,
  isDirector,
  canManagePayments,
  paymentGates,
  onMakeGuardPayoutAvailable,
  onRefundPayment,
  onMarkClientPaidCash,
  onApproveClientCashPayment,
  onRejectClientCashPayment,
  onMarkPlatformFeePaidCash,
  onMarkCashDepositManually,
  onDepositCashToStripe,
  readOnly = false,
}: JobPaymentRowProps) {
  const [busy, setBusy] = useState<'client' | 'approveCash' | 'rejectCash' | 'release' | 'refund' | 'deposit' | 'platformFee' | 'manualDeposit' | null>(null);

  const summary = staffJobMoneySummary(req);
  const ledger = jobPaymentLedger(req);
  const guardAmount = guardPayoutAmount(req);
  const cashPending = isClientCashPaymentPendingApproval(req);
  const canApproveCash =
    paymentGates.allowCash &&
    canManagePayments &&
    canStaffApproveClientCashPayment(req) &&
    onApproveClientCashPayment;
  const canRejectCash =
    paymentGates.allowCash &&
    canManagePayments &&
    canStaffApproveClientCashPayment(req) &&
    onRejectClientCashPayment;
  const canMarkClientCash =
    paymentGates.allowCash && isDirector && canDirectorMarkClientPaidCash(req) && onMarkClientPaidCash;
  const manualDepositDue = getManualCashDepositDue(req);
  const canDeposit = isDirector && canDirectorDepositCashToStripe(req) && onDepositCashToStripe;
  const canManualDeposit =
    isDirector && canDirectorMarkCashDepositManually(req) && onMarkCashDepositManually;
  const canPlatformFeeCash =
    isDirector && canDirectorMarkPlatformFeePaidCash(req) && onMarkPlatformFeePaidCash;
  const canReleaseFunds =
    isDirector &&
    canMakeGuardPayoutAvailable(req) &&
    onMakeGuardPayoutAvailable &&
    !readOnly;
  const canRefund =
    isDirector &&
    !!req.stripePaymentIntentId &&
    req.paymentStatus !== 'released' &&
    onRefundPayment &&
    !readOnly;

  const run = async (kind: typeof busy, fn?: (id: string) => Promise<void>) => {
    if (!fn) return;
    setBusy(kind);
    try {
      await fn(req.id);
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
            {req.clientName} · Guard: {guard?.name || 'No guard yet'}
          </p>
          <p className="text-sm font-medium mt-2">{summary.headline}</p>
          {summary.detail && (
            <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">{summary.detail}</p>
          )}
          {getCashDepositedAmount(req) > 0 && (
            <p className="text-xs text-emerald-400/80 mt-1.5">
              ${getCashDepositedAmount(req).toFixed(2)} already recorded
              {req.cashDepositedManually ? ' (manual)' : ' in Stripe'}
              {req.cashDepositedAt ? ` · ${new Date(req.cashDepositedAt).toLocaleString()}` : ''}
            </p>
          )}
        </div>

        <div className="shrink-0 w-full lg:w-auto lg:min-w-[15rem]">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted mb-2">
            Who paid what
          </p>
          <ul className="space-y-1.5 text-sm">
            {ledger.map((line) => (
              <LedgerRow key={line.party} {...line} />
            ))}
          </ul>
        </div>
      </div>

      {!readOnly &&
        (canApproveCash || canRejectCash || canMarkClientCash || canDeposit || canManualDeposit || canPlatformFeeCash || canReleaseFunds || canRefund) && (
        <div className="app-action-row--equal pt-2 border-t border-brand-border">
          {canApproveCash && (
            <button
              type="button"
              onClick={() => run('approveCash', onApproveClientCashPayment)}
              disabled={busy !== null}
              className="app-button-primary app-btn-sm gap-1.5"
            >
              {busy === 'approveCash' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Banknote className="w-3 h-3" />}
              Approve cash payment
            </button>
          )}

          {canRejectCash && (
            <button
              type="button"
              onClick={() => run('rejectCash', onRejectClientCashPayment)}
              disabled={busy !== null}
              className="app-button-outline app-btn-sm gap-1.5 text-red-400 border-red-500/40"
            >
              {busy === 'rejectCash' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Decline request
            </button>
          )}

          {canMarkClientCash && (
            <button
              type="button"
              onClick={() => run('client', onMarkClientPaidCash)}
              disabled={busy !== null}
              className="app-button-outline app-btn-sm gap-1.5"
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
              className="app-button-primary app-btn-sm gap-1.5"
            >
              {busy === 'deposit' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CreditCard className="w-3 h-3" />}
              {stripeDepositLabel(req)}
            </button>
          )}

          {canManualDeposit && (
            <button
              type="button"
              onClick={() => run('manualDeposit', onMarkCashDepositManually)}
              disabled={busy !== null}
              className="app-button-outline app-btn-sm gap-1.5"
            >
              {busy === 'manualDeposit' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Banknote className="w-3 h-3" />
              )}
              Manually record ${manualDepositDue.toFixed(2)} deposited
            </button>
          )}

          {canPlatformFeeCash && (
            <button
              type="button"
              onClick={() => run('platformFee', onMarkPlatformFeePaidCash)}
              disabled={busy !== null}
              className="app-button-outline app-btn-sm gap-1.5"
            >
              {busy === 'platformFee' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Banknote className="w-3 h-3" />
              )}
              Manually deposit ${getPlatformFeeAmount(req).toFixed(2)} platform fee
            </button>
          )}

          {canReleaseFunds && (
            <button
              type="button"
              onClick={() => run('release', onMakeGuardPayoutAvailable)}
              disabled={busy !== null}
              className="app-button-primary app-btn-sm gap-1.5"
            >
              {busy === 'release' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wallet className="w-3 h-3" />}
              Make ${guardAmount.toFixed(2)} available to guard
            </button>
          )}

          {canRefund && (
            <button
              type="button"
              onClick={() => run('refund', onRefundPayment)}
              disabled={busy !== null}
              className="app-button-outline app-btn-sm gap-1.5 text-red-400 border-red-500/40"
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
