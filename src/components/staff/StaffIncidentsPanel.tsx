import React, { useEffect, useState } from 'react';
import { OpsIncident } from '../../lib/staffOps';
import { IncidentReportViewContext } from '../../lib/incidentReports';
import { IncidentReportDetailView } from '../reports/IncidentReportDetailView';
import { WfBadge } from '../ui/wireframe';
import { AppList, AppSubScreenHeader } from '../ui/app/AppPrimitives';
import { AlertTriangle } from 'lucide-react';
import { StaffOpsPageShell } from './StaffOpsPageShell';
import { useDevice } from '../../lib/platform';
import { GuardrButton } from '../baseui/GuardrButton';
import { StatusChip, type StatusTone } from '../baseui/StatusChip';
import { GuardrDataTable, type GuardrTableColumn } from '../baseui/GuardrDataTable';
import {
  WorkbenchEmpty,
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

/** Severity climbs from neutral to negative the way Base Web tints escalating states. */
const SEVERITY_CHIP_TONE: Record<OpsIncident['severity'], StatusTone> = {
  low: 'neutral',
  medium: 'warning',
  high: 'warning',
  critical: 'negative',
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

  const incidentColumns: GuardrTableColumn<OpsIncident>[] = [
    {
      id: 'location',
      header: 'Location',
      grow: true,
      sortValue: (inc) => inc.location.toLowerCase(),
      render: (inc) => (
        <>
          <p className="uber-workbench-table-primary">{inc.location}</p>
          <p className="uber-workbench-table-secondary">{inc.guardName}</p>
        </>
      ),
    },
    {
      id: 'severity',
      header: 'Severity',
      sortValue: (inc) => inc.severity,
      render: (inc) => (
        <StatusChip tone={SEVERITY_CHIP_TONE[inc.severity]}>{inc.severity}</StatusChip>
      ),
    },
    {
      id: 'when',
      header: 'When',
      sortValue: (inc) => inc.timestamp,
      render: (inc) =>
        new Date(inc.timestamp).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
    },
  ];

  useEffect(() => {
    if (formFactor === 'desktop' && !selectedId && incidents.length > 0) {
      const first = incidents.find((inc) => incidentDetails.some((d) => d.id === inc.id));
      if (first) setSelectedId(first.id);
    }
  }, [formFactor, incidents.length]);

  if (formFactor === 'desktop') {
    return (
      <StaffOpsPageShell
        className="staff-mgmt-panel staff-roster-panel"
        toolbar={
          <WorkbenchToolbar eyebrow="Risk & compliance" subtitle="Incident reports from active shifts." />
        }
      >
        <WorkbenchSplit
          list={
            incidents.length === 0 ? (
              <WorkbenchEmpty icon={AlertTriangle} message="No incidents on file" />
            ) : (
              <GuardrDataTable
                columns={incidentColumns}
                rows={incidents}
                rowKey={(inc) => inc.id}
                selectedKey={selectedId ?? undefined}
                onRowClick={(inc) => setSelectedId(inc.id)}
                caption="Incidents"
                cardLayout={{ title: 'location', subtitle: 'when', trailing: 'severity' }}
              />
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
      </StaffOpsPageShell>
    );
  }

  if (selectedIncident && selectedDetail) {
    return (
      <div className="staff-ops-mobile-shell flex flex-col animate-fade-in min-w-0">
        <div className="app-full-page-detail min-w-0 max-w-full">
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
    <div className="staff-ops-mobile-shell flex flex-col animate-fade-in min-w-0">
      <div className="staff-ops-mobile-body min-w-0 max-w-full">
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
