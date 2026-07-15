import React, { useEffect, useState } from 'react';
import { ScrollText, RefreshCw } from 'lucide-react';
import { loadAuditLog, type AuditLogEntry } from '../../lib/auditLog';

export function StaffAuditLogPanel() {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-brand-primary" />
          <h2 className="text-lg font-bold text-brand-text">Audit log</h2>
        </div>
        <button type="button" onClick={() => void refresh()} className="app-button-outline app-btn-sm flex items-center gap-1">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
      {entries.length >= 200 && (
        <p className="text-xs text-brand-text-muted">
          Showing the 200 most recent entries. Older activity is still retained but not shown here.
        </p>
      )}
      <div className="rounded-xl border border-brand-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-surface-elevated text-brand-text-muted text-xs uppercase sticky top-0 z-10">
            <tr>
              <th className="text-left p-3">Time</th>
              <th className="text-left p-3">Actor</th>
              <th className="text-left p-3">Action</th>
              <th className="text-left p-3 hidden md:table-cell">Entity</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-brand-text-muted">
                  {loading ? 'Loading…' : 'No audit entries yet.'}
                </td>
              </tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id} className="border-t border-brand-border hover:bg-brand-surface-elevated/50">
                  <td className="p-3 text-brand-text-muted whitespace-nowrap">
                    {new Date(e.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span className="font-medium text-brand-text">{e.actorEmail}</span>
                    <span className="text-xs text-brand-text-muted ml-1">({e.actorRole})</span>
                  </td>
                  <td className="p-3 text-brand-text">{e.action.replace(/_/g, ' ')}</td>
                  <td className="p-3 text-brand-text-muted hidden md:table-cell">
                    {e.entityType}{e.entityId ? ` · ${e.entityId.slice(0, 12)}` : ''}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
