import React from 'react';
import { Payment, SecurityGuard, SecurityRequest } from '../../types';
import { AdminFinancePanel } from './AdminFinancePanel';
import { computeGuardEarnings, PLATFORM_FEE_PER_HOUR } from '../../lib/payments';

interface StaffPaymentsPanelProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  payments: Payment[];
  isDirector: boolean;
  onReleasePayout?: (requestId: string, force?: boolean) => Promise<void>;
  onRefundPayment?: (requestId: string) => Promise<void>;
}

export function StaffPaymentsPanel({
  requests,
  guards,
  payments,
  isDirector,
  onReleasePayout,
  onRefundPayment,
}: StaffPaymentsPanelProps) {
  const pending = requests.filter((r) => r.status === 'completed' && !r.ratingGiven);
  const completed = requests.filter((r) => r.status === 'completed');
  const failed: SecurityRequest[] = [];

  return (
    <div className="space-y-8 max-w-5xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-black">Payments</h1>
        <p className="text-xs font-mono text-brand-text-muted mt-1 uppercase">Stripe Connect · Payouts & platform revenue</p>
      </div>

      <AdminFinancePanel
        requests={requests}
        guards={guards}
        payments={payments}
        isDirector={isDirector}
        onReleasePayout={onReleasePayout}
        onRefundPayment={onRefundPayment}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { title: 'Pending Payouts', items: pending, action: 'Release funds' },
          { title: 'Completed Payouts', items: completed.slice(0, 5), action: null },
          { title: 'Failed Payouts', items: failed, action: null },
        ].map(({ title, items, action }) => (
          <div key={title} className="staff-ops-card">
            <h3 className="text-xs font-mono uppercase tracking-widest text-brand-text-muted mb-3">{title}</h3>
            {items.length === 0 ? (
              <p className="text-xs text-brand-text-muted font-mono">None</p>
            ) : (
              <ul className="space-y-2">
                {items.slice(0, 4).map((r) => (
                  <li key={r.id} className="text-xs border-b border-brand-border pb-2 last:border-0">
                    <p className="font-bold truncate">{r.title}</p>
                    <p className="font-mono text-brand-text-muted mt-0.5">
                      ${computeGuardEarnings(r.durationHours, r.hourlyRate)} guard · ${(r.platformFeePerHour ?? PLATFORM_FEE_PER_HOUR) * r.durationHours} fee
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {action && items.length > 0 && (
              <button type="button" onClick={() => alert(`${action} for ${items.length} shift(s).`)} className="staff-ops-btn-primary text-[10px] mt-3 w-full">
                {action}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
