import React, { useEffect, useMemo, useState } from 'react';
import { GuardPayoutInvoice, Payment, SecurityGuard, SecurityRequest, SessionUser } from '../../types';
import type { ClientPaymentGates, PlatformSettings } from '../../lib/platformSettings';
import { openGuardPayoutInvoices, guardPayoutInvoiceLines, guardPayoutInvoiceTotal } from '../../lib/guardPayoutInvoiceStorage';
import {
  PIPELINE_SECTION_META,
  paymentPipelineSummary,
  pipelineStageRequests,
  type PaymentPipelineStage,
} from '../../lib/paymentPipeline';
import { computeOperationalFinancials } from '../../lib/operationalFinancials';
import { buildPayoutExportRows, downloadPayoutCsv } from '../../lib/payoutExport';
import { staffJobMoneySummary } from '../../lib/paymentDisplay';
import { Download } from 'lucide-react';
import { AppItemCardStack } from '../ui/app/AppPrimitives';
import { WfSectionHeader } from '../ui/wireframe';
import { useLayoutFormFactor } from '../../surfaces';
import { GuardrButton } from '../baseui/GuardrButton';
import { GuardrDataTable, type GuardrTableColumn } from '../baseui/GuardrDataTable';
import {
  WorkbenchEmpty,
  WorkbenchSplit,
  WorkbenchToolbar,
} from '../baseui/layout/WorkbenchLayout';
import { JobPaymentRow } from './JobPaymentRow';
import { StaffListFilterTabs } from './StaffListFilterTabs';
import { StaffOpsPageShell } from './StaffOpsPageShell';
import { StaffPaymentSummary } from './StaffPaymentSummary';
import { StaffPayoutInvoiceRow } from './StaffPayoutInvoiceRow';
import { StaffCompensationSection } from './StaffCompensationPanel';

interface StaffPaymentsPanelProps {
  currentUser: SessionUser;
  platformSettings: PlatformSettings;
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  payments: Payment[];
  payoutInvoices?: GuardPayoutInvoice[];
  isDirector: boolean;
  canManagePayments: boolean;
  showStaffCompensation?: boolean;
  paymentGates: ClientPaymentGates;
  onMakeGuardPayoutAvailable?: (requestId: string) => Promise<void>;
  onReleasePayout?: (requestId: string, force?: boolean) => Promise<void>;
  onRefundPayment?: (requestId: string) => Promise<void>;
  onMakeOvertimeGuardPayoutAvailable?: (requestId: string) => Promise<void>;
  onCompletePayoutInvoice?: (invoiceId: string) => Promise<void>;
}

type PipelineStageKey = Exclude<PaymentPipelineStage, 'closed' | 'cash-deposit-pending'>;

type PaymentQueueItem =
  | { kind: 'job'; id: string; req: SecurityRequest; stage: PipelineStageKey }
  | { kind: 'invoice'; id: string; invoice: GuardPayoutInvoice };

type PaymentsFilter = 'action' | 'all' | PipelineStageKey | 'invoices';

const ACTION_STAGES: PipelineStageKey[] = [
  'awaiting-guard-payout',
  'awaiting-client',
];

