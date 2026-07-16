import React, { useEffect } from 'react';
import { ClientReportCard } from '../../lib/clientCoverage';
import { IncidentReportViewContext } from '../../lib/incidentReports';
import { IncidentReportDetailView } from '../reports/IncidentReportDetailView';
import { FileText } from 'lucide-react';

const REPORT_META: Record<ClientReportCard['type'], { emoji: string; label: string; tone: string }> = {
  incident: { emoji: '🚨', label: 'Incident Report', tone: 'danger' },
  activity: { emoji: '📝', label: 'Activity Report', tone: 'neutral' },
  property: { emoji: '🏗️', label: 'Property Report', tone: 'warn' },
};

interface ClientReportsDesktopProps {
  reports: ClientReportCard[];
  incidentDetails: IncidentReportViewContext[];
  selectedIncidentId: string | null;
  onSelectIncident: (incidentId: string | null) => void;
}

export function ClientReportsDesktop({
  reports,
  incidentDetails,
  selectedIncidentId,
  onSelectIncident,
}: ClientReportsDesktopProps) {
  const selectedIncident = selectedIncidentId
    ? incidentDetails.find((d) => d.id === selectedIncidentId) ?? null
    : null;

  useEffect(() => {
    if (!selectedIncidentId && reports.length > 0) {
      const firstIncident = reports.find((r) => r.type === 'incident' && r.incidentId);
      if (firstIncident?.incidentId) onSelectIncident(firstIncident.incidentId);
    }
  }, [reports.length]);

  return (
    <div className="adm-workbench">
      <div className="adm-workbench-toolbar">
        <div>
          <p className="adm-card-eyebrow">Coverage reports</p>
          <p className="adm-workbench-subtitle">Activity logs and incident reports from your jobs.</p>
        </div>
      </div>

      <div className="adm-workbench-split">
        <div className="adm-workbench-list">
          {reports.length === 0 ? (
            <div className="adm-empty">
              <FileText className="w-8 h-8 adm-muted-icon" />
              <p>No reports yet</p>
            </div>
          ) : (
            <table className="adm-table adm-table--list">
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
                      className={`adm-table-row--click${
                        isIncident && selectedIncidentId === report.incidentId ? ' adm-table-row--selected' : ''
                      }`}
                      onClick={isIncident ? () => onSelectIncident(report.incidentId!) : undefined}
                    >
                      <td>
                        <p className="adm-table-primary">{report.title}</p>
                        <p className="adm-table-secondary">{report.summary.slice(0, 80)}…</p>
                      </td>
                      <td className="adm-table-secondary">{report.siteName}</td>
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
          )}
        </div>

        <div className="adm-workbench-detail">
          {selectedIncident ? (
            <div className="adm-workbench-detail-inner">
              <IncidentReportDetailView report={selectedIncident} />
            </div>
          ) : (
            <div className="adm-empty adm-empty--detail">
              <FileText className="w-10 h-10 adm-muted-icon" />
              <p>Select an incident report to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
