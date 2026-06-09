import React from 'react';

interface StaffSummaryCellProps {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
  className?: string;
}

export function StaffSummaryCell({
  label,
  value,
  sub,
  accent = false,
  className = 'staff-summary-cell',
}: StaffSummaryCellProps) {
  return (
    <div className={`${className} ${accent ? 'staff-summary-cell-accent' : ''}`}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-brand-text-muted">{label}</p>
      <p className="text-lg font-bold mt-1">{value}</p>
      <p className="text-xs text-brand-text-muted mt-0.5 leading-snug">{sub}</p>
    </div>
  );
}
