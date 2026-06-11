import React from 'react';
import { SecurityGuard } from '../../types';
import {
  getQualificationProgress,
  GUARD_INACTIVE_DESCRIPTION,
  GUARD_PATHWAY_STATUS_DESCRIPTIONS,
  GUARD_STATUS_LABELS,
  GUARDR_RECOMMENDED_TRAINING_LABEL,
  PTA_UOF_UPLOAD_GUIDANCE,
  guardPathwayStatusLabel,
  THIRTY_TWO_HOUR_COURSE_IDS,
} from '../../lib/guardQualification';
import { getSupplementalCredentialsOnFile } from '../../lib/certMatching';
import { Check, Shield } from 'lucide-react';

interface GuardQualificationPanelProps {
  guard: SecurityGuard;
  state?: string;
}

export function GuardQualificationPanel({ guard, state = 'CA' }: GuardQualificationPanelProps) {
  const progress = getQualificationProgress(guard, state);

  const levelBadge =
    progress.level === 'none'
      ? 'text-brand-text-muted'
      : 'bg-brand-bg-sec text-brand-text';

  const ptaUofDetail = progress.ptaUofCombined
    ? 'Combined 8-hr certificate on file'
    : progress.legacyPta && progress.legacyUof
      ? 'Separate PTA & UOF certificates on file'
      : progress.legacyPta && progress.legacyWmd
        ? 'Separate PTA & WMD certificates on file'
        : PTA_UOF_UPLOAD_GUIDANCE;

  const rows = [
    {
      label: 'BSIS Guard Card (valid)',
      met: progress.guardCard,
      expired: progress.guardCardExpired,
      verified: progress.guardCardVerified,
      detail: progress.guardCardExpired ? 'Guard card on file but expired — upload a valid card' : undefined,
    },
    {
      label: `8-Hour Power to Arrest & Appropriate Use of Force (2-part) — ${GUARDR_RECOMMENDED_TRAINING_LABEL}`,
      met: progress.ptaUofTraining,
      verified: progress.ptaUofCombinedVerified,
      detail: ptaUofDetail,
    },
    {
      label: `32-hour BSIS course block — ${GUARDR_RECOMMENDED_TRAINING_LABEL}`,
      met: progress.thirtyTwoHourBlockComplete,
      verified: progress.thirtyTwoHourBlockVerified,
      detail: progress.thirtyTwoHourBlockVerified
        ? progress.thirtyTwoHourRollup
          ? '32-hour completion certificate verified'
          : `All ${THIRTY_TWO_HOUR_COURSE_IDS.length} courses verified`
        : progress.thirtyTwoHourRollup
          ? '32-hour completion certificate on file'
          : `${progress.uploaded32HourCount} / ${THIRTY_TWO_HOUR_COURSE_IDS.length} courses on file`,
    },
  ];

  return (
    <section className="app-form-section space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="uber-label flex items-center gap-2">
            <Shield className="w-4 h-4" strokeWidth={1.5} />
            Guard status
          </p>
          <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
            A valid BSIS Guard Card is required to accept jobs. 8-hour and 32-hour training are{' '}
            {GUARDR_RECOMMENDED_TRAINING_LABEL.toLowerCase()}. Guardr verification is a trust badge for clients.
          </p>
        </div>
        <span className={`shrink-0 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${levelBadge}`}>
          {guardPathwayStatusLabel(progress.level)}
        </span>
      </div>

      <div className="border-t border-brand-border">
        {rows.map((row) => (
          <div key={row.label} className="app-list-subrow flex items-start justify-between gap-3 text-sm">
            <div className="min-w-0">
              <p className={row.met ? 'text-brand-text' : 'text-brand-text-muted'}>{row.label}</p>
              {row.detail && <p className="text-xs text-brand-text-muted mt-0.5">{row.detail}</p>}
            </div>
            <span
              className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold ${
                row.expired ? 'text-amber-600' : row.met ? 'text-brand-text' : 'text-brand-text-muted'
              }`}
            >
              {row.met ? <Check className="w-3.5 h-3.5" /> : row.expired ? '!' : '—'}
              {row.expired
                ? ' · Expired'
                : row.met && row.verified
                  ? ' · Verified'
                  : row.met
                    ? ' · On file'
                    : ''}
            </span>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-brand-text-muted pt-1">
        <strong>{GUARD_STATUS_LABELS.inactive}:</strong> {GUARD_INACTIVE_DESCRIPTION}.{' '}
        <strong>{GUARD_STATUS_LABELS.active}:</strong> {GUARD_PATHWAY_STATUS_DESCRIPTIONS.pending}.
      </p>
    </section>
  );
}

export function QualificationBadgeList({ guard, state = 'CA' }: GuardQualificationPanelProps) {
  const progress = getQualificationProgress(guard, state);
  if (progress.level === 'none') return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-bg-sec text-brand-text">
        {guardPathwayStatusLabel(progress.level)}
      </span>
      {getSupplementalCredentialsOnFile(guard).map((badge) => (
        <span
          key={badge.id}
          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
            badge.verified ? 'text-brand-text' : 'text-brand-text-muted'
          }`}
        >
          {badge.verified && <Check className="w-3 h-3" />}
          {badge.label}
          {badge.verified ? '' : ' (on file)'}
        </span>
      ))}
    </div>
  );
}
