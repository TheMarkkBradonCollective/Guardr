import React from 'react';
import { Payment, SecurityGuard, SecurityRequest } from '../../types';
import {
  PIPELINE_SECTION_META,
  paymentPipelineSummary,
} from '../../lib/paymentPipeline';
import { WfMetricTile, WfSectionHeader } from '../ui/wireframe';
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
      <WfSectionHeader title={meta.title} count={items.length} />
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
        <p className="text-xs text-brand-text-muted">
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
        <h1 className="text-2xl font-bold">Payments</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <WfMetricTile
          label="Awaiting client"
          value={
            <>
              {summary.awaitingClient.length}
              <span className="block text-xs font-normal text-brand-text-muted mt-0.5">${summary.awaitingClientTotal}</span>
            </>
          }
        />
        <WfMetricTile
          label="Card pay due"
          value={
            <>
              {summary.cashDepositPending.length}
              <span className="block text-xs font-normal text-brand-text-muted mt-0.5">${summary.cashDepositTotal}</span>
            </>
          }
          accent
        />
        <WfMetricTile
          label="Pay guard"
          value={
            <>
              {summary.awaitingGuardPayout.length}
              <span className="block text-xs font-normal text-brand-text-muted mt-0.5">${summary.guardPayoutDue} due</span>
            </>
          }
          accent
        />
        <WfMetricTile
          label="Settled"
          value={
            <>
              {summary.settled.length}
              <span className="block text-xs font-normal text-brand-text-muted mt-0.5">${summary.settledGuardTotal}</span>
            </>
          }
        />
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
          <p className="text-center text-sm text-brand-text-muted py-12 wf-list-card justify-center">
            No payment activity yet. Jobs appear here when clients post requests.
          </p>
        )}
    </div>
  );
}
