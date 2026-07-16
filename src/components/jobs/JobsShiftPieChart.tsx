import React, { useMemo } from 'react';

export interface JobsPieSegment {
  id: string;
  label: string;
  value: number;
  color: string;
}

interface JobsSegmentProgressBarProps {
  segments: JobsPieSegment[];
  activeId?: string;
  totalLabel?: string;
}

export function JobsSegmentProgressBar({
  segments,
  activeId,
  totalLabel = 'shifts',
}: JobsSegmentProgressBarProps) {
  const total = useMemo(
    () => segments.reduce((sum, segment) => sum + segment.value, 0),
    [segments]
  );

  const activeLabel = segments.find((segment) => segment.id === activeId)?.label;

  return (
    <div
      className="guard-pref-progress jobs-segment-progress"
      role="progressbar"
      aria-valuenow={total}
      aria-valuemin={0}
      aria-valuemax={Math.max(total, 1)}
      aria-label={
        total <= 0
          ? `No ${totalLabel}`
          : `${total} ${totalLabel}${activeLabel ? `, ${activeLabel} selected` : ''}`
      }
    >
      <div className="guard-pref-progress-track jobs-segment-progress-track">
        {segments.map((segment) => {
          const widthPercent = total > 0 ? (segment.value / total) * 100 : 0;
          const isActive = activeId === segment.id;
          const isDimmed = Boolean(activeId) && !isActive;

          return (
            <div
              key={segment.id}
              className={`jobs-segment-progress-segment ${
                isActive ? 'jobs-segment-progress-segment-active' : ''
              } ${isDimmed ? 'jobs-segment-progress-segment-dimmed' : ''}`}
              style={{
                width: `${widthPercent}%`,
                backgroundColor: segment.color,
              }}
              title={`${segment.label}: ${segment.value}`}
            />
          );
        })}
      </div>
    </div>
  );
}
