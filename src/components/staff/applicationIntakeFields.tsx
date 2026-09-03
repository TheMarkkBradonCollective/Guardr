import React from 'react';

export function IntakeField({ label, value }: { label: string; value: string | number | undefined | null }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-brand-text-muted mb-0.5">{label}</p>
      <p className="text-sm text-brand-text leading-relaxed">{String(value)}</p>
    </div>
  );
}
