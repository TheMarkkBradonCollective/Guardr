import React from 'react';
import { Payment, SecurityGuard, SecurityRequest } from '../../types';
import {
  PIPELINE_SECTION_META,
  paymentPipelineSummary,
} from '../../lib/paymentPipeline';
import { JobPaymentRow } from './JobPaymentRow';

interface StaffPaymentsPanelProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  payments: Payment[];
  isDirector: boolean;
  onReleasePayout?: (requestId: string, force?: boolean) => Promise<void>;
  onRefundPayment?: (requestId: string) => Promise<void>;
  onMarkClientPaidCash?: (requestId: string) => Promise<void>;
  onMarkGuardPaidCash?: (requestId: string) => Promise<void>;
  onDepositCashToStripe?: (requestId: string) => Promise<void>;
}

function PipelineSection({
  stage,
  items,
  guards,
  payments,
  isDirector,
  onReleasePayout,
  onRefundPayment,
  onMarkClientPaidCash,
  onMarkGuardPaidCash,
  onDepositCashToStripe,
  readOnly = false,
  limit,
}: {
  stage: keyof typeof PIPELINE_SECTION_META;
  items: SecurityRequest[];
  guards: SecurityGuard[];
  payments: Payment[];
  isDirector: boolean;
  onReleasePayout?: (requestId: string, force?: boolean) => Promise<void>;
  onRefundPayment?: (requestId: string) => Promise<void>;
  onMarkClientPaidCash?: (requestId: string) => Promise<void>;
  onMarkGuardPaidCash?: (requestId: string) => Promise<void>;
  onDepositCashToStripe?: (requestId: string) => Promise<void>;
  readOnly?: boolean;
  limit?: number;
}) {
  const meta = PIPELINE_SECTION_META[stage];
  const visible = limit ? items.slice(0, limit) : items;

  if (visible.length === 0) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-black flex items-center gap-2">
          {meta.title}
          <span className="text-[10px] font-mono font-bold text-brand-text-muted border border-brand-border rounded px-1.5 py-0.5">
            {items.length}
          </span>
        </h2>
      </div>
      <div className="space-y-2">
        {visible.map((req) => (
          <JobPaymentRow
            key={req.id}
            req={req}
            guard={guards.find((g) => g.id === req.assignedGuardId)}
            payment={payments.find((p) => p.jobId === req.id)}
            isDirector={isDirector}
            readOnly={readOnly}
            onReleasePayout={onReleasePayout}
            onRefundPayment={onRefundPayment}
            onMarkClientPaidCash={onMarkClientPaidCash}
            onMarkGuardPaidCash={onMarkGuardPaidCash}
            onDepositCashToStripe={onDepositCashToStripe}
          />
        ))}
      </div>
      {limit && items.length > limit && (
        <p className="text-[10px] font-mono text-brand-text-muted">
          Showing {limit} of {items.length} settled jobs.
        </p>
      )}
    </section>
  );
}

export function StaffPaymentsPanel({
  requests,
  guards,
  payments,
  isDirector,
  onReleasePayout,
  onRefundPayment,
  onMarkClientPaidCash,
  onMarkGuardPaidCash,
  onDepositCashToStripe,
}: StaffPaymentsPanelProps) {
  const summary = paymentPipelineSummary(requests);

  const sectionProps = {
    guards,
    payments,
    isDirector,
    onReleasePayout,
    onRefundPayment,
    onMarkClientPaidCash,
    onMarkGuardPaidCash,
    onDepositCashToStripe,
  };

  return (
    <div className="space-y-8 max-w-5xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-black">Payments</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="staff-ops-card p-4">
          <p className="text-[10px] font-mono uppercase text-brand-text-muted">Awaiting client</p>
          <p className="text-2xl font-black font-mono mt-1">{summary.awaitingClient.length}</p>
          <p className="text-[10px] font-mono text-brand-text-muted mt-1">${summary.awaitingClientTotal}</p>
        </div>
        <div className="staff-ops-card p-4 ring-1 ring-orange-500/30">
          <p className="text-[10px] font-mono uppercase text-orange-300">Card pay due</p>
          <p className="text-2xl font-black font-mono mt-1 text-orange-300">{summary.cashDepositPending.length}</p>
          <p className="text-[10px] font-mono text-brand-text-muted mt-1">${summary.cashDepositTotal}</p>
        </div>
        <div className="staff-ops-card p-4 ring-1 ring-brand-primary/30">
          <p className="text-[10px] font-mono uppercase text-brand-primary">Pay guard</p>
          <p className="text-2xl font-black font-mono mt-1 text-brand-primary">{summary.awaitingGuardPayout.length}</p>
          <p className="text-[10px] font-mono text-brand-text-muted mt-1">${summary.guardPayoutDue} due</p>
        </div>
        <div className="staff-ops-card p-4">
          <p className="text-[10px] font-mono uppercase text-brand-text-muted">Settled</p>
          <p className="text-2xl font-black font-mono mt-1">{summary.settled.length}</p>
          <p className="text-[10px] font-mono text-brand-text-muted mt-1">${summary.settledGuardTotal}</p>
        </div>
      </div>

      <PipelineSection stage="cash-deposit-pending" items={summary.cashDepositPending} {...sectionProps} />
      <PipelineSection stage="awaiting-guard-payout" items={summary.awaitingGuardPayout} {...sectionProps} />
      <PipelineSection stage="awaiting-client" items={summary.awaitingClient} {...sectionProps} />
      <PipelineSection stage="client-paid-active" items={summary.clientPaidActive} {...sectionProps} readOnly />
      <PipelineSection
        stage="settled"
        items={summary.settled}
        {...sectionProps}
        readOnly
        limit={8}
      />

      {summary.awaitingClient.length === 0 &&
        summary.cashDepositPending.length === 0 &&
        summary.awaitingGuardPayout.length === 0 &&
        summary.clientPaidActive.length === 0 &&
        summary.settled.length === 0 && (
          <p className="text-center text-sm text-brand-text-muted font-mono py-12 staff-ops-card">
            No payment activity yet. Jobs appear here when clients post requests.
          </p>
        )}
    </div>
  );
}
