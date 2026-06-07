import React from 'react';
import { ClientReportCard } from '../../lib/clientCoverage';
import { ArrowLeft } from 'lucide-react';

interface ClientReportsScreenProps {
  reports: ClientReportCard[];
  onBack: () => void;
}

const REPORT_META: Record<ClientReportCard['type'], { emoji: string; label: string }> = {
  incident: { emoji: '🚨', label: 'Incident Report' },
  activity: { emoji: '📝', label: 'Activity Report' },
  property: { emoji: '🏗️', label: 'Property Report' },
};

export function ClientReportsScreen({ reports, onBack }: ClientReportsScreenProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-8">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-brand-surface" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black">Reports</h1>
      </div>

      {reports.length === 0 ? (
        <div className="uber-card-flat rounded-2xl p-10 text-center text-sm text-brand-text-muted font-mono">
          No reports yet. Completed shifts with activity logs and incident reports appear here.
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const meta = REPORT_META[report.type];
            return (
              <div key={report.id} className="uber-card-flat rounded-xl p-5">
                <p className="text-[10px] font-mono uppercase tracking-wide text-brand-primary">
                  {meta.emoji} {meta.label}
                </p>
                <h3 className="font-black text-base mt-1">{report.title}</h3>
                <p className="text-xs font-mono text-brand-text-muted mt-1">{report.siteName}</p>
                <p className="text-sm text-brand-text-muted mt-3 leading-relaxed">{report.summary}</p>
                <p className="text-[10px] font-mono text-brand-text-muted mt-3">
                  {new Date(report.submittedAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
