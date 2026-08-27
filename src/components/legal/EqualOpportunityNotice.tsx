import type { LegalPageId } from '../../lib/legalContent';
import { EQUAL_OPPORTUNITY_HEADING, EQUAL_OPPORTUNITY_STATEMENT } from '../../lib/legalContent';

interface EqualOpportunityNoticeProps {
  onOpenLegal?: (page: LegalPageId) => void;
  /** Footer / compact placement — smaller type, no card chrome. */
  compact?: boolean;
  className?: string;
  align?: 'start' | 'center' | 'end';
}

/** Public equal-opportunity notice. Does not describe Guardr as an employer. */
export function EqualOpportunityNotice({
  onOpenLegal,
  compact = false,
  className = '',
  align = 'start',
}: EqualOpportunityNoticeProps) {
  const alignClass =
    align === 'center' ? 'text-center' : align === 'end' ? 'text-right' : 'text-left';
  const headingClass = compact
    ? `block text-[11px] font-semibold uppercase tracking-[0.06em] text-brand-text-muted ${alignClass}`
    : `block font-semibold text-sm text-brand-text ${alignClass}`;
  const bodyClass = compact
    ? `mt-1 text-[11px] leading-relaxed text-brand-text-muted ${alignClass}`
    : `mt-1 text-xs leading-relaxed text-brand-text-muted ${alignClass}`;

  return (
    <div className={`${compact ? '' : 'rounded-xl border border-brand-border bg-brand-bg-sec/60 px-4 py-3'} ${className}`}>
      {onOpenLegal ? (
        <button
          type="button"
          onClick={() => onOpenLegal('equal-opportunity')}
          className={`${headingClass} w-full bg-transparent border-0 p-0 cursor-pointer hover:underline`}
        >
          {EQUAL_OPPORTUNITY_HEADING}
        </button>
      ) : (
        <p className={headingClass}>{EQUAL_OPPORTUNITY_HEADING}</p>
      )}
      <p className={bodyClass}>{EQUAL_OPPORTUNITY_STATEMENT}</p>
    </div>
  );
}
