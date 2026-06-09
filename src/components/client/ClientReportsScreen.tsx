import React from 'react';
import { ClientReportCard } from '../../lib/clientCoverage';
import { AppList, AppListRow } from '../ui/app/AppPrimitives';
import { WfBadge } from '../ui/wireframe';
import { ArrowLeft } from 'lucide-react';

interface ClientReportsScreenProps {
  reports: ClientReportCard[];
  onBack: () => void;
}

const REPORT_META: Record<ClientReportCard['type'], { emoji: string; label: string; tone: 'default' | 'primary' | 'success' | 'warning' | 'danger' }> = {
  incident: { emoji: '🚨', label: 'Incident Report', tone: 'danger' },
  activity: { emoji: '📝', label: 'Activity Report', tone: 'primary' },
  property: { emoji: '🏗️', label: 'Property Report', tone: 'warning' },
};

export function ClientReportsScreen({ reports, onBack }: ClientReportsScreenProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-8">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-brand-surface" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Reports</h1>
      </div>

      {reports.length === 0 ? (
        <p className="app-empty-state text-sm">
          No reports yet. Completed shifts with activity logs and incident reports appear here.
        </p>
      ) : (
        <AppList>
          {reports.map((report) => {
            const meta = REPORT_META[report.type];
            return (
              <AppListRow key={report.id} className="app-list-row-align-top flex-col !items-stretch gap-2">
                <p className="font-semibold text-sm">{report.title}</p>
                <p className="text-sm text-brand-text-muted">{report.siteName}</p>
                <WfBadge tone={meta.tone}>{meta.emoji} {meta.label}</WfBadge>
                <p className="text-sm text-brand-text-muted leading-relaxed">{report.summary}</p>
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
    </div>
  );
}
