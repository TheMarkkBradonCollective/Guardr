import React, { useState } from 'react';
import { OpsIncident } from '../../lib/staffOps';
import { IncidentReportViewContext } from '../../lib/incidentReports';
import { IncidentReportDetailView } from '../reports/IncidentReportDetailView';
import { WfBadge } from '../ui/wireframe';
import { AppList, AppSubScreenHeader } from '../ui/app/AppPrimitives';
import { AlertTriangle } from 'lucide-react';

interface StaffIncidentsPanelProps {
  incidents: OpsIncident[];
  incidentDetails?: IncidentReportViewContext[];
  onOpenJob?: (requestId: string) => void;
}

const SEVERITY_TONE: Record<OpsIncident['severity'], 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
  low: 'default',
  medium: 'warning',
  high: 'warning',
  critical: 'danger',
};

export function StaffIncidentsPanel({
  incidents,
  incidentDetails = [],
  onOpenJob,
}: StaffIncidentsPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedIncident = selectedId ? incidents.find((inc) => inc.id === selectedId) ?? null : null;
  const selectedDetail = selectedId ? incidentDetails.find((d) => d.id === selectedId) ?? null : null;

  if (selectedIncident && selectedDetail) {
    return (
      <div className="animate-fade-in -mx-4 sm:-mx-5 app-full-page-detail">
        <AppSubScreenHeader
          title={selectedIncident.location}
          onBack={() => setSelectedId(null)}
          backLabel="Incidents"
        />
        <div className="pb-8 space-y-4">
          <IncidentReportDetailView report={selectedDetail} compact />
          {onOpenJob && (
            <button
              type="button"
              onClick={() => onOpenJob(selectedIncident.requestId)}
              className="app-button-outline app-btn-sm"
            >
              Open job
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in -mx-4 sm:-mx-5">
      {incidents.length === 0 ? (
        <div className="app-empty-state">
          <div className="app-empty-state-icon">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="app-empty-state-title">No incidents on file</p>
          <p className="app-empty-state-body">Incident reports submitted during active shifts will appear here.</p>
        </div>
      ) : (
        <AppList>
          {incidents.map((inc) => {
            const detail = incidentDetails.find((d) => d.id === inc.id);
            return (
              <button
                key={inc.id}
                type="button"
                onClick={() => detail && setSelectedId(inc.id)}
                disabled={!detail}
                className="app-list-row app-list-row-align-top flex-col !items-stretch gap-2 text-left w-full disabled:opacity-60"
              >
                <p className="font-semibold text-sm">{inc.location}</p>
                {inc.locationOnSite && (
                  <p className="text-xs text-brand-text-muted">On site: {inc.locationOnSite}</p>
                )}
                <p className="text-sm text-brand-text-muted">
                  Guard: {inc.guardName} · Client: {inc.clientName}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {inc.incidentType && <WfBadge tone="primary">{inc.incidentType}</WfBadge>}
                  <WfBadge tone={SEVERITY_TONE[inc.severity]}>{inc.severity} severity</WfBadge>
                  <WfBadge tone={inc.status === 'open' ? 'warning' : 'default'}>
                    {inc.status === 'open' ? 'Active job' : 'Job completed'}
                  </WfBadge>
                  <span className="text-xs text-brand-text-muted">
                    Filed {new Date(inc.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-brand-text-muted leading-relaxed line-clamp-2">{inc.description}</p>
                {detail && (
                  <span className="text-xs font-semibold text-brand-primary">View full report</span>
                )}
              </button>
            );
          })}
        </AppList>
      )}
    </div>
  );
}
