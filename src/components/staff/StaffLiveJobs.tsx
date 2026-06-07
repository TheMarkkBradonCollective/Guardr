import React, { useState } from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';
import { formatDuration, formatShiftRange } from '../../lib/dates';
import { DISPATCH_STATUS_LABEL, getDispatchStatus } from '../../lib/staffOps';
import { AlertTriangle, Search, X } from 'lucide-react';

interface StaffLiveJobsProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  onApproveRequest: (id: string) => void;
  onDenyRequest: (id: string) => void;
}

export function StaffLiveJobs({ requests, guards, onApproveRequest, onDenyRequest }: StaffLiveJobsProps) {
  const [search, setSearch] = useState('');
  const live = requests.filter((r) => r.status !== 'closed');

  const filtered = live.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.clientName.toLowerCase().includes(search.toLowerCase()) ||
      r.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-black">Live Jobs</h1>
        <p className="text-xs font-mono text-brand-text-muted mt-1 uppercase">Dispatch view — monitor and control job flow</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
        <input
          type="text"
          placeholder="Search client, location, title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="uber-input pl-10 w-full"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((req) => {
          const dispatch = getDispatchStatus(req);
          const statusCfg = DISPATCH_STATUS_LABEL[dispatch];
          const assigned = guards.find((g) => g.id === req.assignedGuardId);

          return (
            <div key={req.id} className="staff-ops-card">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded border ${statusCfg.className}`}>
                      {statusCfg.emoji} {statusCfg.label}
                    </span>
                    <span className="text-[10px] font-mono text-brand-text-muted">{req.id}</span>
                  </div>
                  <h3 className="font-black text-base">{req.title}</h3>
                  <p className="text-xs font-mono text-brand-text-muted">{req.clientName} · {req.location}</p>
                  <p className="text-xs text-brand-text-muted">{formatShiftRange(req.startDate, req.endDate)} · {formatDuration(req.durationHours)} · ${req.hourlyRate}/hr</p>
                  <p className="text-xs">
                    Assigned:{' '}
                    <strong>{assigned ? assigned.name : 'Unassigned'}</strong>
                    {req.guardsNeeded && req.guardsNeeded > 1 ? ` · ${req.guardsNeeded} guards needed` : ''}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  {req.status === 'pending-review' && (
                    <button type="button" onClick={() => onApproveRequest(req.id)} className="staff-ops-btn-primary text-[10px]">
                      Approve Job
                    </button>
                  )}
                  {assigned && (
                    <button type="button" onClick={() => alert('Reassign guard — select from roster.')} className="staff-ops-btn-outline text-[10px]">
                      Reassign
                    </button>
                  )}
                  <button type="button" onClick={() => alert('Backup guard added to job.')} className="staff-ops-btn-outline text-[10px]">
                    Add Backup
                  </button>
                  {dispatch === 'incident-flagged' && (
                    <button type="button" onClick={() => alert('Incident escalated to supervisor.')} className="staff-ops-btn-danger text-[10px]">
                      <AlertTriangle className="w-3 h-3" /> Escalate
                    </button>
                  )}
                  {req.status !== 'completed' && (
                    <button type="button" onClick={() => onDenyRequest(req.id)} className="staff-ops-btn-danger text-[10px]">
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-brand-text-muted font-mono py-12">No jobs match your search.</p>
        )}
      </div>
    </div>
  );
}
