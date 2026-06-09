import React, { useMemo, useState } from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';
import { guardPayoutAmount } from '../../lib/cashPayments';
import { formatDuration, formatShiftRange } from '../../lib/dates';
import { JOB_STATUS_LABELS } from '../../lib/jobStatus';
import { LIVE_JOB_STATUS_LABEL, getLiveJobStatus } from '../../lib/staffOps';
import { PLATFORM_FEE_PER_HOUR } from '../../lib/payments';
import { useDevice } from '../../lib/platform';
import { WfBadge, WfListCard, WfMetricTile, WfSearchBar } from '../ui/wireframe';
import { Briefcase, X } from 'lucide-react';

type JobsFilter = 'all' | 'open' | 'active' | 'done';

interface StaffJobsPanelProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  onApproveRequest: (id: string) => void;
  onDenyRequest: (id: string) => void;
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

function statusBadgeTone(status: SecurityRequest['status']): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'open':
    case 'accepted':
      return 'primary';
    case 'pending-review':
      return 'warning';
    case 'in-progress':
      return 'success';
    case 'completed':
      return 'success';
    case 'closed':
      return 'default';
    default:
      return 'default';
  }
}

function JobBillingSummary({ req }: { req: SecurityRequest }) {
  const platformFee =
    Math.round((req.platformFeePerHour ?? PLATFORM_FEE_PER_HOUR) * req.durationHours * 100) / 100;
  const guardEarns = guardPayoutAmount(req);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <WfMetricTile label="Client rate" value={`$${req.hourlyRate}/hr`} />
      <WfMetricTile label="Client bill" value={`$${req.estimatedPayout}`} />
      <WfMetricTile label="Platform fee" value={`$${platformFee}`} />
      <WfMetricTile label="Guard earns" value={`$${guardEarns}`} accent />
    </div>
  );
}

function JobDetailPanel({
  req,
  guards,
  onApproveRequest,
  onDenyRequest,
}: {
  req: SecurityRequest;
  guards: SecurityGuard[];
  onApproveRequest: (id: string) => void;
  onDenyRequest: (id: string) => void;
}) {
  const jobStatus = getLiveJobStatus(req);
  const statusCfg = LIVE_JOB_STATUS_LABEL[jobStatus];
  const assigned = guards.find((g) => g.id === req.assignedGuardId);

  return (
    <div className="staff-ops-card h-full space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <WfBadge tone="primary">{statusCfg.emoji} {statusCfg.label}</WfBadge>
        <WfBadge tone={statusBadgeTone(req.status)}>{JOB_STATUS_LABELS[req.status]}</WfBadge>
        <span className="text-xs text-brand-text-muted">{req.id}</span>
      </div>
      <h3 className="font-semibold text-lg">{req.title}</h3>
      <p className="text-sm text-brand-text-muted">{req.clientName} · {req.location}</p>
      {req.siteName && <p className="text-xs text-brand-text-muted">Site: {req.siteName}</p>}
      {req.address && <p className="text-xs text-brand-text-muted">{req.address}</p>}
      <p className="text-xs text-brand-text-muted">
        {formatShiftRange(req.startDate, req.endDate)} · {formatDuration(req.durationHours)}
      </p>
      <p className="text-sm">
        Assigned: <strong>{assigned ? assigned.name : 'Unassigned'}</strong>
        {req.guardsNeeded && req.guardsNeeded > 1 ? ` · ${req.guardsNeeded} guards needed` : ''}
      </p>
      {req.description && (
        <p className="text-xs text-brand-text-muted border-l-2 border-brand-primary pl-3">{req.description}</p>
      )}
      <JobBillingSummary req={req} />
      <div className="flex flex-wrap gap-2 pt-2 border-t border-brand-border">
        {req.status === 'pending-review' && (
          <button type="button" onClick={() => onApproveRequest(req.id)} className="app-button-primary !w-auto !h-9 !px-4 !text-xs">
            Approve Job
          </button>
        )}
        {req.status !== 'completed' && req.status !== 'closed' && (
          <button type="button" onClick={() => onDenyRequest(req.id)} className="app-button-outline !w-auto !h-9 !px-4 !text-xs text-red-400 border-red-500/40">
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
  onApproveRequest,
  onDenyRequest,
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
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-brand-primary" />
          Jobs
        </h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === f.id
                ? 'border-brand-primary bg-brand-primary/15 text-brand-primary'
                : 'border-brand-border text-brand-text-muted hover:text-brand-text'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <WfSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search client, location, title..."
        className="max-w-md"
      />

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-brand-text-muted py-12">No jobs match your filters.</p>
      ) : splitView ? (
        <div className="tablet-split-panel">
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {filtered.map((req) => {
              const isActive = selected?.id === req.id;
              const assignedGuard = guards.find((g) => g.id === req.assignedGuardId);
              return (
                <WfListCard
                  key={req.id}
                  avatar={
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-brand-primary" />
                    </div>
                  }
                  title={req.title}
                  subtitle={req.clientName}
                  meta={
                    <div className="flex flex-wrap items-center gap-1.5">
                      <WfBadge tone={statusBadgeTone(req.status)}>{JOB_STATUS_LABELS[req.status]}</WfBadge>
                      <span>{assignedGuard ? `Guard: ${assignedGuard.name}` : 'Unassigned'}</span>
                    </div>
                  }
                  onClick={() => setSelectedId(req.id)}
                  className={isActive ? 'ring-2 ring-brand-primary' : ''}
                />
              );
            })}
          </div>
          {selected && (
            <JobDetailPanel
              req={selected}
              guards={guards}
              onApproveRequest={onApproveRequest}
              onDenyRequest={onDenyRequest}
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
              onApproveRequest={onApproveRequest}
              onDenyRequest={onDenyRequest}
            />
          ))}
        </div>
      )}
    </div>
  );
}
