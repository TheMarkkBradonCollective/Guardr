import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { OpsShiftViolation } from '../../lib/staffOps';
import { WfBadge } from '../ui/wireframe';
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

interface StaffViolationsPanelProps {
  violations: OpsShiftViolation[];
  onResolveAuditViolation?: (
    requestId: string,
    violationId: string,
    action: 'uphold' | 'dismiss',
    resolutionNote?: string
  ) => void | Promise<void>;
  onOpenJob?: (requestId: string) => void;
}

type ViolationTab = 'open' | 'all' | 'resolved';

const OPEN_STATUSES = new Set(['auto-flagged', 'flagged', 'dispute-open']);

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function statusTone(
  status: string
): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
  if (status === 'dispute-open') return 'warning';
  if (status === 'auto-flagged' || status === 'flagged') return 'danger';
  if (status === 'dismissed' || status === 'verified' || status === 'expired') return 'success';
  if (status === 'upheld') return 'danger';
  return 'default';
}

function statusLabel(status: string): string {
  return status.replace(/-/g, ' ');
}

export function StaffViolationsPanel({
  violations,
  onResolveAuditViolation,
  onOpenJob,
}: StaffViolationsPanelProps) {
  const { formFactor } = useDevice();
  const [tab, setTab] = useState<ViolationTab>('open');
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNoteById, setResolutionNoteById] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return violations.filter((v) => {
      const status = statusMap[v.id] ?? v.status;
      const needsReview = OPEN_STATUSES.has(status);
      if (tab === 'open') return needsReview;
      if (tab === 'resolved') return !needsReview;
      return true;
    });
  }, [violations, statusMap, tab]);

  const tabCounts = useMemo(() => {
    let open = 0;
    let resolved = 0;
    for (const violation of violations) {
      const status = statusMap[violation.id] ?? violation.status;
      if (OPEN_STATUSES.has(status)) open += 1;
      else resolved += 1;
    }
    return { all: violations.length, open, resolved };
  }, [violations, statusMap]);

  const violationColumns: GuardrTableColumn<OpsShiftViolation>[] = [
    {
      id: 'violation',
      header: 'Violation',
      grow: true,
      sortValue: (v) => v.label.toLowerCase(),
      render: (v) => (
        <>
          <p className="uber-workbench-table-primary">{v.label}</p>
          <p className="uber-workbench-table-secondary">{v.jobTitle}</p>
        </>
      ),
    },
    {
      id: 'guard',
      header: 'Guard',
      sortValue: (v) => v.guardName,
      render: (v) => v.guardName,
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (v) => statusMap[v.id] ?? v.status,
      render: (v) => {
        const status = statusMap[v.id] ?? v.status;
        return (
          <StatusChip tone={OPEN_STATUSES.has(status) ? 'warning' : 'positive'}>
            {statusLabel(status)}
          </StatusChip>
        );
      },
    },
  ];

  useEffect(() => {
    if (formFactor === 'desktop' && filtered.length > 0 && !selectedId) {
      setSelectedId(filtered[0].id);
    }
    if (selectedId && !filtered.some((v) => v.id === selectedId)) {
      setSelectedId(filtered[0]?.id ?? null);
    }
  }, [formFactor, filtered, selectedId]);

  const renderViolationCard = (v: OpsShiftViolation) => {
    const status = statusMap[v.id] ?? v.status;
    const needsReview = OPEN_STATUSES.has(status);
    const busy = resolvingId === v.id;
    const canResolve = needsReview && v.status === 'dispute-open' && onResolveAuditViolation;

    return (
      <div className="app-item-card app-item-card-align-top flex-col !items-stretch gap-4 staff-dispute-block !shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <WfBadge tone={v.source === 'client' ? 'warning' : 'primary'}>
              {v.source === 'client' ? 'client flag' : 'system'}
            </WfBadge>
            <h3 className="font-semibold text-sm mt-1">{v.label}</h3>
            <p className="text-xs text-brand-text-muted mt-0.5">
              {v.jobTitle} · {formatWhen(v.createdAt)}
            </p>
          </div>
          <WfBadge tone={statusTone(status)}>{statusLabel(status)}</WfBadge>
        </div>

        <div className="staff-mgmt-detail-row px-0 py-2.5 space-y-1.5 text-xs text-brand-text-muted">
          <p>
            <span className="text-brand-text">Guard:</span> {v.guardName}
          </p>
          <p>
            <span className="text-brand-text">Client:</span> {v.clientName}
          </p>
          <p>
            <span className="text-brand-text">Checkpoint:</span> {v.checkpoint}
          </p>
          <p>
            <span className="text-brand-text">Category:</span> {v.category}
          </p>
          <p className="pt-1 text-sm text-brand-text-muted">{v.description}</p>
        </div>

        {v.guardNote ? (
          <div className="staff-dispute-statement">
            <p className="wf-metric-label">Guard dispute note</p>
            <p className="text-sm text-brand-text-muted mt-1">{v.guardNote}</p>
          </div>
        ) : null}

        {v.disputeDeadlineAt && needsReview ? (
          <p className="text-xs text-brand-text-muted">
            Dispute deadline: {formatWhen(v.disputeDeadlineAt)}
          </p>
        ) : null}

        {canResolve ? (
          <div className="space-y-3 pt-2 border-t border-brand-border">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-brand-text-muted">Staff resolution note (optional)</span>
              <textarea
                value={resolutionNoteById[v.id] ?? ''}
                onChange={(e) => setResolutionNoteById((m) => ({ ...m, [v.id]: e.target.value }))}
                placeholder="Brief note for the record..."
                className="uber-input w-full min-h-[72px] resize-y"
                rows={2}
              />
            </label>
            <div className="app-action-row--equal">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setResolvingId(v.id);
                  void Promise.resolve(
                    onResolveAuditViolation!(
                      v.requestId,
                      v.violationId,
                      'dismiss',
                      resolutionNoteById[v.id]
                    )
                  )
                    .then(() => setStatusMap((m) => ({ ...m, [v.id]: 'dismissed' })))
                    .finally(() => setResolvingId(null));
                }}
                className="app-button-outline app-btn-sm disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Side with guard'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setResolvingId(v.id);
                  void Promise.resolve(
                    onResolveAuditViolation!(
                      v.requestId,
                      v.violationId,
                      'uphold',
                      resolutionNoteById[v.id]
                    )
                  )
                    .then(() => setStatusMap((m) => ({ ...m, [v.id]: 'upheld' })))
                    .finally(() => setResolvingId(null));
                }}
                className="app-button-primary app-btn-sm disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Uphold client'}
              </button>
            </div>
          </div>
        ) : null}

        {onOpenJob ? (
          <button
            type="button"
            className="app-button-outline app-btn-sm self-start"
            onClick={() => onOpenJob(v.requestId)}
          >
            Open job
          </button>
        ) : null}
      </div>
    );
  };

  const tabBar = (
    <StaffListFilterTabs
      aria-label="Violation status"
      activeId={tab}
      onChange={(id) => setTab(id as ViolationTab)}
      tabs={[
        { id: 'open', label: 'Open', count: tabCounts.open },
        { id: 'all', label: 'All', count: tabCounts.all },
        { id: 'resolved', label: 'Resolved', count: tabCounts.resolved },
      ]}
    />
  );

  const emptyMessage = tab === 'open' ? 'No open violations' : 'No violations on file';
  const emptyBody =
    'Skipped checkpoints, briefing not-ready flags, and client shift reviews appear here.';

  const emptyState =
    formFactor === 'desktop' ? (
      <WorkbenchEmpty
        icon={ShieldAlert}
        message={emptyMessage}
        variant="detail"
        action={<p className="uber-workbench-subtitle text-center max-w-md">{emptyBody}</p>}
      />
    ) : (
      <div className="app-empty-state">
        <div className="app-empty-state-icon">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <p className="app-empty-state-title">{emptyMessage}</p>
        <p className="app-empty-state-body">{emptyBody}</p>
      </div>
    );

  if (filtered.length === 0) {
    if (formFactor === 'desktop') {
      return (
        <StaffOpsPageShell
          className="staff-mgmt-panel staff-roster-panel"
          toolbar={
            <WorkbenchToolbar
              eyebrow="Accountability"
              subtitle="Shift checkpoint skips, briefing readiness, and client verification flags."
            />
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
    const selected = filtered.find((v) => v.id === selectedId) ?? filtered[0];

    return (
      <StaffOpsPageShell
        className="staff-mgmt-panel staff-roster-panel"
        toolbar={
          <WorkbenchToolbar
            eyebrow="Accountability"
            subtitle="Shift checkpoint skips, briefing readiness, and client verification flags."
          />
        }
      >
        {tabBar}
        <WorkbenchSplit
          list={
            <GuardrDataTable
              columns={violationColumns}
              rows={filtered}
              rowKey={(v) => v.id}
              selectedKey={selected?.id}
              onRowClick={(v) => setSelectedId(v.id)}
              caption="Shift violations"
              cardLayout={{ title: 'violation', subtitle: 'guard', trailing: 'status' }}
            />
          }
          detail={
            selected ? (
              renderViolationCard(selected)
            ) : (
              <WorkbenchEmpty icon={ShieldAlert} message="Select a violation to review" variant="detail" />
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
        {filtered.map((v) => (
          <React.Fragment key={v.id}>{renderViolationCard(v)}</React.Fragment>
        ))}
      </div>
    </StaffOpsPageShell>
  );
}
