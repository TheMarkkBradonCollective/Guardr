import React, { useMemo, useState } from 'react';
import { Loader2, Scale } from 'lucide-react';
import { OpsDispute } from '../../lib/staffOps';
import { computeOvertimeAmount } from '../../lib/shiftBilling';
import { showAppToast } from '../ui/AppToast';
import { WfBadge } from '../ui/wireframe';

interface StaffDisputesPanelProps {
  disputes: OpsDispute[];
  onResolveOvertimeDispute?: (
    requestId: string,
    action: 'waive' | 'uphold' | 'adjust',
    options?: { adjustedHours?: number; resolutionNote?: string }
  ) => void | Promise<void>;
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function StaffDisputesPanel({ disputes, onResolveOvertimeDispute }: StaffDisputesPanelProps) {
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [adjustHoursById, setAdjustHoursById] = useState<Record<string, string>>({});
  const [resolutionNoteById, setResolutionNoteById] = useState<Record<string, string>>({});

  const openDisputes = useMemo(
    () => disputes.filter((d) => d.status === 'open' && !resolvedIds.has(d.id)),
    [disputes, resolvedIds]
  );

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
      setResolvedIds((prev) => new Set(prev).add(dispute.id));
    } catch (e) {
      showAppToast(e instanceof Error ? e.message : 'Unable to resolve dispute', { tone: 'error' });
    } finally {
      setResolvingId(null);
    }
  };

  if (openDisputes.length === 0) {
    return (
      <div className="animate-fade-in -mx-4 sm:-mx-5 px-4 sm:px-5">
        <div className="app-empty-state py-16">
          <Scale className="w-10 h-10 text-brand-text-muted mx-auto mb-3" strokeWidth={1.5} />
          <p className="font-semibold text-sm">No open disputes</p>
          <p className="text-sm text-brand-text-muted mt-1 max-w-xs mx-auto">
            Late clock-out charge disputes will appear here when a client contests overtime billing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in -mx-4 sm:-mx-5">
      <p className="text-sm text-brand-text-muted px-4 sm:px-5 pb-4">
        Review evidence and resolve contested late clock-out charges.
      </p>

      <div className="border-t border-brand-border">
        {openDisputes.map((d) => {
          const isOvertime = d.type === 'overtime';
          const adjustHoursRaw = adjustHoursById[d.id] ?? String(d.claimedHours ?? '');
          const adjustedHours = Number(adjustHoursRaw);
          const adjustedAmount =
            isOvertime && adjustedHours > 0 && d.hourlyRate != null
              ? computeOvertimeAmount(adjustedHours, d.hourlyRate, d.guardsNeeded ?? 1)
              : 0;
          const busy = resolvingId === d.id;

          return (
            <div
              key={d.id}
              className="app-item-card app-item-card-align-top flex-col !items-stretch gap-4 staff-dispute-block !shadow-none"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <WfBadge tone="primary">
                    {isOvertime ? 'late clock-out overtime' : d.type.replace('-', ' ')}
                  </WfBadge>
                  <h3 className="font-semibold text-sm mt-1">{d.jobTitle}</h3>
                  <p className="text-xs text-brand-text-muted mt-0.5">
                    Opened {formatWhen(d.openedAt)}
                  </p>
                </div>
                <WfBadge tone="warning">open</WfBadge>
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
                      <span className="text-brand-text">Clock-out time:</span>{' '}
                      {d.clockOutAt ? formatWhen(d.clockOutAt) : '—'}
                    </p>
                    <p>
                      <span className="text-brand-text">Claimed overtime:</span> {d.claimedHours ?? 0}h
                    </p>
                    <p>
                      <span className="text-brand-text">Claimed charge:</span> $
                      {(d.claimedAmount ?? 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              <div className="staff-dispute-statements mt-3 -mx-4 sm:-mx-5">
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
                    <span className="text-xs font-medium text-brand-text-muted">
                      Staff resolution note (optional)
                    </span>
                    <textarea
                      value={resolutionNoteById[d.id] ?? ''}
                      onChange={(e) =>
                        setResolutionNoteById((m) => ({ ...m, [d.id]: e.target.value }))
                      }
                      placeholder="Brief note for the record..."
                      className="uber-input w-full min-h-[72px] resize-y"
                      rows={2}
                    />
                  </label>

                  <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                    <label className="flex-1 space-y-1.5">
                      <span className="text-xs font-medium text-brand-text-muted">
                        Adjusted overtime hours
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={adjustHoursRaw}
                        onChange={(e) =>
                          setAdjustHoursById((m) => ({ ...m, [d.id]: e.target.value }))
                        }
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
