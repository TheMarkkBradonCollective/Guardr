import React, { useState } from 'react';
import { DollarSign, TrendingUp, Settings, BarChart3, CreditCard, Loader2, RotateCcw } from 'lucide-react';
import { Payment, SecurityGuard, SecurityRequest } from '../../types';
import { computeGuardEarnings, PLATFORM_FEE_PER_HOUR } from '../../lib/payments';

interface AdminFinancePanelProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  payments: Payment[];
  isDirector: boolean;
  onReleasePayout?: (requestId: string, force?: boolean) => Promise<void>;
  onRefundPayment?: (requestId: string) => Promise<void>;
}

function paymentStatusLabel(status?: string): string {
  switch (status) {
    case 'paid': return 'Paid';
    case 'held': return 'Held';
    case 'released': return 'Released';
    case 'unpaid': return 'Unpaid';
    default: return status || 'Unknown';
  }
}

export function AdminFinancePanel({
  requests,
  guards,
  payments,
  isDirector,
  onReleasePayout,
  onRefundPayment,
}: AdminFinancePanelProps) {
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const completed = requests.filter((r) => r.status === 'completed');
  const platformFees = completed.reduce(
    (sum, r) => sum + (r.platformFeePerHour ?? PLATFORM_FEE_PER_HOUR) * r.durationHours,
    0
  );
  const guardPayouts = completed.reduce(
    (sum, r) => sum + computeGuardEarnings(r.durationHours, r.hourlyRate),
    0
  );
  const grossVolume = completed.reduce((sum, r) => sum + r.estimatedPayout, 0);

  const payoutQueue = requests.filter(
    (r) => r.status === 'completed' && (r.paymentStatus === 'paid' || r.paymentStatus === 'held')
  );

  const handleRelease = async (requestId: string, force = false) => {
    if (!onReleasePayout) return;
    setReleasingId(requestId);
    try {
      await onReleasePayout(requestId, force);
    } finally {
      setReleasingId(null);
    }
  };

  const handleRefund = async (requestId: string) => {
    if (!onRefundPayment) return;
    setRefundingId(requestId);
    try {
      await onRefundPayment(requestId);
    } finally {
      setRefundingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Financial Controls</p>
        <h3 className="text-xl font-black text-slate-900">Platform Revenue</h3>
        <p className="text-xs text-slate-500 mt-1">
          {isDirector ? 'Full financial visibility — Director access' : 'Administrator payout and fee management'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Gross Client Volume', value: grossVolume, icon: DollarSign },
          { label: 'Guard Payouts', value: guardPayouts, icon: TrendingUp },
          { label: 'Platform Fees', value: Math.round(platformFees * 100) / 100, icon: BarChart3 },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 text-indigo-600" />
              <p className="text-[10px] font-mono uppercase text-slate-500">{label}</p>
            </div>
            <p className="text-2xl font-black font-mono text-slate-900">${value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h4 className="font-bold text-sm flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-indigo-600" />
          Payout Status
        </h4>
        {payoutQueue.length === 0 && payments.length === 0 ? (
          <p className="text-xs text-slate-500 font-mono">No pending payouts. Completed paid jobs will appear here.</p>
        ) : (
          <div className="space-y-2">
            {(payoutQueue.length > 0 ? payoutQueue : requests.filter(r => r.paymentStatus && r.paymentStatus !== 'unpaid')).slice(0, 12).map((req) => {
              const guard = guards.find(g => g.id === req.assignedGuardId);
              const payment = payments.find(p => p.jobId === req.id);
              const guardAmount = computeGuardEarnings(req.durationHours, req.hourlyRate);
              const canRelease = req.status === 'completed' && ['paid', 'held'].includes(req.paymentStatus || '');
              return (
                <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-100 rounded-lg p-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-bold truncate">{req.title}</p>
                    <p className="text-[10px] font-mono text-slate-500">
                      {req.clientName} · Guard: {guard?.name || 'Unassigned'} · {paymentStatusLabel(req.paymentStatus)}
                    </p>
                    {payment && (
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                        Payment record: {payment.status} · ${payment.amount}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-black font-mono text-indigo-600">${guardAmount}</span>
                    {canRelease && onReleasePayout && (
                      <button
                        type="button"
                        onClick={() => handleRelease(req.id)}
                        disabled={releasingId === req.id || !guard?.stripeConnectAccountId}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-[10px] font-black uppercase disabled:opacity-40 flex items-center gap-1"
                      >
                        {releasingId === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        Release
                      </button>
                    )}
                    {isDirector && req.stripePaymentIntentId && req.paymentStatus !== 'released' && onRefundPayment && (
                      <button
                        type="button"
                        onClick={() => handleRefund(req.id)}
                        disabled={refundingId === req.id}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-[10px] font-black uppercase disabled:opacity-40 flex items-center gap-1"
                      >
                        {refundingId === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                        Refund
                      </button>
                    )}
                    {isDirector && canRelease && onReleasePayout && (
                      <button
                        type="button"
                        onClick={() => handleRelease(req.id, true)}
                        disabled={releasingId === req.id}
                        className="px-2 py-1.5 rounded-lg border border-amber-300 text-amber-700 text-[9px] font-black uppercase"
                        title="Director force payout"
                      >
                        Force
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h4 className="font-bold text-sm flex items-center gap-2">
          <Settings className="w-4 h-4 text-indigo-600" />
          Fee Configuration
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Platform Fee (per hour)</label>
            <input
              type="number"
              defaultValue={PLATFORM_FEE_PER_HOUR}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
              readOnly={!isDirector}
            />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Payout Schedule</label>
            <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" defaultValue="instant">
              <option value="instant">On admin approval (Stripe Connect)</option>
              <option value="weekly">Weekly batch</option>
            </select>
          </div>
        </div>
        {isDirector && (
          <p className="text-[10px] font-mono text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Director override enabled — force payouts and refunds available.
          </p>
        )}
      </div>

      {isDirector && (
        <div className="bg-slate-950 text-white rounded-xl p-5 border border-slate-800">
          <h4 className="font-bold text-sm text-emerald-400 mb-3">Audit Log (recent)</h4>
          <div className="space-y-2 text-[11px] font-mono text-slate-400">
            <p><span className="text-slate-600">[{new Date().toLocaleDateString()}]</span> Platform fee model active at ${PLATFORM_FEE_PER_HOUR}/hr</p>
            <p><span className="text-slate-600">[{new Date().toLocaleDateString()}]</span> {completed.length} completed shifts · {payments.filter(p => p.status === 'released').length} payouts released</p>
            <p><span className="text-slate-600">[{new Date().toLocaleDateString()}]</span> Stripe Connect Express accounts active</p>
          </div>
        </div>
      )}
    </div>
  );
}
