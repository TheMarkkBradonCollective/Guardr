import React from 'react';
import { AppMetricCell, AppMetricStrip } from '../ui/app/AppPrimitives';

export interface JobTallyItem<T extends string> {
  id: T;
  label: string;
  value: number;
  sub?: string;
}

interface JobsTallyStripProps<T extends string> {
  tallies: JobTallyItem<T>[];
  activeId: T;
  onSelect: (id: T) => void;
  className?: string;
}

export function JobsTallyStrip<T extends string>({
  tallies,
  activeId,
  onSelect,
  className = '',
}: JobsTallyStripProps<T>) {
  const countClass =
    tallies.length >= 4
      ? 'app-metric-strip--count-4'
      : tallies.length === 3
        ? 'app-metric-strip--count-3'
        : tallies.length === 2
          ? 'app-metric-strip--count-2'
          : '';

  return (
    <AppMetricStrip className={`jobs-tally-strip ${countClass} ${className}`.trim()}>
      {tallies.map((tally) => (
        <AppMetricCell
          key={tally.id}
          label={tally.label}
          value={tally.value}
          sub={tally.sub}
          onClick={() => onSelect(tally.id)}
          accent={activeId === tally.id}
        />
      ))}
    </AppMetricStrip>
  );
}
