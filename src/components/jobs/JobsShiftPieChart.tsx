import React, { useMemo } from 'react';

export interface JobsPieSegment {
  id: string;
  label: string;
  value: number;
  color: string;
}

interface JobsShiftPieChartProps {
  segments: JobsPieSegment[];
  activeId?: string;
}

export function JobsShiftPieChart({ segments, activeId }: JobsShiftPieChartProps) {
  const total = useMemo(
    () => segments.reduce((sum, segment) => sum + segment.value, 0),
    [segments]
  );

  const gradient = useMemo(() => {
    if (total <= 0) return 'rgba(255, 255, 255, 0.16)';

    let cumulative = 0;
    const stops: string[] = [];

    for (const segment of segments) {
      if (segment.value <= 0) continue;
      const start = (cumulative / total) * 360;
      cumulative += segment.value;
      const end = (cumulative / total) * 360;
      stops.push(`${segment.color} ${start}deg ${end}deg`);
    }

    return stops.length > 0 ? stops.join(', ') : 'rgba(255, 255, 255, 0.16)';
  }, [segments, total]);

  const activeColor = segments.find((segment) => segment.id === activeId)?.color;

  return (
    <div
      className={`guard-jobs-pie ${total <= 0 ? 'guard-jobs-pie-empty' : ''}`}
      style={{
        background: total > 0 ? `conic-gradient(${gradient})` : undefined,
        boxShadow: activeColor ? `0 0 0 2px ${activeColor}, 0 4px 16px rgba(0, 0, 0, 0.18)` : undefined,
      }}
      aria-hidden
    >
      <div className="guard-jobs-pie-hole">
        <span className="guard-jobs-pie-total">{total}</span>
        <span className="guard-jobs-pie-total-label">shifts</span>
      </div>
    </div>
  );
}
