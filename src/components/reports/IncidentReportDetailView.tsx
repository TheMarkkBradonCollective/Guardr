import React from 'react';
import { WfBadge } from '../ui/wireframe';
import {
  incidentCategoryLabel,
  incidentPriorityLabel,
  incidentPriorityTone,
  IncidentReportViewContext,
} from '../../lib/incidentReports';

interface IncidentReportDetailViewProps {
  report: IncidentReportViewContext;
  compact?: boolean;
}

function DetailRow({ label, value }: { label: string; value?: string | boolean }) {
  if (value === undefined || value === '' || value === false) return null;
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-semibold text-brand-text-muted uppercase tracking-wide">{label}</p>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{display}</p>
    </div>
  );
}

function formatWhen(iso?: string): string {
  if (!iso) return 'Not recorded';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function IncidentReportDetailView({ report, compact = false }: IncidentReportDetailViewProps) {
  const { detail, jobTitle, siteName, jobLocation, clientName, guardName } = report;

  return (
    <div className={`space-y-4 ${compact ? '' : 'pb-2'}`}>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <WfBadge tone="danger">Incident report</WfBadge>
          <WfBadge tone={incidentPriorityTone(detail.priority)}>
            {incidentPriorityLabel(detail.priority)} priority
          </WfBadge>
          <WfBadge tone="primary">{incidentCategoryLabel(detail.incidentType)}</WfBadge>
        </div>
        {!compact && (
          <>
            <p className="font-semibold text-base">{jobTitle}</p>
            <p className="text-sm text-brand-text-muted">{siteName}</p>
          </>
        )}
      </div>

      <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        <DetailRow label="Who — reporting guard" value={guardName} />
        <DetailRow label="Who — client" value={clientName} />
        <DetailRow label="When — occurred" value={formatWhen(detail.occurredAt)} />
        <DetailRow label="When — submitted" value={formatWhen(detail.submittedAt)} />
        <DetailRow
          label="Where — site"
          value={detail.locationOnSite ? `${jobLocation} · ${detail.locationOnSite}` : jobLocation}
        />
      </div>

      <div className="space-y-3 rounded-xl border border-red-500/25 bg-red-500/5 p-4">
        <DetailRow label="What happened" value={detail.description} />
        <DetailRow label="Who was involved" value={detail.partiesInvolved} />
        <DetailRow label="Witnesses" value={detail.witnesses} />
        <DetailRow label="Why / contributing factors" value={detail.causeOrTrigger} />
        <DetailRow label="How — actions taken" value={detail.actionsTaken} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DetailRow
          label="Authorities notified"
          value={
            detail.authoritiesNotified
              ? detail.authorityDetails
                ? `Yes — ${detail.authorityDetails}`
                : 'Yes'
              : undefined
          }
        />
        <DetailRow label="Evidence" value={detail.evidenceNotes} />
        {detail.injuryInvolved && (
          <DetailRow label="Injuries" value={detail.injuryDetails ?? 'Injury reported — see narrative'} />
        )}
        {detail.propertyDamageInvolved && (
          <DetailRow
            label="Property damage"
            value={detail.propertyDamageDetails ?? 'Property damage reported — see narrative'}
          />
        )}
        {detail.followUpRequired && (
          <DetailRow label="Follow-up required" value={detail.followUpNotes ?? 'Yes — follow-up needed'} />
        )}
      </div>
    </div>
  );
}
