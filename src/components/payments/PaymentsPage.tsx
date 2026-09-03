import React from 'react';
import type { AppRole } from '../../lib/appNavigation';
import { useSurfaceKind } from '../../surfaces';

interface PaymentsPageProps {
  role: AppRole;
  children: React.ReactNode;
}

const PAYMENTS_SUBTITLE: Record<AppRole, string> = {
  guard: 'Earnings, payouts, and shift pay history.',
  staff: 'Guard payouts, client billing, and invoices.',
  client: 'Invoices and payment history for your security jobs.',
};

const PAYMENTS_TITLE: Record<AppRole, string> = {
  guard: 'Payments',
  staff: 'Payments & invoices',
  client: 'Payments',
};

export function PaymentsPage({ role, children }: PaymentsPageProps) {
  const surface = useSurfaceKind();

  return (
    <div className={`payments-page payments-page--${surface} flex flex-col min-h-0 h-full`}>
      <header className="payments-page-header shrink-0">
        <h1 className="payments-page-title">{PAYMENTS_TITLE[role]}</h1>
        <p className="payments-page-subtitle">{PAYMENTS_SUBTITLE[role]}</p>
      </header>
      <div className="payments-page-body flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
