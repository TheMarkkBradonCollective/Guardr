import React from 'react';
import { SecurityGuard } from '../../types';
import {
  getQualificationProgress,
  QUALIFICATION_LEVEL_DESCRIPTIONS,
  QUALIFICATION_LEVEL_LABELS,
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
    progress.level === 'active'
      ? 'border-brand-primary/40 bg-brand-primary/10 text-brand-primary'
      : progress.level === 'pending'
        ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
        : 'border-brand-border bg-brand-surface text-brand-text-muted';

  const ptaUofDetail = progress.ptaUofCombined
    ? 'Combined 8-hr certificate on file'
    : progress.legacyPta && progress.legacyUof
      ? 'Legacy separate PTA & UOF certs on file'
      : progress.legacyPta || progress.legacyUof
        ? 'Upload combined 8-hr PTA & UOF cert (or both legacy certs)'
        : undefined;

  const rows = [
    {
      label: 'BSIS Guard Card (valid)',
      met: progress.guardCard,
      expired: progress.guardCardExpired,
      verified: progress.guardCardVerified,
      detail: progress.guardCardExpired ? 'Guard card on file but expired — upload a valid card' : undefined,
    },
    {
      label: '8-Hour Power to Arrest & Appropriate Use of Force (2-part)',
      met: progress.ptaUofTraining,
      verified: progress.ptaUofCombinedVerified,
      detail: ptaUofDetail,
    },
    {
      label: '32-hour BSIS course block',
      met: progress.thirtyTwoHourBlockComplete,
      detail: progress.thirtyTwoHourRollup
        ? '32-hour completion certificate on file'
        : `${progress.uploaded32HourCount} / ${THIRTY_TWO_HOUR_COURSE_IDS.length} courses on file`,
    },
  ];

  return (
    <div className="app-card space-y-4 border-brand-primary/20 bg-brand-primary/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="uber-label flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-primary" />
            Work qualification
          </p>
          <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
            Upload required credentials to accept jobs. Guardr verification is a trust badge for clients — not required
            to reach each level.
          </p>
        </div>
        <span className={`shrink-0 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${levelBadge}`}>
          {progress.level === 'none'
            ? 'Not qualified'
            : QUALIFICATION_LEVEL_LABELS[progress.level]}
        </span>
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-3 text-sm">
            <div className="min-w-0">
              <p className={row.met ? 'text-brand-text' : 'text-brand-text-muted'}>{row.label}</p>
              {row.detail && <p className="text-xs text-brand-text-muted mt-0.5">{row.detail}</p>}
            </div>
            <span
              className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold ${
                row.expired ? 'text-amber-400' : row.met ? 'text-brand-primary' : 'text-brand-text-muted'
              }`}
            >
              {row.met ? <Check className="w-3.5 h-3.5" /> : row.expired ? '!' : '—'}
              {row.expired
                ? ' · On file · Expired'
                : row.met && row.verified
                  ? ' · Verified'
                  : row.met
                    ? ' · On file'
                    : ''}
            </span>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-brand-text-muted border-t border-brand-border pt-3">
        <strong>Level 1:</strong> {QUALIFICATION_LEVEL_DESCRIPTIONS.pending}.{' '}
        <strong>Level 2:</strong> {QUALIFICATION_LEVEL_DESCRIPTIONS.active}.
      </p>
    </div>
  );
}

export function QualificationBadgeList({ guard, state = 'CA' }: GuardQualificationPanelProps) {
  const progress = getQualificationProgress(guard, state);
  if (progress.level === 'none') return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border border-brand-primary/30 bg-brand-primary/10 text-brand-primary">
        {QUALIFICATION_LEVEL_LABELS[progress.level]}
      </span>
      {getSupplementalCredentialsOnFile(guard).map((badge) => (
        <span
          key={badge.id}
          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${
            badge.verified
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : 'bg-brand-border/20 text-brand-text-muted border-brand-border'
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
