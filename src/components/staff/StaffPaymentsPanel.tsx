import React from 'react';
import { Payment, SecurityGuard, SecurityRequest } from '../../types';
import { PIPELINE_FLOW_STEPS } from '../../lib/paymentDisplay';
import {
  PIPELINE_SECTION_META,
  paymentPipelineSummary,
} from '../../lib/paymentPipeline';
import { AppItemCardStack } from '../ui/app/AppPrimitives';
import { WfSectionHeader } from '../ui/wireframe';
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
        <WfSectionHeader title={meta.title} count={items.length} />
        <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">{meta.description}</p>
      </div>
      <AppItemCardStack className="-mx-4 sm:-mx-5 px-4 sm:px-5">
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
      </AppItemCardStack>
      {limit && items.length > limit && (
        <p className="text-xs text-brand-text-muted">
          Showing {limit} of {items.length} completed payouts.
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

  const actionCount =
    summary.awaitingGuardPayout.length +
    summary.cashDepositPending.length +
    summary.awaitingClient.length;

  return (
    <div className="animate-fade-in -mx-4 sm:-mx-5">
      <div className="px-4 sm:px-5 pb-5 border-b border-brand-border">
        <p className="text-sm text-brand-text-muted leading-relaxed">
          Every job follows the same path: the client pays, the shift runs, then you pay the guard.
          Jobs below are grouped by what needs to happen next.
        </p>
        <ol className="mt-4 space-y-1.5 text-xs text-brand-text-muted list-decimal list-inside">
          {PIPELINE_FLOW_STEPS.map((step) => (
            <li key={step.step}>
              <span className="font-semibold text-brand-text">{step.label}</span>
              {' — '}
              {step.description}
            </li>
          ))}
        </ol>
        {actionCount > 0 && (
          <p className="text-sm font-semibold text-brand-primary mt-4">
            {actionCount} job{actionCount === 1 ? '' : 's'} need your attention
          </p>
        )}
      </div>

      <div className="px-4 sm:px-5 space-y-8 pt-6">
        <PipelineSection stage="awaiting-guard-payout" items={summary.awaitingGuardPayout} {...sectionProps} />
        <PipelineSection stage="cash-deposit-pending" items={summary.cashDepositPending} {...sectionProps} />
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
              No payment activity yet. Jobs appear here once clients post requests.
            </p>
          )}
      </div>
    </div>
  );
}
