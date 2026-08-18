import React, { useMemo, useState } from 'react';
import { ClientReportCard } from '../../lib/clientCoverage';
import { IncidentReportViewContext } from '../../lib/incidentReports';
import { IncidentReportDetailView } from '../reports/IncidentReportDetailView';
import { AppEmptyState, AppList, AppListRow, AppScreen, AppSubScreenHeader } from '../ui/app/AppPrimitives';
import { ListDetailLayout } from '../ui/app/ListDetailLayout';
import { StaffListFilterTabs } from '../staff/StaffListFilterTabs';
import { WfBadge, WfListCard } from '../ui/wireframe';
import { ChevronRight, FileText } from 'lucide-react';
import { useLayoutFormFactor } from '../../surfaces';
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
  const formFactor = useLayoutFormFactor();
  const [tabletTab, setTabletTab] = useState<'reports' | 'invoices'>('reports');
  const [tabletReportId, setTabletReportId] = useState<string | null>(null);
  const selectedIncident = selectedIncidentId
    ? incidentDetails.find((d) => d.id === selectedIncidentId) ?? null
    : null;
  const selectedReportId = useMemo(() => {
    if (tabletReportId && reports.some((report) => report.id === tabletReportId)) {
      return tabletReportId;
    }
    if (!selectedIncidentId) return null;
    return reports.find((report) => report.incidentId === selectedIncidentId)?.id ?? null;
  }, [reports, selectedIncidentId, tabletReportId]);

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

  if (formFactor === 'tablet') {
    return (
      <AppScreen className="h-full min-h-0 sft-reports">
        {client ? (
          <StaffListFilterTabs
            aria-label="Reports and invoices"
            activeId={tabletTab}
            onChange={(id) => setTabletTab(id as 'reports' | 'invoices')}
            tabs={[
              { id: 'reports', label: `Reports (${reports.length})` },
              { id: 'invoices', label: 'Invoices' },
            ]}
          />
        ) : null}
        {tabletTab === 'invoices' && client ? (
          <div className="sft-reports-invoices min-h-0 flex-1 overflow-y-auto">
            <ClientInvoicePanel client={client} requests={requests} />
          </div>
        ) : reports.length === 0 ? (
          <AppEmptyState icon={<FileText className="w-5 h-5" />} title="No reports yet">
            Activity logs and incident reports from completed jobs will appear here.
          </AppEmptyState>
        ) : (
          <ListDetailLayout
            items={reports}
            selectedId={selectedReportId}
            onSelectId={(id) => {
              setTabletReportId(id);
              const report = reports.find((item) => item.id === id);
              if (report?.type === 'incident' && report.incidentId) {
                onSelectIncident(report.incidentId);
                return;
              }
              onSelectIncident(null);
            }}
            getItemId={(report) => report.id}
            autoSelectFirst
            mobilePresentation="page"
            emptyDetail={
              <div className="sft-empty">
                <p className="sft-empty-title">Select a report</p>
                <p className="sft-empty-message">Choose a report from the list to read the full record.</p>
              </div>
            }
            renderItem={(report, isSelected, onSelect) => {
              const meta = REPORT_META[report.type];
              return (
                <WfListCard
                  title={report.title}
                  subtitle={report.siteName}
                  meta={
                    <div className="flex flex-col items-start gap-1.5 w-full">
                      <WfBadge tone={meta.tone}>
                        {meta.emoji} {meta.label}
                      </WfBadge>
                      <span className="text-[11px] text-brand-text-muted">
                        {new Date(report.submittedAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  }
                  onClick={onSelect}
                  className={isSelected ? 'app-item-card-selected' : ''}
                />
              );
            }}
            renderDetail={(report) => {
              const incident =
                report.type === 'incident' && report.incidentId
                  ? incidentDetails.find((detail) => detail.id === report.incidentId) ?? null
                  : null;
              if (incident) {
                return <IncidentReportDetailView report={incident} />;
              }
              const meta = REPORT_META[report.type];
              return (
                <div className="sft-report-summary space-y-4">
                  <div>
                    <WfBadge tone={meta.tone}>
                      {meta.emoji} {meta.label}
                    </WfBadge>
                    <h2 className="text-xl font-bold mt-3">{report.title}</h2>
                    <p className="text-sm text-brand-text-muted mt-1">{report.siteName}</p>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{report.summary}</p>
                  <p className="text-xs text-brand-text-muted">
                    {new Date(report.submittedAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              );
            }}
          />
        )}
      </AppScreen>
    );
  }

  if (selectedIncident) {
    return (
      <AppScreen className="app-full-page-detail pb-8">
        <AppSubScreenHeader title="Incident report" onBack={() => onSelectIncident(null)} backLabel="Reports" />
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
