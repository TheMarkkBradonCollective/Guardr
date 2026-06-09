import React from 'react';
import { OpsIncident } from '../../lib/staffOps';

interface StaffIncidentsPanelProps {
  incidents: OpsIncident[];
}

const SEVERITY_CLASS: Record<OpsIncident['severity'], string> = {
  low: 'text-slate-400 border-slate-500/30',
  medium: 'text-amber-400 border-amber-500/30',
  high: 'text-orange-400 border-orange-500/30',
  critical: 'text-red-400 border-red-500/30',
};

export function StaffIncidentsPanel({ incidents }: StaffIncidentsPanelProps) {
  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-black">Client incidents</h1>
        <p className="text-sm text-brand-text-muted mt-2 max-w-2xl">
          Incident reports are filed by guards during shifts and delivered to the client. Guardr staff can
          review them here for context only — response and follow-up are handled by the client.
        </p>
      </div>

      {incidents.length === 0 ? (
        <div className="staff-ops-card text-center py-12">
          <p className="text-sm text-brand-text-muted">No client incident reports on file.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => (
            <div key={inc.id} className="staff-ops-card">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded border ${SEVERITY_CLASS[inc.severity]}`}>
                    {inc.severity} severity
                  </span>
                  <span className="text-[10px] font-mono uppercase text-brand-text-muted px-2 py-0.5 rounded border border-brand-border">
                    {inc.status === 'open' ? 'Active shift' : 'Shift completed'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-brand-text-muted">
                  {new Date(inc.timestamp).toLocaleString()}
                </span>
              </div>
              <h3 className="font-black text-sm">{inc.location}</h3>
              <p className="text-xs font-mono text-brand-text-muted mt-1">
                Guard: {inc.guardName} · Client: {inc.clientName}
              </p>
              <p className="text-sm text-brand-text-muted mt-3 leading-relaxed">{inc.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
