import React from 'react';
import { OpsIncident } from '../../lib/staffOps';
import { WfBadge } from '../ui/wireframe';
import { AppList } from '../ui/app/AppPrimitives';

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
    <div className="animate-fade-in -mx-4 sm:-mx-5">
      <p className="text-sm text-brand-text-muted px-4 sm:px-5 pb-4 max-w-2xl">
        Incident reports are filed by guards during jobs and delivered to the client. Guardr staff can
        review them here for context only — response and follow-up are handled by the client.
      </p>

      {incidents.length === 0 ? (
        <p className="staff-empty-state border-t border-brand-border">No client incident reports on file.</p>
      ) : (
        <AppList>
          {incidents.map((inc) => (
            <div key={inc.id} className="app-list-row app-list-row-align-top flex-col !items-stretch gap-2">
              <p className="font-semibold text-sm">{inc.location}</p>
              <p className="text-sm text-brand-text-muted">
                Guard: {inc.guardName} · Client: {inc.clientName}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <WfBadge tone={SEVERITY_TONE[inc.severity]}>{inc.severity} severity</WfBadge>
                <WfBadge tone={inc.status === 'open' ? 'warning' : 'default'}>
                  {inc.status === 'open' ? 'Active job' : 'Job completed'}
                </WfBadge>
                <span className="text-xs text-brand-text-muted">{new Date(inc.timestamp).toLocaleString()}</span>
              </div>
              <p className="text-sm text-brand-text-muted leading-relaxed">{inc.description}</p>
            </div>
          ))}
        </AppList>
      )}
    </div>
  );
}
