import React from 'react';
import { FileText } from 'lucide-react';
import type { JobServiceAgreement } from '../../types';

interface JobServiceAgreementCardProps {
  agreement: JobServiceAgreement;
  className?: string;
}

export function JobServiceAgreementCard({ agreement, className = '' }: JobServiceAgreementCardProps) {
  return (
    <section
      className={`rounded-xl border border-brand-border bg-brand-surface-elevated/60 p-4 space-y-3 ${className}`.trim()}
    >
      <div className="flex items-start gap-2">
        <FileText className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold">Per-job service agreement</h3>
          <p className="text-xs text-brand-text-muted mt-1">
            Direct arrangement between {agreement.clientName} and {agreement.guardName} — Guardr is
            not the security services provider.
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-brand-text-muted">
        <div>
          <dt className="font-medium text-brand-text">Guard pay</dt>
          <dd>${agreement.guardPayPerHour.toFixed(2)}/hr</dd>
        </div>
        <div>
          <dt className="font-medium text-brand-text">Duration</dt>
          <dd>{agreement.durationHours} hr</dd>
        </div>
        <div className="col-span-2">
          <dt className="font-medium text-brand-text">Generated</dt>
          <dd>{new Date(agreement.generatedAt).toLocaleString()}</dd>
        </div>
      </dl>
      <pre className="text-xs whitespace-pre-wrap leading-relaxed text-brand-text-muted max-h-48 overflow-y-auto border border-brand-border/60 bg-brand-bg/50 p-3 rounded-lg">
        {agreement.body}
      </pre>
    </section>
  );
}
