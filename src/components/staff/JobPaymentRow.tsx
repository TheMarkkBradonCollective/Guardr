import React, { useState } from 'react';
import { Loader2, RotateCcw, Wallet } from 'lucide-react';
import {
  canMakeOvertimeGuardPayoutAvailable,
  canStaffManuallyReleaseGuardPayout,
  guardPayoutAmount,
  guardPayoutBlockedReason,
  overtimeGuardEarnings,
} from '../../lib/cashPayments';
import { hasOvertime, overtimeStatusLabel } from '../../lib/shiftBilling';
import { JOB_STATUS_LABELS } from '../../lib/jobStatus';
import { jobPaymentLedger, staffJobMoneySummary, PaymentLedgerStatus } from '../../lib/paymentDisplay';
import { Payment, SecurityGuard, SecurityRequest } from '../../types';
import type { ClientPaymentGates } from '../../lib/platformSettings';
import { WfBadge } from '../ui/wireframe';
import { AppButton } from '../ui/AppButton';
import { JobPaymentShiftDetails } from './JobPaymentShiftDetails';

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
  onMakeOvertimeGuardPayoutAvailable?: (requestId: string) => Promise<void>;
  readOnly?: boolean;
}

export function JobPaymentRow({
  req,
  guard,
  payment: _payment,
  isDirector,
  canManagePayments: _canManagePayments,
  paymentGates: _paymentGates,
  onMakeGuardPayoutAvailable,
  onRefundPayment,
  onMakeOvertimeGuardPayoutAvailable,
  readOnly = false,
}: JobPaymentRowProps) {
  const [busy, setBusy] = useState<'releaseOvertime' | 'release' | 'refund' | null>(null);

  const summary = staffJobMoneySummary(req);
  const ledger = jobPaymentLedger(req);
  const guardAmount = guardPayoutAmount(req);
  const canReleaseOvertimeGuard =
    isDirector && canMakeOvertimeGuardPayoutAvailable(req) && onMakeOvertimeGuardPayoutAvailable && !readOnly;
  const overtimeGuardAmount = overtimeGuardEarnings(req);
  const canReleaseFunds =
    isDirector &&
    canStaffManuallyReleaseGuardPayout(req) &&
    onMakeGuardPayoutAvailable &&
    !readOnly;
  const guardDepositLabel = `Make $${guardAmount.toFixed(2)} available to guard`;
  const payoutBlockedReason =
    req.status === 'completed' &&
    !req.guardPayoutAvailable &&
    ['paid', 'held'].includes(req.paymentStatus || '')
      ? guardPayoutBlockedReason(req)
      : null;
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
          {hasOvertime(req) && req.overtimeStatus !== 'paid' && (
            <p className="text-xs text-amber-400/90 mt-1.5">{overtimeStatusLabel(req.overtimeStatus)}</p>
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

      <JobPaymentShiftDetails req={req} />

      {payoutBlockedReason && !readOnly && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
          <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
          <span><strong>Guard pay held:</strong> {payoutBlockedReason}</span>
        </div>
      )}

      {!readOnly && (canReleaseOvertimeGuard || canReleaseFunds || canRefund) && (
        <div className="app-action-row--equal pt-2 border-t border-brand-border">
          {canReleaseOvertimeGuard && (
            <AppButton
              variant="primary"
              size="sm"
              onClick={() => run('releaseOvertime', onMakeOvertimeGuardPayoutAvailable)}
              disabled={busy !== null}
              startEnhancer={busy === 'releaseOvertime' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wallet className="w-3 h-3" />}
            >
              Release overtime ${overtimeGuardAmount.toFixed(2)}
            </AppButton>
          )}

          {canReleaseFunds && (
            <AppButton
              variant="primary"
              size="sm"
              onClick={() => run('release', onMakeGuardPayoutAvailable)}
              disabled={busy !== null}
              startEnhancer={busy === 'release' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wallet className="w-3 h-3" />}
            >
              {guardDepositLabel}
            </AppButton>
          )}

          {canRefund && (
            <AppButton
              variant="danger"
              size="sm"
              onClick={() => run('refund', onRefundPayment)}
              disabled={busy !== null}
              startEnhancer={busy === 'refund' ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
            >
              Refund client
            </AppButton>
          )}
        </div>
      )}
    </div>
  );
}
