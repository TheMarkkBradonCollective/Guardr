import React from 'react';
import { Briefcase } from 'lucide-react';

interface StaffSignupNoticeProps {
  onApplyAsStaff?: () => void;
  compact?: boolean;
}

/** Shown on guard/client signup so job seekers route to staff applications. */
export function StaffSignupNotice({ onApplyAsStaff, compact = false }: StaffSignupNoticeProps) {
  return (
    <div
      className={`rounded-xl border border-brand-primary/25 bg-brand-primary/5 ${
        compact ? 'p-3 space-y-2' : 'p-4 space-y-3'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary/15 text-brand-primary">
          <Briefcase className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 space-y-1">
          <p className={`font-semibold text-brand-text ${compact ? 'text-sm' : ''}`}>
            Looking for a job at Guardr?
          </p>
          <p className="text-xs leading-relaxed text-brand-text-muted">
            Guard and hiring accounts are for the security marketplace — independent contractor shifts
            and businesses hiring guards. Guardr does not hire through those paths. Platform staff
            (operations, support, review) apply separately.
          </p>
        </div>
      </div>
      {onApplyAsStaff ? (
        <button type="button" onClick={onApplyAsStaff} className="app-button-outline !w-full !h-10 text-sm">
          Apply to work at Guardr (staff)
        </button>
      ) : null}
    </div>
  );
}
