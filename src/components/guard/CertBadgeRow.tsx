import React from 'react';
import { SecurityGuard } from '../../types';
import { getSupplementalCredentialsOnFile } from '../../lib/certMatching';
import { getQualificationProgress, guardPathwayStatusLabel } from '../../lib/guardQualification';
import { getVerifiedLicensedStates } from '../../lib/guardLicenses';
import { formatStateName } from '../../lib/states';
import { Check, Shield } from 'lucide-react';

interface CertBadgeRowProps {
  guard: SecurityGuard;
  showCaBaseline?: boolean;
  jobState?: string;
}

export function CertBadgeRow({ guard, showCaBaseline = true, jobState = 'CA' }: CertBadgeRowProps) {
  const supplemental = getSupplementalCredentialsOnFile(guard);
  const licensedStates = getVerifiedLicensedStates(guard);
  const progress = getQualificationProgress(guard, jobState);

  const requiredRows = [
    {
      id: 'bsis-guard-card',
      label: 'Guard Card',
      onFile: progress.guardCard,
      expired: progress.guardCardExpired,
      verified: progress.guardCardVerified,
    },
    {
      id: 'bsis-pta-uof',
      label: 'PTA & UOF (8 hr)',
      onFile: progress.ptaUofTraining,
      verified: progress.ptaUofCombinedVerified,
    },
    {
      id: 'bsis-32-hour',
      label: '32-Hr BSIS',
      onFile: progress.thirtyTwoHourBlockComplete,
      verified: false,
    },
  ];

  if (progress.level === 'none' && licensedStates.length === 0 && supplemental.length === 0 && !showCaBaseline) {
    return null;
  }

  return (
    <div className="space-y-3">
      {progress.level !== 'none' && (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary bg-brand-primary/15 border border-brand-primary/30 px-2.5 py-1 rounded-full">
          <Shield className="w-3.5 h-3.5" />
          {guardPathwayStatusLabel(progress.level)}
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
            {requiredRows.map(({ id, label, onFile, expired, verified }) => (
              <span
                key={id}
                className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${
                  expired
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : onFile
                      ? verified
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-brand-primary/15 text-brand-primary border-brand-primary/30'
                      : 'bg-brand-border/20 text-brand-text-muted border-brand-border'
                }`}
              >
                {(onFile || expired) && <Check className="w-3 h-3" />}
                {label}
                {expired ? ' (expired)' : onFile && verified ? ' ✓' : onFile ? ' (on file)' : ''}
              </span>
            ))}
          </div>
          {progress.level === 'pending' && progress.ptaUofTraining && !progress.thirtyTwoHourBlockComplete && (
            <p className="text-[10px] text-brand-text-muted mt-2">
              {progress.uploaded32HourCount} of {progress.total32HourCourses} courses in the 32-hour block on file
            </p>
          )}
        </div>
      )}

      {supplemental.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted mb-2">Additional qualifications</p>
          <div className="flex flex-wrap gap-1.5">
            {supplemental.map(({ id, label, verified }) => (
              <span
                key={id}
                className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${
                  verified
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-brand-primary/15 text-brand-primary border-brand-primary/30'
                }`}
              >
                {verified ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                {label}
                {verified ? ' · Guardr verified' : ' (on file)'}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
