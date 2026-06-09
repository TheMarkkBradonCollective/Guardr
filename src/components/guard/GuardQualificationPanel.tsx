import React from 'react';
import { SecurityGuard } from '../../types';
import {
  CORE_BIS_TRAINING_COURSE_IDS,
  getQualificationProgress,
  guardHasCredentialOnFile,
  guardHasGuardrVerifiedCredential,
  QUALIFICATION_LEVEL_DESCRIPTIONS,
  QUALIFICATION_LEVEL_LABELS,
} from '../../lib/guardQualification';
import { getCertCatalogEntry } from '../../lib/certCatalog';
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

  const rows = [
    { label: 'BSIS Guard Card (valid)', met: progress.guardCard, verified: progress.guardCardVerified },
    { label: 'Power to Arrest (8 hr)', met: progress.powerToArrest },
    { label: 'Appropriate Use of Force (8 hr)', met: progress.useOfForce },
    {
      label: '40-hour BSIS training',
      met: progress.fortyHourRollup || progress.coreTrainingComplete,
      detail: progress.fortyHourRollup
        ? 'Completion certificate on file'
        : `${progress.uploadedTrainingCount} / ${CORE_BIS_TRAINING_COURSE_IDS.length} core courses`,
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
            <span className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold ${row.met ? 'text-brand-primary' : 'text-brand-text-muted'}`}>
              {row.met ? <Check className="w-3.5 h-3.5" /> : '—'}
              {row.met && row.verified ? ' · Verified' : row.met ? ' · On file' : ''}
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
      {OPTIONAL_BADGES(guard).map((badge) => (
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

function OPTIONAL_BADGES(guard: SecurityGuard) {
  const ids = ['bsis-exposed-firearm', 'bsis-baton', 'bsis-chemical-agent', 'cpr', 'first-aid'] as const;

  return ids
    .filter((id) => guardHasCredentialOnFile(guard, id))
    .map((id) => ({
      id,
      label: getCertCatalogEntry(id)?.shortLabel ?? id,
      verified: guardHasGuardrVerifiedCredential(guard, id),
    }));
}
