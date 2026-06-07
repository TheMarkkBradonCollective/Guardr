import React, { useState } from 'react';
import { OpsDispute } from '../../lib/staffOps';

interface StaffDisputesPanelProps {
  disputes: OpsDispute[];
}

export function StaffDisputesPanel({ disputes }: StaffDisputesPanelProps) {
  const [statusMap, setStatusMap] = useState<Record<string, OpsDispute['status']>>({});

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-black">Disputes</h1>
        <p className="text-xs font-mono text-brand-text-muted mt-1 uppercase">Guard vs client conflict resolution</p>
      </div>

      <div className="space-y-4">
        {disputes.map((d) => {
          const status = statusMap[d.id] ?? d.status;
          return (
            <div key={d.id} className="staff-ops-card space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase text-brand-primary">{d.type.replace('-', ' ')}</span>
                  <h3 className="font-black text-sm mt-0.5">{d.jobTitle}</h3>
                </div>
                <span className="text-[10px] font-mono uppercase text-brand-text-muted">{status}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-black/20 rounded-lg p-3">
                  <p className="text-[10px] font-mono uppercase text-brand-text-muted mb-1">Guard — {d.guardName}</p>
                  <p className="text-brand-text-muted">{d.guardStatement}</p>
                </div>
                <div className="bg-black/20 rounded-lg p-3">
                  <p className="text-[10px] font-mono uppercase text-brand-text-muted mb-1">Client — {d.clientName}</p>
                  <p className="text-brand-text-muted">{d.clientStatement}</p>
                </div>
              </div>
              {status === 'open' && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-brand-border">
                  <button type="button" onClick={() => setStatusMap((m) => ({ ...m, [d.id]: 'resolved' }))} className="staff-ops-btn-primary text-[10px]">Approve Payout</button>
                  <button type="button" onClick={() => setStatusMap((m) => ({ ...m, [d.id]: 'held' }))} className="staff-ops-btn-outline text-[10px]">Hold Funds</button>
                  <button type="button" onClick={() => alert('Partial payout issued.')} className="staff-ops-btn-outline text-[10px]">Partial Payout</button>
                  <button type="button" onClick={() => alert('Job payout cancelled.')} className="staff-ops-btn-danger text-[10px]">Cancel Payout</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
