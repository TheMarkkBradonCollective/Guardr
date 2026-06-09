import React, { useState } from 'react';
import { OpsDispute } from '../../lib/staffOps';
import { WfBadge } from '../ui/wireframe';

interface StaffDisputesPanelProps {
  disputes: OpsDispute[];
}

export function StaffDisputesPanel({ disputes }: StaffDisputesPanelProps) {
  const [statusMap, setStatusMap] = useState<Record<string, OpsDispute['status']>>({});

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Disputes</h1>
        <p className="text-sm text-brand-text-muted mt-1">Guard vs client conflict resolution</p>
      </div>

      <div className="space-y-4">
        {disputes.map((d) => {
          const status = statusMap[d.id] ?? d.status;
          return (
            <div key={d.id} className="wf-list-card flex-col items-stretch !flex !flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2 w-full">
                <div>
                  <WfBadge tone="primary">{d.type.replace('-', ' ')}</WfBadge>
                  <h3 className="font-semibold text-sm mt-1">{d.jobTitle}</h3>
                </div>
                <WfBadge tone={status === 'open' ? 'warning' : status === 'resolved' ? 'success' : 'default'}>
                  {status}
                </WfBadge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm w-full">
                <div className="wf-metric-tile">
                  <p className="wf-metric-label">Guard — {d.guardName}</p>
                  <p className="text-brand-text-muted mt-1">{d.guardStatement}</p>
                </div>
                <div className="wf-metric-tile">
                  <p className="wf-metric-label">Client — {d.clientName}</p>
                  <p className="text-brand-text-muted mt-1">{d.clientStatement}</p>
                </div>
              </div>
              {status === 'open' && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-brand-border w-full">
                  <button type="button" onClick={() => setStatusMap((m) => ({ ...m, [d.id]: 'resolved' }))} className="app-button-primary !w-auto !h-9 !px-4 !text-xs">Approve Payout</button>
                  <button type="button" onClick={() => setStatusMap((m) => ({ ...m, [d.id]: 'held' }))} className="app-button-outline !w-auto !h-9 !px-4 !text-xs">Hold Funds</button>
                  <button type="button" onClick={() => alert('Partial payout issued.')} className="app-button-outline !w-auto !h-9 !px-4 !text-xs">Partial Payout</button>
                  <button type="button" onClick={() => alert('Job payout cancelled.')} className="app-button-outline !w-auto !h-9 !px-4 !text-xs text-red-400 border-red-500/40">Cancel Payout</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
