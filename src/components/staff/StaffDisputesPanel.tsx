import React, { useState } from 'react';
import { Scale } from 'lucide-react';
import { DisputeResolutionAction, OpsDispute } from '../../lib/staffOps';
import { showAppToast } from '../ui/AppToast';
import { WfBadge } from '../ui/wireframe';

interface StaffDisputesPanelProps {
  disputes: OpsDispute[];
  onResolveDispute?: (dispute: OpsDispute, action: DisputeResolutionAction) => void | Promise<void>;
}

export function StaffDisputesPanel({ disputes, onResolveDispute }: StaffDisputesPanelProps) {
  const [statusMap, setStatusMap] = useState<Record<string, OpsDispute['status']>>({});

  const resolveDispute = (dispute: OpsDispute, status: OpsDispute['status'], action: DisputeResolutionAction, message: string) => {
    setStatusMap((m) => ({ ...m, [dispute.id]: status }));
    void onResolveDispute?.(dispute, action);
    showAppToast(message, { tone: status === 'resolved' ? 'success' : 'info' });
  };

  if (disputes.length === 0) {
    return (
      <div className="animate-fade-in -mx-4 sm:-mx-5 px-4 sm:px-5">
        <div className="app-empty-state py-16">
          <Scale className="w-10 h-10 text-brand-text-muted mx-auto mb-3" strokeWidth={1.5} />
          <p className="font-semibold text-sm">No open disputes</p>
          <p className="text-sm text-brand-text-muted mt-1 max-w-xs mx-auto">
            Guard vs client conflicts will appear here when they need staff review.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in -mx-4 sm:-mx-5">
      <p className="text-sm text-brand-text-muted px-4 sm:px-5 pb-4">Guard vs client conflict resolution</p>

      <div className="border-t border-brand-border">
        {disputes.map((d) => {
          const status = statusMap[d.id] ?? d.status;
          return (
            <div key={d.id} className="app-item-card app-item-card-align-top flex-col !items-stretch gap-4 staff-dispute-block !shadow-none">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <WfBadge tone="primary">{d.type.replace('-', ' ')}</WfBadge>
                  <h3 className="font-semibold text-sm mt-1">{d.jobTitle}</h3>
                </div>
                <WfBadge tone={status === 'open' ? 'warning' : status === 'resolved' ? 'success' : 'default'}>
                  {status}
                </WfBadge>
              </div>

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

              {status === 'open' && (
                <div className="app-action-row--equal pt-4">
                  <button
                    type="button"
                    onClick={() => resolveDispute(d, 'resolved', 'approve_payout', 'Payout approved.')}
                    className="app-button-primary app-btn-sm"
                  >
                    Approve Payout
                  </button>
                  <button
                    type="button"
                    onClick={() => resolveDispute(d, 'held', 'hold_funds', 'Funds held pending review.')}
                    className="app-button-outline app-btn-sm"
                  >
                    Hold Funds
                  </button>
                  <button
                    type="button"
                    onClick={() => resolveDispute(d, 'resolved', 'partial_payout', 'Partial payout issued.')}
                    className="app-button-outline app-btn-sm"
                  >
                    Partial Payout
                  </button>
                  <button
                    type="button"
                    onClick={() => resolveDispute(d, 'resolved', 'cancel_payout', 'Job payout cancelled.')}
                    className="app-button-outline app-btn-sm text-red-400 border-red-500/40"
                  >
                    Cancel Payout
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
