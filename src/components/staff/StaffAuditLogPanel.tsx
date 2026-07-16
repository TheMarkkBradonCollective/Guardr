import React, { useEffect, useState } from 'react';
import { ScrollText, RefreshCw } from 'lucide-react';
import { loadAuditLog, type AuditLogEntry } from '../../lib/auditLog';
import { useDevice } from '../../lib/platform';
import { AppEmptyState, AppItemCard, AppItemCardStack } from '../ui/app/AppPrimitives';
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
  return action.replace(/_/g, ' ');
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
  const { formFactor } = useDevice();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const data = await loadAuditLog(200);
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const refreshButton = (
    <button
      type="button"
      onClick={() => void refresh()}
      className={
        formFactor === 'desktop'
          ? 'adm-btn adm-btn--outline adm-btn--sm flex items-center gap-1'
          : 'app-button-outline app-btn-sm flex items-center gap-1'
      }
    >
      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
    </button>
  );

  const desktopTable = (
    <div className="adm-finance-audit-table">
      <table className="adm-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Actor</th>
            <th>Action</th>
            <th className="hidden md:table-cell">Entity</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan={4}>{loading ? 'Loading…' : 'No audit entries yet.'}</td>
            </tr>
          ) : (
            entries.map((e) => (
              <tr key={e.id}>
                <td className="adm-table-muted whitespace-nowrap">{new Date(e.createdAt).toLocaleString()}</td>
                <td>
                  <span className="adm-table-primary">{e.actorEmail}</span>
                  <span className="adm-table-secondary ml-1">({e.actorRole})</span>
                </td>
                <td className="adm-table-secondary">{formatAuditAction(e.action)}</td>
                <td className="adm-table-muted hidden md:table-cell">
                  {e.entityType}
                  {e.entityId ? ` · ${e.entityId.slice(0, 12)}` : ''}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const mobileList = loading ? (
    <AppEmptyState title="Loading…" />
  ) : entries.length === 0 ? (
    <AppEmptyState title="No audit entries yet." />
  ) : (
    <AppItemCardStack>
      {entries.map((entry) => (
        <AuditLogCard key={entry.id} entry={entry} />
      ))}
    </AppItemCardStack>
  );

  if (formFactor === 'desktop') {
    return (
      <StaffOpsPageShell className="adm-finance-page adm-finance-audit">
        <div className="adm-workbench-toolbar adm-finance-toolbar">
          <div className="flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-brand-primary" />
            <div>
              <p className="adm-card-eyebrow">Audit trail</p>
              <p className="adm-workbench-subtitle">Staff actions and platform changes — most recent 200 entries.</p>
            </div>
          </div>
          {refreshButton}
        </div>
        {entries.length >= 200 && (
          <p className="adm-workbench-subtitle adm-finance-audit-note">
            Showing the 200 most recent entries. Older activity is still retained but not shown here.
          </p>
        )}
        <div className="adm-workbench-list adm-workbench-list--flat adm-finance-audit-list">{desktopTable}</div>
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
