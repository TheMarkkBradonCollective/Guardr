import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Scale } from 'lucide-react';
import { DisputeResolutionAction, OpsDispute } from '../../lib/staffOps';
import { computeOvertimeAmount } from '../../lib/shiftBilling';
import { showAppToast } from '../ui/AppToast';
import { WfBadge } from '../ui/wireframe';
import { AppButton } from '../ui/AppButton';
import { StatusChip } from '../baseui/StatusChip';
import { GuardrDataTable, type GuardrTableColumn } from '../baseui/GuardrDataTable';
import { StaffListFilterTabs } from './StaffListFilterTabs';
import { StaffOpsPageShell } from './StaffOpsPageShell';
import { useDevice } from '../../lib/platform';
import {
  WorkbenchEmpty,
  WorkbenchSplit,
  WorkbenchToolbar,
} from '../baseui/layout/WorkbenchLayout';

interface StaffDisputesPanelProps {
  disputes: OpsDispute[];
  onResolveDispute?: (dispute: OpsDispute, action: DisputeResolutionAction) => void | Promise<void>;
  onResolveOvertimeDispute?: (
    requestId: string,
    action: 'waive' | 'uphold' | 'adjust',
    options?: { adjustedHours?: number; resolutionNote?: string }
  ) => void | Promise<void>;
  onResolveAuditViolation?: (
    requestId: string,
    violationId: string,
    action: 'uphold' | 'dismiss',
    note?: string
  ) => void | Promise<void>;
}

