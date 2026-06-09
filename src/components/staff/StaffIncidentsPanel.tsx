import React from 'react';
import { OpsIncident } from '../../lib/staffOps';
import { WfBadge, WfListCard } from '../ui/wireframe';

interface StaffIncidentsPanelProps {
  incidents: OpsIncident[];
}

const SEVERITY_TONE: Record<OpsIncident['severity'], 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
  low: 'default',
  medium: 'warning',
  high: 'warning',
  critical: 'danger',
};

export function StaffIncidentsPanel({ incidents }: StaffIncidentsPanelProps) {
  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Client incidents</h1>
        <p className="text-sm text-brand-text-muted mt-2 max-w-2xl">
          Incident reports are filed by guards during shifts and delivered to the client. Guardr staff can
          review them here for context only — response and follow-up are handled by the client.
        </p>
      </div>

      {incidents.length === 0 ? (
        <div className="wf-list-card justify-center py-12">
          <p className="text-sm text-brand-text-muted">No client incident reports on file.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => (
            <WfListCard
              key={inc.id}
              title={inc.location}
              subtitle={`Guard: ${inc.guardName} · Client: ${inc.clientName}`}
              meta={
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <WfBadge tone={SEVERITY_TONE[inc.severity]}>{inc.severity} severity</WfBadge>
                    <WfBadge tone={inc.status === 'open' ? 'warning' : 'default'}>
                      {inc.status === 'open' ? 'Active shift' : 'Shift completed'}
                    </WfBadge>
                    <span>{new Date(inc.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-brand-text-muted leading-relaxed">{inc.description}</p>
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
