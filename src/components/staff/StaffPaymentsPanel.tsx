import React, { useMemo } from 'react';
import { GuardPayoutInvoice, Payment, SecurityGuard, SecurityRequest } from '../../types';
import type { ClientPaymentGates } from '../../lib/platformSettings';
import { openGuardPayoutInvoices } from '../../lib/guardPayoutInvoiceStorage';
import { PIPELINE_FLOW_STEPS } from '../../lib/paymentDisplay';
import {
  PIPELINE_SECTION_META,
  paymentPipelineSummary,
} from '../../lib/paymentPipeline';
import { AppItemCardStack } from '../ui/app/AppPrimitives';
import { WfSectionHeader } from '../ui/wireframe';
import { JobPaymentRow } from './JobPaymentRow';
import { StaffPaymentSummary } from './StaffPaymentSummary';
import { StaffPayoutInvoiceRow } from './StaffPayoutInvoiceRow';

interface StaffPaymentsPanelProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  payments: Payment[];
  payoutInvoices?: GuardPayoutInvoice[];
  isDirector: boolean;
  canManagePayments: boolean;
  paymentGates: ClientPaymentGates;
  onMakeGuardPayoutAvailable?: (requestId: string) => Promise<void>;
  onReleasePayout?: (requestId: string, force?: boolean) => Promise<void>;
  onRefundPayment?: (requestId: string) => Promise<void>;
  onMarkClientPaidCash?: (requestId: string) => Promise<void>;
  onApproveClientCashPayment?: (requestId: string) => Promise<void>;
  onRejectClientCashPayment?: (requestId: string) => Promise<void>;
  onMarkGuardPaidCash?: (requestId: string) => Promise<void>;
  onMarkPlatformFeePaidCash?: (requestId: string) => Promise<void>;
  onDepositCashToStripe?: (requestId: string) => Promise<void>;
  onCompletePayoutInvoice?: (invoiceId: string) => Promise<void>;
}

function PipelineSection({
  stage,
  items,
  guards,
  payments,
  isDirector,
  canManagePayments,
  paymentGates,
  onMakeGuardPayoutAvailable,
  onRefundPayment,
  onMarkClientPaidCash,
  onApproveClientCashPayment,
  onRejectClientCashPayment,
  onMarkPlatformFeePaidCash,
  onDepositCashToStripe,
  readOnly = false,
  limit,
}: {
  stage: keyof typeof PIPELINE_SECTION_META;
  items: SecurityRequest[];
  guards: SecurityGuard[];
  payments: Payment[];
  isDirector: boolean;
  canManagePayments: boolean;
  paymentGates: ClientPaymentGates;
  onMakeGuardPayoutAvailable?: (requestId: string) => Promise<void>;
  onRefundPayment?: (requestId: string) => Promise<void>;
  onMarkClientPaidCash?: (requestId: string) => Promise<void>;
  onApproveClientCashPayment?: (requestId: string) => Promise<void>;
  onRejectClientCashPayment?: (requestId: string) => Promise<void>;
  onMarkPlatformFeePaidCash?: (requestId: string) => Promise<void>;
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
            canManagePayments={canManagePayments}
            paymentGates={paymentGates}
            readOnly={readOnly}
            onMakeGuardPayoutAvailable={onMakeGuardPayoutAvailable}
            onRefundPayment={onRefundPayment}
            onMarkClientPaidCash={onMarkClientPaidCash}
            onApproveClientCashPayment={onApproveClientCashPayment}
            onRejectClientCashPayment={onRejectClientCashPayment}
            onMarkPlatformFeePaidCash={onMarkPlatformFeePaidCash}
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
  payoutInvoices = [],
  isDirector,
  canManagePayments,
  paymentGates,
  onMakeGuardPayoutAvailable,
  onReleasePayout,
  onRefundPayment,
  onMarkClientPaidCash,
  onApproveClientCashPayment,
  onRejectClientCashPayment,
  onMarkGuardPaidCash,
  onMarkPlatformFeePaidCash,
  onDepositCashToStripe,
  onCompletePayoutInvoice,
}: StaffPaymentsPanelProps) {
  const summary = paymentPipelineSummary(requests);
  const openInvoices = useMemo(() => openGuardPayoutInvoices(payoutInvoices), [payoutInvoices]);

  const sectionProps = {
    guards,
    payments,
    isDirector,
    canManagePayments,
    paymentGates,
    onMakeGuardPayoutAvailable,
    onRefundPayment,
    onMarkClientPaidCash,
    onApproveClientCashPayment,
    onRejectClientCashPayment,
    onMarkPlatformFeePaidCash,
    onDepositCashToStripe,
  };

  const actionCount =
    openInvoices.length +
    summary.awaitingGuardPayout.length +
    summary.cashDepositPending.length +
    summary.awaitingClient.length;

  return (
    <div className="animate-fade-in -mx-4 sm:-mx-5">
      <div className="px-4 sm:px-5 pb-5 border-b border-brand-border">
        <p className="text-sm text-brand-text-muted leading-relaxed">
          Every job follows the same path: the client pays, the job runs, then the guard collects pay from their Pay screen.
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
        <div className="mt-5">
          <StaffPaymentSummary summary={summary} />
        </div>
      </div>

      <div className="px-4 sm:px-5 space-y-8 pt-6">
        {openInvoices.length > 0 && (
          <section className="space-y-3">
            <WfSectionHeader title="Guard payout invoices" count={openInvoices.length} />
            <p className="text-xs text-brand-text-muted leading-relaxed">
              Guards submit these from Pay when they want cash pickup or a bank transfer. Fulfill each line item, then mark the invoice completed.
            </p>
            <AppItemCardStack className="-mx-4 sm:-mx-5 px-4 sm:px-5">
              {openInvoices.map((invoice) => (
                <StaffPayoutInvoiceRow
                  key={invoice.id}
                  invoice={invoice}
                  requests={requests}
                  guards={guards}
                  isDirector={isDirector}
                  onMarkGuardPaidCash={onMarkGuardPaidCash}
                  onReleasePayout={onReleasePayout}
                  onCompleteInvoice={onCompletePayoutInvoice}
                />
              ))}
            </AppItemCardStack>
          </section>
        )}

        <PipelineSection stage="awaiting-guard-payout" items={summary.awaitingGuardPayout} {...sectionProps} />
        <PipelineSection stage="cash-deposit-pending" items={summary.cashDepositPending} {...sectionProps} />
        <PipelineSection stage="awaiting-client" items={summary.awaitingClient} {...sectionProps} />
        <PipelineSection
          stage="guard-collection-pending"
          items={summary.guardCollectionPending}
          {...sectionProps}
          readOnly
        />
        <PipelineSection stage="client-paid-active" items={summary.clientPaidActive} {...sectionProps} readOnly />
        <PipelineSection
          stage="settled"
          items={summary.settled}
          {...sectionProps}
          readOnly
          limit={8}
        />

        {openInvoices.length === 0 &&
          summary.awaitingClient.length === 0 &&
          summary.cashDepositPending.length === 0 &&
          summary.awaitingGuardPayout.length === 0 &&
          summary.guardCollectionPending.length === 0 &&
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
