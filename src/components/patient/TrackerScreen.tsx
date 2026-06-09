import React from 'react';
import { Plus } from 'lucide-react';
import { AppList, AppListRow, AppScreen, AppScreenTitle } from './AppPrimitives';
import { MOCK_TRACKER_METRICS } from './mockData';

const RECENT_READINGS = [
  { date: 'Today, 8:30 AM', metric: 'Blood Pressure', value: '120/80 mmHg' },
  { date: 'Yesterday, 9:15 AM', metric: 'Temperature', value: '98 F' },
  { date: 'Yesterday, 9:15 AM', metric: 'Pulse', value: '74 bpm' },
];

export function TrackerScreen() {
  return (
    <AppScreen className="pb-8">
      <div className="flex items-center justify-between gap-3 px-5 mb-2">
        <h1 className="text-[1.75rem] font-bold tracking-tight leading-tight">Tracker</h1>
        <button
          type="button"
          className="p-2 -mt-1 text-brand-text"
          aria-label="Add metric"
        >
          <Plus className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="app-metric-strip mt-2 mb-8">
        {MOCK_TRACKER_METRICS.map((metric) => (
          <div key={metric.id} className="app-metric-item">
            <p className="app-metric-label">{metric.label}</p>
            <p className="app-metric-value">{metric.value}</p>
            {metric.unit && <span className="app-metric-unit">{metric.unit}</span>}
          </div>
        ))}
      </div>

      <div className="app-section-head !mb-0">
        <h2>Recent readings</h2>
      </div>
      <AppList>
        {RECENT_READINGS.map((reading, i) => (
          <AppListRow key={i}>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{reading.metric}</p>
              <p className="text-xs text-brand-text-muted mt-0.5">{reading.date}</p>
            </div>
            <p className="font-semibold text-sm shrink-0">{reading.value}</p>
          </AppListRow>
        ))}
      </AppList>
    </AppScreen>
  );
}
