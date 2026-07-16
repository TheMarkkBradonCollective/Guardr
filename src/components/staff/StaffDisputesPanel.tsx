import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Scale } from 'lucide-react';
import { DisputeResolutionAction, OpsDispute } from '../../lib/staffOps';
import { computeOvertimeAmount } from '../../lib/shiftBilling';
import { showAppToast } from '../ui/AppToast';
import { WfBadge } from '../ui/wireframe';
import { useDevice } from '../../lib/platform';

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
    resolutionNote?: string
  ) => void | Promise<void>;
}

type DisputeTab = 'all' | 'overtime' | 'audit';

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
  onResolveAuditViolation,
}: StaffDisputesPanelProps) {
  const { formFactor } = useDevice();
  const [tab, setTab] = useState<DisputeTab>('all');
  const [statusMap, setStatusMap] = useState<Record<string, OpsDispute['status']>>({});
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [adjustHoursById, setAdjustHoursById] = useState<Record<string, string>>({});
  const [resolutionNoteById, setResolutionNoteById] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const openDisputes = useMemo(
    () =>
      disputes.filter((d) => {
        const status = statusMap[d.id] ?? d.status;
        if (status !== 'open') return false;
        if (tab === 'overtime') return d.type === 'overtime';
        if (tab === 'audit') return d.type === 'audit-violation';
        return true;
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
    const isAudit = d.type === 'audit-violation';
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
              {isOvertime
                ? 'late clock-out overtime'
                : isAudit
                  ? `audit · ${d.auditCheckpoint ?? 'checkpoint'}`
                  : d.type.replace('-', ' ')}
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

        {isAudit && (
          <div className="rounded-xl border border-brand-border bg-brand-surface/40 px-3 py-2.5 space-y-1.5 text-xs text-brand-text-muted">
            <p>
              <span className="text-brand-text">Category:</span> {d.auditCategory ?? '—'}
            </p>
            <p>
              <span className="text-brand-text">Checkpoint:</span> {d.auditCheckpoint ?? '—'}
            </p>
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
              <button
                type="button"
                disabled={busy}
                onClick={() => void resolveOvertime(d, 'waive')}
                className="app-button-outline app-btn-sm text-red-400 border-red-500/40 disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Waive charge'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void resolveOvertime(d, 'uphold')}
                className="app-button-primary app-btn-sm disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Uphold original'}
              </button>
              <button
                type="button"
                disabled={busy || !(adjustedHours > 0)}
                onClick={() => void resolveOvertime(d, 'adjust', adjustedHours)}
                className="app-button-outline app-btn-sm disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply adjustment'}
              </button>
            </div>
          </div>
        )}

        {isAudit && onResolveAuditViolation && d.requestId && d.auditViolationId && status === 'open' && (
          <div className="app-action-row--equal pt-4">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                void onResolveAuditViolation(
                  d.requestId!,
                  d.auditViolationId!,
                  'dismiss',
                  resolutionNoteById[d.id]
                ).then(() => setStatusMap((m) => ({ ...m, [d.id]: 'resolved' })));
              }}
              className="app-button-outline app-btn-sm"
            >
              Side with guard
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                void onResolveAuditViolation(
                  d.requestId!,
                  d.auditViolationId!,
                  'uphold',
                  resolutionNoteById[d.id]
                ).then(() => setStatusMap((m) => ({ ...m, [d.id]: 'resolved' })));
              }}
              className="app-button-primary app-btn-sm"
            >
              Uphold client
            </button>
          </div>
        )}

        {!isOvertime && !isAudit && status === 'open' && onResolveDispute && (
          <div className="app-action-row--equal pt-4">
            <button
              type="button"
              onClick={() => resolveTicketDispute(d, 'resolved', 'approve_payout', 'Payout approved.')}
              className="app-button-primary app-btn-sm"
            >
              Approve Payout
            </button>
            <button
              type="button"
              onClick={() => resolveTicketDispute(d, 'held', 'hold_funds', 'Funds held pending review.')}
              className="app-button-outline app-btn-sm"
            >
              Hold Funds
            </button>
            <button
              type="button"
              onClick={() => resolveTicketDispute(d, 'resolved', 'partial_payout', 'Partial payout issued.')}
              className="app-button-outline app-btn-sm"
            >
              Partial Payout
            </button>
            <button
              type="button"
              onClick={() => resolveTicketDispute(d, 'resolved', 'cancel_payout', 'Job payout cancelled.')}
              className="app-button-outline app-btn-sm text-red-400 border-red-500/40"
            >
              Cancel Payout
            </button>
          </div>
        )}
      </div>
    );
  };

  const emptyState = (
    <div className={formFactor === 'desktop' ? 'adm-empty' : 'app-empty-state'}>
      {formFactor !== 'desktop' ? (
        <div className="app-empty-state-icon">
          <Scale className="w-5 h-5" />
        </div>
      ) : (
        <Scale className="w-8 h-8 adm-muted-icon" />
      )}
      <p className={formFactor === 'desktop' ? undefined : 'app-empty-state-title'}>No open disputes</p>
      <p className={formFactor === 'desktop' ? 'adm-workbench-subtitle' : 'app-empty-state-body'}>
        Overtime billing disputes and guard vs client conflicts will appear here when they need staff review.
      </p>
    </div>
  );

  const tabBar = (
    <div className="flex gap-2 mb-4">
      {(['all', 'overtime', 'audit'] as DisputeTab[]).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => setTab(key)}
          className={`app-button-outline app-btn-sm capitalize ${tab === key ? '!border-brand-primary !text-brand-primary' : ''}`}
        >
          {key === 'audit' ? 'Audit violations' : key}
        </button>
      ))}
    </div>
  );

  if (openDisputes.length === 0) {
    return (
      <div className={formFactor === 'desktop' ? 'adm-workbench' : 'animate-fade-in -mx-4 sm:-mx-5 px-4 sm:px-5'}>
        {tabBar}
        {emptyState}
      </div>
    );
  }

  if (formFactor === 'desktop') {
    const selected = openDisputes.find((d) => d.id === selectedId) ?? openDisputes[0];

    return (
      <div className="adm-workbench">
        <div className="adm-workbench-toolbar">
          <div>
            <p className="adm-card-eyebrow">Billing</p>
            <p className="adm-workbench-subtitle">Open disputes requiring staff resolution.</p>
          </div>
        </div>
        {tabBar}
        <div className="adm-workbench-split">
          <div className="adm-workbench-list">
            <table className="adm-table adm-table--list">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Type</th>
                  <th>Opened</th>
                </tr>
              </thead>
              <tbody>
                {openDisputes.map((d) => (
                  <tr
                    key={d.id}
                    className={`adm-table-row--click${selected?.id === d.id ? ' adm-table-row--selected' : ''}`}
                    onClick={() => setSelectedId(d.id)}
                  >
                    <td>
                      <p className="adm-table-primary">{d.jobTitle}</p>
                      <p className="adm-table-secondary">{d.guardName} vs {d.clientName}</p>
                    </td>
                    <td className="adm-table-secondary">
                      {d.type === 'overtime' ? 'Overtime' : d.type === 'audit-violation' ? 'Audit' : d.type}
                    </td>
                    <td className="adm-table-secondary">{formatWhen(d.openedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="adm-workbench-detail">
            {selected ? (
              <div className="adm-workbench-detail-inner">{renderDisputeCard(selected)}</div>
            ) : (
              <div className="adm-empty adm-empty--detail">
                <Scale className="w-10 h-10 adm-muted-icon" />
                <p>Select a dispute to review</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in -mx-4 sm:-mx-5 px-4 sm:px-5">
      {tabBar}
      <div className="border-t border-brand-border">
        {openDisputes.map((d) => (
          <React.Fragment key={d.id}>{renderDisputeCard(d)}</React.Fragment>
        ))}
      </div>
    </div>
  );
}
