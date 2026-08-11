import React, { useEffect, useState } from 'react';
import { ClientReportCard } from '../../lib/clientCoverage';
import { IncidentReportViewContext } from '../../lib/incidentReports';
import { IncidentReportDetailView } from '../reports/IncidentReportDetailView';
import { ClientInvoicePanel } from './ClientInvoicePanel';
import type { Client, SecurityRequest } from '../../types';
import { FileText } from 'lucide-react';
import { StatusChip, type StatusTone } from '../baseui/StatusChip';
import { GuardrDataTable, type GuardrTableColumn } from '../baseui/GuardrDataTable';
import {
  WorkbenchEmpty,
  WorkbenchPage,
  WorkbenchPanel,
  WorkbenchSplit,
  WorkbenchTabBar,
} from '../baseui/layout/WorkbenchLayout';

const REPORT_META: Record<
  ClientReportCard['type'],
  { emoji: string; label: string; tone: string; chip: StatusTone }
> = {
  incident: { emoji: '🚨', label: 'Incident Report', tone: 'danger', chip: 'negative' },
  activity: { emoji: '📝', label: 'Activity Report', tone: 'neutral', chip: 'neutral' },
  property: { emoji: '🏗️', label: 'Property Report', tone: 'warn', chip: 'warning' },
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

  const reportColumns: GuardrTableColumn<ClientReportCard>[] = [
    {
      id: 'report',
      header: 'Report',
      grow: true,
      sortValue: (report) => report.title.toLowerCase(),
      render: (report) => (
        <>
          <p className="uber-workbench-table-primary">{report.title}</p>
          <p className="uber-workbench-table-secondary">{report.summary.slice(0, 80)}…</p>
        </>
      ),
    },
    {
      id: 'site',
      header: 'Site',
      sortValue: (report) => report.siteName,
      render: (report) => report.siteName,
    },
    {
      id: 'type',
      header: 'Type',
      sortValue: (report) => report.type,
      render: (report) => (
        <StatusChip tone={REPORT_META[report.type].chip}>
          {REPORT_META[report.type].label}
        </StatusChip>
      ),
    },
  ];

  return (
    <WorkbenchPage className="adm-reports-workbench">
      <WorkbenchTabBar<ReportsTab>
        items={[
          { id: 'reports', label: `Reports (${reports.length})` },
          { id: 'invoices', label: 'Invoices' },
        ]}
        activeId={tab}
        onSelect={setTab}
      />

      {tab === 'invoices' ? (
        <WorkbenchPanel>
          <ClientInvoicePanel client={client} requests={requests} desktop />
        </WorkbenchPanel>
      ) : (
        <WorkbenchPanel padding={false}>
        <WorkbenchSplit
          list={
            reports.length === 0 ? (
              <WorkbenchEmpty icon={FileText} message="No reports yet" />
            ) : (
              <GuardrDataTable
                columns={reportColumns}
                rows={reports}
                rowKey={(report) => report.id}
                selectedKey={reports.find((r) => r.incidentId === selectedIncidentId)?.id}
                onRowClick={(report) => {
                  if (report.type === 'incident' && report.incidentId) {
                    onSelectIncident(report.incidentId);
                  }
                }}
                caption="Reports"
                cardLayout={{ title: 'report', subtitle: 'site', trailing: 'type' }}
              />
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
        </WorkbenchPanel>
      )}
    </WorkbenchPage>
  );
}
