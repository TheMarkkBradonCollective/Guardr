import React, { useState } from 'react';
import { Banknote, CreditCard, Loader2 } from 'lucide-react';
import {
  canDirectorMarkClientPaidCash,
  canDirectorMarkGuardPaidCash,
  clientPaymentDisplay,
  guardPayoutAmount,
  guardPayoutDisplay,
} from '../../lib/cashPayments';
import { SecurityRequest } from '../../types';

interface DirectorCashPaymentControlsProps {
  req: SecurityRequest;
  isDirector: boolean;
  onMarkClientPaidCash?: (requestId: string) => Promise<void>;
  onMarkGuardPaidCash?: (requestId: string) => Promise<void>;
  onReleasePayout?: (requestId: string) => Promise<void>;
  compact?: boolean;
}

export function DirectorCashPaymentControls({
  req,
  isDirector,
  onMarkClientPaidCash,
  onMarkGuardPaidCash,
  onReleasePayout,
  compact = false,
}: DirectorCashPaymentControlsProps) {
  const [busy, setBusy] = useState<'client' | 'guard' | 'stripe' | null>(null);

  const run = async (kind: 'client' | 'guard' | 'stripe', fn?: (id: string) => Promise<void>) => {
    if (!fn) return;
    setBusy(kind);
    try {
      await fn(req.id);
    } finally {
      setBusy(null);
    }
  };

  const showClientCash = isDirector && canDirectorMarkClientPaidCash(req) && onMarkClientPaidCash;
  const showGuardActions =
    isDirector && canDirectorMarkGuardPaidCash(req) && (onMarkGuardPaidCash || onReleasePayout);

  if (!showClientCash && !showGuardActions && !req.paymentStatus) return null;

  return (
    <div className={`space-y-3 ${compact ? '' : 'border border-brand-border rounded-xl p-4 bg-white/5'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted">Payment</p>
        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border border-brand-border">
          {clientPaymentDisplay(req)}
        </span>
        {req.status === 'completed' && (
          <span className="text-[10px] font-mono text-brand-text-muted">Guard: {guardPayoutDisplay(req)}</span>
        )}
      </div>

      {showClientCash && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs text-brand-text-muted">
            Client paid cash? Record it so hiring can proceed without Stripe.
          </p>
          <button
            type="button"
            onClick={() => run('client', onMarkClientPaidCash)}
            disabled={busy !== null}
            className="staff-ops-btn-outline text-[10px] gap-1.5 shrink-0"
          >
            {busy === 'client' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Banknote className="w-3 h-3" />}
            Mark Paid (Cash)
          </button>
        </div>
      )}

      {showGuardActions && (
        <div className="space-y-2 border-t border-brand-border pt-3">
          <p className="text-xs text-brand-text-muted">
            Shift complete — pay guard ${guardPayoutAmount(req)} via Stripe or record cash handed to guard.
          </p>
          <div className="flex flex-wrap gap-2">
            {onReleasePayout && (
              <button
                type="button"
                onClick={() => run('stripe', onReleasePayout)}
                disabled={busy !== null}
                className="staff-ops-btn-primary text-[10px] gap-1.5"
              >
                {busy === 'stripe' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CreditCard className="w-3 h-3" />}
                Pay Guard (Stripe)
              </button>
            )}
            {onMarkGuardPaidCash && (
              <button
                type="button"
                onClick={() => run('guard', onMarkGuardPaidCash)}
                disabled={busy !== null}
                className="staff-ops-btn-outline text-[10px] gap-1.5"
              >
                {busy === 'guard' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Banknote className="w-3 h-3" />}
                Paid Cash to Guard
              </button>
            )}
          </div>
        </div>
      )}

      {isDirector && req.paymentStatus === 'released' && req.guardPayoutMethod === 'cash' && (
        <p className="text-[10px] font-mono text-emerald-400">Guard payout recorded as cash by Director.</p>
      )}
    </div>
  );
}
