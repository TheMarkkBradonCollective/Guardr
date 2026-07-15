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
  className = 'guard-performance-stat',
}: StaffSummaryCellProps) {
  return (
    <div className={`${className} ${accent ? 'guard-performance-stat-accent' : ''}`}>
      <p className="guard-performance-stat-label">{label}</p>
      <p className="guard-performance-stat-value">{value}</p>
      <p className="guard-performance-stat-sub">{sub}</p>
    </div>
  );
}
