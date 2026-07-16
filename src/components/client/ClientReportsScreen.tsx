import React from 'react';
import { ClientReportCard } from '../../lib/clientCoverage';
import { IncidentReportViewContext } from '../../lib/incidentReports';
import { IncidentReportDetailView } from '../reports/IncidentReportDetailView';
import { AppEmptyState, AppList, AppListRow, AppScreen, AppSubScreenHeader } from '../ui/app/AppPrimitives';
import { WfBadge } from '../ui/wireframe';
import { ChevronRight, FileText } from 'lucide-react';
import { useDevice } from '../../lib/platform';
import { ClientReportsDesktop } from './ClientReportsDesktop';
import { ClientInvoicePanel } from './ClientInvoicePanel';
import type { Client, SecurityRequest } from '../../types';

interface ClientReportsScreenProps {
  reports: ClientReportCard[];
  incidentDetails: IncidentReportViewContext[];
  selectedIncidentId: string | null;
  onSelectIncident: (incidentId: string | null) => void;
  onBack: () => void;
  client?: Client;
  requests?: SecurityRequest[];
}

const REPORT_META: Record<ClientReportCard['type'], { emoji: string; label: string; tone: 'default' | 'primary' | 'success' | 'warning' | 'danger' }> = {
  incident: { emoji: '🚨', label: 'Incident Report', tone: 'danger' },
  activity: { emoji: '📝', label: 'Activity Report', tone: 'primary' },
  property: { emoji: '🏗️', label: 'Property Report', tone: 'warning' },
};

export function ClientReportsScreen({
  reports,
  incidentDetails,
  selectedIncidentId,
  onSelectIncident,
  onBack,
  client,
  requests = [],
}: ClientReportsScreenProps) {
  const { formFactor } = useDevice();
  const selectedIncident = selectedIncidentId
    ? incidentDetails.find((d) => d.id === selectedIncidentId) ?? null
    : null;

  if (formFactor === 'desktop' && client) {
    return (
      <ClientReportsDesktop
        reports={reports}
        incidentDetails={incidentDetails}
        selectedIncidentId={selectedIncidentId}
        onSelectIncident={onSelectIncident}
        client={client}
        requests={requests}
      />
    );
  }

  if (selectedIncident) {
    return (
      <AppScreen className="app-full-page-detail pb-8">
        <AppSubScreenHeader title="Incident report" onBack={() => onSelectIncident(null)} />
        <div className="px-5">
          <IncidentReportDetailView report={selectedIncident} />
        </div>
      </AppScreen>
    );
  }

  return (
    <>
      <AppScreen className="pb-8">
        {reports.length === 0 ? (
          <AppEmptyState
            icon={<FileText className="w-5 h-5" />}
            title="No reports yet"
          >
            Activity logs and incident reports from completed jobs will appear here.
          </AppEmptyState>
        ) : (
          <AppList>
            {reports.map((report) => {
              const meta = REPORT_META[report.type];
              const isIncident = report.type === 'incident' && report.incidentId;
              return (
                <AppListRow
                  key={report.id}
                  onClick={isIncident ? () => onSelectIncident(report.incidentId!) : undefined}
                  className="app-list-row-align-top flex-col !items-stretch gap-2"
                >
                  <div className="flex items-start justify-between gap-2 w-full">
                    <p className="font-semibold text-sm">{report.title}</p>
                    {isIncident && <ChevronRight className="w-4 h-4 text-brand-text-muted shrink-0 mt-0.5" />}
                  </div>
                  <p className="text-sm text-brand-text-muted">{report.siteName}</p>
                  <WfBadge tone={meta.tone}>{meta.emoji} {meta.label}</WfBadge>
                  <p className="text-sm text-brand-text-muted leading-relaxed line-clamp-3">{report.summary}</p>
                  <p className="text-xs text-brand-text-muted">
                    {new Date(report.submittedAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </AppListRow>
              );
            })}
          </AppList>
        )}
      </AppScreen>
      {client ? (
        <div className="px-4 pb-8">
          <ClientInvoicePanel client={client} requests={requests} />
        </div>
      ) : null}
    </>
  );
}
