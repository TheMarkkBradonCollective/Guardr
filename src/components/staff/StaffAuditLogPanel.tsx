import React, { useEffect, useState } from 'react';
import { ScrollText, RefreshCw } from 'lucide-react';
import { loadAuditLog, type AuditLogEntry } from '../../lib/auditLog';
import { useDevice } from '../../lib/platform';
import { StaffOpsPageShell } from './StaffOpsPageShell';

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

  const table = (
    <div className={formFactor === 'desktop' ? 'adm-finance-audit-table' : 'rounded-xl border border-brand-border overflow-hidden'}>
      <table className={formFactor === 'desktop' ? 'adm-table' : 'w-full text-sm'}>
        <thead className={formFactor === 'desktop' ? undefined : 'bg-brand-surface-elevated text-brand-text-muted text-xs uppercase sticky top-0 z-10'}>
          <tr>
            <th className={formFactor === 'desktop' ? undefined : 'text-left p-3'}>Time</th>
            <th className={formFactor === 'desktop' ? undefined : 'text-left p-3'}>Actor</th>
            <th className={formFactor === 'desktop' ? undefined : 'text-left p-3'}>Action</th>
            <th className={formFactor === 'desktop' ? undefined : 'text-left p-3 hidden md:table-cell'}>Entity</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan={4} className={formFactor === 'desktop' ? undefined : 'p-8 text-center text-brand-text-muted'}>
                {loading ? 'Loading…' : 'No audit entries yet.'}
              </td>
            </tr>
          ) : (
            entries.map((e) => (
              <tr
                key={e.id}
                className={formFactor === 'desktop' ? undefined : 'border-t border-brand-border hover:bg-brand-surface-elevated/50'}
              >
                <td className={formFactor === 'desktop' ? 'adm-table-muted whitespace-nowrap' : 'p-3 text-brand-text-muted whitespace-nowrap'}>
                  {new Date(e.createdAt).toLocaleString()}
                </td>
                <td className={formFactor === 'desktop' ? undefined : 'p-3'}>
                  <span className={formFactor === 'desktop' ? 'adm-table-primary' : 'font-medium text-brand-text'}>
                    {e.actorEmail}
                  </span>
                  <span className={formFactor === 'desktop' ? 'adm-table-secondary ml-1' : 'text-xs text-brand-text-muted ml-1'}>
                    ({e.actorRole})
                  </span>
                </td>
                <td className={formFactor === 'desktop' ? 'adm-table-secondary' : 'p-3 text-brand-text'}>
                  {e.action.replace(/_/g, ' ')}
                </td>
                <td className={formFactor === 'desktop' ? 'adm-table-muted hidden md:table-cell' : 'p-3 text-brand-text-muted hidden md:table-cell'}>
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
        <div className="adm-workbench-list adm-workbench-list--flat adm-finance-audit-list">{table}</div>
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
      {table}
    </div>
  );
}
