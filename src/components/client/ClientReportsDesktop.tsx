import React, { useEffect, useState } from 'react';
import { ClientReportCard } from '../../lib/clientCoverage';
import { IncidentReportViewContext } from '../../lib/incidentReports';
import { IncidentReportDetailView } from '../reports/IncidentReportDetailView';
import { ClientInvoicePanel } from './ClientInvoicePanel';
import type { Client, SecurityRequest } from '../../types';
import { FileText } from 'lucide-react';
import {
  WorkbenchEmpty,
  WorkbenchPage,
  WorkbenchSplit,
  WorkbenchTabBar,
  WorkbenchToolbar,
} from '../baseui/layout/WorkbenchLayout';

const REPORT_META: Record<ClientReportCard['type'], { emoji: string; label: string; tone: string }> = {
  incident: { emoji: '🚨', label: 'Incident Report', tone: 'danger' },
  activity: { emoji: '📝', label: 'Activity Report', tone: 'neutral' },
  property: { emoji: '🏗️', label: 'Property Report', tone: 'warn' },
};

type ReportsTab = 'reports' | 'invoices';

interface ClientReportsDesktopProps {
  reports: ClientReportCard[];
  incidentDetails: IncidentReportViewContext[];
  selectedIncidentId: string | null;
  onSelectIncident: (incidentId: string | null) => void;
  client: Client;
  requests: SecurityRequest[];
}

export function ClientReportsDesktop({
  reports,
  incidentDetails,
  selectedIncidentId,
  onSelectIncident,
  client,
  requests,
}: ClientReportsDesktopProps) {
  const [tab, setTab] = useState<ReportsTab>('reports');
  const selectedIncident = selectedIncidentId
    ? incidentDetails.find((d) => d.id === selectedIncidentId) ?? null
    : null;

  useEffect(() => {
    if (tab !== 'reports') return;
    if (!selectedIncidentId && reports.length > 0) {
      const firstIncident = reports.find((r) => r.type === 'incident' && r.incidentId);
      if (firstIncident?.incidentId) onSelectIncident(firstIncident.incidentId);
    }
  }, [reports.length, tab, selectedIncidentId, onSelectIncident, reports]);

  return (
    <WorkbenchPage className="adm-reports-workbench">
      <WorkbenchToolbar
        eyebrow="Coverage"
        subtitle="Activity logs, incident reports, and invoices from your jobs."
        actions={
          <WorkbenchTabBar<ReportsTab>
            items={[
              { id: 'reports', label: `Reports (${reports.length})` },
              { id: 'invoices', label: 'Invoices' },
            ]}
            activeId={tab}
            onSelect={setTab}
          />
        }
      />

      {tab === 'invoices' ? (
        <div className="adm-reports-invoices p-4">
          <ClientInvoicePanel client={client} requests={requests} desktop />
        </div>
      ) : (
        <WorkbenchSplit
          list={
            reports.length === 0 ? (
              <WorkbenchEmpty icon={FileText} message="No reports yet" />
            ) : (
              <table className="uber-workbench-table">
                <thead>
                  <tr>
                    <th>Report</th>
                    <th>Site</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => {
                    const meta = REPORT_META[report.type];
                    const isIncident = report.type === 'incident' && report.incidentId;
                    return (
                      <tr
                        key={report.id}
                        className={`uber-workbench-table-row${
                          isIncident && selectedIncidentId === report.incidentId ? ' uber-workbench-table-row--selected' : ''
                        }`}
                        onClick={isIncident ? () => onSelectIncident(report.incidentId!) : undefined}
                      >
                        <td>
                          <p className="uber-workbench-table-primary">{report.title}</p>
                          <p className="uber-workbench-table-secondary">{report.summary.slice(0, 80)}…</p>
                        </td>
                        <td className="uber-workbench-table-secondary">{report.siteName}</td>
                        <td>
                          <span className={`adm-pill adm-pill--${meta.tone}`}>
                            {meta.emoji} {meta.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          }
          detail={
            selectedIncident ? (
              <IncidentReportDetailView report={selectedIncident} />
            ) : (
              <WorkbenchEmpty icon={FileText} message="Select an incident report to view details" variant="detail" />
            )
          }
        />
      )}
    </WorkbenchPage>
  );
}
