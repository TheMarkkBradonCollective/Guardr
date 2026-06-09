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
      <p className="wf-metric-label">{label}</p>
      <p className="wf-metric-value">{value}</p>
    </div>
  );
}
