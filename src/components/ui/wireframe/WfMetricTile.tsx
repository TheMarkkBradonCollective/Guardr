import React from 'react';

interface WfMetricTileProps {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
  className?: string;
}

export function WfMetricTile({ label, value, accent = false, className = '' }: WfMetricTileProps) {
  return (
    <div className={`wf-metric-tile ${accent ? 'wf-metric-tile-accent' : ''} ${className}`}>
      <p className="wf-metric-label text-[10px] font-bold uppercase tracking-[0.07em]">{label}</p>
      <p className="wf-metric-value text-2xl font-black tracking-[-0.04em] leading-none mt-1">{value}</p>
    </div>
  );
}