const PIPELINE_STAGE_ORDER: PipelineStageKey[] = [
  'awaiting-guard-payout',
  'awaiting-client',
  'guard-collection-pending',
  'client-paid-active',
  'settled',
];

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
  onMakeOvertimeGuardPayoutAvailable,
  readOnly = false,
  limit,
}: {
  stage: PipelineStageKey;
  items: SecurityRequest[];
  guards: SecurityGuard[];
  payments: Payment[];
  isDirector: boolean;
  canManagePayments: boolean;
  paymentGates: ClientPaymentGates;
  onMakeGuardPayoutAvailable?: (requestId: string) => Promise<void>;
  onRefundPayment?: (requestId: string) => Promise<void>;
  onMakeOvertimeGuardPayoutAvailable?: (requestId: string) => Promise<void>;
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
      <AppItemCardStack className="ops-list-bleed-stack">
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
            onMakeOvertimeGuardPayoutAvailable={onMakeOvertimeGuardPayoutAvailable}
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

function queueItemLabel(item: PaymentQueueItem): string {
  if (item.kind === 'invoice') return 'Payout invoice';
  return PIPELINE_SECTION_META[item.stage].title;
}

function queueItemPrimary(item: PaymentQueueItem): string {
  if (item.kind === 'invoice') return `${item.invoice.guardName} — invoice`;
  return item.req.title;
}

function queueItemSecondary(item: PaymentQueueItem, guards: SecurityGuard[]): string {
  if (item.kind === 'invoice') {
    const lines = guardPayoutInvoiceLines(item.invoice);
    const total = guardPayoutInvoiceTotal(item.invoice);
    return `${lines.length} job${lines.length === 1 ? '' : 's'} · $${total.toFixed(2)}`;
  }
  const guard = guards.find((g) => g.id === item.req.assignedGuardId);
  return `${item.req.clientName} · ${guard?.name || 'No guard'}`;
}

function queueItemAmount(item: PaymentQueueItem): string {
  if (item.kind === 'invoice') return `$${guardPayoutInvoiceTotal(item.invoice).toFixed(2)}`;
  return staffJobMoneySummary(item.req).headline;
}

export function StaffPaymentsPanel({
  currentUser,
  platformSettings,
  requests,
  guards,
  payments,
  payoutInvoices = [],
  isDirector,
  canManagePayments,
  showStaffCompensation = true,
  paymentGates,
  onMakeGuardPayoutAvailable,
  onReleasePayout,
  onRefundPayment,
  onMakeOvertimeGuardPayoutAvailable,
  onCompletePayoutInvoice,
}: StaffPaymentsPanelProps) {
  const formFactor = useLayoutFormFactor();
  const showGuardPayments = canManagePayments;
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
    onMakeOvertimeGuardPayoutAvailable,
  };

  const actionCount =
    openInvoices.length +
    summary.awaitingGuardPayout.length +
    summary.awaitingClient.length;

  const allQueueItems = useMemo(() => {
    const items: PaymentQueueItem[] = openInvoices.map((invoice) => ({
      kind: 'invoice' as const,
      id: `invoice-${invoice.id}`,
      invoice,
    }));
    for (const stage of PIPELINE_STAGE_ORDER) {
      for (const req of pipelineStageRequests(summary, stage)) {
        items.push({ kind: 'job', id: req.id, req, stage });
      }
    }
    return items;
  }, [openInvoices, summary]);

  const actionQueueItems = useMemo(() => {
    const items: PaymentQueueItem[] = openInvoices.map((invoice) => ({
      kind: 'invoice' as const,
      id: `invoice-${invoice.id}`,
      invoice,
    }));
    for (const stage of ACTION_STAGES) {
      for (const req of pipelineStageRequests(summary, stage)) {
        items.push({ kind: 'job', id: req.id, req, stage });
      }
    }
    return items;
  }, [openInvoices, summary]);

  const [filter, setFilter] = useState<PaymentsFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredQueue = useMemo(() => {
    if (filter === 'action') return actionQueueItems;
    if (filter === 'all') return allQueueItems;
    if (filter === 'invoices') {
      return allQueueItems.filter((item) => item.kind === 'invoice');
    }
    return allQueueItems.filter((item) => item.kind === 'job' && item.stage === filter);
  }, [actionQueueItems, allQueueItems, filter]);

  const queueColumns: GuardrTableColumn<PaymentQueueItem>[] = [
    {
      id: 'item',
      header: 'Job / invoice',
      grow: true,
      sortValue: (item) => queueItemPrimary(item).toLowerCase(),
      render: (item) => (
        <>
          <p className="uber-workbench-table-primary">{queueItemPrimary(item)}</p>
          <p className="uber-workbench-table-secondary">{queueItemSecondary(item, guards)}</p>
        </>
      ),
    },
    {
      id: 'stage',
      header: 'Stage',
      sortValue: (item) => queueItemLabel(item),
      render: (item) => queueItemLabel(item),
    },
    {
      id: 'amount',
      header: 'Amount',
      numeric: true,
      align: 'right',
      render: (item) => queueItemAmount(item),
    },
  ];

  useEffect(() => {
    if (formFactor !== 'desktop') return;
    if (filteredQueue.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filteredQueue.some((item) => item.id === selectedId)) {
      setSelectedId(filteredQueue[0].id);
    }
  }, [formFactor, filteredQueue, selectedId]);

  const selectedItem = filteredQueue.find((item) => item.id === selectedId) ?? null;

  const staffPayAdjustmentsBlock = showStaffCompensation ? (
    <StaffCompensationSection
      embedded
      hideTimeSections
      currentUser={currentUser}
      guards={guards}
      requests={requests}
      platformSettings={platformSettings}
    />
  ) : null;

  const exportButton = showGuardPayments && canManagePayments ? (
    formFactor === 'desktop' ? (
      <GuardrButton
        kind="secondary"
        size="compact"
        onClick={() => downloadPayoutCsv(buildPayoutExportRows(requests, guards, payments))}
      >
        <Download className="w-4 h-4" />
        Export payouts CSV
      </GuardrButton>
    ) : (
      <button
        type="button"
        className="app-button-outline app-btn-sm gap-2 staff-payments-export"
        onClick={() => downloadPayoutCsv(buildPayoutExportRows(requests, guards, payments))}
      >
        <Download className="w-4 h-4" />
        Export payouts CSV
      </button>
    )
  ) : null;

  const emptyState = (
    <div className={formFactor === 'desktop' ? 'adm-empty' : 'app-empty-state'}>
      {formFactor !== 'desktop' ? (
        <div className="app-empty-state-icon">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      ) : null}
      <p className={formFactor === 'desktop' ? undefined : 'app-empty-state-title'}>No payment activity yet</p>
      <p className={formFactor === 'desktop' ? 'uber-workbench-subtitle' : 'app-empty-state-body'}>
        Jobs will appear here once clients post security requests.
      </p>
    </div>
  );

  if (formFactor === 'desktop') {
    if (!showGuardPayments) {
      return (
        <StaffOpsPageShell
          className="staff-mgmt-panel staff-roster-panel adm-finance-page adm-payments-workbench"
          toolbar={
            <WorkbenchToolbar
              eyebrow="Finance"
              subtitle="Revenue-share payouts and Prop 22–ready pay adjustments."
            />
          }
        >
          {staffPayAdjustmentsBlock}
        </StaffOpsPageShell>
      );
    }

    const filterTabs: { id: PaymentsFilter; label: string; count?: number }[] = [
      { id: 'action', label: 'Needs action', count: actionCount },
      { id: 'all', label: 'All', count: allQueueItems.length },
      { id: 'invoices', label: 'Invoices', count: openInvoices.length },
      ...PIPELINE_STAGE_ORDER.map((stage) => ({
        id: stage as PaymentsFilter,
        label: PIPELINE_SECTION_META[stage].title,
        count: pipelineStageRequests(summary, stage).length,
      })),
    ];
    const visibleFilterTabs = filterTabs.filter(
      (tab) => tab.id === 'all' || tab.id === 'action' || (tab.count ?? 0) > 0
    );

    return (
      <StaffOpsPageShell
        className="staff-mgmt-panel staff-roster-panel adm-finance-page adm-payments-workbench"
        toolbar={
          <WorkbenchToolbar
            eyebrow="Finance"
            subtitle="Guard payouts, client billing, and staff compensation."
            actions={exportButton}
          />
        }
      >
        {allQueueItems.length === 0 ? (
          <>
            <WorkbenchEmpty message="No guard payment activity yet. Jobs will appear here once clients post security requests." />
            {staffPayAdjustmentsBlock}
          </>
        ) : (
          <>
            <StaffPaymentSummary summary={summary} financials={financials} variant="desktop" />

            <StaffListFilterTabs
              aria-label="Payment queue"
              activeId={filter}
              onChange={(id) => setFilter(id as PaymentsFilter)}
              tabs={visibleFilterTabs}
            />

            {filteredQueue.length === 0 ? (
              <WorkbenchEmpty message="No items in this queue." variant="detail" />
            ) : (
              <WorkbenchSplit
                className="adm-finance-split adm-ops-list-detail"
                list={
                  <GuardrDataTable
                    columns={queueColumns}
                    rows={filteredQueue}
                    rowKey={(item) => item.id}
                    selectedKey={selectedId ?? undefined}
                    onRowClick={(item) => setSelectedId(item.id)}
                    caption="Payment queue"
                    cardLayout={{ title: 'item', subtitle: 'stage', trailing: 'amount' }}
                  />
                }
                detail={
                  selectedItem ? (
                    selectedItem.kind === 'invoice' ? (
                      <StaffPayoutInvoiceRow
                        invoice={selectedItem.invoice}
                        requests={requests}
                        guards={guards}
                        isDirector={isDirector}
                        onReleasePayout={onReleasePayout}
                        onCompleteInvoice={onCompletePayoutInvoice}
                      />
                    ) : (
                      <JobPaymentRow
                        req={selectedItem.req}
                        guard={guards.find((g) => g.id === selectedItem.req.assignedGuardId)}
                        payment={payments.find((p) => p.jobId === selectedItem.req.id)}
                        isDirector={isDirector}
                        canManagePayments={canManagePayments}
                        paymentGates={paymentGates}
                        readOnly={
                          selectedItem.stage === 'guard-collection-pending' ||
                          selectedItem.stage === 'client-paid-active' ||
                          selectedItem.stage === 'settled'
                        }
                        {...sectionProps}
                      />
                    )
                  ) : (
                    <WorkbenchEmpty message="Select a payment to review" variant="detail" />
                  )
                }
              />
            )}
            {staffPayAdjustmentsBlock ? (
              <div className="mt-8 pt-8 border-t border-brand-border">{staffPayAdjustmentsBlock}</div>
            ) : null}
          </>
        )}
      </StaffOpsPageShell>
    );
  }

  if (!showGuardPayments) {
    return (
      <div className="animate-fade-in staff-payments-panel">
        {staffPayAdjustmentsBlock}
      </div>
    );
  }

  return (
    <div className="animate-fade-in staff-payments-panel">
      <div className="staff-payments-summary">
        {actionCount > 0 && (
          <p className="staff-payments-attention">
            {actionCount} job{actionCount === 1 ? '' : 's'} need your attention
          </p>
        )}
        <StaffPaymentSummary summary={summary} financials={financials} />
        {exportButton}
      </div>

      <div className="staff-payments-body">
        {openInvoices.length > 0 && (
          <section className="space-y-3">
            <WfSectionHeader title="Guard payout invoices" count={openInvoices.length} />
            <AppItemCardStack className="ops-list-bleed-stack">
              {openInvoices.map((invoice) => (
                <StaffPayoutInvoiceRow
                  key={invoice.id}
                  invoice={invoice}
                  requests={requests}
                  guards={guards}
                  isDirector={isDirector}
                  onReleasePayout={onReleasePayout}
                  onCompleteInvoice={onCompletePayoutInvoice}
                />
              ))}
            </AppItemCardStack>
          </section>
        )}

        <PipelineSection stage="awaiting-guard-payout" items={summary.awaitingGuardPayout} {...sectionProps} />
        <PipelineSection stage="awaiting-client" items={summary.awaitingClient} {...sectionProps} />
        <PipelineSection
          stage="guard-collection-pending"
          items={summary.guardCollectionPending}
          {...sectionProps}
          readOnly
        />
        <PipelineSection stage="client-paid-active" items={summary.clientPaidActive} {...sectionProps} readOnly />
        <PipelineSection stage="settled" items={summary.settled} {...sectionProps} readOnly limit={8} />

        {allQueueItems.length === 0 && emptyState}

        {staffPayAdjustmentsBlock ? (
          <section className="space-y-3 mt-8 pt-6 border-t border-brand-border">
            {staffPayAdjustmentsBlock}
          </section>
        ) : null}
      </div>
    </div>
  );
}
