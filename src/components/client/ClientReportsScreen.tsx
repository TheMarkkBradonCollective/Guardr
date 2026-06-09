import React from 'react';
import { ClientReportCard } from '../../lib/clientCoverage';
import { WfBadge, WfListCard } from '../ui/wireframe';
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
        <div className="wf-list-card justify-center py-10 text-sm text-brand-text-muted">
          No reports yet. Completed shifts with activity logs and incident reports appear here.
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const meta = REPORT_META[report.type];
            return (
              <WfListCard
                key={report.id}
                title={report.title}
                subtitle={report.siteName}
                meta={
                  <div className="space-y-2">
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
                  </div>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
