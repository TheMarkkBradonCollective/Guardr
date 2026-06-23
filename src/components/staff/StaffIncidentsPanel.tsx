import React, { useState } from 'react';
import { OpsIncident } from '../../lib/staffOps';
import { IncidentReportViewContext } from '../../lib/incidentReports';
import { IncidentReportDetailView } from '../reports/IncidentReportDetailView';
import { WfBadge } from '../ui/wireframe';
import { AppList } from '../ui/app/AppPrimitives';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="animate-fade-in -mx-4 sm:-mx-5">
      <p className="text-sm text-brand-text-muted px-4 sm:px-5 pb-4 max-w-2xl">
        Incident reports are filed by guards during active shifts and at checkout. Each report includes who,
        what, when, where, why, and how the guard responded — shared with the client for review.
      </p>

      {incidents.length === 0 ? (
        <p className="staff-empty-state border-t border-brand-border">No incident reports on file.</p>
      ) : (
        <AppList>
          {incidents.map((inc) => {
            const detail = incidentDetails.find((d) => d.id === inc.id);
            const expanded = expandedId === inc.id;
            return (
              <div key={inc.id} className="app-list-row app-list-row-align-top flex-col !items-stretch gap-2">
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
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : inc.id)}
                    className="app-button-outline app-btn-sm gap-1.5 self-start"
                  >
                    {expanded ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" /> Hide full report
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" /> View full report
                      </>
                    )}
                  </button>
                )}

                {expanded && detail && (
                  <div className="mt-1 rounded-xl border border-brand-border bg-brand-bg-sec/40 p-4">
                    <IncidentReportDetailView report={detail} compact />
                  </div>
                )}

                {onOpenJob && (
                  <button
                    type="button"
                    onClick={() => onOpenJob(inc.requestId)}
                    className="mt-1 app-button-outline app-btn-sm"
                  >
                    Open job
                  </button>
                )}
              </div>
            );
          })}
        </AppList>
      )}
    </div>
  );
}
