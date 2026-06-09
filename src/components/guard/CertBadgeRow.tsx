import React from 'react';
import { SecurityGuard } from '../../types';
import { getVerifiedProfileBadges } from '../../lib/certMatching';
import { getCertCatalogEntry } from '../../lib/certCatalog';
import {
  CORE_BIS_TRAINING_COURSE_IDS,
  getQualificationProgress,
  guardHasCredentialOnFile,
  guardHasGuardrVerifiedCredential,
  LEVEL_2_REQUIRED_IDS,
  QUALIFICATION_LEVEL_LABELS,
} from '../../lib/guardQualification';
import { getVerifiedLicensedStates } from '../../lib/guardLicenses';
import { formatStateName } from '../../lib/states';
import { Check, Shield } from 'lucide-react';

interface CertBadgeRowProps {
  guard: SecurityGuard;
  showCaBaseline?: boolean;
  jobState?: string;
}

export function CertBadgeRow({ guard, showCaBaseline = true, jobState = 'CA' }: CertBadgeRowProps) {
  const badges = getVerifiedProfileBadges(guard);
  const licensedStates = getVerifiedLicensedStates(guard);
  const progress = getQualificationProgress(guard, jobState);

  const requiredRows = [
    { id: 'bsis-guard-card', label: 'Guard Card', onFile: progress.guardCard, verified: progress.guardCardVerified },
    ...LEVEL_2_REQUIRED_IDS.map((id) => ({
      id,
      label: getCertCatalogEntry(id)?.shortLabel ?? id,
      onFile: guardHasCredentialOnFile(guard, id),
      verified: guardHasGuardrVerifiedCredential(guard, id),
    })),
    {
      id: 'bsis-40-hour',
      label: '40-Hr BSIS',
      onFile: progress.fortyHourRollup || progress.coreTrainingComplete,
      verified: guardHasGuardrVerifiedCredential(guard, 'bsis-40-hour-completed'),
    },
  ];

  if (progress.level === 'none' && licensedStates.length === 0 && badges.length === 0 && !showCaBaseline) {
    return null;
  }

  return (
    <div className="space-y-3">
      {progress.level !== 'none' && (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary bg-brand-primary/15 border border-brand-primary/30 px-2.5 py-1 rounded-full">
          <Shield className="w-3.5 h-3.5" />
          {QUALIFICATION_LEVEL_LABELS[progress.level]}
        </span>
      )}

      {licensedStates.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary bg-brand-primary/15 border border-brand-primary/30 px-2.5 py-1 rounded-full">
            <Shield className="w-3.5 h-3.5" />
            Guard Card verified · {licensedStates.map(formatStateName).join(', ')}
          </span>
        </div>
      )}

      {showCaBaseline && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted mb-2">Required to work</p>
          <div className="flex flex-wrap gap-1.5">
            {requiredRows.map(({ id, label, onFile, verified }) => (
              <span
                key={id}
                className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${
                  onFile
                    ? verified
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-brand-primary/15 text-brand-primary border-brand-primary/30'
                    : 'bg-brand-border/20 text-brand-text-muted border-brand-border'
                }`}
              >
                {onFile && <Check className="w-3 h-3" />}
                {label}
                {onFile && verified ? ' ✓' : onFile ? ' (on file)' : ''}
              </span>
            ))}
          </div>
          {progress.level === 'pending' && !progress.coreTrainingComplete && !progress.fortyHourRollup && (
            <p className="text-[10px] text-brand-text-muted mt-2">
              {progress.uploadedTrainingCount} of {CORE_BIS_TRAINING_COURSE_IDS.length} core BSIS courses on file
            </p>
          )}
        </div>
      )}

      {badges.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted mb-2">Additional qualifications</p>
          <div className="flex flex-wrap gap-1.5">
            {badges.map(({ catalogId, shortLabel }) => (
              <span
                key={catalogId}
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {shortLabel} · Guardr verified
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
