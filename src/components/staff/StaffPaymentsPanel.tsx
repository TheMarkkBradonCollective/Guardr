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
      <div className="app-list !border-t-0 -mx-4 sm:-mx-5">
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
    <div className="animate-fade-in -mx-4 sm:-mx-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border-t border-brand-border">
        <div className="p-4 border-b border-r border-brand-border">
          <WfMetricTile
            label="Awaiting client"
            value={
              <>
                {summary.awaitingClient.length}
                <span className="block text-xs font-normal text-brand-text-muted mt-0.5">${summary.awaitingClientTotal}</span>
              </>
            }
          />
        </div>
        <div className="p-4 border-b border-r border-brand-border">
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
        </div>
        <div className="p-4 border-b border-r border-brand-border">
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
        </div>
        <div className="p-4 border-b border-brand-border">
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
      </div>

      <div className="px-4 sm:px-5 space-y-8 pt-6">
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
          <p className="staff-empty-state border-t border-brand-border">
            No payment activity yet. Jobs appear here when clients post requests.
          </p>
        )}
      </div>
    </div>
  );
}
