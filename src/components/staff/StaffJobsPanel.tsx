import React, { useMemo, useState } from 'react';
import { Payment, SecurityGuard, SecurityRequest } from '../../types';
import { formatDuration, formatShiftRange } from '../../lib/dates';
import { JOB_STATUS_LABELS } from '../../lib/jobStatus';
import { LIVE_JOB_STATUS_LABEL, getLiveJobStatus } from '../../lib/staffOps';
import { useDevice } from '../../lib/platform';
import { Briefcase, Search, X } from 'lucide-react';
import { JobPaymentRow } from './JobPaymentRow';

type JobsFilter = 'all' | 'open' | 'active' | 'done';

interface StaffJobsPanelProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  payments?: Payment[];
  isDirector?: boolean;
  onApproveRequest: (id: string) => void;
  onDenyRequest: (id: string) => void;
  onMarkClientPaidCash?: (requestId: string) => Promise<void>;
  onMarkGuardPaidCash?: (requestId: string) => Promise<void>;
  onDepositCashToStripe?: (requestId: string) => Promise<void>;
  onReleasePayout?: (requestId: string) => Promise<void>;
}

function matchesFilter(req: SecurityRequest, filter: JobsFilter): boolean {
  switch (filter) {
    case 'open':
      return req.status === 'open' || req.status === 'pending-review';
    case 'active':
      return req.status === 'accepted' || req.status === 'in-progress';
    case 'done':
      return req.status === 'completed' || req.status === 'closed';
    default:
      return true;
  }
}

function JobDetailPanel({
  req,
  guards,
  isDirector,
  onApproveRequest,
  onDenyRequest,
  payments,
  onMarkClientPaidCash,
  onMarkGuardPaidCash,
  onDepositCashToStripe,
  onReleasePayout,
}: {
  req: SecurityRequest;
  guards: SecurityGuard[];
  payments?: Payment[];
  isDirector?: boolean;
  onApproveRequest: (id: string) => void;
  onDenyRequest: (id: string) => void;
  onMarkClientPaidCash?: (requestId: string) => Promise<void>;
  onMarkGuardPaidCash?: (requestId: string) => Promise<void>;
  onDepositCashToStripe?: (requestId: string) => Promise<void>;
  onReleasePayout?: (requestId: string) => Promise<void>;
}) {
  const jobStatus = getLiveJobStatus(req);
  const statusCfg = LIVE_JOB_STATUS_LABEL[jobStatus];
  const assigned = guards.find((g) => g.id === req.assignedGuardId);

  return (
    <div className="staff-ops-card h-full space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded border ${statusCfg.className}`}>
          {statusCfg.emoji} {statusCfg.label}
        </span>
        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border border-brand-border text-brand-text-muted">
          {JOB_STATUS_LABELS[req.status]}
        </span>
        <span className="text-[10px] font-mono text-brand-text-muted">{req.id}</span>
      </div>
      <h3 className="font-black text-lg">{req.title}</h3>
      <p className="text-sm font-mono text-brand-text-muted">{req.clientName} · {req.location}</p>
      {req.siteName && <p className="text-xs text-brand-text-muted">Site: {req.siteName}</p>}
      {req.address && <p className="text-xs text-brand-text-muted">{req.address}</p>}
      <p className="text-xs text-brand-text-muted">
        {formatShiftRange(req.startDate, req.endDate)} · {formatDuration(req.durationHours)} · ${req.hourlyRate}/hr
      </p>
      <p className="text-sm">
        Assigned: <strong>{assigned ? assigned.name : 'Unassigned'}</strong>
        {req.guardsNeeded && req.guardsNeeded > 1 ? ` · ${req.guardsNeeded} guards needed` : ''}
      </p>
      {req.description && (
        <p className="text-xs text-brand-text-muted border-l-2 border-brand-primary pl-3">{req.description}</p>
      )}
      <JobPaymentRow
        req={req}
        guard={assigned}
        payment={payments?.find((p) => p.jobId === req.id)}
        isDirector={!!isDirector}
        onMarkClientPaidCash={onMarkClientPaidCash}
        onMarkGuardPaidCash={onMarkGuardPaidCash}
        onDepositCashToStripe={onDepositCashToStripe}
        onReleasePayout={onReleasePayout}
      />
      <div className="flex flex-wrap gap-2 pt-2">
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
        {req.status !== 'completed' && req.status !== 'closed' && (
          <button type="button" onClick={() => onDenyRequest(req.id)} className="staff-ops-btn-danger text-[10px]">
            <X className="w-3 h-3" /> Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export function StaffJobsPanel({
  requests,
  guards,
  isDirector,
  onApproveRequest,
  onDenyRequest,
  payments = [],
  onMarkClientPaidCash,
  onMarkGuardPaidCash,
  onDepositCashToStripe,
  onReleasePayout,
}: StaffJobsPanelProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<JobsFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { formFactor } = useDevice();
  const splitView = formFactor === 'tablet' || formFactor === 'desktop';

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...requests]
      .filter((r) => matchesFilter(r, filter))
      .filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.clientName.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q)
      )
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [requests, filter, search]);

  const selected = filtered.find((r) => r.id === selectedId) ?? filtered[0] ?? null;

  const filters: { id: JobsFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'open', label: 'Open' },
    { id: 'active', label: 'Active' },
    { id: 'done', label: 'Done' },
  ];

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-brand-primary" />
          Jobs
        </h1>
        <p className="text-xs font-mono text-brand-text-muted mt-1 uppercase">
          All client requests — open, active, and completed
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-black uppercase border transition-colors ${
              filter === f.id
                ? 'border-brand-primary bg-brand-primary/15 text-brand-primary'
                : 'border-brand-border text-brand-text-muted hover:text-brand-text'
            }`}
          >
            {f.label}
          </button>
        ))}
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

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-brand-text-muted font-mono py-12">No jobs match your filters.</p>
      ) : splitView ? (
        <div className="tablet-split-panel">
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {filtered.map((req) => {
              const isActive = selected?.id === req.id;
              return (
                <button
                  key={req.id}
                  type="button"
                  onClick={() => setSelectedId(req.id)}
                  className={`w-full text-left staff-ops-card p-3 transition-colors ${
                    isActive ? 'ring-2 ring-brand-primary' : 'hover:bg-white/5'
                  }`}
                >
                  <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded border border-brand-border text-brand-text-muted">
                    {JOB_STATUS_LABELS[req.status]}
                  </span>
                  <p className="font-black text-sm mt-2 truncate">{req.title}</p>
                  <p className="text-[10px] font-mono text-brand-text-muted truncate">{req.clientName}</p>
                </button>
              );
            })}
          </div>
          {selected && (
            <JobDetailPanel
              req={selected}
              guards={guards}
              payments={payments}
              isDirector={isDirector}
              onApproveRequest={onApproveRequest}
              onDenyRequest={onDenyRequest}
              onMarkClientPaidCash={onMarkClientPaidCash}
              onMarkGuardPaidCash={onMarkGuardPaidCash}
              onDepositCashToStripe={onDepositCashToStripe}
              onReleasePayout={onReleasePayout}
            />
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <JobDetailPanel
              key={req.id}
              req={req}
              guards={guards}
              payments={payments}
              isDirector={isDirector}
              onApproveRequest={onApproveRequest}
              onDenyRequest={onDenyRequest}
              onMarkClientPaidCash={onMarkClientPaidCash}
              onMarkGuardPaidCash={onMarkGuardPaidCash}
              onDepositCashToStripe={onDepositCashToStripe}
              onReleasePayout={onReleasePayout}
            />
          ))}
        </div>
      )}
    </div>
  );
}
