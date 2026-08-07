import React from 'react';
import type { AppRole } from '../../lib/appNavigation';

interface PaymentsPageProps {
  role: AppRole;
  children: React.ReactNode;
}

const PAYMENTS_SUBTITLE: Record<AppRole, string> = {
  guard: 'Earnings, payouts, and shift pay history.',
  staff: 'Guard payouts, client billing, and staff compensation.',
  client: 'Invoices and payment history for your security jobs.',
};

export function PaymentsPage({ role, children }: PaymentsPageProps) {
  return (
    <div className="payments-page flex flex-col min-h-0 h-full">
      <header className="payments-page-header px-4 pt-4 pb-3 border-b border-brand-border shrink-0">
        <h1 className="text-xl font-bold">Payments</h1>
        <p className="text-sm text-brand-text-muted mt-1">{PAYMENTS_SUBTITLE[role]}</p>
      </header>
      <div className="payments-page-body flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
