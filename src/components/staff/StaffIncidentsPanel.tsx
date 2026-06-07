import React, { useState } from 'react';
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
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-black">Incident Center</h1>
        <p className="text-xs font-mono text-brand-text-muted mt-1 uppercase">Real-time safety and incident response</p>
      </div>

      <div className="space-y-3">
        {incidents.map((inc) => {
          const isResolved = resolved.has(inc.id) || inc.status === 'resolved';
          return (
            <div key={inc.id} className={`staff-ops-card ${isResolved ? 'opacity-60' : ''}`}>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded border ${SEVERITY_CLASS[inc.severity]}`}>
                  {inc.severity} severity
                </span>
                <span className="text-[10px] font-mono text-brand-text-muted">
                  {new Date(inc.timestamp).toLocaleString()}
                </span>
              </div>
              <h3 className="font-black text-sm">{inc.location}</h3>
              <p className="text-xs font-mono text-brand-text-muted mt-1">
                Guard: {inc.guardName} · Client: {inc.clientName}
              </p>
              <p className="text-sm text-brand-text-muted mt-3 leading-relaxed">{inc.description}</p>
              {!isResolved && (
                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-brand-border">
                  <button type="button" onClick={() => alert('Reviewer assigned.')} className="staff-ops-btn-outline text-[10px]">Assign Reviewer</button>
                  <button type="button" onClick={() => alert('Escalated to director.')} className="staff-ops-btn-danger text-[10px]">Escalate</button>
                  <button type="button" onClick={() => setResolved((s) => new Set(s).add(inc.id))} className="staff-ops-btn-primary text-[10px]">Resolve</button>
                  <button type="button" onClick={() => alert('Marked false report.')} className="staff-ops-btn-outline text-[10px]">False Report</button>
                  <button type="button" onClick={() => alert('Job frozen pending review.')} className="staff-ops-btn-outline text-[10px]">Freeze Job</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
