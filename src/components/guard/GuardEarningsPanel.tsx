import React from 'react';
import { EarningsSummary } from '../../lib/guardJobs';
import { Payment, SecurityRequest } from '../../types';
import { getEstimatedGuardEarnings } from '../../lib/guardJobs';
import { TrendingUp, Wallet, Link2, Loader2, Clock } from 'lucide-react';

interface GuardEarningsPanelProps {
  summary: EarningsSummary;
  completedJobs: SecurityRequest[];
  balance: number;
  pendingPayout?: number;
  stripeConnected?: boolean;
  stripeReady?: boolean;
  connectPending?: boolean;
  onConnectStripe?: () => void;
  onCashOut: () => void;
  cashoutPending?: boolean;
  payments?: Payment[];
}

export function GuardEarningsPanel({
  summary,
  completedJobs,
  balance,
  pendingPayout = 0,
  stripeConnected = false,
  stripeReady = false,
  connectPending = false,
  onConnectStripe,
  onCashOut,
  cashoutPending = false,
  payments = [],
}: GuardEarningsPanelProps) {
  const periods = [
    { label: 'Today', value: summary.today },
    { label: 'This Week', value: summary.week },
    { label: 'This Month', value: summary.month },
    { label: 'Lifetime', value: summary.lifetime },
  ];

  return (
    <div className="absolute inset-0 z-[1002] bg-brand-bg overflow-y-auto pt-20 pb-24 px-4">
      <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
        <div>
          <p className="text-[10px] font-mono uppercase text-brand-text-muted tracking-widest mb-1">Earnings</p>
          <h2 className="text-2xl font-black tracking-tight">Your Pay</h2>
        </div>

        {!stripeReady && onConnectStripe && (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-amber-400" />
              <p className="text-xs font-black uppercase text-amber-400">Stripe Connect Required</p>
            </div>
            <p className="text-xs text-brand-text-muted">
              Connect your Stripe Express account to receive job payouts from Guardr.
            </p>
            <button
              type="button"
              onClick={onConnectStripe}
              disabled={connectPending}
              className="w-full py-3 rounded-xl bg-amber-500 text-black font-black text-xs uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {connectPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
              ) : (
                <><Link2 className="w-4 h-4" /> Connect Stripe Account</>
              )}
            </button>
          </div>
        )}

        {stripeConnected && stripeReady && (
          <p className="text-[10px] font-mono text-emerald-400/90 bg-emerald-500/8 border border-emerald-500/20 px-3 py-2 rounded-xl">
            Stripe Connect active — payouts deposit to your connected account.
          </p>
        )}

        <div className="rounded-2xl bg-gradient-to-br from-brand-primary/15 to-transparent border border-brand-primary/30 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono uppercase text-brand-primary flex items-center gap-1.5">
              <Wallet className="w-4 h-4" /> Released Earnings
            </p>
            <span className="text-[9px] font-mono bg-brand-primary/15 text-brand-primary px-2 py-0.5 rounded-full uppercase">Stripe Connect</span>
          </div>
          <p className="text-4xl font-black font-mono">${balance.toFixed(2)}</p>
          {pendingPayout > 0 && (
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400/90">
              <Clock className="w-3.5 h-3.5" />
              ${pendingPayout.toFixed(2)} pending admin payout approval
            </div>
          )}
          <button
            type="button"
            onClick={onCashOut}
            disabled={balance <= 0 || cashoutPending || !stripeReady}
            className="w-full py-3 rounded-xl bg-brand-primary text-black font-black text-xs uppercase tracking-wider disabled:opacity-40"
          >
            {cashoutPending ? 'Processing...' : 'Cash Out'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {periods.map(({ label, value }) => (
            <div key={label} className="uber-card rounded-2xl p-4">
              <p className="text-[10px] font-mono uppercase text-brand-text-muted mb-1">{label}</p>
              <p className="text-2xl font-black font-mono text-brand-primary">${value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {payments.length > 0 && (
          <div>
            <h3 className="font-black text-sm uppercase tracking-tight mb-3">Payout History</h3>
            <div className="space-y-2">
              {payments.slice(0, 6).map((p) => (
                <div key={p.id} className="uber-card rounded-xl flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">Job {p.jobId}</p>
                    <p className="text-[10px] font-mono text-brand-text-muted capitalize">{p.status}</p>
                  </div>
                  <p className="text-lg font-black font-mono text-brand-primary shrink-0">
                    ${p.amount.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="font-black text-sm uppercase tracking-tight flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-brand-primary" />
            Recent Shifts
          </h3>
          {completedJobs.length === 0 ? (
            <div className="uber-card rounded-2xl py-12 text-center">
              <p className="text-brand-text-muted text-sm font-mono">Complete shifts to see earnings here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {completedJobs.slice(0, 8).map((job) => (
                <div key={job.id} className="uber-card rounded-xl flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{job.title}</p>
                    <p className="text-[10px] font-mono text-brand-text-muted">{job.clientName}</p>
                    {job.paymentStatus && (
                      <p className="text-[9px] font-mono text-brand-primary capitalize mt-0.5">{job.paymentStatus}</p>
                    )}
                  </div>
                  <p className="text-lg font-black font-mono text-brand-primary shrink-0">
                    +${getEstimatedGuardEarnings(job)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
