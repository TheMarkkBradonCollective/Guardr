import React, { useCallback, useEffect, useState } from 'react';
import { ScrollText, RefreshCw } from 'lucide-react';
import { loadAuditLog, formatAuditActionLabel, type AuditLogEntry } from '../../lib/auditLog';
import { useAuditLogRealtime } from '../../lib/useAuditLogRealtime';
import { useLayoutFormFactor } from '../../surfaces';
import { GuardrButton } from '../baseui/GuardrButton';
import { GuardrDataTable, type GuardrTableColumn } from '../baseui/GuardrDataTable';
import { WorkbenchToolbar } from '../baseui/layout/WorkbenchLayout';
import { AppItemCard, AppItemCardStack, AppRequestState } from '../ui/app/AppPrimitives';
import { userFacingError } from '../../lib/userFacingError';
import { StaffOpsPageShell } from './StaffOpsPageShell';

function formatAuditTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatAuditAction(action: string): string {
  return formatAuditActionLabel(action);
}

function AuditLogCard({ entry }: { entry: AuditLogEntry }) {
  return (
    <AppItemCard className="flex-col !items-stretch gap-2">
      <p className="text-sm font-semibold capitalize">{formatAuditAction(entry.action)}</p>
      <p className="text-xs text-brand-text-muted break-all">
        <span className="font-medium text-brand-text">{entry.actorEmail}</span>
        <span className="ml-1">({entry.actorRole})</span>
      </p>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-brand-text-muted">
        <span>{formatAuditTime(entry.createdAt)}</span>
        {entry.entityType && (
          <span>
            {entry.entityType}
            {entry.entityId ? ` · ${entry.entityId.slice(0, 12)}` : ''}
          </span>
        )}
      </div>
    </AppItemCard>
  );
}

export function StaffAuditLogPanel() {
  const formFactor = useLayoutFormFactor();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadAuditLog(200);
      setEntries(data);
    } catch (err) {
      setError(userFacingError(err, 'Could not load the audit log.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useAuditLogRealtime((entry) => {
    setEntries((prev) => {
      if (prev.some((row) => row.id === entry.id)) return prev;
      return [entry, ...prev].slice(0, 200);
    });
  }, true);

  const refreshButton =
    formFactor === 'desktop' ? (
      <GuardrButton kind="secondary" size="compact" onClick={() => void refresh()}>
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
      </GuardrButton>
    ) : (
      <button
        type="button"
        onClick={() => void refresh()}
        className="app-button-outline app-btn-sm flex items-center gap-1"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
      </button>
    );

  const auditColumns: GuardrTableColumn<(typeof entries)[number]>[] = [
    {
      id: 'time',
      header: 'Time',
      sortValue: (e) => e.createdAt,
      render: (e) => (
        <span className="whitespace-nowrap">{new Date(e.createdAt).toLocaleString()}</span>
      ),
    },
    {
      id: 'actor',
      header: 'Actor',
      grow: true,
      sortValue: (e) => e.actorEmail.toLowerCase(),
      render: (e) => (
        <>
          <span className="uber-workbench-table-primary">{e.actorEmail}</span>
          <span className="uber-workbench-table-secondary ml-1">({e.actorRole})</span>
        </>
      ),
    },
    {
      id: 'action',
      header: 'Action',
      sortValue: (e) => e.action,
      render: (e) => formatAuditAction(e.action),
    },
    {
      id: 'entity',
      header: 'Entity',
      hideOnNarrow: true,
      render: (e) => `${e.entityType}${e.entityId ? ` · ${e.entityId.slice(0, 12)}` : ''}`,
    },
  ];

  const desktopTable = (
    <div className="adm-finance-audit-table">
      <GuardrDataTable
        columns={auditColumns}
        rows={entries}
        rowKey={(e) => e.id}
        caption="Audit log"
        density="compact"
        layout="table"
        emptyMessage={loading ? 'Loading…' : error ? error : 'No audit entries yet.'}
      />
    </div>
  );

  const mobileList = (
    <AppRequestState
      status={loading ? 'loading' : error ? 'error' : entries.length === 0 ? 'empty' : 'ready'}
      title={loading ? 'Loading' : error ? 'Could not load audit log' : 'No audit entries yet'}
      message={error ?? (loading ? 'This should only take a moment.' : 'When staff take an action, it will show up here.')}
      onRetry={error ? () => void refresh() : undefined}
    >
      <AppItemCardStack>
        {entries.map((entry) => (
          <AuditLogCard key={entry.id} entry={entry} />
        ))}
      </AppItemCardStack>
    </AppRequestState>
  );

  if (formFactor === 'desktop') {
    return (
      <StaffOpsPageShell
        className="staff-mgmt-panel staff-roster-panel adm-finance-page adm-finance-audit"
        toolbar={
          <WorkbenchToolbar
            eyebrow="Audit trail"
            subtitle="Staff actions and platform changes — most recent 200 entries."
            actions={refreshButton}
          />
        }
      >
        {entries.length >= 200 && (
          <p className="uber-workbench-subtitle adm-finance-audit-note">
            Showing the 200 most recent entries. Older activity is still retained but not shown here.
          </p>
        )}
        <div className="uber-workbench-list uber-workbench-list--flat adm-finance-audit-list">{desktopTable}</div>
      </StaffOpsPageShell>
    );
  }

  if (formFactor === 'tablet') {
    return (
      <StaffOpsPageShell
        className="staff-mgmt-panel staff-roster-panel staff-audit-tablet"
        toolbar={
          <div className="flex items-center justify-end">
            {refreshButton}
          </div>
        }
      >
        {entries.length >= 200 && (
          <p className="text-xs text-brand-text-muted">
            Showing the 200 most recent entries. Older activity is still retained but not shown here.
          </p>
        )}
        <AppRequestState
          status={loading ? 'loading' : error ? 'error' : entries.length === 0 ? 'empty' : 'ready'}
          title={loading ? 'Loading' : error ? 'Could not load audit log' : 'No audit entries yet'}
          message={error ?? (loading ? 'This should only take a moment.' : 'When staff take an action, it will show up here.')}
          onRetry={error ? () => void refresh() : undefined}
        >
          <div className="staff-audit-tablet-grid">
            {entries.map((entry) => (
              <AuditLogCard key={entry.id} entry={entry} />
            ))}
          </div>
        </AppRequestState>
      </StaffOpsPageShell>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-brand-primary" />
          <h2 className="text-lg font-bold text-brand-text">Audit log</h2>
        </div>
        {refreshButton}
      </div>
      {entries.length >= 200 && (
        <p className="text-xs text-brand-text-muted">
          Showing the 200 most recent entries. Older activity is still retained but not shown here.
        </p>
      )}
      {mobileList}
    </div>
  );
}
