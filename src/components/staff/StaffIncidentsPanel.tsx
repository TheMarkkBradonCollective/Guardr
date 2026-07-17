import React, { useEffect, useState } from 'react';
import { OpsIncident } from '../../lib/staffOps';
import { IncidentReportViewContext } from '../../lib/incidentReports';
import { IncidentReportDetailView } from '../reports/IncidentReportDetailView';
import { WfBadge } from '../ui/wireframe';
import { AppList, AppSubScreenHeader } from '../ui/app/AppPrimitives';
import { AlertTriangle } from 'lucide-react';
import { useDevice } from '../../lib/platform';
import { GuardrButton } from '../baseui/GuardrButton';
import {
  WorkbenchEmpty,
  WorkbenchPage,
  WorkbenchSplit,
  WorkbenchToolbar,
} from '../baseui/layout/WorkbenchLayout';

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
  const { formFactor } = useDevice();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedIncident = selectedId ? incidents.find((inc) => inc.id === selectedId) ?? null : null;
  const selectedDetail = selectedId ? incidentDetails.find((d) => d.id === selectedId) ?? null : null;

  useEffect(() => {
    if (formFactor === 'desktop' && !selectedId && incidents.length > 0) {
      const first = incidents.find((inc) => incidentDetails.some((d) => d.id === inc.id));
      if (first) setSelectedId(first.id);
    }
  }, [formFactor, incidents.length]);

  if (formFactor === 'desktop') {
    return (
      <WorkbenchPage>
        <WorkbenchToolbar eyebrow="Risk & compliance" subtitle="Incident reports from active shifts." />
        <WorkbenchSplit
          list={
            incidents.length === 0 ? (
              <WorkbenchEmpty icon={AlertTriangle} message="No incidents on file" />
            ) : (
              <table className="uber-workbench-table">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Severity</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc) => (
                    <tr
                      key={inc.id}
                      className={`uber-workbench-table-row${selectedId === inc.id ? ' uber-workbench-table-row--selected' : ''}`}
                      onClick={() => setSelectedId(inc.id)}
                    >
                      <td>
                        <p className="uber-workbench-table-primary">{inc.location}</p>
                        <p className="uber-workbench-table-secondary">{inc.guardName}</p>
                      </td>
                      <td>
                        <span className={`adm-pill adm-pill--${SEVERITY_TONE[inc.severity] === 'danger' ? 'danger' : 'warn'}`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="uber-workbench-table-secondary">
                        {new Date(inc.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
          detail={
            selectedIncident && selectedDetail ? (
              <div className="space-y-4">
                <h2 className="text-lg font-bold m-0">{selectedIncident.location}</h2>
                <IncidentReportDetailView report={selectedDetail} compact />
                {onOpenJob ? (
                  <GuardrButton kind="secondary" size="compact" onClick={() => onOpenJob(selectedIncident.requestId)}>
                    Open job
                  </GuardrButton>
                ) : null}
              </div>
            ) : (
              <WorkbenchEmpty icon={AlertTriangle} message="Select an incident to review details" variant="detail" />
            )
          }
        />
      </WorkbenchPage>
    );
  }

  if (selectedIncident && selectedDetail) {
    return (
      <div className="staff-ops-mobile-shell h-full min-h-0 flex flex-col animate-fade-in">
        <div className="-mx-4 sm:-mx-5 app-full-page-detail flex-1 min-h-0">
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
      </div>
    );
  }

  return (
    <div className="staff-ops-mobile-shell h-full min-h-0 flex flex-col animate-fade-in">
      <div className="staff-ops-mobile-body flex-1 min-h-0 overflow-y-auto overscroll-contain -mx-4 sm:-mx-5">
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
                <WfBadge tone={SEVERITY_TONE[inc.severity]}>{inc.severity}</WfBadge>
                <p className="text-xs text-brand-text-muted">
                  {inc.guardName} ·{' '}
                  {new Date(inc.timestamp).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </button>
            );
          })}
        </AppList>
      )}
      </div>
    </div>
  );
}