type DisputeTab = 'all' | 'overtime';

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function StaffDisputesPanel({
  disputes,
  onResolveDispute,
  onResolveOvertimeDispute,
}: StaffDisputesPanelProps) {
  const { formFactor } = useDevice();
  const [tab, setTab] = useState<DisputeTab>('all');
  const [statusMap, setStatusMap] = useState<Record<string, OpsDispute['status']>>({});
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [adjustHoursById, setAdjustHoursById] = useState<Record<string, string>>({});
  const [resolutionNoteById, setResolutionNoteById] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const openPool = useMemo(
    () =>
      disputes.filter((d) => {
        const status = statusMap[d.id] ?? d.status;
        return status === 'open' && d.type !== 'audit-violation';
      }),
    [disputes, statusMap]
  );

  const openDisputes = useMemo(
    () =>
      disputes.filter((d) => {
        const status = statusMap[d.id] ?? d.status;
        if (status !== 'open') return false;
        if (tab === 'overtime') return d.type === 'overtime';
        return d.type !== 'audit-violation';
      }),
    [disputes, statusMap, tab]
  );

  useEffect(() => {
    if (formFactor === 'desktop' && openDisputes.length > 0 && !selectedId) {
      setSelectedId(openDisputes[0].id);
    }
    if (selectedId && !openDisputes.some((d) => d.id === selectedId)) {
      setSelectedId(openDisputes[0]?.id ?? null);
    }
  }, [formFactor, openDisputes, selectedId]);

  const disputeColumns: GuardrTableColumn<OpsDispute>[] = [
    {
      id: 'job',
      header: 'Job',
      grow: true,
      sortValue: (d) => d.jobTitle.toLowerCase(),
      render: (d) => (
        <>
          <p className="uber-workbench-table-primary">{d.jobTitle}</p>
          <p className="uber-workbench-table-secondary">
            {d.guardName} vs {d.clientName}
          </p>
        </>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      sortValue: (d) => d.type,
      render: (d) => (
        <StatusChip tone={d.type === 'overtime' ? 'warning' : 'neutral'}>
          {d.type === 'overtime' ? 'Overtime' : d.type}
        </StatusChip>
      ),
    },
    {
      id: 'opened',
      header: 'Opened',
      sortValue: (d) => d.openedAt,
      render: (d) => formatWhen(d.openedAt),
    },
  ];

  const resolveTicketDispute = (
    dispute: OpsDispute,
    status: OpsDispute['status'],
    action: DisputeResolutionAction,
    message: string
  ) => {
    setStatusMap((m) => ({ ...m, [dispute.id]: status }));
    void onResolveDispute?.(dispute, action);
    showAppToast(message, { tone: status === 'resolved' ? 'success' : 'info' });
  };

  const resolveOvertime = async (
    dispute: OpsDispute,
    action: 'waive' | 'uphold' | 'adjust',
    adjustedHours?: number
  ) => {
    if (!dispute.requestId || !onResolveOvertimeDispute) return;
    setResolvingId(dispute.id);
    try {
      await onResolveOvertimeDispute(dispute.requestId, action, {
        adjustedHours,
        resolutionNote: resolutionNoteById[dispute.id],
      });
      setStatusMap((m) => ({ ...m, [dispute.id]: 'resolved' }));
    } catch (e) {
      showAppToast(e instanceof Error ? e.message : 'Unable to resolve dispute', { tone: 'error' });
    } finally {
      setResolvingId(null);
    }
  };

  const renderDisputeCard = (d: OpsDispute) => {
    const isOvertime = d.type === 'overtime';
    const status = statusMap[d.id] ?? d.status;
    const defaultAdjustHours =
      d.clientClaimedHours != null ? d.clientClaimedHours : d.claimedHours ?? 0;
    const adjustHoursRaw = adjustHoursById[d.id] ?? String(defaultAdjustHours);
    const adjustedHours = Number(adjustHoursRaw);
    const adjustedAmount =
      isOvertime && adjustedHours > 0 && d.hourlyRate != null
        ? computeOvertimeAmount(adjustedHours, d.hourlyRate, d.guardsNeeded ?? 1)
        : 0;
    const busy = resolvingId === d.id;

    return (
      <div className="app-item-card app-item-card-align-top flex-col !items-stretch gap-4 staff-dispute-block !shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <WfBadge tone="primary">
              {isOvertime ? 'late clock-out overtime' : d.type.replace('-', ' ')}
            </WfBadge>
            <h3 className="font-semibold text-sm mt-1">{d.jobTitle}</h3>
            <p className="text-xs text-brand-text-muted mt-0.5">Opened {formatWhen(d.openedAt)}</p>
          </div>
          <WfBadge tone={status === 'open' ? 'warning' : status === 'resolved' ? 'success' : 'default'}>
            {status}
          </WfBadge>
        </div>

        {isOvertime && (
          <div className="rounded-xl border border-brand-border bg-brand-surface/40 px-3 py-2.5 space-y-1.5">
            <p className="wf-metric-label">Evidence</p>
            <div className="grid gap-1 text-xs text-brand-text-muted sm:grid-cols-2">
              <p>
                <span className="text-brand-text">Scheduled end:</span>{' '}
                {d.scheduledEnd ? formatWhen(d.scheduledEnd) : '—'}
              </p>
              <p>
                <span className="text-brand-text">Recorded clock-out:</span>{' '}
                {d.clockOutAt ? formatWhen(d.clockOutAt) : '—'}
              </p>
              <p>
                <span className="text-brand-text">Client claimed clock-out:</span>{' '}
                {d.clientClaimedClockOutAt ? formatWhen(d.clientClaimedClockOutAt) : '—'}
              </p>
              <p>
                <span className="text-brand-text">Billed overtime:</span> {d.claimedHours ?? 0}h ($
                {(d.claimedAmount ?? 0).toFixed(2)})
              </p>
              <p>
                <span className="text-brand-text">Client claimed overtime:</span>{' '}
                {d.clientClaimedHours != null ? `${d.clientClaimedHours}h` : '—'}
                {d.clientClaimedAmount != null ? ` ($${d.clientClaimedAmount.toFixed(2)})` : ''}
              </p>
            </div>
          </div>
        )}

        <div className={`staff-dispute-statements mt-3${formFactor === 'desktop' ? '' : ' -mx-4 sm:-mx-5'}`}>
          <div className="staff-dispute-statement">
            <p className="wf-metric-label">Guard — {d.guardName}</p>
            <p className="text-sm text-brand-text-muted mt-1">{d.guardStatement}</p>
          </div>
          <div className="staff-dispute-statement">
            <p className="wf-metric-label">Client — {d.clientName}</p>
            <p className="text-sm text-brand-text-muted mt-1">{d.clientStatement}</p>
          </div>
        </div>

        {isOvertime && onResolveOvertimeDispute && (
          <div className="space-y-3 pt-2 border-t border-brand-border">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-brand-text-muted">Staff resolution note (optional)</span>
              <textarea
                value={resolutionNoteById[d.id] ?? ''}
                onChange={(e) => setResolutionNoteById((m) => ({ ...m, [d.id]: e.target.value }))}
                placeholder="Brief note for the record..."
                className="uber-input w-full min-h-[72px] resize-y"
                rows={2}
              />
            </label>

            <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
              <label className="flex-1 space-y-1.5">
                <span className="text-xs font-medium text-brand-text-muted">Adjusted overtime hours</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={adjustHoursRaw}
                  onChange={(e) => setAdjustHoursById((m) => ({ ...m, [d.id]: e.target.value }))}
                  className="uber-input w-full"
                />
              </label>
              {adjustedHours > 0 && (
                <p className="text-xs text-brand-text-muted sm:pb-2.5">
                  Adjusted charge: <span className="text-brand-text">${adjustedAmount.toFixed(2)}</span>
                </p>
              )}
            </div>

            <div className="app-action-row--equal pt-1">
              <AppButton
                variant="danger"
                size="sm"
                disabled={busy}
                onClick={() => void resolveOvertime(d, 'waive')}
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Waive charge'}
              </AppButton>
              <AppButton
                variant="primary"
                size="sm"
                disabled={busy}
                onClick={() => void resolveOvertime(d, 'uphold')}
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Uphold original'}
              </AppButton>
              <AppButton
                variant="outline"
                size="sm"
                disabled={busy || !(adjustedHours > 0)}
                onClick={() => void resolveOvertime(d, 'adjust', adjustedHours)}
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply adjustment'}
              </AppButton>
            </div>
          </div>
        )}

        {!isOvertime && status === 'open' && onResolveDispute && (
          <div className="app-action-row--equal pt-4">
            <AppButton
              variant="primary"
              size="sm"
              onClick={() => resolveTicketDispute(d, 'resolved', 'approve_payout', 'Payout approved.')}
            >
              Approve Payout
            </AppButton>
            <AppButton
              variant="outline"
              size="sm"
              onClick={() => resolveTicketDispute(d, 'held', 'hold_funds', 'Funds held pending review.')}
            >
              Hold Funds
            </AppButton>
            <AppButton
              variant="outline"
              size="sm"
              onClick={() => resolveTicketDispute(d, 'resolved', 'partial_payout', 'Partial payout issued.')}
            >
              Partial Payout
            </AppButton>
            <AppButton
              variant="danger"
              size="sm"
              onClick={() => resolveTicketDispute(d, 'resolved', 'cancel_payout', 'Job payout cancelled.')}
            >
              Cancel Payout
            </AppButton>
          </div>
        )}
      </div>
    );
  };

  const emptyState =
    formFactor === 'desktop' ? (
      <WorkbenchEmpty
        icon={Scale}
        message="No open disputes"
        variant="detail"
        action={
          <p className="uber-workbench-subtitle text-center max-w-md">
            Overtime billing disputes and guard vs client conflicts appear here. Shift checkpoint violations are under Violations.
          </p>
        }
      />
    ) : (
      <div className="app-empty-state">
        <div className="app-empty-state-icon">
          <Scale className="w-5 h-5" />
        </div>
        <p className="app-empty-state-title">No open disputes</p>
        <p className="app-empty-state-body">
          Overtime billing disputes and guard vs client conflicts appear here. Shift checkpoint violations are under Violations.
        </p>
      </div>
    );

  const tabBar = (
    <StaffListFilterTabs
      aria-label="Dispute type"
      activeId={tab}
      onChange={(id) => setTab(id as DisputeTab)}
      tabs={[
        { id: 'all', label: 'All', count: openPool.length },
        {
          id: 'overtime',
          label: 'Overtime',
          count: openPool.filter((d) => d.type === 'overtime').length,
        },
      ]}
    />
  );

  if (openDisputes.length === 0) {
    if (formFactor === 'desktop') {
      return (
        <StaffOpsPageShell
          className="staff-mgmt-panel staff-roster-panel"
          toolbar={
            <WorkbenchToolbar eyebrow="Billing" subtitle="Open disputes requiring staff resolution." />
          }
        >
          {tabBar}
          {emptyState}
        </StaffOpsPageShell>
      );
    }
    return (
      <StaffOpsPageShell className="staff-mgmt-panel staff-roster-panel">
        {tabBar}
        {emptyState}
      </StaffOpsPageShell>
    );
  }

  if (formFactor === 'desktop') {
    const selected = openDisputes.find((d) => d.id === selectedId) ?? openDisputes[0];

    return (
      <StaffOpsPageShell
        className="staff-mgmt-panel staff-roster-panel"
        toolbar={
          <WorkbenchToolbar eyebrow="Billing" subtitle="Open disputes requiring staff resolution." />
        }
      >
        {tabBar}
        <WorkbenchSplit
          list={
            <GuardrDataTable
              columns={disputeColumns}
              rows={openDisputes}
              rowKey={(d) => d.id}
              selectedKey={selected?.id}
              onRowClick={(d) => setSelectedId(d.id)}
              caption="Open disputes"
              cardLayout={{ title: 'job', subtitle: 'opened', trailing: 'type' }}
            />
          }
          detail={
            selected ? (
              renderDisputeCard(selected)
            ) : (
              <WorkbenchEmpty icon={Scale} message="Select a dispute to review" variant="detail" />
            )
          }
        />
      </StaffOpsPageShell>
    );
  }

  return (
    <StaffOpsPageShell className="staff-mgmt-panel staff-roster-panel">
      {tabBar}
      <div className="border-t border-brand-border">
        {openDisputes.map((d) => (
          <React.Fragment key={d.id}>{renderDisputeCard(d)}</React.Fragment>
        ))}
      </div>
    </StaffOpsPageShell>
  );
}
