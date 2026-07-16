import React, { useMemo } from 'react';
import { GuardPayoutInvoice, Payment, SecurityGuard, SecurityRequest } from '../../types';
import type { ClientPaymentGates } from '../../lib/platformSettings';
import { openGuardPayoutInvoices } from '../../lib/guardPayoutInvoiceStorage';
import { PIPELINE_FLOW_STEPS } from '../../lib/paymentDisplay';
import {
  PIPELINE_SECTION_META,
  paymentPipelineSummary,
} from '../../lib/paymentPipeline';
import { computeOperationalFinancials } from '../../lib/operationalFinancials';
import { buildPayoutExportRows, downloadPayoutCsv } from '../../lib/payoutExport';
import { Download } from 'lucide-react';
import { AppItemCardStack } from '../ui/app/AppPrimitives';
import { WfSectionHeader } from '../ui/wireframe';
import { useDevice } from '../../lib/platform';
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
  onMarkOvertimePaidCash?: (requestId: string) => Promise<void>;
  onApproveOvertimeCashPayment?: (requestId: string) => Promise<void>;
  onMakeOvertimeGuardPayoutAvailable?: (requestId: string) => Promise<void>;
  onMarkOvertimeGuardPaidCash?: (requestId: string) => Promise<void>;
  onApproveClientCashPayment?: (requestId: string) => Promise<void>;
  onRejectClientCashPayment?: (requestId: string) => Promise<void>;
  onMarkGuardPaidCash?: (requestId: string) => Promise<void>;
  onMarkPlatformFeePaidCash?: (requestId: string) => Promise<void>;
  onMarkCashDepositManually?: (requestId: string) => Promise<void>;
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
  onMarkOvertimePaidCash,
  onApproveOvertimeCashPayment,
  onMakeOvertimeGuardPayoutAvailable,
  onMarkOvertimeGuardPaidCash,
  onApproveClientCashPayment,
  onRejectClientCashPayment,
  onMarkGuardPaidCash,
  onMarkPlatformFeePaidCash,
  onMarkCashDepositManually,
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
  onMarkOvertimePaidCash?: (requestId: string) => Promise<void>;
  onApproveOvertimeCashPayment?: (requestId: string) => Promise<void>;
  onMakeOvertimeGuardPayoutAvailable?: (requestId: string) => Promise<void>;
  onMarkOvertimeGuardPaidCash?: (requestId: string) => Promise<void>;
  onApproveClientCashPayment?: (requestId: string) => Promise<void>;
  onRejectClientCashPayment?: (requestId: string) => Promise<void>;
  onMarkGuardPaidCash?: (requestId: string) => Promise<void>;
  onMarkPlatformFeePaidCash?: (requestId: string) => Promise<void>;
  onMarkCashDepositManually?: (requestId: string) => Promise<void>;
  readOnly?: boolean;
  limit?: number;
}) {
  const meta = PIPELINE_SECTION_META[stage];
  const [expanded, setExpanded] = React.useState(false);
  const effectiveLimit = expanded ? undefined : limit;
  const visible = effectiveLimit ? items.slice(0, effectiveLimit) : items;

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
            onMarkOvertimePaidCash={onMarkOvertimePaidCash}
            onApproveOvertimeCashPayment={onApproveOvertimeCashPayment}
            onMakeOvertimeGuardPayoutAvailable={onMakeOvertimeGuardPayoutAvailable}
            onMarkOvertimeGuardPaidCash={onMarkOvertimeGuardPaidCash}
            onApproveClientCashPayment={onApproveClientCashPayment}
            onRejectClientCashPayment={onRejectClientCashPayment}
            onMarkGuardPaidCash={onMarkGuardPaidCash}
            onMarkPlatformFeePaidCash={onMarkPlatformFeePaidCash}
            onMarkCashDepositManually={onMarkCashDepositManually}
          />
        ))}
      </AppItemCardStack>
      {limit && items.length > limit && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-brand-text-muted">
            {expanded ? `Showing all ${items.length}.` : `Showing ${limit} of ${items.length}.`}
          </p>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-xs font-semibold text-brand-primary hover:underline"
          >
            {expanded ? 'Show fewer' : `Show all ${items.length}`}
          </button>
        </div>
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
  onMarkOvertimePaidCash,
  onApproveOvertimeCashPayment,
  onMakeOvertimeGuardPayoutAvailable,
  onMarkOvertimeGuardPaidCash,
  onApproveClientCashPayment,
  onRejectClientCashPayment,
  onMarkGuardPaidCash,
  onMarkPlatformFeePaidCash,
  onMarkCashDepositManually,
  onCompletePayoutInvoice,
}: StaffPaymentsPanelProps) {
  const { formFactor } = useDevice();
  const summary = paymentPipelineSummary(requests);
  const financials = useMemo(() => computeOperationalFinancials(requests), [requests]);
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
    onMarkOvertimePaidCash,
    onApproveOvertimeCashPayment,
    onMakeOvertimeGuardPayoutAvailable,
    onMarkOvertimeGuardPaidCash,
    onApproveClientCashPayment,
    onRejectClientCashPayment,
    onMarkGuardPaidCash,
    onMarkPlatformFeePaidCash,
    onMarkCashDepositManually,
  };

  const actionCount =
    openInvoices.length +
    summary.awaitingGuardPayout.length +
    summary.cashDepositPending.length +
    summary.awaitingClient.length;

  return (
    <div className={`animate-fade-in staff-payments-panel${formFactor === 'desktop' ? ' adm-payments-workbench' : ''}`}>
      <div className={formFactor === 'desktop' ? 'adm-dashboard-grid adm-span-12' : 'staff-payments-summary'}>
        {formFactor === 'desktop' ? (
          <>
            {actionCount > 0 && (
              <article className="adm-card adm-span-12">
                <p className="adm-card-eyebrow">Attention needed</p>
                <p className="adm-stat-value adm-stat-value--sm">{actionCount} job{actionCount === 1 ? '' : 's'}</p>
              </article>
            )}
            <article className="adm-card adm-span-12">
              <StaffPaymentSummary summary={summary} financials={financials} />
            </article>
          </>
        ) : (
          <>
        {actionCount > 0 && (
          <p className="staff-payments-attention">
            {actionCount} job{actionCount === 1 ? '' : 's'} need your attention
          </p>
        )}
        <StaffPaymentSummary summary={summary} financials={financials} />
          </>
        )}
        {canManagePayments && (
          <button
            type="button"
            className={formFactor === 'desktop' ? 'adm-btn adm-btn--outline adm-btn--sm adm-mt-sm' : 'app-button-outline app-btn-sm gap-2 staff-payments-export'}
            onClick={() => downloadPayoutCsv(buildPayoutExportRows(requests, guards, payments))}
          >
            <Download className="w-4 h-4" />
            Export payouts CSV
          </button>
        )}
      </div>

      <div className={formFactor === 'desktop' ? 'adm-payments-pipeline' : 'staff-payments-body'}>
        {openInvoices.length > 0 && (
          <section className="space-y-3">
            <WfSectionHeader title="Guard payout invoices" count={openInvoices.length} />
            <AppItemCardStack className={formFactor === 'desktop' ? '' : '-mx-4 sm:-mx-5 px-4 sm:px-5'}>
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
            <div className="app-empty-state">
              <div className="app-empty-state-icon">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="app-empty-state-title">No payment activity yet</p>
              <p className="app-empty-state-body">Jobs will appear here once clients post security requests.</p>
            </div>
          )}
      </div>
    </div>
  );
}
