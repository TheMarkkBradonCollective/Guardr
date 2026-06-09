import React, { useMemo, useState } from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';
import { guardPayoutAmount } from '../../lib/cashPayments';
import { formatDuration, formatShiftRange } from '../../lib/dates';
import { JOB_STATUS_LABELS } from '../../lib/jobStatus';
import { LIVE_JOB_STATUS_LABEL, getLiveJobStatus } from '../../lib/staffOps';
import { computeGuardPay, PLATFORM_FEE_PER_HOUR } from '../../lib/payments';
import { useDevice } from '../../lib/platform';
import { JobListCard } from '../jobs/JobListCard';
import { AppItemCardStack } from '../ui/app/AppPrimitives';
import { WfBadge, WfMetricTile, WfSearchBar } from '../ui/wireframe';
import { ArrowLeft, X } from 'lucide-react';

type JobsFilter = 'all' | 'open' | 'active' | 'done';

interface StaffJobsPanelProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  onApproveRequest: (id: string) => void;
  onDenyRequest: (id: string) => void;
  initialSelectedId?: string | null;
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
  const platformRate = req.platformFeePerHour ?? PLATFORM_FEE_PER_HOUR;
  const platformFee = Math.round(platformRate * req.durationHours * 100) / 100;
  const guardRate = req.guardPay ?? computeGuardPay(req.hourlyRate);
  const guardEarns = guardPayoutAmount(req);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <WfMetricTile label="Client rate" value={`$${req.hourlyRate}/hr`} />
        <WfMetricTile label="Client bill" value={`$${req.estimatedPayout}`} />
        <WfMetricTile label="Guard rate" value={`$${guardRate}/hr`} />
        <WfMetricTile label="Guard earns" value={`$${guardEarns}`} accent />
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-brand-text-muted border-t border-brand-border pt-3">
        <span>
          Platform rate: <strong className="text-brand-text">${platformRate}/hr</strong>
        </span>
        <span>
          Platform fee: <strong className="text-brand-text">${platformFee}</strong>
        </span>
      </div>
    </div>
  );
}

function JobDetailPanel({
  req,
  guards,
  onApproveRequest,
  onDenyRequest,
  onBack,
}: {
  req: SecurityRequest;
  guards: SecurityGuard[];
  onApproveRequest: (id: string) => void;
  onDenyRequest: (id: string) => void;
  onBack?: () => void;
}) {
  const jobStatus = getLiveJobStatus(req);
  const statusCfg = LIVE_JOB_STATUS_LABEL[jobStatus];
  const assigned = guards.find((g) => g.id === req.assignedGuardId);

  return (
    <div className="staff-detail-pane h-full space-y-4">
      {onBack && (
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm text-brand-primary">
          <ArrowLeft className="w-4 h-4" />
          Back to jobs
        </button>
      )}
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
  initialSelectedId = null,
}: StaffJobsPanelProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<JobsFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
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

  const selected = filtered.find((r) => r.id === selectedId) ?? (splitView ? filtered[0] : null) ?? null;
  const showDetailOnly = Boolean(selected && !splitView);

  const filters: { id: JobsFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'open', label: 'Open' },
    { id: 'active', label: 'Active' },
    { id: 'done', label: 'Done' },
  ];

  function renderJobCard(req: SecurityRequest, isActive: boolean) {
    const assignedGuard = guards.find((g) => g.id === req.assignedGuardId);
    return (
      <JobListCard
        key={req.id}
        job={req}
        subtitle={req.clientName}
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <WfBadge tone={statusBadgeTone(req.status)}>{JOB_STATUS_LABELS[req.status]}</WfBadge>
            <span>{assignedGuard ? `Guard: ${assignedGuard.name}` : 'Unassigned'}</span>
          </div>
        }
        onClick={() => setSelectedId(req.id)}
        selected={isActive}
        showStatus={false}
      />
    );
  }

  return (
    <div className="animate-fade-in space-y-4">
      {!showDetailOnly && (
        <>
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
        </>
      )}

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-brand-text-muted py-12">No jobs match your filters.</p>
      ) : showDetailOnly && selected ? (
        <JobDetailPanel
          req={selected}
          guards={guards}
          onApproveRequest={onApproveRequest}
          onDenyRequest={onDenyRequest}
          onBack={() => setSelectedId(null)}
        />
      ) : splitView ? (
        <div className="tablet-split-panel">
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <AppItemCardStack>
              {filtered.map((req) => renderJobCard(req, selected?.id === req.id))}
            </AppItemCardStack>
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
        <AppItemCardStack>
          {filtered.map((req) => renderJobCard(req, false))}
        </AppItemCardStack>
      )}
    </div>
  );
}
